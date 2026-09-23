import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const image = process.env.MOBILE_DOCKER_IMAGE;
const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8" }).trim();
test(
  "final image starts joined recovery worker as node and serves fixed port3000 without DB",
  { skip: !image, timeout: 20000 },
  async () => {
    const name = "saluteca-upload-smoke-" + Date.now();
    try {
      docker("run", "-d", "--name", name, "-p", "127.0.0.1::3000", image);
      const address = docker("port", name, "3000/tcp");
      let ready = false;
      for (let i = 0; i < 50; i++) {
        try {
          const r = await fetch("http://" + address + "/maintenance.html", {
            signal: AbortSignal.timeout(300),
          });
          if (r.status === 200) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 150));
      }
      assert.equal(ready, true);
      assert.equal(
        docker("inspect", "--format", "{{.Config.User}}", name),
        "node",
      );
      assert.match(
        docker(
          "exec",
          name,
          "node",
          "-e",
          "console.log(require('node:fs').readFileSync('/proc/1/cmdline','utf8'))",
        ),
        /start-mobile-backend/,
      );
    } finally {
      try {
        docker("rm", "-f", name);
      } catch {}
    }
  },
);
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { migrateUploadSchema } from "../../src/mobile-server/upload-schema.ts";
const db = "misaluteca_mobile_upload_docker_test";
const dbopts = {
  host: "127.0.0.1",
  port: 33316,
  user: "root",
  password: "isolated-test-password",
  multipleStatements: true,
};
test(
  "actual final Docker HTTP handles disk full atomically and its joined worker recovers writer death",
  { skip: !image, timeout: 90000 },
  async () => {
    const admin = await mysql.createConnection(dbopts);
    await admin.query(
      "DROP DATABASE IF EXISTS " + db + ";CREATE DATABASE " + db,
    );
    await admin.end();
    const pool = mysql.createPool({ ...dbopts, database: db });
    const name = "saluteca-upload-runtime-" + Date.now();
    const token = "docker-upload-token";
    try {
      await pool.query(
        await readFile(
          new URL("../../database/mobile-test-bootstrap.sql", import.meta.url),
          "utf8",
        ),
      );
      await migrateUploadSchema(pool, db);
      await pool.query(
        await readFile(
          new URL("../../database/mobile-auth.sql", import.meta.url),
          "utf8",
        ),
      );
      await pool.query(
        "INSERT INTO users(id,email)VALUES(1,'docker@example.invalid')",
      );
      await pool.query(
        "INSERT INTO mobile_auth_sessions(id,user_id,access_hash,access_expires_at,expires_at)VALUES(?,?,?,?,?)",
        [
          "docker-test",
          1,
          createHash("sha256").update(token).digest("hex"),
          Date.now() + 900000,
          Date.now() + 900000,
        ],
      );
      docker(
        "run",
        "-d",
        "--name",
        name,
        "--add-host",
        "host.docker.internal:host-gateway",
        "--tmpfs",
        "/app/uploads:rw,size=1048576,uid=1000,gid=1000,mode=0700",
        "-p",
        "127.0.0.1::3000",
        "-e",
        "DB_HOST=host.docker.internal",
        "-e",
        "DB_PORT=33316",
        "-e",
        "DB_USER=root",
        "-e",
        "DB_PASSWORD=isolated-test-password",
        "-e",
        "DB_NAME=" + db,
        "-e",
        "DIRECTORY_UPLOADS=/app/uploads",
        "-e",
        "MOBILE_ORIGIN=https://test.invalid",
        "-e",
        "NEXTAUTH_SECRET=isolated-test-secret",
        "-e",
        "NEXTAUTH_URL=https://test.invalid",
        image,
      );
      const address = "http://" + docker("port", name, "3000/tcp");
      for (let i = 0; i < 80; i++) {
        try {
          if (
            (
              await fetch(address + "/api/mobile/v1/me", {
                signal: AbortSignal.timeout(300),
              })
            ).status === 401
          )
            break;
        } catch {}
        await new Promise((r) => setTimeout(r, 150));
      }
      const form = new FormData();
      form.set("date", "18-09-2026");
      form.set("patient", "self");
      const huge = Buffer.alloc(2 * 1024 * 1024, 32);
      huge.write("%PDF-1.4");
      huge.write("%%EOF", huge.length - 5);
      form.append(
        "files",
        new Blob([huge], { type: "application/pdf" }),
        "large.pdf",
      );
      const failure = await fetch(address + "/api/mobile/v1/studies", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Idempotency-Key": "93adad7a-a21c-4ced-8b4b-a6cdc42d7a6e",
        },
        body: form,
        signal: AbortSignal.timeout(10000),
      });
      assert.equal(failure.status, 503);
      assert.equal((await failure.json()).error.code, "UPLOAD_UNAVAILABLE");
      const [empty] = await pool.query("SELECT COUNT(*) n FROM estudios");
      assert.equal(empty[0].n, 0);
      const [quota] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      assert.equal(quota[0].count_files, 0);
      assert.equal(
        docker(
          "exec",
          name,
          "node",
          "-e",
          "console.log(require('node:fs').readdirSync('/app/uploads/1/.mobile-staging').length)",
        ),
        "0",
      );
      const key = "722786a4-598c-4ce6-8d2a-c5793346aca1";
      const writer = `import mysql from 'mysql2/promise';import{MysqlStudyUpload}from'/app/src/mobile-server/mysql-study-upload.ts';const p=mysql.createPool({host:process.env.DB_HOST,port:33316,user:'root',password:process.env.DB_PASSWORD,database:process.env.DB_NAME});const f=new FormData();f.set('date','18-09-2026');f.set('patient','self');f.append('files',new Blob(['%PDF-1.4\\n%%EOF'],{type:'application/pdf'}),'a.pdf');await new MysqlStudyUpload(p,'/app/uploads',{checkpoint:async point=>{if(point==='promoted')process.exit(17)}}).submit(new Request('http://test',{method:'POST',headers:{'Idempotency-Key':'${key}'},body:f}),{id:'1',email:'docker@example.invalid',name:'Docker'},async()=>{});`;
      let killed = false;
      try {
        docker("exec", name, "node", "--input-type=module", "-e", writer);
      } catch (e) {
        assert.equal(e.status, 17);
        killed = true;
      }
      assert.equal(killed, true);
      await pool.query(
        "UPDATE mobile_study_uploads SET lease_until=0,next_attempt=0 WHERE operation_id=?",
        [key],
      );
      let recovered = false;
      for (let i = 0; i < 60; i++) {
        const [r] = await pool.query(
          "SELECT status,error_code FROM mobile_study_uploads WHERE operation_id=?",
          [key],
        );
        if (r[0]?.status === "failed") {
          assert.equal(r[0].error_code, "UPLOAD_INTERRUPTED");
          recovered = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      assert.equal(recovered, true);
      assert.equal(
        docker(
          "exec",
          name,
          "node",
          "-e",
          "console.log(require('node:fs').readdirSync('/app/uploads/1').filter(x=>x.startsWith('mobile-')).length)",
        ),
        "0",
      );
      const [after] = await pool.query("SELECT COUNT(*) n FROM estudios");
      assert.equal(after[0].n, 0);
      const checked = JSON.parse(
        docker(
          "exec",
          name,
          "node",
          "scripts/migrate-mobile-upload.mjs",
          "--test-database",
          db,
          "--check",
        ),
      );
      assert.equal(checked.status, "ready");
      const applied = JSON.parse(
        docker(
          "exec",
          name,
          "node",
          "scripts/migrate-mobile-upload.mjs",
          "--test-database",
          db,
          "--apply",
        ),
      );
      assert.equal(applied.status, "ready");
      const [preserved] = await pool.query(
        "SELECT count_files FROM users WHERE id=1",
      );
      assert.equal(preserved[0].count_files, 0);
    } finally {
      try {
        docker("rm", "-f", name);
      } catch {}
      await pool.end();
    }
  },
);
