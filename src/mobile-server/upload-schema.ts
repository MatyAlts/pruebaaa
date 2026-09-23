import type { Pool, RowDataPacket } from "mysql2/promise";
import { readFile } from "node:fs/promises";
const ledger = {
  id_usuario: "int",
  operation_id: "char(36)",
  fingerprint: "char(64)",
  status: "varchar(10)",
  manifest: "mediumtext",
  study_id: "int",
  lease_token: "char(36)",
  lease_until: "bigint",
  next_attempt: "bigint",
  attempts: "int",
  error_code: "varchar(40)",
  retryable: "tinyint",
  created_at: "bigint",
  updated_at: "bigint",
};
const nullable = new Set(["study_id", "lease_token", "error_code"]);
async function columns(pool: Pool, table: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,COLUMN_KEY,EXTRA,COLLATION_NAME,COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
    [table],
  );
  return rows;
}
export async function uploadSchemaReady(pool: Pool) {
  if (!(await uploadBaseCompatible(pool))) return false;
  const rows = await columns(pool, "mobile_study_uploads");
  if (!rows.length) return false;
  for (const [name, type] of Object.entries(ledger))
    if (
      !rows.some(
        (r) =>
          r.COLUMN_NAME === name &&
          r.COLUMN_TYPE === type &&
          r.IS_NULLABLE === (nullable.has(name) ? "YES" : "NO"),
      )
    )
      return false;
  for (const [table] of [
    ["users"],
    ["estudios"],
    ["estudios_archivos"],
    ["mobile_study_uploads"],
  ]) {
    const [engine] = await pool.query<RowDataPacket[]>(
      "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
      [table],
    );
    if (engine[0]?.ENGINE !== "InnoDB") return false;
  }
  for (const r of rows) {
    if (r.COLUMN_NAME === "retryable" && String(r.COLUMN_DEFAULT) !== "1")
      return false;
    if (r.COLUMN_NAME === "status" && r.COLUMN_DEFAULT !== "pending")
      return false;
    if (
      ["lease_until", "next_attempt", "attempts"].includes(r.COLUMN_NAME) &&
      String(r.COLUMN_DEFAULT) !== "0"
    )
      return false;
  }
  const users = await columns(pool, "users");
  if (
    !users.some(
      (r) =>
        r.COLUMN_NAME === "count_files" &&
        r.COLUMN_TYPE === "int" &&
        (r.COLUMN_DEFAULT === null || String(r.COLUMN_DEFAULT) === "0"),
    ) ||
    !users.some(
      (r) => r.COLUMN_NAME === "date_files" && r.COLUMN_TYPE === "varchar(20)",
    )
  )
    return false;
  const studies = await columns(pool, "estudios");
  for (const name of ["titulo", "institucion", "medico"]) {
    const r = studies.find((r) => r.COLUMN_NAME === name);
    if (
      !r ||
      !/^varchar\((\d+)\)$/.test(r.COLUMN_TYPE) ||
      (["institucion", "medico"].includes(name) && r.IS_NULLABLE !== "YES") ||
      Number(r.COLUMN_TYPE.match(/\d+/)[0]) < 400
    )
      return false;
  }
  const [indexes] = await pool.query<RowDataPacket[]>(
    "SELECT INDEX_NAME,NON_UNIQUE,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='mobile_study_uploads' GROUP BY INDEX_NAME,NON_UNIQUE",
  );
  if (
    !indexes.some(
      (r) =>
        r.INDEX_NAME === "PRIMARY" &&
        r.NON_UNIQUE === 0 &&
        r.cols === "id_usuario,operation_id",
    ) ||
    !indexes.some(
      (r) =>
        r.INDEX_NAME === "idx_upload_claim" &&
        r.cols === "status,next_attempt,lease_until",
    )
  )
    return false;
  const [fk] = await pool.query<RowDataPacket[]>(
    "SELECT k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME='mobile_study_uploads' AND k.COLUMN_NAME='id_usuario'",
  );
  return fk.some(
    (r) =>
      r.REFERENCED_TABLE_NAME === "users" &&
      r.REFERENCED_COLUMN_NAME === "id" &&
      r.DELETE_RULE === "RESTRICT",
  );
}
export async function migrateUploadSchema(pool: Pool, testDatabase: string) {
  const [db] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  if (!testDatabase || db[0]?.name !== testDatabase)
    throw new Error("TEST_DATABASE_REQUIRED");
  await preflightUploadSchema(pool);
  for (const table of ["users", "estudios", "estudios_archivos"]) {
    const cols = await columns(pool, table);
    if (
      !cols.some(
        (r) =>
          r.COLUMN_NAME === "id" &&
          r.COLUMN_TYPE === "int" &&
          r.COLUMN_KEY === "PRI",
      )
    )
      throw new Error("INCOMPATIBLE_UPLOAD_BASE");
    const [engine] = await pool.query<RowDataPacket[]>(
      "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
      [table],
    );
    if (engine[0]?.ENGINE !== "InnoDB")
      throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  }
  if (!(await uploadBaseCompatible(pool)))
    throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  const users = await columns(pool, "users"),
    studies = await columns(pool, "estudios");
  for (const [name, type] of [
    ["count_files", "int"],
    ["date_files", "varchar(20)"],
  ]) {
    const r = users.find((r) => r.COLUMN_NAME === name);
    if (r && r.COLUMN_TYPE !== type)
      throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  }
  for (const name of ["titulo", "institucion", "medico"]) {
    const r = studies.find((r) => r.COLUMN_NAME === name);
    if (
      !r ||
      !/^varchar\((\d+)\)$/.test(r.COLUMN_TYPE) ||
      r.IS_NULLABLE !== "YES"
    )
      throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  }
  const existing = await columns(pool, "mobile_study_uploads");
  if (existing.length && !(await uploadSchemaReady(pool)))
    throw new Error("INCOMPATIBLE_UPLOAD_SCHEMA");
  if (!users.some((r) => r.COLUMN_NAME === "count_files"))
    await pool.query(
      "ALTER TABLE users ADD count_files INT NOT NULL DEFAULT 0",
    );
  if (!users.some((r) => r.COLUMN_NAME === "date_files"))
    await pool.query("ALTER TABLE users ADD date_files VARCHAR(20) NULL");
  for (const name of ["titulo", "institucion", "medico"])
    if (
      Number(
        studies
          .find((r) => r.COLUMN_NAME === name)!
          .COLUMN_TYPE.match(/\d+/)[0],
      ) < 400
    ) {
      const r = studies.find((r) => r.COLUMN_NAME === name)!;
      if (!/^[a-z0-9_]+$/.test(r.COLLATION_NAME))
        throw new Error("INCOMPATIBLE_UPLOAD_BASE");
      await pool.query(
        `ALTER TABLE estudios MODIFY ${name} VARCHAR(400) COLLATE ${r.COLLATION_NAME} NULL DEFAULT ${pool.escape(r.COLUMN_DEFAULT)} COMMENT ${pool.escape(r.COLUMN_COMMENT)}`,
      );
    }
  if (!existing.length)
    await pool.query(
      await readFile(
        new URL("../../database/mobile-test-upload.sql", import.meta.url),
        "utf8",
      ),
    );
  if (!(await uploadSchemaReady(pool)))
    throw new Error("INCOMPATIBLE_UPLOAD_SCHEMA");
}

async function uploadBaseCompatible(pool: Pool) {
  const required: Record<string, Record<string, string>> = {
    users: { id: "int", email: "varchar(255)" },
    estudios: {
      id: "int",
      uuid: "varchar(100)",
      id_usuario: "int",
      email_usuario: "varchar(255)",
      id_familiar: "int",
      fecha: "varchar(20)",
      conclusion: "text",
      descripcion: "text",
      created_at: "varchar(20)",
      file_key: "varchar(500)",
      file_name: "varchar(255)",
      mime_type: "varchar(100)",
      file_size: "bigint",
    },
    estudios_archivos: {
      id: "int",
      id_estudio: "int",
      file_key: "varchar(500)",
      file_name: "varchar(255)",
      mime_type: "varchar(100)",
      file_size: "bigint",
      created_at: "varchar(20)",
    },
  };
  for (const [table, definition] of Object.entries(required)) {
    const actual = await columns(pool, table);
    for (const [name, type] of Object.entries(definition)) {
      const r = actual.find((r) => r.COLUMN_NAME === name);
      if (
        !r ||
        r.COLUMN_TYPE !== type ||
        (name === "id" &&
          (r.COLUMN_KEY !== "PRI" || !r.EXTRA.includes("auto_increment"))) ||
        (["id_familiar", "conclusion", "descripcion"].includes(name) &&
          r.IS_NULLABLE !== "YES")
      )
        return false;
    }
  }
  const [fk] = await pool.query<RowDataPacket[]>(
    "SELECT k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME='estudios_archivos' AND k.COLUMN_NAME='id_estudio'",
  );
  return fk.some(
    (r) =>
      r.REFERENCED_TABLE_NAME === "estudios" &&
      r.REFERENCED_COLUMN_NAME === "id" &&
      r.DELETE_RULE === "CASCADE",
  );
}

export async function preflightUploadSchema(pool: Pool) {
  if (!(await uploadBaseCompatible(pool)))
    throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  for (const table of ["users", "estudios", "estudios_archivos"]) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
      [table],
    );
    if (rows[0]?.ENGINE !== "InnoDB")
      throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  }
  const users = await columns(pool, "users"),
    studies = await columns(pool, "estudios");
  for (const [name, type] of [
    ["count_files", "int"],
    ["date_files", "varchar(20)"],
  ]) {
    const r = users.find((r) => r.COLUMN_NAME === name);
    if (
      r &&
      (r.COLUMN_TYPE !== type ||
        (name === "count_files" &&
          r.COLUMN_DEFAULT !== null &&
          String(r.COLUMN_DEFAULT) !== "0"))
    )
      throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  }
  for (const name of ["titulo", "institucion", "medico"]) {
    const r = studies.find((r) => r.COLUMN_NAME === name);
    if (
      !r ||
      !/^varchar\((\d+)\)$/.test(r.COLUMN_TYPE) ||
      r.IS_NULLABLE !== "YES"
    )
      throw new Error("INCOMPATIBLE_UPLOAD_BASE");
  }
  if (
    (await columns(pool, "mobile_study_uploads")).length &&
    !(await uploadSchemaReady(pool))
  )
    throw new Error("INCOMPATIBLE_UPLOAD_SCHEMA");
}
