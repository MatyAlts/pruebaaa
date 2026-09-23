import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
test(
  "fresh dedicated test schema supports canonical Google and study reading queries",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_test",
      multipleStatements: true,
    });
    try {
      await pool.query(
        "CREATE DATABASE IF NOT EXISTS misaluteca_mobile_bootstrap_test",
      );
      await pool.query("USE misaluteca_mobile_bootstrap_test");
      await pool.query(
        "DROP TABLE IF EXISTS mobile_auth_refresh,mobile_auth_sessions,mobile_auth_requests,mobile_auth_rates,estudios_archivos,estudios,users",
      );
      await pool.query(
        await readFile(
          new URL("../../database/mobile-test-bootstrap.sql", import.meta.url),
          "utf8",
        ),
      );
      await pool.query(
        "INSERT INTO users (name,email,given_name,family_name,image,locale,updated_at) VALUES ('Prueba','test@example.invalid','Prueba','Usuario','','es','17-09-2026 12:00')",
      );
      const [users] = await pool.query(
        "SELECT id,name,email FROM users WHERE email=? LIMIT 1",
        ["test@example.invalid"],
      );
      assert.equal((users as { id: number }[]).length, 1);
      await pool.query(
        "UPDATE users SET name=?, given_name=?, family_name=?, image=?, locale=?, updated_at=? WHERE email=? LIMIT 1",
        [
          "Nombre",
          "Nombre",
          "Prueba",
          "",
          "es",
          "17-09-2026 12:01",
          "test@example.invalid",
        ],
      );
      await pool.query(
        await readFile(
          new URL("../../database/mobile-auth.sql", import.meta.url),
          "utf8",
        ),
      );
      const [studies] = await pool.query(
        "SELECT id,uuid,id_usuario,email_usuario,id_familiar,titulo,fecha,institucion,medico,conclusion,descripcion,created_at,updated_at,file_key,file_name,mime_type,file_size FROM estudios WHERE id_usuario=? AND id_familiar IS NULL ORDER BY id DESC LIMIT 20",
        [1],
      );
      assert.deepEqual(studies, []);
      await assert.rejects(
        pool.query(
          await readFile(
            new URL(
              "../../database/mobile-test-bootstrap.sql",
              import.meta.url,
            ),
            "utf8",
          ),
        ),
      );
    } finally {
      await pool.end();
    }
  },
);
