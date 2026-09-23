import { test } from "node:test";
import assert from "node:assert/strict";
import { mobileHttp } from "../../src/mobile-server/http.ts";
test("unauthorized multipart is rejected before a single body byte is read", async () => {
  let read = false;
  const request = new Request("http://localhost/api/mobile/v1/studies", {
    method: "POST",
    body: new ReadableStream(
      {
        pull() {
          read = true;
        },
      },
      { highWaterMark: 0 },
    ),
    duplex: "half",
  } as RequestInit);
  const response = await mobileHttp(request, {
    auth: {
      identity: async () => {
        throw new Error();
      },
    } as never,
    studies: {} as never,
    uploadRoot: ".",
  });
  assert.equal(response.status, 401);
  assert.equal(read, false);
});
test("missing upload readiness disables capability and rejects upload without weakening reads", async () => {
  const deps = {
    auth: {
      identity: async () => ({
        id: "1",
        email: "one@example.invalid",
        name: null,
        image: null,
      }),
    } as never,
    studies: { list: async () => ({ items: [], nextCursor: null }) } as never,
    uploadRoot: ".",
  };
  const post = await mobileHttp(
    new Request("http://localhost/api/mobile/v1/studies", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
    }),
    deps,
  );
  assert.equal(post.status, 503);
  const get = await mobileHttp(
    new Request("http://localhost/api/mobile/v1/studies", {
      headers: { Authorization: "Bearer token" },
    }),
    deps,
  );
  assert.equal(get.status, 200);
  const cap = await mobileHttp(
    new Request("http://localhost/api/mobile/v1/capabilities", {
      headers: { Authorization: "Bearer token" },
    }),
    deps,
  );
  assert.equal((await cap.json()).features.studiesUpload, undefined);
});
import { ReadingError } from "../../src/mobile-server/studies.ts";
test("public daily upload quota message preserves generic auth rate-limit minute message", async () => {
  for (const [code, pattern] of [
    ["UPLOAD_LIMIT_REACHED", /diario/],
    ["RATE_LIMITED", /minuto/],
  ] as const) {
    const deps = {
      auth: { identity: async () => ({ id: "1" }) } as never,
      studies: {} as never,
      uploadRoot: ".",
      uploadReady: true,
      upload: {
        ready: async () => true,
        submit: async () => {
          throw new ReadingError(429, code);
        },
      } as never,
    };
    const response = await mobileHttp(
      new Request("http://localhost/api/mobile/v1/studies", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }),
      deps,
    );
    assert.equal(response.status, 429);
    assert.match((await response.json()).error.message, pattern);
  }
});
