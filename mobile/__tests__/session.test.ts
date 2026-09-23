import {
  MobileClient,
  SessionError,
  apiOrigin,
  type ClientAdapters,
} from "../src/session";
const redirect = "com.matyalts.misaluteca://auth/callback";
test("private JPEG stream requires declared MIME and actual JPEG magic", async () => {
  const f = fixture(); await login(f);
  const bytes = new Uint8Array([255,216,255,0]);
  f.fetcher.mockResolvedValueOnce({ ...response({}), headers: new Headers({ "content-type": "image/jpeg" }), body: { getReader: () => { let sent = false; return { read: async () => sent ? { done: true } : (sent = true, { done: false, value: bytes }), releaseLock: jest.fn(), cancel: jest.fn() }; } } });
  await expect(f.client.downloadAttachment("/studies/study/files/file", "image/jpeg")).resolves.toEqual(bytes);
});
test.each([["image/png", [137,80,78,71,13,10,26,10], true], ["image/jpeg", [0,0,0], false], ["image/png", [255,216,255], false]])("private %s validates bytes", async (mime, data, valid) => {
  const f = fixture(); await login(f); const bytes = new Uint8Array(data as number[]);
  f.fetcher.mockResolvedValueOnce({ ...response({}), headers: new Headers({ "content-type": mime as string }), body: { getReader: () => { let sent = false; return { read: async () => sent ? { done: true } : (sent = true, { done: false, value: bytes }), releaseLock: jest.fn(), cancel: jest.fn() }; } } });
  const pending = f.client.downloadAttachment("/studies/study/files/file", mime as string);
  if (valid) await expect(pending).resolves.toEqual(bytes); else await expect(pending).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" });
});
test("multipart second401 never refreshes or resends again", async () => {
  const f = fixture(); await login(f);
  const transport = jest.fn().mockResolvedValue({ status: 401, value: {} });
  f.fetcher.mockResolvedValueOnce(response({ accessToken: "rotated", refreshToken: "rotated-refresh" }));
  await expect(f.client.upload("key", () => new FormData(), transport, new AbortController().signal, () => {})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(transport).toHaveBeenCalledTimes(2);
  expect(f.fetcher.mock.calls.filter(([url]) => url.endsWith("/auth/refresh"))).toHaveLength(1);
});
test("logout hides late upload success and progress", async () => {
  const f = fixture(); await login(f);
  let finish!: (value: { status: number; value: unknown }) => void;
  let progress!: (fraction: number) => void;
  const transport = jest.fn(request => { progress = request.progress; return new Promise<{ status: number; value: unknown }>(resolve => { finish = resolve; }); });
  const shown = jest.fn();
  const pending = f.client.upload("key", () => new FormData(), transport, new AbortController().signal, shown).catch(error => error);
  f.fetcher.mockResolvedValueOnce(response({}, 204)); await f.client.logout();
  progress(1); finish({ status: 201, value: { studyId: "private" } });
  expect(await pending).toMatchObject({ code: "CANCELLED" }); expect(shown).not.toHaveBeenCalled();
});
test("multipart upload uses canonical Bearer and rebuilds body once after explicit401", async () => {
  const f = fixture(); await login(f);
  const transport = jest.fn().mockResolvedValueOnce({ status: 401, value: {} }).mockResolvedValueOnce({ status: 201, value: { status: "complete", studyId: "study" } });
  const body = jest.fn(() => new FormData());
  f.fetcher.mockResolvedValueOnce(response({ accessToken: "new-access", refreshToken: "new-refresh" }));
  await expect(f.client.upload("uuid", body, transport, new AbortController().signal, () => {})).resolves.toMatchObject({ studyId: "study" });
  expect(body).toHaveBeenCalledTimes(2);
  expect(transport.mock.calls[0][0]).toMatchObject({ token: "access", key: "uuid", url: "https://test.invalid/api/mobile/v1/studies" });
  expect(transport.mock.calls[1][0]).toMatchObject({ token: "new-access", key: "uuid" });
});
test("family writes use the existing canonical Bearer and JSON body", async () => {
  const f = fixture(); await login(f);
  f.fetcher.mockResolvedValueOnce(response({ familyMember: { uuid: "family", name: "Ana" } }, 201));
  await expect(f.client.write("/family-members", "POST", { name: "Ana" })).resolves.toMatchObject({ familyMember: { name: "Ana" } });
  expect(f.fetcher).toHaveBeenLastCalledWith("https://test.invalid/api/mobile/v1/family-members", expect.objectContaining({ method: "POST", credentials: "omit", redirect: "error", headers: { "Content-Type": "application/json", Authorization: "Bearer access" }, body: JSON.stringify({ name: "Ana" }) }));
});
test("a family mutation response after logout cannot update private state", async () => {
  const f = fixture(); await login(f); let finish!: (value: Response) => void;
  f.fetcher.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const pending = f.client.write("/family-members/family", "DELETE", { confirmation: "misaluteca" }).catch((error) => error);
  f.fetcher.mockResolvedValueOnce(response({}, 204)); await f.client.logout();
  finish(response({ operationId: "operation", status: "pending" }, 202));
  expect(await pending).toMatchObject({ code: "CANCELLED" }); expect(f.client.state.user).toBeNull();
});
test("authenticated family writes refresh once before retrying an explicit401", async () => {
  const f = fixture(); await login(f);
  f.fetcher.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({ accessToken: "new-access", refreshToken: "new-refresh" })).mockResolvedValueOnce(response({ familyMember: { name: "Renamed" } }));
  await expect(f.client.write("/family-members/family", "PATCH", { name: "Renamed" })).resolves.toMatchObject({ familyMember: { name: "Renamed" } });
  expect(f.fetcher).toHaveBeenLastCalledWith(expect.stringContaining("/family-members/family"), expect.objectContaining({ method: "PATCH", headers: expect.objectContaining({ Authorization: "Bearer new-access" }) }));
});
test("late old refresh 401 leaves the newer session and its credential intact", async () => {
  const f = fixture();
  await login(f);
  let finish!: (value: Response) => void;
  f.fetcher.mockResolvedValueOnce(response({}, 401)).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const old = f.client.get("/studies").catch((error) => error);
  await new Promise((resolve) => setTimeout(resolve, 0));
  f.fetcher.mockResolvedValueOnce(response({}, 204));
  await f.client.logout();
  await login(f);
  finish(response({}, 401));
  expect(await old).toMatchObject({ code: "UNAUTHORIZED" });
  expect(f.client.state.user?.id).toBe("17");
  expect(f.stored()).toBe("refresh");
});
test("pending refresh write is drained and removed before logout and relogin", async () => {
  const f = fixture();
  await login(f);
  const write = f.adapters.storage.set;
  let release!: () => void;
  let first = true;
  f.adapters.storage.set = async (value) => {
    if (first) {
      first = false;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }
    await write(value);
  };
  f.fetcher
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(
      response({
        accessToken: "old-rotated-access",
        refreshToken: "old-rotated-refresh",
      }),
    );
  const old = f.client.get("/studies").catch((error) => error);
  await new Promise((resolve) => setTimeout(resolve, 0));
  f.fetcher.mockResolvedValueOnce(response({}, 204));
  let finished = false;
  const closing = f.client.logout().then(() => {
    finished = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(finished).toBe(false);
  expect(f.client.state.user).toBeNull();
  release();
  await closing;
  expect(await old).toMatchObject({ code: "CANCELLED" });
  await login(f);
  expect(f.stored()).toBe("refresh");
  expect(f.client.state.user?.id).toBe("17");
});
test("invalid refresh hides private state before slow PDF cleanup and never overwrites a new login", async () => {
  const f = fixture();
  await login(f);
  let release!: () => void;
  f.adapters.cleanup = () =>
    new Promise<void>((resolve) => {
      release = resolve;
    });
  f.fetcher
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(response({}, 401));
  const old = f.client.get("/studies").catch((error) => error);
  await new Promise((resolve) => setTimeout(resolve, 0));
  try {
    expect(f.client.state.user).toBeNull();
    await login(f);
    expect(f.client.state.user?.id).toBe("17");
  } finally {
    release();
  }
  expect(await old).toMatchObject({ code: "UNAUTHORIZED" });
  expect(f.client.state.user?.id).toBe("17");
  expect(f.stored()).toBe("refresh");
});
test("logout waits for an in-flight SecureStore write before permitting a new session", async () => {
  const f = fixture();
  const write = f.adapters.storage.set;
  let release!: () => void;
  let first = true;
  f.adapters.storage.set = async (value) => {
    if (first) {
      first = false;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }
    await write(value);
  };
  f.fetcher
    .mockResolvedValueOnce(
      response({ authorizationUrl: "https://test.invalid/mobile/authorize" }),
    )
    .mockResolvedValueOnce(
      response({ accessToken: "old-access", refreshToken: "old-refresh" }),
    );
  const old = f.client.login();
  await new Promise((resolve) => setTimeout(resolve, 0));
  f.fetcher.mockResolvedValueOnce(response({}, 204));
  let finished = false;
  const closing = f.client.logout().then(() => {
    finished = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  try {
    expect(f.client.state.user).toBeNull();
    expect(finished).toBe(false);
  } finally {
    release();
  }
  await Promise.all([old, closing]);
  await login(f);
  expect(f.client.state.user?.id).toBe("17");
  expect(f.stored()).toBe("refresh");
});
test("late old refresh network error cannot clear a newly logged-in session", async () => {
  const f = fixture();
  await login(f);
  let reject!: (error: Error) => void;
  f.fetcher.mockResolvedValueOnce(response({}, 401)).mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const old = f.client.get("/studies").catch((error) => error);
  await new Promise((resolve) => setTimeout(resolve, 0));
  f.fetcher.mockResolvedValueOnce(response({}, 204));
  await f.client.logout();
  await login(f);
  reject(new TypeError("late network failure"));
  expect(await old).toMatchObject({ code: "NETWORK" });
  expect(f.client.state.user?.id).toBe("17");
  expect(f.stored()).toBe("refresh");
});
function fixture() {
  let stored: string | null = null;
  const fetcher = jest.fn();
  const cleanup = jest.fn(async () => {});
  const browser = jest.fn(async () => ({
    type: "success",
    url: redirect + "?code=code&state=state",
  }));
  const adapters: ClientAdapters = {
    fetch: fetcher,
    storage: {
      get: async () => stored,
      set: async (v) => {
        stored = v;
      },
      remove: async () => {
        stored = null;
      },
    },
    browser,
    proof: async () => ({
      state: "state",
      verifier: "verifier",
      challenge: "challenge",
    }),
    cleanup,
  };
  return {
    client: new MobileClient("https://test.invalid", adapters),
    fetcher,
    browser,
    cleanup,
    adapters,
    stored: () => stored,
  };
}
const response = (value: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
    url: "https://test.invalid/api/mobile/v1/me",
    headers: new Headers(),
  }) as Response;
async function login(f: ReturnType<typeof fixture>) {
  f.fetcher
    .mockResolvedValueOnce(
      response({
        authorizationUrl: "https://test.invalid/mobile/authorize",
        requestId: "request",
      }),
    )
    .mockResolvedValueOnce(
      response({ accessToken: "access", refreshToken: "refresh" }),
    )
    .mockResolvedValueOnce(response({ user: { id: "17", name: "Prueba" } }));
  await f.client.login();
}
test("HTTPS origin refuses credentials, query, fragments and HTTP", () => {
  expect(apiOrigin("https://test.invalid/")).toBe("https://test.invalid");
  for (const value of [
    "http://test.invalid",
    "https://user:secret@test.invalid",
    "https://test.invalid/?key=secret",
    "https://test.invalid/#fragment",
  ])
    expect(() => apiOrigin(value)).toThrow();
});
test("login validates callback and only stores refresh token securely", async () => {
  const f = fixture();
  await login(f);
  expect(f.stored()).toBe("refresh");
  expect(f.client.state.user?.id).toBe("17");
  expect(f.fetcher.mock.calls[2][1].headers.Authorization).toBe(
    "Bearer access",
  );
  expect(
    f.fetcher.mock.calls.every(([, options]) => options.credentials === "omit"),
  ).toBe(true);
});
test("cancel and wrong state leave no partial session", async () => {
  for (const result of [
    { type: "cancel" },
    { type: "success", url: redirect + "?code=stolen&state=evil" },
  ]) {
    const f = fixture();
    f.browser.mockResolvedValueOnce(result as never);
    f.fetcher.mockResolvedValueOnce(
      response({ authorizationUrl: "https://test.invalid/mobile/authorize" }),
    );
    await f.client.login();
    expect(f.client.state.user).toBeNull();
    expect(f.stored()).toBeNull();
    expect(f.fetcher).toHaveBeenCalledTimes(1);
  }
});
test("two concurrent 401 requests perform one refresh and retry once", async () => {
  const f = fixture();
  await login(f);
  f.fetcher
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(
      response({ accessToken: "new-access", refreshToken: "new-refresh" }),
    )
    .mockResolvedValue(response({ items: [], nextCursor: null }));
  await Promise.all([f.client.get("/studies"), f.client.get("/studies")]);
  expect(
    f.fetcher.mock.calls.filter(([url]) => url.endsWith("/auth/refresh")),
  ).toHaveLength(1);
  expect(f.stored()).toBe("new-refresh");
});
test("invalid refresh cleans session while network failure is distinguishable", async () => {
  const invalid = fixture();
  await login(invalid);
  invalid.fetcher
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(response({}, 401));
  await expect(invalid.client.get("/studies")).rejects.toBeInstanceOf(
    SessionError,
  );
  expect(invalid.stored()).toBeNull();
  const offline = fixture();
  await login(offline);
  offline.fetcher.mockRejectedValueOnce(new TypeError("network"));
  await expect(offline.client.get("/studies")).rejects.toMatchObject({
    code: "NETWORK",
  });
  expect(offline.stored()).toBe("refresh");
});
test("logout clears local data even offline and rejects late response", async () => {
  const f = fixture();
  await login(f);
  let complete!: (value: Response) => void;
  f.fetcher.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const request = f.client.get("/studies");
  f.fetcher.mockRejectedValueOnce(new TypeError("offline"));
  const result = await f.client.logout();
  expect(result.remoteConfirmed).toBe(false);
  expect(f.stored()).toBeNull();
  expect(f.cleanup).toHaveBeenCalled();
  complete(response({ items: [{ id: "private" }] }));
  await expect(request).rejects.toMatchObject({ code: "CANCELLED" });
  expect(f.client.state.user).toBeNull();
});
test("custom-scheme callback validates protocol and host, not opaque URL origin", async () => {
  const f = fixture();
  f.browser.mockResolvedValueOnce({
    type: "success",
    url: "evil://auth/callback?code=code&state=state",
  });
  f.fetcher.mockResolvedValueOnce(
    response({ authorizationUrl: "https://test.invalid/mobile/authorize" }),
  );
  await f.client.login();
  expect(f.fetcher).toHaveBeenCalledTimes(1);
  expect(f.client.state.user).toBeNull();
});
test("ambiguous refresh timeout removes consumed credential and returns to login", async () => {
  const f = fixture();
  await login(f);
  f.fetcher
    .mockResolvedValueOnce(response({}, 401))
    .mockRejectedValueOnce(
      new TypeError("server consumed token then connection dropped"),
    );
  await expect(f.client.get("/studies")).rejects.toMatchObject({
    code: "NETWORK",
  });
  expect(f.stored()).toBeNull();
  expect(f.client.state.user).toBeNull();
});
test("logout hides private state before a slow remote revocation completes", async () => {
  const f = fixture();
  await login(f);
  let finish!: (value: Response) => void;
  f.fetcher.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = f.client.logout();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(f.client.state.user).toBeNull();
  expect(f.stored()).toBeNull();
  finish(response({}, 204));
  await pending;
});
test("old restore cannot renew or replace a newly logged-in session after logout", async () => {
  const f = fixture();
  await login(f);
  const original = f.adapters.storage.get;
  let finish!: (value: string | null) => void;
  let pendingRead = true;
  f.adapters.storage.get = () => {
    if (pendingRead) {
      pendingRead = false;
      return new Promise((resolve) => {
        finish = resolve;
      });
    }
    return original();
  };
  const restoring = f.client.restore();
  await new Promise((resolve) => setTimeout(resolve, 0));
  f.fetcher.mockResolvedValueOnce(response({}, 204));
  await f.client.logout();
  await login(f);
  const count = f.fetcher.mock.calls.length;
  finish("refresh");
  await restoring;
  expect(f.fetcher).toHaveBeenCalledTimes(count);
  expect(f.client.state.user?.id).toBe("17");
  expect(f.stored()).toBe("refresh");
});
test("two restore calls share one in-flight restoration", async () => {
  const f = fixture();
  let resolveStored!: (value: string | null) => void;
  f.adapters.storage.get = jest.fn(
    () => new Promise<string | null>((resolve) => {
      resolveStored = resolve;
    }),
  );
  const first = f.client.restore();
  const second = f.client.restore();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(f.adapters.storage.get).toHaveBeenCalledTimes(1);
  resolveStored(null);
  await Promise.all([first, second]);
  expect(f.client.state.busy).toBe(false);
});
test("PDF stream without content length is cancelled at the size limit", async () => {
  const f = fixture();
  await login(f);
  const cancel = jest.fn();
  const reader = {
    read: jest.fn(async () => ({
      done: false,
      value: new Uint8Array(1024 * 1024),
    })),
    cancel,
    releaseLock: jest.fn(),
  };
  const arrayBuffer = jest.fn(async () => new ArrayBuffer(0));
  f.fetcher.mockResolvedValueOnce({
    ...response(null),
    headers: new Headers({ "Content-Type": "application/pdf" }),
    body: { getReader: () => reader },
    arrayBuffer,
  });
  await expect(f.client.download("/studies/12/files/1")).rejects.toMatchObject({
    code: "FILE_TOO_LARGE",
  });
  expect(cancel).toHaveBeenCalled();
  expect(arrayBuffer).not.toHaveBeenCalled();
  expect(reader.read).toHaveBeenCalledTimes(11);
});
test("PDF stream joins short chunks and validates its content", async () => {
  for (const text of ["%PDF-1.7", "not PDF"]) {
    const f = fixture();
    await login(f);
    const read = jest
      .fn()
      .mockResolvedValueOnce({
        done: false,
        value: Uint8Array.from(text.slice(0, 3), (char) => char.charCodeAt(0)),
      })
      .mockResolvedValueOnce({
        done: false,
        value: Uint8Array.from(text.slice(3), (char) => char.charCodeAt(0)),
      })
      .mockResolvedValue({ done: true });
    f.fetcher.mockResolvedValueOnce({
      ...response(null),
      headers: new Headers({ "Content-Type": "application/pdf" }),
      body: {
        getReader: () => ({ read, cancel: jest.fn(), releaseLock: jest.fn() }),
      },
    });
    if (text.startsWith("%PDF-"))
      expect(
        Array.from(await f.client.download("/studies/12/files/1")),
      ).toEqual(Array.from(text, (char) => char.charCodeAt(0)));
    else
      await expect(
        f.client.download("/studies/12/files/1"),
      ).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" });
  }
});
test("old login result cannot erase a new session after logout", async () => {
  const f = fixture();
  let complete!: (value: Response) => void;
  f.fetcher
    .mockResolvedValueOnce(
      response({ authorizationUrl: "https://test.invalid/mobile/authorize" }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
  const old = f.client.login();
  await new Promise((resolve) => setTimeout(resolve, 0));
  f.fetcher.mockResolvedValueOnce(response({}, 204));
  await f.client.logout();
  await login(f);
  complete(
    response({ accessToken: "old-access", refreshToken: "old-refresh" }),
  );
  await old;
  expect(f.client.state.user?.id).toBe("17");
  expect(f.stored()).toBe("refresh");
});
