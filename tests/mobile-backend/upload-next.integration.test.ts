import { migrateUploadSchema } from "../../src/mobile-server/upload-schema.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
test(
  "external Next HTTP commits and reconciles authenticated multipart with schema and supervised recovery",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1", timeout: 90000 },
  async () => {
    const admin = await mysql.createConnection({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      multipleStatements: true,
    });
    await admin.query(
      "DROP DATABASE IF EXISTS misaluteca_mobile_upload_http_test; CREATE DATABASE misaluteca_mobile_upload_http_test",
    );
    await admin.end();
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_upload_http_test",
      multipleStatements: true,
    });
    const root = await mkdtemp(join(tmpdir(), "upload-next-")),
      token = "isolated-upload-token",
      key = "566a932f-4ff0-40b8-921d-3891128c0d57";
    await pool.query(
      await readFile(
        new URL("../../database/mobile-test-bootstrap.sql", import.meta.url),
        "utf8",
      ),
    );
    await migrateUploadSchema(pool, "misaluteca_mobile_upload_http_test");
    await pool.query(
      "INSERT INTO users(id,email)VALUES(1,'one@example.invalid')",
    );
    await pool.query(
      await readFile(
        new URL("../../database/mobile-auth.sql", import.meta.url),
        "utf8",
      ),
    );
    await pool.query("DELETE FROM mobile_auth_sessions WHERE id='upload-next'");
    await pool.query(
      "INSERT INTO mobile_auth_sessions(id,user_id,access_hash,access_expires_at,expires_at)VALUES(?,?,?,?,?)",
      [
        "upload-next",
        1,
        createHash("sha256").update(token).digest("hex"),
        Date.now() + 900000,
        Date.now() + 900000,
      ],
    );
    const child = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--webpack",
        "--port",
        "33321",
      ],
      {
        env: {
          ...process.env,
          DB_HOST: "127.0.0.1",
          DB_PORT: "33316",
          DB_USER: "root",
          DB_PASSWORD: "isolated-test-password",
          DB_NAME: "misaluteca_mobile_upload_http_test",
          MOBILE_ORIGIN: "https://test.invalid",
          MOBILE_UPLOAD_SUPERVISED: "true",
          DIRECTORY_UPLOADS: root,
          NEXTAUTH_SECRET: "isolated-test-secret",
          NEXTAUTH_URL: "http://127.0.0.1:33321",
        },
        stdio: "ignore",
      },
    );
    try {
      for (let i = 0; i < 100; i++) {
        try {
          const r = await fetch("http://127.0.0.1:33321/api/mobile/v1/me", {
            signal: AbortSignal.timeout(1000),
          });
          if (r.status === 401) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 300));
      }
      const f = new FormData();
      f.set("date", "18-09-2026");
      f.set("patient", "self");
      f.append(
        "files",
        new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
        "a.pdf",
      );
      const response = await fetch(
        "http://127.0.0.1:33321/api/mobile/v1/studies",
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token, "Idempotency-Key": key },
          body: f,
        },
      );
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.status, "complete");
      const status = await fetch(
        "http://127.0.0.1:33321/api/mobile/v1/study-uploads/" + key,
        { headers: { Authorization: "Bearer " + token } },
      );
      assert.equal((await status.json()).studyId, body.studyId);
    } finally {
      child.kill("SIGTERM");
      await new Promise((r) => child.once("exit", r));
      await pool.end();
    }
  },
);
