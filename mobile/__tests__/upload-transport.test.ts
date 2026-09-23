import { xhrUpload } from "../src/upload-transport";
function fixture() {
  const xhr = {
    open: jest.fn(),
    setRequestHeader: jest.fn(),
    send: jest.fn(),
    abort: jest.fn(),
    upload: {} as Record<string, unknown>,
    status: 201,
    responseText: '{"status":"complete"}',
    responseURL: "https://test.invalid/api/mobile/v1/studies",
    onload: null as unknown,
    onerror: null as unknown,
    ontimeout: null as unknown,
    onabort: null as unknown,
  };
  const request = {
    url: xhr.responseURL,
    token: "access",
    key: "key",
    body: new FormData(),
    signal: new AbortController().signal,
    progress: jest.fn(),
  };
  return { xhr, request };
}
test("XHR uploads native FormData with Bearer/key and progress without JSON content type", async () => {
  const { xhr, request } = fixture();
  const result = xhrUpload(request, () => xhr as unknown as XMLHttpRequest);
  (xhr.upload.onprogress as (event: unknown) => void)({
    lengthComputable: true,
    loaded: 20,
    total: 40,
  });
  (xhr.onload as () => void)();
  expect(await result).toEqual({ status: 201, value: { status: "complete" } });
  expect(xhr.send).toHaveBeenCalledWith(request.body);
  expect(xhr.setRequestHeader.mock.calls).toEqual([
    ["Authorization", "Bearer access"],
    ["Idempotency-Key", "key"],
  ]);
  expect(request.progress).toHaveBeenCalledWith(0.5);
});
test.each(["onerror", "ontimeout"])(
  "%s is ambiguous and must reconcile",
  async (event) => {
    const { xhr, request } = fixture();
    const result = xhrUpload(
      request,
      () => xhr as unknown as XMLHttpRequest,
    ).catch((error) => error);
    (xhr[event as "onerror"] as () => void)();
    expect(await result).toMatchObject({ code: "AMBIGUOUS" });
  },
);
test("abort stops transport and does not claim server cancellation", async () => {
  const { xhr, request } = fixture();
  const controller = new AbortController();
  const result = xhrUpload(
    { ...request, signal: controller.signal },
    () => xhr as unknown as XMLHttpRequest,
  ).catch((error) => error);
  controller.abort();
  expect(xhr.abort).toHaveBeenCalledTimes(1);
  expect(await result).toMatchObject({ code: "AMBIGUOUS" });
});
test("cross origin redirect cannot expose a successful private response", async () => {
  const { xhr, request } = fixture();
  xhr.responseURL = "https://foreign.invalid/response";
  const result = xhrUpload(
    request,
    () => xhr as unknown as XMLHttpRequest,
  ).catch((error) => error);
  (xhr.onload as () => void)();
  expect(await result).toMatchObject({ code: "AMBIGUOUS" });
});
