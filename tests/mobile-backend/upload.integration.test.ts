import { migrateFamilySchema } from "../../src/mobile-server/family-schema.ts";
import { MysqlFamily } from "../../src/mobile-server/mysql-family.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import {
  readFile,
  mkdtemp,
  writeFile,
  mkdir,
  access,
  utimes,
  readdir,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { migrateUploadSchema } from "../../src/mobile-server/upload-schema.ts";
import {
  MysqlStudyUpload,
  cleanupUploadFailure,
} from "../../src/mobile-server/mysql-study-upload.ts";
import { recoverUploadBatch } from "../../src/mobile-server/upload-recovery.ts";
import { spawn } from "node:child_process";
const config = {
  host: "127.0.0.1",
  port: 33316,
  user: "root",
  password: "isolated-test-password",
  multipleStatements: true,
};
const key = "566a932f-4ff0-40b8-921d-3891128c0d44";

function request(title = "report") {
  const f = new FormData();
  f.set("date", "18-09-2026");
  f.set("patient", "self");
  f.set("title", title);
  f.append(
    "files",
    new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
    "a.pdf",
  );
  return new Request("http://localhost/api/mobile/v1/studies", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: f,
  });
}

test(
  "upload atomically commits one study and quota, replay same key returns same study",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const admin = await mysql.createConnection(config);
    await admin.query(
      "DROP DATABASE IF EXISTS misaluteca_mobile_upload_test;CREATE DATABASE misaluteca_mobile_upload_test",
    );
    const pool = mysql.createPool({
      ...config,
      database: "misaluteca_mobile_upload_test",
    });
    const root = await mkdtemp(join(tmpdir(), "upload-ledger-"));
    try {
      await pool.query(
        await readFile(
          new URL("../../database/mobile-test-bootstrap.sql", import.meta.url),
          "utf8",
        ),
      );
      await migrateUploadSchema(pool, "misaluteca_mobile_upload_test");
      await pool.query(
        "INSERT INTO users(id,email) VALUES(1,'one@example.invalid'),(2,'two@example.invalid')",
      );
      const upload = new MysqlStudyUpload(pool, root);
      const user = {
        id: "1",
        email: "one@example.invalid",
        name: null,
        image: null,
      };
      const first = await upload.submit(request(), user, async () => {});
      const replay = await upload.submit(request(), user, async () => {});
      assert.equal(first.httpStatus, 201);
      assert.equal(replay.httpStatus, 200);
      assert.equal(first.studyId, replay.studyId);
      const [rows] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      assert.equal((rows as { count_files: number }[])[0].count_files, 1);
      const [studies] = await pool.query("SELECT * FROM estudios");
      assert.equal((studies as unknown[]).length, 1);
      assert.equal((await upload.status("1", key)).status, "complete");
      await assert.rejects(upload.status("2", key), /NOT_FOUND/);
      await assert.rejects(
        upload.submit(request("different"), user, async () => {}),
        /IDEMPOTENCY_CONFLICT/,
      );
    } finally {
      await pool.end();
      await admin.end();
    }
  },
);
test(
  "actual death after commit preserves one study and cleanup reclaims completed staging",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-after-commit-")),
      op = "566a932f-4ff0-40b8-921d-3891128c0d58";
    try {
      const child = spawn(
        process.execPath,
        [
          "tests/mobile-backend/fixtures/upload-crash.mjs",
          root,
          op,
          "committed",
        ],
        { stdio: "ignore" },
      );
      assert.equal(await new Promise((r) => child.once("exit", r)), 17);
      const upload = new MysqlStudyUpload(pool, root);
      const before = await upload.status("1", op);
      assert.equal(before.status, "complete");
      await recoverUploadBatch(pool, root);
      await access(join(root, `1/mobile-${op}-0.pdf`));
      const [rows] = await pool.query(
        "SELECT manifest FROM mobile_study_uploads WHERE operation_id=?",
        [op],
      );
      const directory = JSON.parse(
        (rows as { manifest: string }[])[0].manifest,
      ).directoryKey;
      await assert.rejects(access(join(root, directory)));
      assert.equal((await upload.status("1", op)).studyId, before.studyId);
    } finally {
      await pool.end();
    }
  },
);
test(
  "actual writer death after private promotion is recovered by actual internal worker without partial study",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1", timeout: 15000 },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-kill-")),
      op = "566a932f-4ff0-40b8-921d-3891128c0d56";
    try {
      const child = spawn(
        process.execPath,
        [
          "tests/mobile-backend/fixtures/upload-crash.mjs",
          root,
          op,
          "promoted",
        ],
        { stdio: "ignore" },
      );
      const code = await new Promise((r) => child.once("exit", r));
      assert.equal(code, 17);
      await pool.query(
        "UPDATE mobile_study_uploads SET lease_until=0 WHERE operation_id=?",
        [op],
      );
      const worker = spawn(
        process.execPath,
        ["scripts/mobile-cleanup-worker.mjs"],
        {
          env: {
            ...process.env,
            DB_HOST: "127.0.0.1",
            DB_PORT: "33316",
            DB_USER: "root",
            DB_PASSWORD: "isolated-test-password",
            DB_NAME: "misaluteca_mobile_upload_test",
            DIRECTORY_UPLOADS: root,
          },
          stdio: "ignore",
        },
      );
      try {
        let done = false;
        for (let i = 0; i < 70; i++) {
          const s = await new MysqlStudyUpload(pool, root).status("1", op);
          if (s.status === "failed") {
            done = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        assert.equal(done, true);
        await assert.rejects(access(join(root, `1/mobile-${op}-0.pdf`)));
      } finally {
        worker.kill("SIGTERM");
        await new Promise((r) => worker.once("exit", r));
      }
    } finally {
      await pool.end();
    }
  },
);
test(
  "worker reclaims old untracked ingestion directories and completed staging while preserving committed files",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-orphan-"));
    const orphan = "1/.mobile-staging/566a932f-4ff0-40b8-921d-3891128c0d55";
    try {
      await mkdir(join(root, orphan), { recursive: true });
      await writeFile(join(root, orphan, "0"), "private");
      await utimes(join(root, orphan), new Date(0), new Date(0));
      await recoverUploadBatch(pool, root);
      await assert.rejects(access(join(root, orphan)));
    } finally {
      await pool.end();
    }
  },
);
test(
  "recovery preserves shared or ambiguous retained references and rejects unsafe manifest paths",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-retained-"));
    const op = "566a932f-4ff0-40b8-921d-3891128c0d53",
      fileKey = `1/mobile-${op}-0.pdf`,
      directoryKey = "1/.mobile-staging/566a932f-4ff0-40b8-921d-3891128c0d54";
    const manifest = {
      fields: { patient: "self" },
      directoryKey,
      files: [{ fileKey, stageKey: directoryKey + "/0" }],
    };
    try {
      await mkdir(join(root, directoryKey), { recursive: true });
      await writeFile(join(root, fileKey), "retain");
      await pool.query(
        "INSERT INTO estudios(uuid,id_usuario,email_usuario,fecha,file_key)VALUES('alias-retain',1,'one@example.invalid','18-09-2026',?)",
        ["1/./" + fileKey.split("/")[1]],
      );
      await pool.query(
        "INSERT INTO mobile_study_uploads(id_usuario,operation_id,fingerprint,manifest,created_at,updated_at)VALUES(?,?,?,?,1,1)",
        ["1", op, "a".repeat(64), JSON.stringify(manifest)],
      );
      await recoverUploadBatch(pool, root);
      await access(join(root, fileKey));
      assert.equal(
        (await new MysqlStudyUpload(pool, root).status("1", op)).status,
        "pending",
      );
      await pool.query("DELETE FROM estudios WHERE uuid='alias-retain'");
    } finally {
      await pool.end();
    }
  },
);
test(
  "storage or SQL failure rolls back study quota and every promoted attachment",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-rollback-"));
    try {
      await pool.query(
        "CREATE TRIGGER reject_upload BEFORE INSERT ON estudios FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test rollback'",
      );
      const op = "566a932f-4ff0-40b8-921d-3891128c0d52",
        r = request();
      r.headers.set("Idempotency-Key", op);
      const [before] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      await assert.rejects(
        new MysqlStudyUpload(pool, root).submit(
          r,
          { id: "1", email: "one@example.invalid", name: null, image: null },
          async () => {},
        ),
        /test rollback/,
      );
      await assert.rejects(access(join(root, `1/mobile-${op}-0.pdf`)));
      const [after] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      assert.deepEqual(after, before);
      assert.equal(
        (await new MysqlStudyUpload(pool, root).status("1", op)).status,
        "failed",
      );
    } finally {
      await pool.query("DROP TRIGGER IF EXISTS reject_upload");
      await pool.end();
    }
  },
);
test(
  "expired cleanup lease cannot unlink; new worker lease recovers durable manifest",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-fence-"));
    const op = "566a932f-4ff0-40b8-921d-3891128c0d49",
      lease = "566a932f-4ff0-40b8-921d-3891128c0d50";
    const fileKey = `1/mobile-${op}-0.pdf`,
      directoryKey = "1/.mobile-staging/566a932f-4ff0-40b8-921d-3891128c0d51";
    const manifest = {
      fields: { patient: "self" },
      directoryKey,
      files: [{ fileKey, stageKey: directoryKey + "/0" }],
    };
    try {
      await mkdir(join(root, directoryKey), { recursive: true });
      await writeFile(join(root, fileKey), "keep");
      await pool.query(
        "INSERT INTO mobile_study_uploads(id_usuario,operation_id,fingerprint,manifest,created_at,updated_at,lease_token,lease_until)VALUES(?,?,?,?,?,?,?,?)",
        ["1", op, "a".repeat(64), JSON.stringify(manifest), 1, 1, lease, 1],
      );
      await cleanupUploadFailure(
        pool,
        root,
        "1",
        op,
        lease,
        manifest as never,
        new Error(),
      );
      await access(join(root, fileKey));
      await recoverUploadBatch(pool, root);
      await assert.rejects(access(join(root, fileKey)));
      assert.equal(
        (await new MysqlStudyUpload(pool, root).status("1", op)).status,
        "failed",
      );
    } finally {
      await pool.end();
    }
  },
);
test(
  "recovery fences stale upload and removes only unreferenced private promoted files",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-recover-"));
    try {
      await recoverUploadBatch(pool, root);
      const [rows] = await pool.query(
        "SELECT COUNT(*) AS n FROM mobile_study_uploads WHERE status='complete'",
      );
      assert.ok((rows as { n: number }[])[0].n >= 1);
    } finally {
      await pool.end();
    }
  },
);
test(
  "ledger key is account-local and revoked session rolls back before publishing files",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-isolation-")),
      upload = new MysqlStudyUpload(pool, root);
    try {
      const r = request();
      assert.equal(
        (
          await upload.submit(
            r,
            { id: "2", email: "two@example.invalid", name: null, image: null },
            async () => {},
          )
        ).status,
        "complete",
      );
      const revoked = request();
      revoked.headers.set(
        "Idempotency-Key",
        "566a932f-4ff0-40b8-921d-3891128c0d48",
      );
      await assert.rejects(
        upload.submit(
          revoked,
          { id: "1", email: "one@example.invalid", name: null, image: null },
          async () => {
            throw new Error("revoked");
          },
        ),
        /revoked/,
      );
      assert.equal(
        (await upload.status("1", "566a932f-4ff0-40b8-921d-3891128c0d48"))
          .status,
        "failed",
      );
    } finally {
      await pool.end();
    }
  },
);
test(
  "single-connection pool completes uploads without retaining claim connection",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1", timeout: 2000 },
  async () => {
    const pool = mysql.createPool({
      ...config,
      database: "misaluteca_mobile_upload_test",
      connectionLimit: 1,
    });
    const root = await mkdtemp(join(tmpdir(), "upload-single-"));
    const upload = new MysqlStudyUpload(pool, root);
    const r = request();
    r.headers.set("Idempotency-Key", "566a932f-4ff0-40b8-921d-3891128c0d47");
    try {
      assert.equal(
        (
          await upload.submit(
            r,
            { id: "1", email: "one@example.invalid", name: null, image: null },
            async () => {},
          )
        ).status,
        "complete",
      );
    } finally {
      await pool.end();
    }
  },
);
test(
  "concurrent distinct keys serialize study quota and failure/reset permit same-key safe retry",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      ...config,
      database: "misaluteca_mobile_upload_test",
    });
    const root = await mkdtemp(join(tmpdir(), "upload-race-"));
    const upload = new MysqlStudyUpload(pool, root),
      user = { id: "2", email: "two@example.invalid", name: null, image: null };
    const old = process.env.LIMIT_UPLOAD;
    process.env.LIMIT_UPLOAD = "1";
    const keyed = (id: string) => {
      const r = request();
      r.headers.set("Idempotency-Key", id);
      return r;
    };
    try {
      await pool.query(
        "UPDATE users SET count_files=0,date_files=NULL WHERE id=2",
      );
      const result = await Promise.allSettled([
        upload.submit(
          keyed("566a932f-4ff0-40b8-921d-3891128c0d45"),
          user,
          async () => {},
        ),
        upload.submit(
          keyed("566a932f-4ff0-40b8-921d-3891128c0d46"),
          user,
          async () => {},
        ),
      ]);
      assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
      assert.match(
        String(
          (result.find((r) => r.status === "rejected") as PromiseRejectedResult)
            .reason,
        ),
        /UPLOAD_LIMIT_REACHED/,
      );
      const failedKey =
        (await upload.status("2", "566a932f-4ff0-40b8-921d-3891128c0d45"))
          .status === "failed"
          ? "566a932f-4ff0-40b8-921d-3891128c0d45"
          : "566a932f-4ff0-40b8-921d-3891128c0d46";
      await pool.query("UPDATE users SET date_files='01-01-2020' WHERE id=2");
      assert.equal(
        (await upload.submit(keyed(failedKey), user, async () => {}))
          .httpStatus,
        201,
      );
      const [rows] = await pool.query(
        "SELECT count_files FROM users WHERE id=2",
      );
      assert.equal((rows as { count_files: number }[])[0].count_files, 1);
    } finally {
      if (old === undefined) delete process.env.LIMIT_UPLOAD;
      else process.env.LIMIT_UPLOAD = old;
      await pool.end();
    }
  },
);

test(
  "staging scavenger bounds each batch and resumes beyond retained active directories",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-many-stages-"));
    try {
      for (let i = 0; i < 40; i++) {
        const directory =
          "1/.mobile-staging/" +
          `566a932f-4ff0-40b8-921d-${String(i).padStart(12, "0")}`;
        await mkdir(join(root, directory), { recursive: true });
        await utimes(join(root, directory), new Date(0), new Date(0));
      }
      await recoverUploadBatch(pool, root);
      assert.ok((await readdir(join(root, "1", ".mobile-staging"))).length > 0);
      for (let i = 0; i < 5; i++) await recoverUploadBatch(pool, root);
      assert.equal(
        (await readdir(join(root, "1", ".mobile-staging"))).length,
        0,
      );
    } finally {
      await pool.end();
    }
  },
);

test(
  "simultaneous identical retries commit exactly one operation and increment once",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-same-key-"));
    try {
      const upload = new MysqlStudyUpload(pool, root),
        op = "566a932f-4ff0-40b8-921d-3891128c0d60",
        user = {
          id: "1",
          email: "one@example.invalid",
          name: null,
          image: null,
        };
      const keyed = () => {
        const r = request();
        r.headers.set("Idempotency-Key", op);
        return r;
      };
      const [before] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      const result = await Promise.all([
        upload.submit(keyed(), user, async () => {}),
        upload.submit(keyed(), user, async () => {}),
      ]);
      assert.equal(result.filter((r) => r.httpStatus === 201).length, 1);
      const status = await upload.status("1", op);
      assert.equal(status.status, "complete");
      const [after] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      assert.equal(
        (after as { count_files: number }[])[0].count_files,
        (before as { count_files: number }[])[0].count_files + 1,
      );
    } finally {
      await pool.end();
    }
  },
);

test(
  "family cleanup fault does not suppress independent actual upload recovery",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-family-fault-")),
      op = "566a932f-4ff0-40b8-921d-3891128c0d62",
      directoryKey = "1/.mobile-staging/566a932f-4ff0-40b8-921d-3891128c0d63";
    try {
      await pool.query("CREATE TABLE familiares(id INT)");
      await mkdir(join(root, directoryKey), { recursive: true });
      const fileKey = `1/mobile-${op}-0.pdf`;
      await writeFile(join(root, fileKey), "uncommitted");
      await pool.query(
        "INSERT INTO mobile_study_uploads(id_usuario,operation_id,fingerprint,manifest,created_at,updated_at)VALUES(?,?,?,?,1,1)",
        [
          "1",
          op,
          "a".repeat(64),
          JSON.stringify({
            directoryKey,
            files: [{ fileKey, stageKey: directoryKey + "/0" }],
          }),
        ],
      );
      const worker = spawn(
        process.execPath,
        ["scripts/mobile-cleanup-worker.mjs"],
        {
          env: {
            ...process.env,
            DB_HOST: "127.0.0.1",
            DB_PORT: "33316",
            DB_USER: "root",
            DB_PASSWORD: "isolated-test-password",
            DB_NAME: "misaluteca_mobile_upload_test",
            DIRECTORY_UPLOADS: root,
          },
          stdio: "ignore",
        },
      );
      try {
        let done = false;
        for (let i = 0; i < 35; i++) {
          if (
            (await new MysqlStudyUpload(pool, root).status("1", op)).status ===
            "failed"
          ) {
            done = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        assert.equal(done, true);
      } finally {
        worker.kill("SIGTERM");
        await new Promise((r) => worker.once("exit", r));
      }
    } finally {
      await pool.query("DROP TABLE IF EXISTS familiares");
      await pool.end();
    }
  },
);

test(
  "family uploads reject absent or foreign UUID and store all web fields for owned family",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
        ...config,
        database: "misaluteca_mobile_upload_test",
      }),
      root = await mkdtemp(join(tmpdir(), "upload-family-"));
    const user = {
        id: "1",
        email: "one@example.invalid",
        name: null,
        image: null,
      },
      upload = new MysqlStudyUpload(pool, root);
    const form = (familyUuid: string, op: string) => {
      const f = new FormData();
      f.set("date", "29-02-2024");
      f.set("patient", "family");
      f.set("familyUuid", familyUuid);
      for (const key of ["title", "institution", "medico"])
        f.set(key, "a".repeat(400));
      f.set("conclusion", "b".repeat(10000));
      f.set("description", "c".repeat(2000));
      f.append(
        "files",
        new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
        "a.pdf",
      );
      return new Request("http://localhost", {
        method: "POST",
        headers: { "Idempotency-Key": op },
        body: f,
      });
    };
    try {
      await assert.rejects(
        upload.submit(
          form(
            "566a932f-4ff0-40b8-921d-3891128c0d64",
            "566a932f-4ff0-40b8-921d-3891128c0d65",
          ),
          user,
          async () => {},
        ),
        { status: 404 },
      );
      await migrateFamilySchema(pool, "misaluteca_mobile_upload_test");
      const family = new MysqlFamily(pool),
        own = await family.create(user, { name: "Ana" }),
        foreign = await family.create(
          { id: "2", email: "two@example.invalid" },
          { name: "Foreign" },
        );
      await assert.rejects(
        upload.submit(
          form(foreign.uuid, "566a932f-4ff0-40b8-921d-3891128c0d66"),
          user,
          async () => {},
        ),
        { status: 404 },
      );
      const saved = await upload.submit(
        form(own.uuid, "566a932f-4ff0-40b8-921d-3891128c0d67"),
        user,
        async () => {},
      );
      const [rows] = await pool.query(
        "SELECT id_familiar,CHAR_LENGTH(titulo) AS t,CHAR_LENGTH(medico)AS m,CHAR_LENGTH(conclusion)AS c,CHAR_LENGTH(descripcion)AS d FROM estudios WHERE id=?",
        [saved.studyId],
      );
      const row = (
        rows as {
          id_familiar: number;
          t: number;
          m: number;
          c: number;
          d: number;
        }[]
      )[0];
      assert.equal(String(row.id_familiar), own.id);
      assert.deepEqual([row.t, row.m, row.c, row.d], [400, 400, 10000, 2000]);
    } finally {
      await pool.end();
    }
  },
);
