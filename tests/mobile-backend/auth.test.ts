import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  MobileAuth,
  AuthError,
  type AuthStore,
  type AuthTransaction,
  type LoginRequest,
  type MobileSession,
  type RefreshGeneration,
} from "../../src/mobile-server/auth.ts";

class TestStore implements AuthStore {
  requests = new Map<string, LoginRequest>();
  sessions = new Map<string, MobileSession>();
  refreshes = new Map<string, RefreshGeneration>();
  rates = new Map<string, { count: number; expiresAt: number }>();
  private pending = Promise.resolve();
  async transaction<T>(
    operation: (tx: AuthTransaction) => Promise<T>,
  ): Promise<T> {
    let release!: () => void;
    const previous = this.pending;
    this.pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    const tx: AuthTransaction = {
      request: async (id) => this.requests.get(id) ?? null,
      code: async (hash) =>
        [...this.requests.values()].find((r) => r.codeHash === hash) ?? null,
      saveRequest: async (value) => {
        this.requests.set(value.id, { ...value });
      },
      session: async (id) => this.sessions.get(id) ?? null,
      access: async (hash) =>
        [...this.sessions.values()].find((s) => s.accessHash === hash) ?? null,
      saveSession: async (value) => {
        this.sessions.set(value.id, { ...value });
      },
      refresh: async (hash) => this.refreshes.get(hash) ?? null,
      saveRefresh: async (value) => {
        this.refreshes.set(value.hash, { ...value });
      },
      user: async (id) =>
        id === "17"
          ? {
              id,
              name: "Persona de prueba",
              email: "test@example.invalid",
              image: null,
            }
          : null,
      rate: async (key, now, maximum) => {
        const old = this.rates.get(key);
        const value =
          old && old.expiresAt > now
            ? old
            : { count: 0, expiresAt: now + 60000 };
        value.count++;
        this.rates.set(key, value);
        return value.count <= maximum;
      },
    };
    try {
      return await operation(tx);
    } finally {
      release();
    }
  }
}
const verifier = "a".repeat(64);
const state = "b".repeat(43);
const redirect = "com.matyalts.misaluteca://auth/callback";
const challenge = createHash("sha256").update(verifier).digest("base64url");
function fixture() {
  let now = 100000;
  const store = new TestStore();
  return {
    store,
    auth: new MobileAuth(
      store,
      { origin: "https://saluteca.matyalts.me", redirect },
      () => now,
    ),
    advance: (ms: number) => {
      now += ms;
    },
  };
}
async function approved(auth: MobileAuth) {
  const request = await auth.createRequest(
    { challenge, state, redirect },
    "test",
  );
  const csrf = await auth.bindBrowser(request.requestId);
  const callback = await auth.approve(request.requestId, "17", csrf, csrf);
  const code = new URL(callback).searchParams.get("code")!;
  return { code, state, redirect, verifier };
}
test("exchange binds the canonical user and stores hashes, never tokens", async () => {
  const { auth, store } = fixture();
  const grant = await auth.exchange(await approved(auth), "exchange");
  assert.equal((await auth.identity(grant.accessToken)).id, "17");
  const serialized = JSON.stringify([
    ...store.sessions.values(),
    ...store.refreshes.values(),
  ]);
  assert.ok(!serialized.includes(grant.accessToken));
  assert.ok(!serialized.includes(grant.refreshToken));
  assert.equal(grant.expiresIn, 900);
});
test("request rejects unlisted redirect and malformed PKCE", async () => {
  const { auth } = fixture();
  await assert.rejects(
    auth.createRequest(
      { challenge, state, redirect: "evil://callback" },
      "test",
    ),
    AuthError,
  );
  await assert.rejects(
    auth.createRequest({ challenge: "plain", state, redirect }, "test"),
    AuthError,
  );
});
test("approval rejects missing user and invalid CSRF", async () => {
  const { auth } = fixture();
  const { requestId } = await auth.createRequest(
    { challenge, state, redirect },
    "test",
  );
  const csrf = await auth.bindBrowser(requestId);
  await assert.rejects(auth.approve(requestId, "999", csrf, csrf), AuthError);
  await assert.rejects(auth.approve(requestId, "17", "wrong", csrf), AuthError);
});
test("exchange rejects verifier, state and redirect mismatch", async () => {
  const { auth } = fixture();
  const input = await approved(auth);
  for (const change of [
    { verifier: "z".repeat(64) },
    { state: "z".repeat(43) },
    { redirect: "evil://callback" },
  ])
    await assert.rejects(
      auth.exchange({ ...input, ...change }, "exchange"),
      AuthError,
    );
  assert.ok((await auth.exchange(input, "exchange")).accessToken);
});
test("code replay and concurrent exchange issue at most one session", async () => {
  const { auth } = fixture();
  const input = await approved(auth);
  const results = await Promise.allSettled([
    auth.exchange(input, "exchange"),
    auth.exchange(input, "exchange"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  await assert.rejects(auth.exchange(input, "exchange"), AuthError);
});
test("code and request expire independently", async () => {
  const f = fixture();
  const input = await approved(f.auth);
  f.advance(60001);
  await assert.rejects(f.auth.exchange(input, "exchange"), AuthError);
  const req = await f.auth.createRequest(
    { challenge, state, redirect },
    "request",
  );
  f.advance(300001);
  await assert.rejects(f.auth.bindBrowser(req.requestId), AuthError);
});
test("rate limit is persisted and recovers after window", async () => {
  const f = fixture();
  for (let i = 0; i < 10; i++)
    await f.auth.createRequest({ challenge, state, redirect }, "same-ip");
  await assert.rejects(
    f.auth.createRequest({ challenge, state, redirect }, "same-ip"),
    (e: unknown) => e instanceof AuthError && e.status === 429,
  );
  f.advance(60001);
  assert.ok(
    (await f.auth.createRequest({ challenge, state, redirect }, "same-ip"))
      .requestId,
  );
});
test("access expiration and refresh rotation invalidate the old access", async () => {
  const f = fixture();
  const first = await f.auth.exchange(await approved(f.auth), "exchange");
  f.advance(900001);
  await assert.rejects(f.auth.identity(first.accessToken), AuthError);
  const second = await f.auth.renew(first.refreshToken, "renew");
  assert.notEqual(second.refreshToken, first.refreshToken);
  assert.equal((await f.auth.identity(second.accessToken)).id, "17");
});
test("refresh replay revokes the entire family including new access", async () => {
  const f = fixture();
  const first = await f.auth.exchange(await approved(f.auth), "exchange");
  const second = await f.auth.renew(first.refreshToken, "renew");
  await assert.rejects(f.auth.renew(first.refreshToken, "renew"), AuthError);
  await assert.rejects(f.auth.identity(second.accessToken), AuthError);
});
test("concurrent refresh replay revokes the family", async () => {
  const f = fixture();
  const first = await f.auth.exchange(await approved(f.auth), "exchange");
  const results = await Promise.allSettled([
    f.auth.renew(first.refreshToken, "renew"),
    f.auth.renew(first.refreshToken, "renew"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const success = results.find((r) => r.status === "fulfilled");
  if (success?.status === "fulfilled")
    await assert.rejects(f.auth.identity(success.value.accessToken), AuthError);
});
test("absolute session lifetime is seven days even after refresh", async () => {
  const f = fixture();
  const first = await f.auth.exchange(await approved(f.auth), "exchange");
  f.advance(7 * 86400000 + 1);
  await assert.rejects(f.auth.renew(first.refreshToken, "renew"), AuthError);
});
test("logout revokes access and refresh and is idempotent", async () => {
  const f = fixture();
  const first = await f.auth.exchange(await approved(f.auth), "exchange");
  await f.auth.logout(first.accessToken, undefined);
  await f.auth.logout(first.accessToken, undefined);
  await assert.rejects(f.auth.identity(first.accessToken), AuthError);
  await assert.rejects(f.auth.renew(first.refreshToken, "renew"), AuthError);
});
test("expired access logout can use refresh", async () => {
  const f = fixture();
  const first = await f.auth.exchange(await approved(f.auth), "exchange");
  f.advance(900001);
  await f.auth.logout(undefined, first.refreshToken);
  await assert.rejects(f.auth.renew(first.refreshToken, "renew"), AuthError);
});
test("invalid exchange attempts still consume persisted rate budget", async () => {
  const f = fixture();
  for (let i = 0; i < 10; i++)
    await assert.rejects(
      f.auth.exchange(
        { code: "q".repeat(43), verifier, state, redirect },
        "attacker",
      ),
      AuthError,
    );
  await assert.rejects(
    f.auth.exchange(
      { code: "q".repeat(43), verifier, state, redirect },
      "attacker",
    ),
    (e: unknown) => e instanceof AuthError && e.status === 429,
  );
});
test("malformed Unicode CSRF rejects without internal RangeError", async () => {
  const { auth } = fixture();
  const { requestId } = await auth.createRequest(
    { challenge, state, redirect },
    "test",
  );
  const csrf = await auth.bindBrowser(requestId);
  await assert.rejects(
    auth.approve(requestId, "17", "é".repeat(csrf.length), csrf),
    AuthError,
  );
});
test("backend origin cannot contain query, credentials or fragment", () => {
  for (const origin of [
    "https://test.invalid/?secret=1",
    "https://test.invalid/#fragment",
    "https://user:pass@test.invalid/",
  ])
    assert.throws(() => new MobileAuth(new TestStore(), { origin, redirect }));
});
test("origin canonicalization handles trailing slash and host case", async () => {
  for (const origin of ["https://test.invalid/", "https://TEST.invalid"]) {
    const auth = new MobileAuth(new TestStore(), { origin, redirect });
    const request = await auth.createRequest(
      { challenge, state, redirect },
      "origin",
    );
    assert.ok(
      request.authorizationUrl.startsWith(
        "https://test.invalid/mobile/authorize?",
      ),
    );
  }
});
