import type { Pool, RowDataPacket } from "mysql2/promise";
import { readFile } from "node:fs/promises";
const definitions: Record<string, Record<string, string>> = {
  familiares: {
    id: "int",
    uuid: "char(36)",
    id_usuario: "int",
    email_usuario: "varchar(255)",
    nombre: "varchar(255)",
    fecha_nacimiento: "varchar(10)",
    created_at: "varchar(20)",
    updated_at: "varchar(20)",
  },
  mobile_cleanup_operations: {
    operation_id: "char(36)",
    id_usuario: "int",
    status: "varchar(10)",
    created_at: "bigint",
    updated_at: "bigint",
  },
  mobile_cleanup_files: {
    id: "bigint",
    operation_id: "char(36)",
    file_key: "varchar(500)",
    status: "varchar(10)",
    attempts: "int",
    next_attempt: "bigint",
    lease_until: "bigint",
    lease_token: "char(36)",
  },
};
const nullable = new Set([
  "familiares.fecha_nacimiento",
  "mobile_cleanup_files.lease_token",
]);
const indexes: Record<string, [string, string, boolean][]> = {
  familiares: [
    ["PRIMARY", "id", true],
    ["uuid", "uuid", true],
    ["idx_family_owner", "id_usuario,id", false],
  ],
  mobile_cleanup_operations: [["PRIMARY", "operation_id", true]],
  mobile_cleanup_files: [
    ["PRIMARY", "id", true],
    ["idx_operation_file", "operation_id,file_key", true],
    ["idx_cleanup_claim", "status,next_attempt,lease_until", false],
  ],
};
export async function validateFamilyBase(pool: Pool) {
  const required: Record<string, Record<string, string>> = {
    users: { id: "int", email: "varchar(255)" },
    estudios: {
      id: "int",
      id_usuario: "int",
      id_familiar: "int",
      file_key: "varchar(500)",
    },
    estudios_archivos: {
      id: "int",
      id_estudio: "int",
      file_key: "varchar(500)",
    },
  };
  for (const [table, columns] of Object.entries(required)) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
      [table],
    );
    for (const [name, type] of Object.entries(columns))
      if (
        !rows.some(
          (r) =>
            r.COLUMN_NAME === name &&
            r.COLUMN_TYPE === type &&
            (name !== "id" || r.COLUMN_KEY === "PRI") &&
            (name !== "id_familiar" || r.IS_NULLABLE === "YES"),
        )
      )
        throw new Error("INCOMPATIBLE_TEST_BASE");
    const [engine] = await pool.query<RowDataPacket[]>(
      "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
      [table],
    );
    if (engine[0]?.ENGINE !== "InnoDB")
      throw new Error("INCOMPATIBLE_TEST_BASE");
  }
}
export async function familySchemaReady(pool: Pool) {
  const [present] = await pool.query<RowDataPacket[]>(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('familiares','mobile_cleanup_operations','mobile_cleanup_files')",
  );
  if (!present.length) return false;
  if (present.length !== 3) throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
  for (const [table, columns] of Object.entries(definitions)) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
      [table],
    );
    if (!rows.length) return false;
    for (const [name, type] of Object.entries(columns))
      if (
        !rows.some(
          (r) =>
            r.COLUMN_NAME === name &&
            r.COLUMN_TYPE === type &&
            r.IS_NULLABLE ===
              (nullable.has(table + "." + name) ? "YES" : "NO") &&
            (name !== "id" || r.EXTRA.includes("auto_increment")),
        )
      )
        throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
    const [engine] = await pool.query<RowDataPacket[]>(
      "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
      [table],
    );
    if (engine[0]?.ENGINE !== "InnoDB")
      throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
    const [actualIndexes] = await pool.query<RowDataPacket[]>(
      "SELECT INDEX_NAME,NON_UNIQUE,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_list FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? GROUP BY INDEX_NAME,NON_UNIQUE",
      [table],
    );
    for (const [index, list, unique] of indexes[table])
      if (
        !actualIndexes.some(
          (r) =>
            r.INDEX_NAME === index &&
            r.columns_list === list &&
            Boolean(r.NON_UNIQUE) !== unique,
        )
      )
        throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
    for (const r of rows) {
      if (r.COLUMN_NAME === "status" && r.COLUMN_DEFAULT !== "pending")
        throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
      if (
        ["attempts", "next_attempt", "lease_until"].includes(r.COLUMN_NAME) &&
        String(r.COLUMN_DEFAULT) !== "0"
      )
        throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
    }
  }
  for (const [table, column, target, targetColumn] of [
    ["familiares", "id_usuario", "users", "id"],
    [
      "mobile_cleanup_files",
      "operation_id",
      "mobile_cleanup_operations",
      "operation_id",
    ],
  ]) {
    const [fk] = await pool.query<RowDataPacket[]>(
      "SELECT k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=? AND k.COLUMN_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL",
      [table, column],
    );
    if (
      !fk.some(
        (r) =>
          r.REFERENCED_TABLE_NAME === target &&
          r.REFERENCED_COLUMN_NAME === targetColumn &&
          r.DELETE_RULE === "RESTRICT",
      )
    )
      throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
  }
  return true;
}
export async function migrateFamilySchema(
  pool: Pool,
  testDatabase = "misaluteca_mobile_family_test",
) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  if (!testDatabase || String(rows[0].name) !== testDatabase)
    throw new Error("TEST_DATABASE_REQUIRED");
  await validateFamilyBase(pool);
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('familiares','mobile_cleanup_operations','mobile_cleanup_files')",
  );
  if (existing.length) {
    if (existing.length !== 3 || !(await familySchemaReady(pool)))
      throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
    return;
  }
  await pool.query(
    await readFile(
      new URL("../../database/mobile-test-family.sql", import.meta.url),
      "utf8",
    ),
  );
  if (!(await familySchemaReady(pool)))
    throw new Error("INCOMPATIBLE_FAMILY_SCHEMA");
}
