import moment from "moment";
import type {
  Pool,
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2/promise";
import { createHash, randomUUID } from "node:crypto";
import { link, unlink, lstat, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import {
  parseUpload,
  privateDirectory,
  type StagedFile,
} from "./upload-parser.ts";
import { UUID, type UploadFields } from "./upload-validation.ts";
import { ReadingError } from "./studies.ts";
import type { Identity } from "./auth.ts";
import { uploadSchemaReady } from "./upload-schema.ts";
type Manifest = {
  fields: UploadFields;
  files: (StagedFile & { fileKey: string; stageKey: string })[];
  directoryKey: string;
};
export const quotaDay = (now = Date.now()) =>
  moment(now).subtract(3, "hours").format("DD-MM-YYYY");
export class MysqlStudyUpload {
  pool: Pool;
  root: string;
  checkpoint?: (point: string) => Promise<void>;
  acquireTimeoutMs: number;
  constructor(
    pool: Pool,
    root: string,
    options: {
      checkpoint?: (point: string) => Promise<void>;
      acquireTimeoutMs?: number;
    } = {},
  ) {
    this.pool = pool;
    this.root = root;
    this.checkpoint = options.checkpoint;
    this.acquireTimeoutMs = options.acquireTimeoutMs ?? 5000;
  }
  ready() {
    return uploadSchemaReady(this.pool);
  }
  async status(owner: string, key: string) {
    if (!UUID.test(key)) throw new ReadingError();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT operation_id,status,study_id,error_code,retryable FROM mobile_study_uploads WHERE id_usuario=? AND operation_id=?",
      [owner, key.toLowerCase()],
    );
    if (!rows[0]) throw new ReadingError();
    return dto(rows[0]);
  }
  async submit(
    request: Request,
    user: Identity,
    revalidate: (connection: PoolConnection) => Promise<void>,
  ) {
    const key = request.headers.get("Idempotency-Key") ?? "";
    if (!UUID.test(key)) throw new ReadingError(400, "INVALID_IDEMPOTENCY_KEY");
    const operationId = key.toLowerCase(),
      parsed = await parseUpload(request, this.root, user.id),
      lease = randomUUID();
    const manifest: Manifest = {
      fields: parsed.fields,
      directoryKey: `${user.id}/.mobile-staging/${basename(parsed.directory)}`,
      files: parsed.files.map((file, index) => ({
        ...file,
        fileKey: `${user.id}/mobile-${operationId}-${index}.${file.extension}`,
        stageKey: `${user.id}/.mobile-staging/${basename(parsed.directory)}/${index}`,
      })),
    };
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify([
          parsed.fields,
          parsed.files.map((f) => [f.name, f.mimeType, f.size, f.hash]),
        ]),
      )
      .digest("hex");
    const conn = await acquireUploadConnection(
      this.pool,
      this.acquireTimeoutMs,
    ).catch(async (error) => {
      await rm(parsed.directory, { recursive: true, force: true });
      throw error;
    });
    const claimDeadline = setTimeout(() => conn.destroy(), 30000);
    let retained = false,
      released = false;
    try {
      await conn.beginTransaction();
      await conn.query(
        "INSERT IGNORE INTO mobile_study_uploads(id_usuario,operation_id,fingerprint,manifest,created_at,updated_at)VALUES(?,?,?,?,?,?)",
        [
          user.id,
          operationId,
          fingerprint,
          JSON.stringify(manifest),
          Date.now(),
          Date.now(),
        ],
      );
      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT * FROM mobile_study_uploads WHERE id_usuario=? AND operation_id=? FOR UPDATE",
        [user.id, operationId],
      );
      const row = rows[0];
      if (row.fingerprint !== fingerprint)
        throw new ReadingError(409, "IDEMPOTENCY_CONFLICT");
      if (row.status === "complete") {
        await conn.commit();
        return { ...dto(row), httpStatus: 200 };
      }
      if (row.status === "pending" && row.lease_token) {
        await conn.commit();
        return { operationId, status: "pending" as const, httpStatus: 202 };
      }
      if (row.status === "failed" && !row.retryable)
        throw new ReadingError(
          row.error_code === "UPLOAD_LIMIT_REACHED" ? 429 : 400,
          row.error_code ?? "UPLOAD_FAILED",
        );
      await conn.query(
        "UPDATE mobile_study_uploads SET manifest=?,status='pending',lease_token=?,lease_until=?,updated_at=?,error_code=NULL WHERE id_usuario=? AND operation_id=?",
        [
          JSON.stringify(manifest),
          lease,
          Date.now() + 60000,
          Date.now(),
          user.id,
          operationId,
        ],
      );
      await conn.commit();
      retained = true;
      clearTimeout(claimDeadline);
      conn.release();
      released = true;
      return await this.commit(user, operationId, lease, manifest, revalidate);
    } catch (error) {
      if (!released) await conn.rollback();
      throw error;
    } finally {
      clearTimeout(claimDeadline);
      if (!released) conn.release();
      if (!retained)
        await rm(parsed.directory, { recursive: true, force: true });
    }
  }
  private async commit(
    user: Identity,
    key: string,
    lease: string,
    manifest: Manifest,
    revalidate: (connection: PoolConnection) => Promise<void>,
  ) {
    const conn = await this.pool.getConnection();
    let released = false;
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT * FROM mobile_study_uploads WHERE id_usuario=? AND operation_id=? FOR UPDATE",
        [user.id, key],
      );
      const row = rows[0];
      if (!row || row.lease_token !== lease || row.lease_until <= Date.now())
        throw new ReadingError(409, "STALE_UPLOAD_LEASE");
      await revalidate(conn);
      const [users] = await conn.query<RowDataPacket[]>(
        "SELECT count_files,date_files FROM users WHERE id=? FOR UPDATE",
        [user.id],
      );
      if (!users[0]) throw new ReadingError();
      let familyId: number | null = null;
      if (manifest.fields.patient === "family") {
        const [tables] = await conn.query<RowDataPacket[]>(
          "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='familiares'",
        );
        if (!tables.length) throw new ReadingError();
        const [family] = await conn.query<RowDataPacket[]>(
          "SELECT id FROM familiares WHERE uuid=? AND id_usuario=? FOR UPDATE",
          [manifest.fields.familyUuid, user.id],
        );
        if (!family[0]) throw new ReadingError();
        familyId = family[0].id;
      }
      const day = quotaDay(),
        count =
          users[0].date_files === day ? Number(users[0].count_files ?? 0) : 0,
        maximum = Number(process.env.LIMIT_UPLOAD ?? "20");
      if (!Number.isSafeInteger(maximum) || maximum < 1)
        throw new ReadingError(503, "UPLOAD_UNAVAILABLE");
      if (count >= maximum) throw new ReadingError(429, "UPLOAD_LIMIT_REACHED");
      await privateDirectory(this.root, user.id);
      await assertManifestPaths(this.root, user.id, key, manifest);
      for (const file of manifest.files) {
        if (row.lease_until <= Date.now())
          throw new ReadingError(409, "STALE_UPLOAD_LEASE");
        const stage = join(this.root, file.stageKey),
          destination = join(this.root, file.fileKey);
        if ((await lstat(stage)).isSymbolicLink())
          throw new ReadingError(400, "INVALID_FILE_PATH");
        await link(stage, destination);
      }
      await this.checkpoint?.("promoted");
      const f = manifest.fields,
        first = manifest.files[0];
      const [created] = await conn.query<ResultSetHeader>(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,titulo,fecha,institucion,medico,conclusion,descripcion,created_at,file_key,file_name,mime_type,file_size)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          randomUUID(),
          user.id,
          user.email,
          familyId,
          f.title,
          f.date,
          f.institution,
          f.medico,
          f.conclusion,
          f.description,
          day,
          first.fileKey,
          first.name,
          first.mimeType,
          first.size,
        ],
      );
      for (const file of manifest.files)
        await conn.query(
          "INSERT INTO estudios_archivos(id_estudio,file_key,file_name,mime_type,file_size,created_at)VALUES(?,?,?,?,?,?)",
          [
            created.insertId,
            file.fileKey,
            file.name,
            file.mimeType,
            file.size,
            day,
          ],
        );
      await conn.query(
        "UPDATE users SET count_files=?,date_files=? WHERE id=?",
        [count + 1, day, user.id],
      );
      await conn.query(
        "UPDATE mobile_study_uploads SET status='complete',study_id=?,lease_token=NULL,lease_until=0,updated_at=? WHERE id_usuario=? AND operation_id=?",
        [created.insertId, Date.now(), user.id, key],
      );
      await conn.commit();
      await this.checkpoint?.("committed");
      await rm(join(this.root, manifest.directoryKey), {
        recursive: true,
        force: true,
      }).catch(() => {});
      return {
        operationId: key,
        status: "complete" as const,
        studyId: String(created.insertId),
        httpStatus: 201,
      };
    } catch (error) {
      await conn.rollback();
      conn.release();
      released = true;
      await cleanupUploadFailure(
        this.pool,
        this.root,
        user.id,
        key,
        lease,
        manifest,
        error,
      );
      throw error;
    } finally {
      if (!released) conn.release();
    }
  }
}
function dto(row: RowDataPacket) {
  return {
    operationId: String(row.operation_id),
    status: row.status as "pending" | "complete" | "failed",
    ...(row.study_id ? { studyId: String(row.study_id) } : {}),
    ...(row.status === "failed"
      ? {
          errorCode: row.error_code ?? "UPLOAD_FAILED",
          retryable: Boolean(row.retryable),
        }
      : {}),
  };
}
export async function cleanupUploadFailure(
  pool: Pool,
  root: string,
  owner: string,
  key: string,
  lease: string,
  manifest: Manifest,
  error: unknown,
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT status,lease_token,lease_until FROM mobile_study_uploads WHERE id_usuario=? AND operation_id=? FOR UPDATE",
      [owner, key],
    );
    if (
      rows[0]?.status !== "pending" ||
      rows[0]?.lease_token !== lease ||
      rows[0]?.lease_until <= Date.now()
    ) {
      await conn.rollback();
      return;
    }
    await assertManifestPaths(root, owner, key, manifest);
    for (const file of manifest.files) {
      const ambiguous =
        "(LOCATE('..',file_key)>0 OR LOCATE('/./',file_key)>0 OR LOCATE('//',file_key)>0 OR LOCATE(CHAR(92),file_key)>0 OR file_key LIKE '/%')";
      const [references] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM estudios WHERE file_key=? OR ${ambiguous} UNION ALL SELECT id FROM estudios_archivos WHERE file_key=? OR ${ambiguous} LIMIT 1`,
        [file.fileKey, file.fileKey],
      );
      if (references.length) throw new Error("RETAINED_FILE");
      if (!references.length) {
        const path = join(root, file.fileKey);
        try {
          const info = await lstat(path);
          if (info.isFile() && !info.isSymbolicLink()) await unlink(path);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        }
      }
    }
    await rm(join(root, manifest.directoryKey), {
      recursive: true,
      force: true,
    });
    const code = error instanceof ReadingError ? error.code : "UPLOAD_FAILED";
    await conn.query(
      "UPDATE mobile_study_uploads SET status='failed',error_code=?,retryable=?,lease_token=NULL,lease_until=0,updated_at=? WHERE id_usuario=? AND operation_id=?",
      [
        code,
        error instanceof ReadingError && [400, 404, 415].includes(error.status)
          ? 0
          : 1,
        Date.now(),
        owner,
        key,
      ],
    );
    await conn.commit();
  } catch {
    await conn.rollback();
  } finally {
    conn.release();
  }
}

async function assertManifestPaths(
  root: string,
  owner: string,
  key: string,
  manifest: Manifest,
) {
  if (
    !UUID.test(key) ||
    !Array.isArray(manifest.files) ||
    !manifest.files.length ||
    manifest.files.length > 10
  )
    throw new Error("UNSAFE_UPLOAD_MANIFEST");
  const parts = manifest.directoryKey?.split("/");
  if (
    parts?.length !== 3 ||
    parts[0] !== owner ||
    parts[1] !== ".mobile-staging" ||
    !UUID.test(parts[2])
  )
    throw new Error("UNSAFE_UPLOAD_MANIFEST");
  await privateDirectory(root, owner, ".mobile-staging", parts[2]);
  for (const [file, index] of manifest.files.map((f, i) => [f, i] as const)) {
    if (
      !new RegExp(
        "^" + owner + "/mobile-" + key + "-" + index + "\\.(pdf|jpg|jpeg|png)$",
      ).test(file.fileKey) ||
      file.stageKey !== manifest.directoryKey + "/" + index
    )
      throw new Error("UNSAFE_UPLOAD_MANIFEST");
    const stage = join(root, file.stageKey);
    try {
      if ((await lstat(stage)).isSymbolicLink())
        throw new Error("UNSAFE_UPLOAD_MANIFEST");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

async function acquireUploadConnection(pool: Pool, timeoutMs: number) {
  let expired = false,
    timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      expired = true;
      reject(new ReadingError(503, "UPLOAD_UNAVAILABLE"));
    }, timeoutMs);
  });
  const connection = pool.getConnection().then((conn) => {
    if (expired) {
      conn.release();
      throw new ReadingError(503, "UPLOAD_UNAVAILABLE");
    }
    return conn;
  });
  try {
    return await Promise.race([connection, deadline]);
  } finally {
    clearTimeout(timer!);
  }
}
