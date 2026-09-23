import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import { MysqlAuthStore } from "../../src/mobile-server/mysql-auth-store.ts";
import { MobileAuth, AuthError } from "../../src/mobile-server/auth.ts";
import { spawn, execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Hard-coded loopback dedicated test database: never reads DB_HOST/DB_NAME/.env.
test(
  "real MySQL migration, code atomicity, rotation, replay and rollback",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_test",
      multipleStatements: true,
      connectionLimit: 4,
    });
    try {
      const [databases] = await pool.query("SELECT DATABASE() AS name");
      assert.equal(
        (databases as { name: string }[])[0].name,
        "misaluteca_mobile_test",
      );
      await pool.query(
        "CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100), image VARCHAR(100)) ENGINE=InnoDB",
      );
      await pool.query(
        await readFile(
          new URL("../../database/mobile-auth.sql", import.meta.url),
          "utf8",
        ),
      );
      await pool.query(
        "DELETE FROM mobile_auth_refresh; DELETE FROM mobile_auth_sessions; DELETE FROM mobile_auth_requests; DELETE FROM mobile_auth_rates; DELETE FROM users",
      );
      await pool.query(
        "INSERT INTO users (id,name,email) VALUES (17,'Prueba','test@example.invalid')",
      );
      const store = new MysqlAuthStore(pool);
      const redirect = "com.matyalts.misaluteca://auth/callback";
      const verifier = "a".repeat(64);
      const state = "b".repeat(43);
      const auth = new MobileAuth(store, {
        origin: "https://saluteca.matyalts.me",
        redirect,
      });
      const request = await auth.createRequest(
        {
          challenge: createHash("sha256").update(verifier).digest("base64url"),
          state,
          redirect,
        },
        "integration",
      );
      const csrf = await auth.bindBrowser(request.requestId);
      const url = new URL(
        await auth.approve(request.requestId, "17", csrf, csrf),
      );
      const input = {
        code: url.searchParams.get("code")!,
        verifier,
        state,
        redirect,
      };
      const codes = await Promise.allSettled([
        auth.exchange(input, "integration"),
        auth.exchange(input, "integration"),
      ]);
      assert.equal(codes.filter((r) => r.status === "fulfilled").length, 1);
      const success = codes.find((r) => r.status === "fulfilled");
      assert.ok(success?.status === "fulfilled");
      const first = success.value;
      assert.equal((await auth.identity(first.accessToken)).id, "17");
      const second = await auth.renew(first.refreshToken, "integration");
      await assert.rejects(
        auth.renew(first.refreshToken, "integration"),
        AuthError,
      );
      await assert.rejects(auth.identity(second.accessToken), AuthError);
      const concurrentAttempt = await auth.createRequest(
        {
          challenge: createHash("sha256").update(verifier).digest("base64url"),
          state,
          redirect,
        },
        "concurrent",
      );
      const concurrentCsrf = await auth.bindBrowser(
        concurrentAttempt.requestId,
      );
      const concurrentCode = new URL(
        await auth.approve(
          concurrentAttempt.requestId,
          "17",
          concurrentCsrf,
          concurrentCsrf,
        ),
      );
      const concurrentGrant = await auth.exchange(
        {
          code: concurrentCode.searchParams.get("code")!,
          verifier,
          state,
          redirect,
        },
        "concurrent",
      );
      const refreshes = await Promise.allSettled([
        auth.renew(concurrentGrant.refreshToken, "concurrent"),
        auth.renew(concurrentGrant.refreshToken, "concurrent"),
      ]);
      assert.equal(
        refreshes.filter((result) => result.status === "fulfilled").length,
        1,
      );
      const rotated = refreshes.find((result) => result.status === "fulfilled");
      assert.ok(rotated?.status === "fulfilled");
      await assert.rejects(auth.identity(rotated.value.accessToken), AuthError);
      await assert.rejects(
        store.transaction(async (tx) => {
          const session = await tx.access(
            createHash("sha256").update(second.accessToken).digest("hex"),
          );
          assert.ok(session);
          await tx.saveSession({ ...session, revoked: false });
          throw new Error("rollback");
        }),
      );
      await assert.rejects(auth.identity(second.accessToken), AuthError);
      const [stored] = await pool.query(
        "SELECT * FROM mobile_auth_sessions; SELECT * FROM mobile_auth_refresh",
      );
      const persisted = JSON.stringify(stored);
      assert.ok(!persisted.includes(first.refreshToken));
      assert.ok(!persisted.includes(second.accessToken));
      for (let i = 0; i < 10; i++)
        await assert.rejects(
          auth.exchange({ ...input, code: "q".repeat(43) }, "attacker"),
          AuthError,
        );
      await assert.rejects(
        auth.exchange({ ...input, code: "q".repeat(43) }, "attacker"),
        (error: unknown) => error instanceof AuthError && error.status === 429,
      );
      await pool.query(
        "INSERT INTO users (id,name,email) VALUES (18,'Otra','other@example.invalid')",
      );
      await pool.query(
        "CREATE TABLE IF NOT EXISTS estudios (id INT PRIMARY KEY, uuid VARCHAR(100), id_usuario INT, email_usuario VARCHAR(100), id_familiar INT NULL, titulo VARCHAR(100), fecha VARCHAR(100), institucion VARCHAR(100), medico VARCHAR(100), conclusion TEXT, descripcion TEXT, created_at VARCHAR(100), updated_at VARCHAR(100), file_key VARCHAR(100), file_name VARCHAR(100), mime_type VARCHAR(100), file_size INT)",
      );
      await pool.query(
        "CREATE TABLE IF NOT EXISTS estudios_archivos (id INT PRIMARY KEY, id_estudio INT, file_key VARCHAR(100), file_name VARCHAR(100), mime_type VARCHAR(100), file_size INT)",
      );
      await pool.query(
        "DELETE FROM estudios_archivos; DELETE FROM estudios; INSERT INTO estudios (id,uuid,id_usuario,titulo,fecha,medico,file_key,file_name,mime_type,file_size) VALUES (12,'own',17,'Propio','17-09-2026','Prueba','17/a.pdf','Prueba.pdf','application/pdf',13),(13,'foreign',18,'Ajeno','17-09-2026','Otra',NULL,NULL,NULL,NULL),(14,'family',17,'Familiar','17-09-2026','Otra',NULL,NULL,NULL,NULL); UPDATE estudios SET id_familiar=3 WHERE id=14",
      );
      const temp = await mkdtemp(join(tmpdir(), "saluteca-http-test-"));
      await mkdir(join(temp, "17"));
      await writeFile(join(temp, "17/a.pdf"), "%PDF-1.7\ntest");
      const attempt = await auth.createRequest(
        {
          challenge: createHash("sha256").update(verifier).digest("base64url"),
          state,
          redirect,
        },
        "http",
      );
      const browserCsrf = await auth.bindBrowser(attempt.requestId);
      const codeUrl = new URL(
        await auth.approve(attempt.requestId, "17", browserCsrf, browserCsrf),
      );
      const grant = await auth.exchange(
        { code: codeUrl.searchParams.get("code")!, verifier, state, redirect },
        "http",
      );
      const child = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "dev",
          "--webpack",
          "--port",
          "33317",
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            DB_HOST: "127.0.0.1",
            DB_USER: "root",
            DB_PASSWORD: "isolated-test-password",
            DB_NAME: "misaluteca_mobile_test",
            DB_PORT: "33316",
            DIRECTORY_UPLOADS: temp,
            MOBILE_ORIGIN: "https://saluteca.matyalts.me",
            NEXTAUTH_URL: "http://127.0.0.1:33317",
            NEXTAUTH_SECRET: "isolated-test-secret-never-use-outside-tests",
            GOOGLE_CLIENT_ID: "test-not-real-client",
            GOOGLE_CLIENT_SECRET: "test-not-real-secret",
            OPENAI_API_KEY: "test-not-real-key",
          },
          stdio: "ignore",
        },
      );
      try {
        let ready = false;
        for (let i = 0; i < 100; i++) {
          try {
            const response = await fetch(
              "http://127.0.0.1:33317/api/mobile/v1/me",
              { signal: AbortSignal.timeout(1000) },
            );
            if (response.status === 401) {
              ready = true;
              break;
            }
          } catch {}
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        assert.ok(ready, "dedicated Next test server readiness");
        const headers = { Authorization: `Bearer ${grant.accessToken}` };
        const list = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/studies",
          { headers },
        );
        assert.equal(list.status, 200);
        assert.deepEqual(
          (await list.json()).items.map((s: { id: string }) => s.id),
          ["12"],
        );
        const unauthBrowser = await fetch(
          "http://127.0.0.1:33317/mobile/authorize?requestId=" +
            attempt.requestId,
          { redirect: "manual" },
        );
        assert.equal(unauthBrowser.status, 307);
        assert.ok(
          unauthBrowser.headers
            .get("location")
            ?.includes("/mobile/sign-in?callbackUrl="),
        );
        assert.equal(
          (
            await fetch("http://127.0.0.1:33317/mobile/authorize", {
              method: "POST",
              headers: { Origin: "https://evil.invalid" },
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await fetch("http://127.0.0.1:33317/mobile/authorize", {
              method: "POST",
              headers: { Origin: "https://saluteca.matyalts.me" },
            })
          ).status,
          401,
        );
        for (const id of ["13", "14", "999"])
          assert.equal(
            (
              await fetch(
                `http://127.0.0.1:33317/api/mobile/v1/studies/${id}`,
                { headers },
              )
            ).status,
            404,
          );
        const pdf = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/studies/12/files/legacy",
          { headers },
        );
        assert.equal(pdf.status, 200);
        assert.equal(await pdf.text(), "%PDF-1.7\ntest");
        assert.equal(
          (
            await fetch(
              "http://127.0.0.1:33317/api/mobile/v1/studies/12/files/999",
              { headers },
            )
          ).status,
          404,
        );
        assert.equal(pdf.headers.get("x-content-type-options"), "nosniff");
        await pool.query(
          "INSERT INTO estudios (id,uuid,id_usuario,titulo,fecha,medico,institucion,descripcion) VALUES (20,'older',17,'Control','01-02-2025','Dra Uno','Clínica','hallazgo'),(21,'newer',17,'Control','01-10-2026','Dra Dos','Hospital','Normal')",
        );
        const summary = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/studies/summary",
          { headers },
        );
        assert.equal(summary.status, 200);
        assert.equal(summary.headers.get("cache-control"), "no-store");
        const stats = await summary.json();
        assert.equal(stats.propiosTotal, 3);
        assert.equal(stats.familiaresTotal, null);
        assert.deepEqual(
          stats.recientes.map((s: { id: string }) => s.id),
          ["21", "12", "20"],
        );
        const filtered = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/studies?q=hallazgo&month=2&year=2025&sort=study-date-desc",
          { headers },
        );
        assert.equal(filtered.status, 200);
        assert.deepEqual(
          (await filtered.json()).items.map((s: { id: string }) => s.id),
          ["20"],
        );
        const sorted = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/studies?sort=study-date-desc&limit=1",
          { headers },
        );
        const sortedPage = await sorted.json();
        assert.deepEqual(
          sortedPage.items.map((s: { id: string }) => s.id),
          ["21"],
        );
        const continued = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/studies?sort=study-date-desc&limit=1&cursor=" +
            sortedPage.nextCursor,
          { headers },
        );
        assert.deepEqual(
          (await continued.json()).items.map((s: { id: string }) => s.id),
          ["12"],
        );
        assert.equal(
          (
            await fetch(
              "http://127.0.0.1:33317/api/mobile/v1/studies?sort=study-date-desc&q=changed&cursor=" +
                sortedPage.nextCursor,
              { headers },
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await fetch(
              "http://127.0.0.1:33317/api/mobile/v1/studies?month=13",
              { headers },
            )
          ).status,
          400,
        );
        const capabilities = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/capabilities",
          { headers },
        );
        assert.equal((await capabilities.json()).features.studiesSummary, true);
        const logout = await fetch(
          "http://127.0.0.1:33317/api/mobile/v1/auth/logout",
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: grant.refreshToken }),
          },
        );
        assert.equal(logout.status, 204);
        assert.equal(logout.headers.get("set-cookie"), null);
        assert.equal(
          (await fetch("http://127.0.0.1:33317/api/mobile/v1/me", { headers }))
            .status,
          401,
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
