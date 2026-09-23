import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mobileHttp,
  type MobileDependencies,
} from "../../src/mobile-server/http.ts";
import { AuthError } from "../../src/mobile-server/auth.ts";
const dependencies: MobileDependencies = {
  auth: {
    identity: async (token) => {
      if (token !== "valid") throw new AuthError();
      return {
        id: "17",
        name: "Prueba",
        email: "test@example.invalid",
        image: null,
      };
    },
    createRequest: async () => ({
      requestId: "request",
      authorizationUrl: "https://test.invalid/mobile/authorize",
    }),
    exchange: async () => {
      throw new AuthError(400, "INVALID_GRANT");
    },
    renew: async () => {
      throw new AuthError();
    },
    logout: async () => {},
  },
  studies: {
    list: async () => ({ items: [], nextCursor: null }),
    detail: async () => {
      throw new Error("SQL credential/path private");
    },
    file: async () => {
      throw new Error("private");
    },
  },
  uploadRoot: "unused",
};
test("private endpoints reject missing bearer and do not accept cookies", async () => {
  for (const headers of [
    new Headers(),
    new Headers({ Cookie: "next-auth.session-token=valid" }),
  ]) {
    const r = await mobileHttp(
      new Request("https://test.invalid/api/mobile/v1/me", { headers }),
      dependencies,
    );
    assert.equal(r.status, 401);
    assert.equal(r.headers.get("cache-control"), "no-store");
  }
});
test("identity derives from bearer and error never leaks internal details", async () => {
  const r = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/me?userId=99", {
      headers: { Authorization: "Bearer valid" },
    }),
    dependencies,
  );
  assert.equal((await r.json()).user.id, "17");
  const failed = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/studies/12", {
      headers: { Authorization: "Bearer valid" },
    }),
    dependencies,
  );
  assert.equal(failed.status, 500);
  assert.ok(!(await failed.text()).includes("SQL"));
});
test("empty studies remain successful and unsupported method is rejected", async () => {
  const r = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/studies", {
      headers: { Authorization: "Bearer valid" },
    }),
    dependencies,
  );
  assert.deepEqual(await r.json(), { items: [], nextCursor: null });
  const invalid = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/me", { method: "POST" }),
    dependencies,
  );
  assert.equal(invalid.status, 405);
});
test("capabilities require bearer and expose only implemented read features", async () => {
  const denied = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/capabilities"),
    dependencies,
  );
  assert.equal(denied.status, 401);
  const allowed = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/capabilities", {
      headers: { Authorization: "Bearer valid" },
    }),
    dependencies,
  );
  assert.deepEqual(await allowed.json(), {
    version: 1,
    features: { studiesRead: true, profile: true, logout: true },
  });
});
test("malformed, large and missing JSON reject rather than raising internal error", async () => {
  for (const body of ["{", JSON.stringify({ large: "x".repeat(5000) }), "{}"]) {
    const r = await mobileHttp(
      new Request("https://test.invalid/api/mobile/v1/auth/token", {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
      }),
      dependencies,
    );
    assert.ok([400, 413].includes(r.status));
  }
});
test("oversized chunked body is cancelled before reading unlimited content", async () => {
  let reads = 0,
    cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      reads++;
      if (reads > 10) controller.close();
      else controller.enqueue(new Uint8Array(2048));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("https://test.invalid/api/mobile/v1/auth/token", {
    method: "POST",
    body: stream,
    duplex: "half",
    headers: { "content-type": "application/json" },
  } as RequestInit);
  const pending = mobileHttp(request, dependencies);
  const timeout = setTimeout(() => {
    void stream.cancel().catch(() => {});
  }, 200);
  try {
    const result = await Promise.race([
      pending,
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("body never bounded")), 100),
      ),
    ]);
    assert.equal(result.status, 413);
    assert.ok(cancelled);
    assert.ok(reads < 8);
  } finally {
    clearTimeout(timeout);
  }
});

test("summary route forwards only bearer owner and forwards bounded filter query", async () => {
  let seen: unknown;
  const deps = {
    ...dependencies,
    studies: {
      ...dependencies.studies,
      summary: async (userId: string) => ({
        scope: "self" as const,
        propiosTotal: userId === "17" ? 22 : 0,
        familiaresTotal: null,
        total: null,
        recientes: [],
        filterOptions: { medicos: [], institutions: [], years: [] },
      }),
      list: async (userId: string, query: unknown) => {
        seen = { userId, query };
        return { items: [], nextCursor: null };
      },
    },
  };
  const response = await mobileHttp(
    new Request(
      "https://test.invalid/api/mobile/v1/studies/summary?userId=99",
      { headers: { Authorization: "Bearer valid" } },
    ),
    deps,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).propiosTotal, 22);
  await mobileHttp(
    new Request(
      "https://test.invalid/api/mobile/v1/studies?q=hello&month=2&sort=study-date-desc",
      { headers: { Authorization: "Bearer valid" } },
    ),
    deps,
  );
  assert.deepEqual(seen, {
    userId: "17",
    query: {
      limit: null,
      cursor: null,
      q: "hello",
      medico: null,
      institution: null,
      month: "2",
      year: null,
      sort: "study-date-desc",
      scope: null,
    },
  });
  const capability = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/capabilities", {
      headers: { Authorization: "Bearer valid" },
    }),
    deps,
  );
  assert.equal((await capability.json()).features.studiesSummary, true);
  assert.equal(
    (
      await mobileHttp(
        new Request("https://test.invalid/api/mobile/v1/studies/summary"),
        deps,
      )
    ).status,
    401,
  );
  const failed = await mobileHttp(
    new Request("https://test.invalid/api/mobile/v1/studies/summary", {
      headers: { Authorization: "Bearer valid" },
    }),
    {
      ...deps,
      studies: {
        ...deps.studies,
        summary: async () => {
          throw new Error("private SQL password");
        },
      },
    },
  );
  assert.equal(failed.status, 500);
  const failedBody = await failed.text();
  assert.ok(!failedBody.includes("password"));
  assert.ok(!failedBody.includes("propiosTotal"));
});
