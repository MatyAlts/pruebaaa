import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { assertUploadSession } from "../../src/mobile-server/upload-session.ts";
test(
  "commit rechecks and locks same existing Bearer session on transaction connection",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const admin = await mysql.createConnection({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      multipleStatements: true,
    });
    await admin.query(
      "DROP DATABASE IF EXISTS misaluteca_mobile_upload_session_test;CREATE DATABASE misaluteca_mobile_upload_session_test",
    );
    await admin.end();
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_upload_session_test",
      multipleStatements: true,
      connectionLimit: 1,
    });
    const conn = await pool.getConnection();
    try {
      await conn.query(
        await readFile(
          new URL("../../database/mobile-test-bootstrap.sql", import.meta.url),
          "utf8",
        ),
      );
      await conn.query(
        await readFile(
          new URL("../../database/mobile-auth.sql", import.meta.url),
          "utf8",
        ),
      );
      await conn.query(
        "INSERT INTO users(id,email)VALUES(765,'upload-session@example.invalid') ON DUPLICATE KEY UPDATE email=email",
      );
      await conn.query(
        "DELETE FROM mobile_auth_sessions WHERE id='upload-session-valid'",
      );
      await conn.query(
        "INSERT INTO mobile_auth_sessions(id,user_id,access_hash,access_expires_at,expires_at)VALUES(?,?,?,?,?)",
        [
          "upload-session-valid",
          765,
          createHash("sha256").update("test-commit").digest("hex"),
          Date.now() + 60000,
          Date.now() + 60000,
        ],
      );
      await conn.beginTransaction();
      await assertUploadSession(conn, "test-commit", "765");
      await assert.rejects(
        assertUploadSession(conn, "test-commit", "766"),
        /UNAUTHORIZED/,
      );
      await conn.query(
        "UPDATE mobile_auth_sessions SET revoked=1 WHERE id='upload-session-valid'",
      );
      await assert.rejects(
        assertUploadSession(conn, "test-commit", "765"),
        /UNAUTHORIZED/,
      );
      await conn.rollback();
    } finally {
      conn.release();
      await pool.end();
    }
  },
);
