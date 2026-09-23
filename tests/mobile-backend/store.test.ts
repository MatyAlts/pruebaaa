import { test } from "node:test";
import assert from "node:assert/strict";
import { MysqlAuthStore } from "../../src/mobile-server/mysql-auth-store.ts";

function fixture() {
  const calls: string[] = [];
  const connection = {
    beginTransaction: async () => {
      calls.push("BEGIN");
    },
    commit: async () => {
      calls.push("COMMIT");
    },
    rollback: async () => {
      calls.push("ROLLBACK");
    },
    release: () => {
      calls.push("RELEASE");
    },
    execute: async (sql: string, values?: unknown[]) => {
      calls.push(sql);
      if (sql.startsWith("SELECT user_id"))
        return [
          [
            {
              user_id: "17",
              access_hash: "hash",
              id: "session",
              access_expires_at: 99,
              expires_at: 199,
              revoked: 0,
            },
          ],
          [],
        ];
      if (sql.startsWith("SELECT payload"))
        return [[{ payload: JSON.stringify({ id: "request" }) }], []];
      if (sql.startsWith("SELECT attempts"))
        return [[{ attempts: 1, expires_at: 60000 }], []];
      return [[], values];
    },
  };
  const pool = { getConnection: async () => connection };
  return { calls, store: new MysqlAuthStore(pool) };
}
test("request and session reads lock rows within committed transaction", async () => {
  const f = fixture();
  await f.store.transaction(async (tx) => {
    assert.equal((await tx.request("request"))?.id, "request");
    await tx.session("session");
  });
  assert.equal(f.calls[0], "BEGIN");
  assert.ok(f.calls.some((s) => s.includes("FOR UPDATE")));
  assert.deepEqual(f.calls.slice(-2), ["COMMIT", "RELEASE"]);
});
test("failure rolls back and releases rather than committing", async () => {
  const f = fixture();
  await assert.rejects(
    f.store.transaction(async () => {
      throw new Error("simulated DB failure");
    }),
  );
  assert.deepEqual(f.calls, ["BEGIN", "ROLLBACK", "RELEASE"]);
});
test("rate accounting locks persisted key and caps attempts", async () => {
  const f = fixture();
  await f.store.transaction(async (tx) => {
    assert.equal(await tx.rate("opaquehash", 0, 10), true);
  });
  assert.ok(f.calls.some((s) => s.includes("mobile_auth_rates")));
  assert.ok(f.calls.some((s) => s.includes("FOR UPDATE")));
});
