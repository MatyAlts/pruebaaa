import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import { mkdtemp, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MysqlStudyUpload } from "../../src/mobile-server/mysql-study-upload.ts";
test(
  "bounded pool acquisition releases private untracked staging before one-hour GC deadline",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        host: "127.0.0.1",
        port: 33316,
        user: "root",
        password: "isolated-test-password",
        connectionLimit: 1,
      }),
      held = await pool.getConnection(),
      root = await mkdtemp(join(tmpdir(), "upload-wait-"));
    const release = setTimeout(() => held.release(), 250);
    const f = new FormData();
    f.set("date", "18-09-2026");
    f.set("patient", "self");
    f.append(
      "files",
      new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
      "a.pdf",
    );
    try {
      await assert.rejects(
        new MysqlStudyUpload(pool, root, { acquireTimeoutMs: 20 }).submit(
          new Request("http://localhost", {
            method: "POST",
            headers: {
              "Idempotency-Key": "566a932f-4ff0-40b8-921d-3891128c0d58",
            },
            body: f,
          }),
          { id: "1", email: "one@example.invalid", name: null, image: null },
          async () => {},
        ),
        /UPLOAD_UNAVAILABLE/,
      );
      assert.deepEqual(await readdir(join(root, "1", ".mobile-staging")), []);
    } finally {
      clearTimeout(release);
      held.release();
      await pool.end();
    }
  },
);
