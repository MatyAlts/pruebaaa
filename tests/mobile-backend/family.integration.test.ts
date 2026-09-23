import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import {
  migrateFamilySchema,
  familySchemaReady,
} from "../../src/mobile-server/family-schema.ts";
import { MysqlFamily } from "../../src/mobile-server/mysql-family.ts";
import { cleanupBatch } from "../../src/mobile-server/family-cleanup.ts";
import {
  mkdtemp,
  mkdir,
  writeFile,
  access,
  symlink,
  unlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MysqlFamilyStudyReading } from "../../src/mobile-server/mysql-family-study-reading.ts";
import { MobileStudies } from "../../src/mobile-server/studies.ts";
import { mobileHttp } from "../../src/mobile-server/http.ts";
import { MobileAuth } from "../../src/mobile-server/auth.ts";
import { MysqlAuthStore } from "../../src/mobile-server/mysql-auth-store.ts";
import { createHash } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

test(
  "family TEST migration preserves existing records and rejects incompatible schemas",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_family_test",
      multipleStatements: true,
    });
    const admin = mysql.createConnection({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      multipleStatements: true,
    });
    const conn = await admin;
    await conn.query(
      "DROP DATABASE IF EXISTS misaluteca_mobile_family_test; CREATE DATABASE misaluteca_mobile_family_test",
    );
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
      await pool.query("ALTER TABLE users MODIFY email VARCHAR(200) NOT NULL");
      await assert.rejects(migrateFamilySchema(pool), /INCOMPATIBLE_TEST_BASE/);
      await pool.query("ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL");
      await migrateFamilySchema(pool);
      await pool.query(
        "RENAME TABLE mobile_cleanup_files TO cleanup_files_hidden",
      );
      await assert.rejects(
        familySchemaReady(pool),
        /INCOMPATIBLE_FAMILY_SCHEMA/,
      );
      await pool.query(
        "RENAME TABLE cleanup_files_hidden TO mobile_cleanup_files",
      );
      const [rows] = await pool.query("SELECT uuid FROM estudios");
      assert.equal((rows as { uuid: string }[])[0].uuid, "keep");
      await migrateFamilySchema(pool);
      await pool.query("ALTER TABLE familiares MODIFY nombre INT");
      await assert.rejects(
        migrateFamilySchema(pool),
        /INCOMPATIBLE_FAMILY_SCHEMA/,
      );
      await pool.query(
        "ALTER TABLE familiares MODIFY nombre VARCHAR(255) NOT NULL",
      );
      await pool.query(
        "ALTER TABLE familiares MODIFY nombre VARCHAR(255) NULL",
      );
      await assert.rejects(
        migrateFamilySchema(pool),
        /INCOMPATIBLE_FAMILY_SCHEMA/,
      );
      await pool.query(
        "ALTER TABLE familiares MODIFY nombre VARCHAR(255) NOT NULL",
      );
      await pool.query(
        "ALTER TABLE familiares ADD INDEX idx_temporary_fk(id_usuario)",
      );
      await pool.query("ALTER TABLE familiares DROP INDEX idx_family_owner");
      await assert.rejects(
        migrateFamilySchema(pool),
        /INCOMPATIBLE_FAMILY_SCHEMA/,
      );
      await pool.query(
        "ALTER TABLE familiares ADD INDEX idx_family_owner(id_usuario,id)",
      );
      await pool.query("ALTER TABLE familiares DROP INDEX idx_temporary_fk");
    } finally {
      await pool.end();
      await conn.end();
    }
  },
);

test(
  "manual TEST preflight CLI checks named database and rejects mismatch before DDL",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const env = {
      ...process.env,
      DB_HOST: "127.0.0.1",
      DB_PORT: "33316",
      DB_USER: "root",
      DB_PASSWORD: "isolated-test-password",
      DB_NAME: "misaluteca_mobile_family_test",
    };
    const result = await promisify(execFile)(
      process.execPath,
      [
        "scripts/migrate-mobile-family.mjs",
        "--test-database",
        "misaluteca_mobile_family_test",
        "--check",
      ],
      { env },
    );
    assert.match(result.stdout, /ready/);
    await assert.rejects(
      promisify(execFile)(
        process.execPath,
        [
          "scripts/migrate-mobile-family.mjs",
          "--test-database",
          "different",
          "--apply",
        ],
        { env },
      ),
    );
  },
);

test(
  "family HTTP uses canonical Bearer for CRUD, scoped reading and operations with real MySQL",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_family_test",
      multipleStatements: true,
    });
    try {
      await pool.query(
        await readFile(
          new URL("../../database/mobile-auth.sql", import.meta.url),
          "utf8",
        ),
      );
      const redirect = "com.matyalts.misaluteca://auth/callback",
        verifier = "v".repeat(64),
        state = "s".repeat(43);
      const auth = new MobileAuth(new MysqlAuthStore(pool), {
        origin: "https://test.invalid",
        redirect,
      });
      const req = await auth.createRequest(
        {
          challenge: createHash("sha256").update(verifier).digest("base64url"),
          state,
          redirect,
        },
        "family-http",
      );
      const csrf = await auth.bindBrowser(req.requestId);
      const approved = new URL(
        await auth.approve(req.requestId, "1", csrf, csrf),
      );
      const grant = await auth.exchange(
        { code: approved.searchParams.get("code")!, verifier, state, redirect },
        "family-http",
      );
      const deps = {
        auth,
        studies: new MobileStudies(new MysqlFamilyStudyReading(pool)),
        family: new MysqlFamily(pool),
        uploadRoot: "unused",
      };
      const unavailable = await mobileHttp(
        new Request("https://test.invalid/api/mobile/v1/capabilities", {
          headers: { Authorization: "Bearer " + grant.accessToken },
        }),
        deps,
      );
      assert.equal((await unavailable.json()).features.familyDelete, false);
      Object.assign(deps, { familyDeleteReady: true });
      const call = (
        path: string,
        method = "GET",
        input?: unknown,
        authorized = true,
      ) =>
        mobileHttp(
          new Request("https://test.invalid/api/mobile/v1/" + path, {
            method,
            headers: {
              ...(authorized
                ? { Authorization: "Bearer " + grant.accessToken }
                : {}),
              "Content-Type": "application/json",
            },
            body: input ? JSON.stringify(input) : undefined,
          }),
          deps,
        );
      assert.equal(
        (await call("family-members", "POST", { name: "Anon" }, false)).status,
        401,
      );
      const created = await call("family-members", "POST", { name: "HTTP" });
      assert.equal(created.status, 201);
      const item = (await created.json()).familyMember;
      assert.equal(
        (
          await call("family-members/" + item.uuid, "PATCH", {
            name: "Renombrado",
          })
        ).status,
        200,
      );
      assert.equal(
        (await call("family-members/" + item.uuid + "/studies")).status,
        200,
      );
      assert.equal(
        (await (await call("capabilities")).json()).features.familyRead,
        true,
      );
      const deleted = await call("family-members/" + item.uuid, "DELETE", {
        confirmation: "misaluteca",
      });
      assert.equal(deleted.status, 202);
      const op = await deleted.json();
      assert.equal((await call("operations/" + op.operationId)).status, 200);
      assert.equal((await call("family-members/" + item.uuid)).status, 404);
      const child = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "dev",
          "--webpack",
          "--port",
          "33319",
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            DB_HOST: "127.0.0.1",
            DB_PORT: "33316",
            DB_NAME: "misaluteca_mobile_family_test",
            DB_USER: "root",
            DB_PASSWORD: "isolated-test-password",
            MOBILE_ORIGIN: "https://test.invalid",
            NEXTAUTH_URL: "http://127.0.0.1:33319",
            NEXTAUTH_SECRET: "isolated-test-secret",
            GOOGLE_CLIENT_ID: "test",
            GOOGLE_CLIENT_SECRET: "test",
          },
          stdio: "ignore",
        },
      );
      try {
        let ready = false;
        for (let i = 0; i < 100; i++) {
          try {
            const r = await fetch("http://127.0.0.1:33319/api/mobile/v1/me", {
              signal: AbortSignal.timeout(1000),
            });
            if (r.status === 401) {
              ready = true;
              break;
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 300));
        }
        assert.equal(ready, true);
        const headers = {
          Authorization: "Bearer " + grant.accessToken,
          "Content-Type": "application/json",
        };
        const response = await fetch(
          "http://127.0.0.1:33319/api/mobile/v1/family-members",
          {
            method: "POST",
            headers,
            body: JSON.stringify({ name: "Next Real" }),
          },
        );
        assert.equal(response.status, 201);
        const entry = (await response.json()).familyMember;
        assert.equal(
          (
            await fetch(
              "http://127.0.0.1:33319/api/mobile/v1/family-members/" +
                entry.uuid,
              {
                method: "PATCH",
                headers,
                body: JSON.stringify({ name: "Next edit" }),
              },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await fetch(
              "http://127.0.0.1:33319/api/mobile/v1/family-members/" +
                entry.uuid,
              {
                method: "DELETE",
                headers,
                body: JSON.stringify({ confirmation: "misaluteca" }),
              },
            )
          ).status,
          503,
        );
        assert.equal(
          (
            await (
              await fetch("http://127.0.0.1:33319/api/mobile/v1/capabilities", {
                headers,
              })
            ).json()
          ).features.familyDelete,
          false,
        );
      } finally {
        if (child.pid) {
          if (process.platform === "win32")
            await new Promise<void>((resolve) =>
              execFile(
                "taskkill",
                ["/PID", String(child.pid), "/T", "/F"],
                () => resolve(),
              ),
            );
          else child.kill("SIGTERM");
        }
      }
    } finally {
      await pool.end();
    }
  },
);

test(
  "family scopes and patient DTO require both owners; legacy list stays self and cursors bind patient selection",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_family_test",
      multipleStatements: true,
    });
    try {
      const f = await new MysqlFamily(pool).create(
        { id: "1", email: "one@example.invalid" },
        { name: "Paciente" },
      );
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,titulo,fecha) VALUES('scope-family',1,'one@example.invalid',?,'Control','18-09-2026')",
        [f.id],
      );
      const reader = new MobileStudies(new MysqlFamilyStudyReading(pool));
      const family = await reader.list("1", {
        limit: null,
        cursor: null,
        scope: "family",
        familyUuid: f.uuid,
        sort: "study-date-desc",
      });
      assert.equal(family.items.length, 1);
      assert.equal(family.items[0].patient.kind, "family");
      assert.equal(family.items[0].patient.name, "Paciente");
      const own = await reader.list("1", { limit: null, cursor: null });
      assert.deepEqual(
        own.items.map((s) => s.uuid),
        ["keep"],
      );
      await assert.rejects(
        reader.list("2", {
          limit: null,
          cursor: null,
          scope: "family",
          familyUuid: f.uuid,
        }),
        { status: 404 },
      );
      const all = await reader.summary("1", { scope: "all" });
      assert.ok(all.familiaresTotal! > 0);
      assert.equal(all.total, all.propiosTotal + all.familiaresTotal!);
      const page = await reader.list("1", {
        limit: "1",
        cursor: null,
        scope: "all",
        sort: "study-date-desc",
      });
      assert.ok(page.nextCursor);
      await assert.rejects(
        reader.list("1", {
          limit: "1",
          cursor: page.nextCursor,
          scope: "family",
          familyUuid: f.uuid,
          sort: "study-date-desc",
        }),
        { status: 400 },
      );
      const auto = await reader.list("1", {
        limit: "1",
        cursor: null,
        scope: "all",
      });
      await assert.rejects(
        reader.list("1", { limit: "1", cursor: auto.nextCursor }),
        { status: 400 },
      );
      const pdfRoot = await mkdtemp(join(tmpdir(), "family-pdf-"));
      await mkdir(join(pdfRoot, "2"));
      await writeFile(join(pdfRoot, "2/secret.pdf"), "%PDF-1.7\nother");
      await pool.query(
        "UPDATE estudios SET file_key='2/secret.pdf',file_name='secret.pdf',mime_type='application/pdf',file_size=14 WHERE uuid='scope-family'",
      );
      await assert.rejects(
        reader.file("1", family.items[0].id, "legacy", pdfRoot),
        { status: 400 },
      );
      await symlink(
        join(pdfRoot, "2"),
        join(pdfRoot, "1"),
        process.platform === "win32" ? "junction" : "dir",
      );
      await pool.query(
        "UPDATE estudios SET file_key='1/secret.pdf' WHERE uuid='scope-family'",
      );
      await assert.rejects(
        reader.file("1", family.items[0].id, "legacy", pdfRoot),
        { status: 400 },
      );
      await pool.query(
        "UPDATE estudios SET file_key=NULL WHERE uuid='scope-family'",
      );
    } finally {
      await pool.end();
    }
  },
);

test(
  "durable cleanup deletes confined keys, handles ENOENT and keeps traversal/shared keys pending",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_family_test",
      multipleStatements: true,
    });
    try {
      const root = await mkdtemp(join(tmpdir(), "family-cleanup-"));
      await mkdir(join(root, "1"));
      await writeFile(join(root, "1/a.pdf"), "private");
      await writeFile(join(root, "1/b.pdf"), "private");
      await pool.query(
        "INSERT INTO mobile_cleanup_operations VALUES('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',1,'pending',0,0); INSERT INTO mobile_cleanup_files(operation_id,file_key) VALUES('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','1/a.pdf'),('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','1/b.pdf')",
      );
      await cleanupBatch(pool, root);
      await assert.rejects(access(join(root, "1/a.pdf")));
      await assert.rejects(access(join(root, "1/b.pdf")));
      const [ops] = await pool.query(
        "SELECT status FROM mobile_cleanup_operations",
      );
      assert.equal((ops as { status: string }[])[0].status, "complete");
      await pool.query(
        "INSERT INTO mobile_cleanup_operations VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',1,'pending',0,0); INSERT INTO mobile_cleanup_files(operation_id,file_key) VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','1/missing.pdf'),('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','../outside.pdf'),('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','1/shared.pdf')",
      );
      await pool.query(
        "UPDATE estudios SET file_key='1/shared.pdf' WHERE uuid='keep'",
      );
      await writeFile(join(root, "1/shared.pdf"), "keep");
      await cleanupBatch(pool, root);
      assert.equal(await access(join(root, "1/shared.pdf")), undefined);
      const [files] = await pool.query(
        "SELECT file_key,status,attempts FROM mobile_cleanup_files WHERE operation_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' ORDER BY file_key",
      );
      assert.deepEqual(
        (files as { file_key: string; status: string; attempts: number }[]).map(
          (r) => [r.file_key, r.status, r.attempts],
        ),
        [
          ["../outside.pdf", "pending", 1],
          ["1/missing.pdf", "complete", 1],
          ["1/shared.pdf", "pending", 1],
        ],
      );
      await pool.query(
        "INSERT INTO mobile_cleanup_files(operation_id,file_key) VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','1/alias.pdf')",
      );
      await pool.query(
        "UPDATE estudios SET file_key='1/sub/../alias.pdf' WHERE uuid='keep'",
      );
      await writeFile(join(root, "1/alias.pdf"), "keep");
      await cleanupBatch(pool, root, Date.now() + 6000);
      assert.equal(await access(join(root, "1/alias.pdf")), undefined);
      await pool.query(
        "UPDATE estudios SET file_key=NULL WHERE uuid='keep'; INSERT INTO mobile_cleanup_files(operation_id,file_key,lease_until,lease_token) VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','1/lease.pdf',1,'cccccccc-cccc-cccc-cccc-cccccccccccc')",
      );
      await writeFile(join(root, "1/lease.pdf"), "lease");
      let locked = false;
      await cleanupBatch(pool, root, Date.now() + 12000, {
        unlink: async (path) => {
          if (String(path).endsWith("lease.pdf")) {
            const c = await pool.getConnection();
            try {
              await assert.rejects(
                c.query(
                  "SELECT id FROM mobile_cleanup_files WHERE file_key='1/lease.pdf' FOR UPDATE NOWAIT",
                ),
              );
              locked = true;
            } finally {
              c.release();
            }
          }
          await unlink(path);
        },
      });
      assert.equal(locked, true);
      await pool.query(
        "UPDATE estudios SET file_key='1/./alias2.pdf' WHERE uuid='keep'; INSERT INTO mobile_cleanup_files(operation_id,file_key) VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','1/alias2.pdf')",
      );
      await writeFile(join(root, "1/alias2.pdf"), "keep");
      await cleanupBatch(pool, root, Date.now() + 18000);
      assert.equal(await access(join(root, "1/alias2.pdf")), undefined);
      await pool.query(
        "UPDATE estudios SET file_key='1//alias2.pdf' WHERE uuid='keep'",
      );
      await cleanupBatch(pool, root, Date.now() + 24000);
      assert.equal(await access(join(root, "1/alias2.pdf")), undefined);
      await pool.query(
        "UPDATE estudios SET file_key=NULL; INSERT INTO mobile_cleanup_files(operation_id,file_key) VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','1/link/outside.pdf'),('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','1/retry.pdf')",
      );
      const outside = await mkdtemp(join(tmpdir(), "family-outside-"));
      await writeFile(join(outside, "outside.pdf"), "other");
      await symlink(
        outside,
        join(root, "1/link"),
        process.platform === "win32" ? "junction" : "dir",
      );
      await writeFile(join(root, "1/retry.pdf"), "retry");
      await cleanupBatch(pool, root, Date.now() + 30000, {
        unlink: async (p) => {
          if (String(p).endsWith("retry.pdf"))
            throw Object.assign(new Error("denied"), { code: "EACCES" });
          await unlink(p);
        },
      });
      assert.equal(await access(join(outside, "outside.pdf")), undefined);
      assert.equal(await access(join(root, "1/retry.pdf")), undefined);
      await cleanupBatch(pool, root, Date.now() + 36000);
      await assert.rejects(access(join(root, "1/retry.pdf")));
      assert.equal(await access(join(outside, "outside.pdf")), undefined);
      const [retried] = await pool.query(
        "SELECT status,attempts FROM mobile_cleanup_files WHERE file_key='1/retry.pdf'",
      );
      assert.deepEqual(retried, [{ status: "complete", attempts: 2 }]);
    } finally {
      await pool.end();
    }
  },
);

test(
  "DELETE commits an owned cascade with durable outbox, rejects inconsistent ownership and confirmation",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_family_test",
      multipleStatements: true,
    });
    try {
      const service = new MysqlFamily(pool);
      const f = await service.create(
        { id: "1", email: "one@example.invalid" },
        { name: "Eliminar" },
      );
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,fecha,file_key) VALUES('delete-me',1,'one@example.invalid',?,'18-09-2026','1/a.pdf')",
        [f.id],
      );
      await pool.query(
        "INSERT INTO estudios_archivos(id_estudio,file_key,file_name,mime_type,file_size) SELECT id,'1/b.pdf','b.pdf','application/pdf',10 FROM estudios WHERE uuid='delete-me'",
      );
      await assert.rejects(
        service.remove("1", f.uuid, { confirmation: "wrong" }),
        { status: 400 },
      );
      await assert.rejects(
        service.remove("2", f.uuid, { confirmation: "misaluteca" }),
        { status: 404 },
      );
      const operation = await service.remove("1", f.uuid, {
        confirmation: "misaluteca",
      });
      assert.equal(operation.status, "pending");
      await assert.rejects(service.detail("1", f.uuid), { status: 404 });
      assert.equal(
        (await service.operation("1", operation.operationId)).status,
        "pending",
      );
      await assert.rejects(service.operation("2", operation.operationId), {
        status: 404,
      });
      const [keys] = await pool.query(
        "SELECT file_key FROM mobile_cleanup_files WHERE operation_id=? ORDER BY file_key",
        [operation.operationId],
      );
      assert.deepEqual(
        (keys as { file_key: string }[]).map((r) => r.file_key),
        ["1/a.pdf", "1/b.pdf"],
      );
      const bad = await service.create(
        { id: "1", email: "one@example.invalid" },
        { name: "Inconsistente" },
      );
      await pool.query(
        "INSERT INTO users(id,email) VALUES(2,'two@example.invalid') ON DUPLICATE KEY UPDATE email=email",
      );
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,fecha) VALUES('bad-delete',2,'two@example.invalid',?,'18-09-2026')",
        [bad.id],
      );
      await assert.rejects(
        service.remove("1", bad.uuid, { confirmation: "misaluteca" }),
        { status: 409 },
      );
      assert.equal((await service.detail("1", bad.uuid)).uuid, bad.uuid);
      const rollback = await service.create(
        { id: "1", email: "one@example.invalid" },
        { name: "Rollback" },
      );
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,fecha,file_key) VALUES('rollback-own',1,'one@example.invalid',?,'18-09-2026','1/rollback.pdf')",
        [rollback.id],
      );
      const [before] = await pool.query(
        "SELECT COUNT(*) AS n FROM mobile_cleanup_operations",
      );
      await pool.query(
        "CREATE TRIGGER reject_family_delete BEFORE DELETE ON familiares FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='isolated rollback'",
      );
      await assert.rejects(
        service.remove("1", rollback.uuid, { confirmation: "misaluteca" }),
      );
      await pool.query("DROP TRIGGER reject_family_delete");
      assert.equal((await service.detail("1", rollback.uuid)).studyCount, 1);
      const [after] = await pool.query(
        "SELECT COUNT(*) AS n FROM mobile_cleanup_operations",
      );
      assert.deepEqual(after, before);
      await pool.query(
        "CREATE TABLE links(id INT PRIMARY KEY,id_estudio INT NOT NULL,id_usuario INT NOT NULL) ENGINE=InnoDB",
      );
      await pool.query(
        "INSERT INTO links SELECT 1,id,1 FROM estudios WHERE uuid='rollback-own'",
      );
      await service.remove("1", rollback.uuid, { confirmation: "misaluteca" });
      const [links] = await pool.query("SELECT * FROM links");
      assert.deepEqual(links, []);
      const incompatible = await service.create(
        { id: "1", email: "one@example.invalid" },
        { name: "Links incompatible" },
      );
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,fecha) VALUES('bad-links',1,'one@example.invalid',?,'18-09-2026')",
        [incompatible.id],
      );
      await pool.query(
        "ALTER TABLE links MODIFY id_usuario VARCHAR(40) NOT NULL",
      );
      await assert.rejects(
        service.remove("1", incompatible.uuid, { confirmation: "misaluteca" }),
        { status: 409 },
      );
      assert.equal(
        (await service.detail("1", incompatible.uuid)).studyCount,
        1,
      );
      await pool.query("DROP TABLE links");
    } finally {
      await pool.end();
    }
  },
);

test(
  "family CRUD owns UUIDs, validates names and counts complete own family history",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_family_test",
      multipleStatements: true,
    });
    try {
      await pool.query(
        "ALTER TABLE familiares MODIFY nombre VARCHAR(255) NOT NULL",
      );
      await pool.query(
        "INSERT INTO users(id,email) VALUES(2,'two@example.invalid') ON DUPLICATE KEY UPDATE email=email",
      );
      const service = new MysqlFamily(pool);
      const user = { id: "1", email: "one@example.invalid" };
      const item = await service.create(user, { name: "  Ana  " });
      assert.equal(item.name, "Ana");
      assert.equal((await service.list("1"))[0].uuid, item.uuid);
      assert.deepEqual(await service.list("2"), []);
      await assert.rejects(service.detail("2", item.uuid), { status: 404 });
      await assert.rejects(
        service.rename("2", item.uuid, { name: "Intrusa" }),
        { status: 404 },
      );
      await assert.rejects(service.create(user, { name: "  " }), {
        status: 400,
      });
      await assert.rejects(service.create(user, { name: "a".repeat(41) }), {
        status: 400,
      });
      await assert.rejects(service.create(user, { name: "Ana", userId: "2" }), {
        status: 400,
      });
      assert.equal(
        (await service.rename("1", item.uuid, { name: "a".repeat(40) })).name
          .length,
        40,
      );
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,fecha) VALUES('family-own',1,'one@example.invalid',?,'18-09-2026'),('family-inconsistent',2,'two@example.invalid',?,'19-09-2026')",
        [item.id, item.id],
      );
      assert.equal((await service.detail("1", item.uuid)).studyCount, 1);
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,id_familiar,fecha) VALUES('invalid-last',1,'one@example.invalid',?,'99-99-2027')",
        [item.id],
      );
      assert.equal(
        (await service.detail("1", item.uuid)).lastStudyDate,
        "18-09-2026",
      );
    } finally {
      await pool.end();
    }
  },
);

test(
  "actual internal worker reclaims persisted operation and shuts down without public cleanup route",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_family_test",
      multipleStatements: true,
    });
    const root = await mkdtemp(join(tmpdir(), "family-worker-"));
    await mkdir(join(root, "1"));
    try {
      await pool.query(
        "DELETE FROM mobile_cleanup_files WHERE operation_id='dddddddd-dddd-dddd-dddd-dddddddddddd'; DELETE FROM mobile_cleanup_operations WHERE operation_id='dddddddd-dddd-dddd-dddd-dddddddddddd'",
      );
      await pool.query(
        "UPDATE estudios SET file_key=NULL; INSERT INTO mobile_cleanup_operations VALUES('dddddddd-dddd-dddd-dddd-dddddddddddd',1,'pending',0,0); INSERT INTO mobile_cleanup_files(operation_id,file_key) VALUES('dddddddd-dddd-dddd-dddd-dddddddddddd','1/worker-missing.pdf')",
      );
      const child = spawn(
        process.execPath,
        ["scripts/mobile-cleanup-worker.mjs"],
        {
          env: {
            ...process.env,
            DB_HOST: "127.0.0.1",
            DB_PORT: "33316",
            DB_USER: "root",
            DB_PASSWORD: "isolated-test-password",
            DB_NAME: "misaluteca_mobile_family_test",
            DIRECTORY_UPLOADS: root,
          },
          stdio: "ignore",
        },
      );
      try {
        let done = false;
        for (let i = 0; i < 50; i++) {
          const [r] = await pool.query(
            "SELECT status FROM mobile_cleanup_operations WHERE operation_id='dddddddd-dddd-dddd-dddd-dddddddddddd'",
          );
          if ((r as { status: string }[])[0].status === "complete") {
            done = true;
            break;
          }
          if (child.exitCode !== null) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        assert.equal(done, true);
      } finally {
        if (child.exitCode === null) {
          child.kill("SIGTERM");
          await new Promise((r) => child.once("exit", r));
        }
      }
    } finally {
      await pool.end();
    }
  },
);
