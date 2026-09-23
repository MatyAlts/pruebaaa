import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { MysqlStudyUpload } from "../../src/mobile-server/mysql-study-upload.ts";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readFile } from "node:fs/promises";
import {
  uploadSchemaReady,
  migrateUploadSchema,
} from "../../src/mobile-server/upload-schema.ts";
test(
  "TEST additive upload migration preserves populated bootstrap and existing family",
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
      "DROP DATABASE IF EXISTS misaluteca_mobile_upload_schema_test; CREATE DATABASE misaluteca_mobile_upload_schema_test",
    );
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_upload_schema_test",
      multipleStatements: true,
    });
    try {
      await pool.query(
        await readFile(
          new URL("../../database/mobile-test-bootstrap.sql", import.meta.url),
          "utf8",
        ),
      );
      await pool.query(
        "INSERT INTO users(id,email) VALUES(1,'one@example.invalid'); INSERT INTO estudios(uuid,id_usuario,email_usuario,fecha) VALUES('keep',1,'one@example.invalid','18-09-2026')",
      );
      assert.equal(await uploadSchemaReady(pool), false);
      await migrateUploadSchema(pool, "misaluteca_mobile_upload_schema_test");
      assert.equal(await uploadSchemaReady(pool), true);
      const [rows] = await pool.query("SELECT uuid FROM estudios");
      assert.equal((rows as { uuid: string }[])[0].uuid, "keep");
      await migrateUploadSchema(pool, "misaluteca_mobile_upload_schema_test");
    } finally {
      await pool.end();
      await admin.end();
    }
  },
);
test(
  "compatible legacy nullable quota preserves NULL rows and starts at one committed study",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_upload_schema_test",
      multipleStatements: true,
    });
    try {
      await pool.query(
        "ALTER TABLE users MODIFY count_files INT NULL DEFAULT NULL;UPDATE users SET count_files=NULL",
      );
      assert.equal(await uploadSchemaReady(pool), true);
      await migrateUploadSchema(pool, "misaluteca_mobile_upload_schema_test");
      const [rows] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      assert.equal((rows as { count_files: null }[])[0].count_files, null);
      const f = new FormData();
      f.set("date", "18-09-2026");
      f.set("patient", "self");
      f.append(
        "files",
        new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
        "a.pdf",
      );
      const upload = new MysqlStudyUpload(
        pool,
        await mkdtemp(join(tmpdir(), "legacy-quota-")),
      );
      await upload.submit(
        new Request("http://localhost", {
          method: "POST",
          headers: {
            "Idempotency-Key": "566a932f-4ff0-40b8-921d-3891128c0d61",
          },
          body: f,
        }),
        { id: "1", email: "one@example.invalid", name: null, image: null },
        async () => {},
      );
      const [after] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      assert.equal((after as { count_files: number }[])[0].count_files, 1);
      await pool.query(
        "ALTER TABLE users MODIFY count_files INT NOT NULL DEFAULT 0",
      );
    } finally {
      await pool.end();
    }
  },
);

test(
  "auto-generated business identifiers and recovery retry defaults are required",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_upload_schema_test",
      multipleStatements: true,
    });
    try {
      await pool.query(
        "ALTER TABLE estudios_archivos DROP FOREIGN KEY estudios_archivos_ibfk_1;ALTER TABLE estudios MODIFY id INT NOT NULL;ALTER TABLE estudios_archivos ADD CONSTRAINT estudios_archivos_ibfk_1 FOREIGN KEY(id_estudio) REFERENCES estudios(id) ON DELETE CASCADE",
      );
      assert.equal(await uploadSchemaReady(pool), false);
      await pool.query(
        "ALTER TABLE estudios_archivos DROP FOREIGN KEY estudios_archivos_ibfk_1;ALTER TABLE estudios MODIFY id INT NOT NULL AUTO_INCREMENT;ALTER TABLE estudios_archivos ADD CONSTRAINT estudios_archivos_ibfk_1 FOREIGN KEY(id_estudio) REFERENCES estudios(id) ON DELETE CASCADE",
      );
      await pool.query(
        "ALTER TABLE mobile_study_uploads ALTER retryable SET DEFAULT 0",
      );
      assert.equal(await uploadSchemaReady(pool), false);
      await pool.query(
        "ALTER TABLE mobile_study_uploads ALTER retryable SET DEFAULT 1",
      );
    } finally {
      await pool.end();
    }
  },
);
test(
  "readiness rejects missing transaction columns, unsafe defaults and attachment FK semantics",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_upload_schema_test",
      multipleStatements: true,
    });
    try {
      await pool.query(
        "ALTER TABLE estudios RENAME COLUMN conclusion TO hidden_conclusion",
      );
      assert.equal(await uploadSchemaReady(pool), false);
      await pool.query(
        "ALTER TABLE estudios RENAME COLUMN hidden_conclusion TO conclusion",
      );
      await pool.query(
        "ALTER TABLE mobile_study_uploads ALTER status SET DEFAULT 'complete'",
      );
      assert.equal(await uploadSchemaReady(pool), false);
      await pool.query(
        "ALTER TABLE mobile_study_uploads ALTER status SET DEFAULT 'pending'",
      );
    } finally {
      await pool.end();
    }
  },
);
test(
  "migration refuses incompatible existing types before any additive write and readiness tolerates absent DDL",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_upload_schema_test",
      multipleStatements: true,
    });
    try {
      await assert.rejects(
        migrateUploadSchema(pool, "wrong-db"),
        /TEST_DATABASE_REQUIRED/,
      );
      await pool.query(
        "ALTER TABLE mobile_study_uploads MODIFY fingerprint VARCHAR(64) NOT NULL",
      );
      assert.equal(await uploadSchemaReady(pool), false);
      await assert.rejects(
        migrateUploadSchema(pool, "misaluteca_mobile_upload_schema_test"),
        /INCOMPATIBLE_UPLOAD_SCHEMA/,
      );
      await pool.query(
        "ALTER TABLE mobile_study_uploads MODIFY fingerprint CHAR(64) NOT NULL",
      );
      await pool.query("ALTER TABLE users MODIFY count_files VARCHAR(20)");
      await assert.rejects(
        migrateUploadSchema(pool, "misaluteca_mobile_upload_schema_test"),
        /INCOMPATIBLE_UPLOAD_BASE/,
      );
      assert.equal(await uploadSchemaReady(pool), false);
    } finally {
      await pool.end();
    }
  },
);
test(
  "readiness and preflight reject optional web fields made NOT NULL before any additive DDL",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const db = "misaluteca_mobile_upload_nullability_test";
    const options = {
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      multipleStatements: true,
    };
    const admin = await mysql.createConnection(options);
    await admin.query(
      "DROP DATABASE IF EXISTS " + db + ";CREATE DATABASE " + db,
    );
    await admin.end();
    const pool = mysql.createPool({ ...options, database: db });
    try {
      await pool.query(
        await readFile(
          new URL("../../database/mobile-test-bootstrap.sql", import.meta.url),
          "utf8",
        ),
      );
      await migrateUploadSchema(pool, db);
      assert.equal(await uploadSchemaReady(pool), true);
      for (const name of [
        "institucion",
        "medico",
        "conclusion",
        "descripcion",
      ]) {
        const type = ["institucion", "medico"].includes(name)
          ? "VARCHAR(400)"
          : "TEXT";
        await pool.query(
          "ALTER TABLE estudios MODIFY " + name + " " + type + " NOT NULL",
        );
        assert.equal(await uploadSchemaReady(pool), false, name);
        await pool.query(
          "ALTER TABLE estudios MODIFY titulo VARCHAR(100) NULL",
        );
        await assert.rejects(
          migrateUploadSchema(pool, db),
          /INCOMPATIBLE_UPLOAD/,
        );
        const [rows] = await pool.query<RowDataPacket[]>(
          "SHOW COLUMNS FROM estudios LIKE 'titulo'",
        );
        assert.equal(rows[0].Type, "varchar(100)");
        await pool.query(
          "ALTER TABLE estudios MODIFY " +
            name +
            " " +
            type +
            " NULL, MODIFY titulo VARCHAR(400) NULL",
        );
        assert.equal(await uploadSchemaReady(pool), true);
      }
    } finally {
      await pool.end();
    }
  },
);
