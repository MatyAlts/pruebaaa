import type { Pool, RowDataPacket } from "mysql2/promise";
import { randomUUID } from "node:crypto";
import { lstat, realpath, unlink } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { familySchemaReady } from "./family-schema.ts";
export const CLEANUP_BATCH = 20,
  CLEANUP_LEASE_MS = 60000,
  CLEANUP_RETRY_MS = 5000;
async function confined(root: string, userId: string, key: string) {
  if (
    !/^[1-9]\d*$/.test(userId) ||
    !key.startsWith(userId + "/") ||
    key.includes("\\") ||
    key.includes("\0") ||
    key.split("/").some((p) => !p || p === "." || p === "..") ||
    isAbsolute(key)
  )
    throw new Error("UNSAFE_FILE_KEY");
  const actualRoot = await realpath(resolve(root));
  let current = actualRoot;
  for (const component of key.split("/")) {
    current = join(current, component);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error("UNSAFE_SYMLINK");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const rel = relative(actualRoot, current);
  if (!rel || rel.startsWith("..") || isAbsolute(rel))
    throw new Error("UNSAFE_FILE_KEY");
  return current;
}
export async function cleanupBatch(
  pool: Pool,
  root: string,
  now = Date.now(),
  io: { unlink: typeof unlink } = { unlink },
) {
  if (!(await familySchemaReady(pool))) return 0;
  const connection = await pool.getConnection(),
    lease = randomUUID();
  let claimed: RowDataPacket[] = [];
  try {
    await connection.beginTransaction();
    [claimed] = await connection.query<RowDataPacket[]>(
      "SELECT f.id,f.file_key,o.id_usuario FROM mobile_cleanup_files f JOIN mobile_cleanup_operations o ON o.operation_id=f.operation_id WHERE f.status='pending' AND f.next_attempt<=? AND f.lease_until<=? ORDER BY f.id LIMIT ? FOR UPDATE SKIP LOCKED",
      [now, now, CLEANUP_BATCH],
    );
    for (const row of claimed)
      await connection.query(
        "UPDATE mobile_cleanup_files SET lease_until=?,lease_token=?,attempts=attempts+1 WHERE id=?",
        [now + CLEANUP_LEASE_MS, lease, row.id],
      );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  for (const row of claimed) {
    let success = false;
    const guard = await pool.getConnection();
    try {
      await guard.beginTransaction();
      const [owned] = await guard.query<RowDataPacket[]>(
        "SELECT id FROM mobile_cleanup_files WHERE id=? AND lease_token=? AND status='pending' FOR UPDATE",
        [row.id, lease],
      );
      if (!owned.length) {
        await guard.rollback();
        guard.release();
        continue;
      }
      await guard.query(
        "UPDATE mobile_cleanup_files SET lease_until=? WHERE id=?",
        [Date.now() + CLEANUP_LEASE_MS, row.id],
      );
      const path = await confined(
        root,
        String(row.id_usuario),
        String(row.file_key),
      );
      const ambiguous =
        "(LOCATE('..',file_key)>0 OR LOCATE('/./',file_key)>0 OR LOCATE('//',file_key)>0 OR LOCATE(CHAR(92),file_key)>0 OR LOCATE(CHAR(0),file_key)>0 OR file_key LIKE '/%' OR file_key NOT REGEXP '^[1-9][0-9]*/[^/]+')";
      const [shared] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM estudios WHERE file_key=? OR ${ambiguous} UNION ALL SELECT id_estudio AS id FROM estudios_archivos WHERE file_key=? OR ${ambiguous} LIMIT 1`,
        [row.file_key, row.file_key],
      );
      if (shared.length) throw new Error("FILE_STILL_REFERENCED");
      try {
        await io.unlink(path);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      success = true;
    } catch {}
    try {
      await guard.query(
        "UPDATE mobile_cleanup_files SET status=?,next_attempt=?,lease_until=0,lease_token=NULL WHERE id=? AND lease_token=?",
        [
          success ? "complete" : "pending",
          success ? 0 : now + CLEANUP_RETRY_MS,
          row.id,
          lease,
        ],
      );
      await guard.commit();
    } finally {
      guard.release();
    }
  }
  await pool.query(
    "UPDATE mobile_cleanup_operations o SET status='complete',updated_at=? WHERE o.status='pending' AND NOT EXISTS(SELECT 1 FROM mobile_cleanup_files f WHERE f.operation_id=o.operation_id AND f.status<>'complete')",
    [now],
  );
  return claimed.length;
}
