import mysql from "mysql2/promise";
import { MysqlStudyUpload } from "../../../src/mobile-server/mysql-study-upload.ts";
const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 33316,
  user: "root",
  password: "isolated-test-password",
  database: "misaluteca_mobile_upload_test",
});
const [root, key, point] = process.argv.slice(2);
const f = new FormData();
f.set("date", "18-09-2026");
f.set("patient", "self");
f.append(
  "files",
  new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
  "a.pdf",
);
try {
  await new MysqlStudyUpload(pool, root, {
    checkpoint: async (value) => {
      if (value === point) process.exit(17);
    },
  }).submit(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: f,
    }),
    { id: "1", email: "one@example.invalid", name: null, image: null },
    async () => {},
  );
} finally {
  await pool.end();
}
