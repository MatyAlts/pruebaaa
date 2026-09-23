import type { Pool, RowDataPacket } from "mysql2/promise";
import { randomUUID } from "node:crypto";
import { cleanupUploadFailure } from "./mysql-study-upload.ts";
import { ReadingError } from "./studies.ts";
import { uploadSchemaReady } from "./upload-schema.ts";
import { opendir, lstat, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { UUID } from "./upload-validation.ts";
import { privateDirectory } from "./upload-parser.ts";
export async function recoverUploadBatch(pool: Pool, root: string) {
  if (!(await uploadSchemaReady(pool))) return;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id_usuario,operation_id FROM mobile_study_uploads WHERE status='pending' AND lease_until<=? AND next_attempt<=? ORDER BY created_at LIMIT 20",
    [Date.now(), Date.now()],
  );
  for (const row of rows) {
    const conn = await pool.getConnection();
    const lease = randomUUID();
    let manifest;
    try {
      await conn.beginTransaction();
      const [claim] = await conn.query<RowDataPacket[]>(
        "SELECT * FROM mobile_study_uploads WHERE id_usuario=? AND operation_id=? FOR UPDATE NOWAIT",
        [row.id_usuario, row.operation_id],
      );
      if (
        !claim[0] ||
        claim[0].status !== "pending" ||
        claim[0].lease_until > Date.now()
      ) {
        await conn.rollback();
        continue;
      }
      manifest = JSON.parse(claim[0].manifest);
      await conn.query(
        "UPDATE mobile_study_uploads SET lease_token=?,lease_until=?,attempts=attempts+1,next_attempt=? WHERE id_usuario=? AND operation_id=?",
        [
          lease,
          Date.now() + 60000,
          Date.now() + 5000,
          row.id_usuario,
          row.operation_id,
        ],
      );
      await conn.commit();
    } catch {
      await conn.rollback();
    } finally {
      conn.release();
    }
    if (manifest)
      await cleanupUploadFailure(
        pool,
        root,
        String(row.id_usuario),
        String(row.operation_id),
        lease,
        manifest,
        new ReadingError(503, "UPLOAD_INTERRUPTED"),
      );
  }
  await scavengeStaging(pool, root);
}

const scans = new Map<string, AsyncGenerator<string | null>>();
async function* stages(root: string): AsyncGenerator<string | null> {
  let owners;
  try {
    if ((await lstat(resolve(root))).isSymbolicLink()) return;
    owners = await opendir(root);
  } catch {
    return;
  }
  for await (const owner of owners) {
    yield null;
    if (
      !owner.isDirectory() ||
      owner.isSymbolicLink() ||
      !/^[1-9]\d{0,15}$/.test(owner.name)
    )
      continue;
    const parent = join(root, owner.name, ".mobile-staging");
    let directory;
    try {
      if ((await lstat(parent)).isSymbolicLink()) continue;
      directory = await opendir(parent);
    } catch {
      continue;
    }
    for await (const item of directory) {
      yield item.isDirectory() && !item.isSymbolicLink() && UUID.test(item.name)
        ? `${owner.name}/.mobile-staging/${item.name}`
        : null;
    }
  }
}
async function scavengeStaging(pool: Pool, root: string) {
  let scan = scans.get(root);
  if (!scan) {
    scan = stages(root);
    scans.set(root, scan);
  }
  for (let budget = 0; budget < 20; budget++) {
    const next = await scan.next();
    if (next.done) {
      scans.delete(root);
      break;
    }
    const key = next.value;
    if (!key) continue;
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT status,lease_until FROM mobile_study_uploads WHERE id_usuario=? AND JSON_UNQUOTE(JSON_EXTRACT(IF(JSON_VALID(manifest),manifest,'{}'),'$.directoryKey'))=? LIMIT 1",
        [key.split("/")[0], key],
      );
      const info = await lstat(join(root, key));
      if (rows[0]?.status === "pending") continue;
      if (rows[0]?.status !== "complete" && Date.now() - info.mtimeMs < 3600000)
        continue;
      const parts = key.split("/");
      await privateDirectory(root, parts[0], parts[1], parts[2]);
      await rm(join(root, key), { recursive: true, force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
