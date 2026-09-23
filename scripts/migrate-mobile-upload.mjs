import mysql from "mysql2/promise";
import {
  uploadSchemaReady,
  migrateUploadSchema,
  preflightUploadSchema,
} from "../src/mobile-server/upload-schema.ts";
const args = process.argv.slice(2),
  name = args[1],
  mode = args[2];
if (
  args.length !== 3 ||
  args[0] !== "--test-database" ||
  !name ||
  name !== process.env.DB_NAME ||
  !["--check", "--apply"].includes(mode)
) {
  console.error(
    "Uso TEST explícito: node scripts/migrate-mobile-upload.mjs --test-database <DB_NAME> --check|--apply",
  );
  process.exitCode = 1;
} else {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: name,
    multipleStatements: true,
    connectionLimit: 1,
  });
  try {
    await preflightUploadSchema(pool);
    if (mode === "--apply") await migrateUploadSchema(pool, name);
    console.log(
      JSON.stringify({
        database: name,
        status: (await uploadSchemaReady(pool))
          ? "ready"
          : "migration-required",
      }),
    );
  } catch {
    console.error(
      "Esquema TEST incompatible o conexión no disponible. No continuar sin revisar.",
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
