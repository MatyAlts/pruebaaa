import mysql from "mysql2/promise";
import { cleanupBatch } from "../src/mobile-server/family-cleanup.ts";
import { setTimeout } from "node:timers/promises";
import { recoverUploadBatch } from "../src/mobile-server/upload-recovery.ts";
import { studyCleanupBatch } from '../src/mobile-server/study-cleanup.ts';
const controller = new AbortController();
process.on("SIGTERM", () => controller.abort());
process.on("SIGINT", () => controller.abort());
const configured =
  process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;
const pool = configured
  ? mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 3,
      connectTimeout: 10000,
    })
  : null;
try {
  while (!controller.signal.aborted) {
    if (pool) {
      try {await studyCleanupBatch(pool,process.env.DIRECTORY_UPLOADS||'/app/uploads');} catch {console.error('Limpieza de estudios pendiente; se reintentará.');}
      try {
        await cleanupBatch(pool, process.env.DIRECTORY_UPLOADS || "/app/uploads");
      } catch {
        console.error("Limpieza familiar pendiente; se reintentará.");
      }
      try {
        await recoverUploadBatch(
          pool,
          process.env.DIRECTORY_UPLOADS || "/app/uploads",
        );
      } catch {
        console.error(
          "Recuperación de cargas móvil pendiente; se reintentará.",
        );
      }
    }
    try {
      await setTimeout(5000, undefined, { signal: controller.signal });
    } catch {}
  }
} finally {
  if (pool) await pool.end();
}
