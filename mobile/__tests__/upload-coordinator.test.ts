import { UploadCoordinator } from "../src/upload-coordinator";
import { SessionError } from "../src/session";
const draft = {
  date: "10-09-2026",
  title: "",
  institution: "",
  medico: "",
  conclusion: "",
  description: "",
  patient: "self" as const,
  files: [
    {
      uri: "file:///private/report.pdf",
      name: "report.pdf",
      mimeType: "application/pdf",
      size: 100,
    },
  ],
};
test("a response for another operation cannot invalidate history", async () => {
  const client = {
    upload: jest
      .fn()
      .mockResolvedValue({
        operationId: "foreign",
        status: "complete",
        studyId: "study",
      }),
    get: jest.fn(),
  };
  const changed = jest.fn();
  await expect(
    new UploadCoordinator(
      client,
      () => "key",
      () => {},
      changed,
    ).submit(draft),
  ).rejects.toMatchObject({ code: "AMBIGUOUS" });
  expect(changed).not.toHaveBeenCalled();
});
test("uncertain retry queries status first and blocks another POST while network is unavailable", async () => {
  const client = {
    upload: jest.fn().mockRejectedValue(new SessionError("AMBIGUOUS", "Lost")),
    get: jest.fn().mockRejectedValue(new SessionError("NETWORK", "Offline")),
  };
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    jest.fn(),
  );
  await expect(coordinator.submit(draft)).rejects.toMatchObject({
    code: "NETWORK",
  });
  await expect(coordinator.submit(draft)).rejects.toMatchObject({
    code: "NETWORK",
  });
  expect(client.upload).toHaveBeenCalledTimes(1);
  expect(client.get).toHaveBeenCalledTimes(2);
});
test("retry consults known pending and never duplicates the POST", async () => {
  const client = {
    upload: jest
      .fn()
      .mockResolvedValue({ operationId: "key", status: "pending" }),
    get: jest.fn().mockResolvedValue({ operationId: "key", status: "pending" }),
  };
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    jest.fn(),
  );
  await coordinator.submit(draft);
  await expect(coordinator.submit(draft)).resolves.toMatchObject({
    status: "pending",
  });
  expect(client.upload).toHaveBeenCalledTimes(1);
});
test("failed retryable cleanup reuses immutable body and the original key after status check", async () => {
  const client = {
    upload: jest
      .fn()
      .mockResolvedValueOnce({ operationId: "key", status: "pending" })
      .mockResolvedValueOnce({
        operationId: "key",
        status: "complete",
        studyId: "study",
      }),
    get: jest
      .fn()
      .mockResolvedValue({
        operationId: "key",
        status: "failed",
        retryable: true,
        errorCode: "UPLOAD_INTERRUPTED",
      }),
  };
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    jest.fn(),
  );
  await coordinator.submit(draft);
  await expect(coordinator.submit(draft)).resolves.toMatchObject({
    status: "complete",
  });
  expect(client.upload.mock.calls.map(([key]) => key)).toEqual(["key", "key"]);
  expect(client.get).toHaveBeenCalledTimes(1);
});
test("definitive failed operation allows a new draft but pending operation cannot reset", async () => {
  const client = {
    upload: jest
      .fn()
      .mockResolvedValueOnce({ operationId: "key", status: "pending" })
      .mockResolvedValueOnce({
        operationId: "key",
        status: "failed",
        retryable: false,
      }),
    get: jest
      .fn()
      .mockResolvedValue({
        operationId: "key",
        status: "failed",
        retryable: false,
      }),
  };
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    jest.fn(),
  );
  await coordinator.submit(draft);
  expect(() => coordinator.reset()).toThrow();
  await coordinator.reconcile();
  coordinator.reset();
  expect(coordinator.key).toBeNull();
});
test("explicit first request body413 allows correcting the draft without trapping the user", async () => {
  const client = {
    upload: jest.fn().mockRejectedValue(new SessionError("413", "Body limit")),
    get: jest.fn(),
  };
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    jest.fn(),
  );
  await expect(coordinator.submit(draft)).rejects.toMatchObject({
    code: "413",
  });
  expect(coordinator.key).toBeNull();
});
test("reconciles an ambiguous upload using the same key and reports only confirmed commit", async () => {
  const client = {
    upload: jest.fn().mockRejectedValue(new SessionError("AMBIGUOUS", "Lost")),
    get: jest
      .fn()
      .mockResolvedValue({
        operationId: "stable-key",
        status: "complete",
        studyId: "study",
      }),
  };
  const changed = jest.fn();
  const coordinator = new UploadCoordinator(
    client,
    () => "stable-key",
    () => {},
    changed,
  );
  await expect(coordinator.submit(draft)).resolves.toMatchObject({
    status: "complete",
    studyId: "study",
  });
  expect(client.get).toHaveBeenCalledWith("/study-uploads/stable-key");
  expect(changed).toHaveBeenCalledTimes(1);
});
test("unknown status cannot be treated as a confirmed commit", async () => {
  const client = {
    upload: jest
      .fn()
      .mockResolvedValue({ operationId: "key", status: "complete" }),
    get: jest.fn(),
  };
  const changed = jest.fn();
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    changed,
  );
  await expect(coordinator.submit(draft)).rejects.toMatchObject({
    code: "AMBIGUOUS",
  });
  expect(changed).not.toHaveBeenCalled();
});
test("concurrent taps share one upload and confirmed replay invalidates once", async () => {
  let finish!: (value: unknown) => void;
  const client = {
    upload: jest.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    ),
    get: jest
      .fn()
      .mockResolvedValue({
        operationId: "key",
        status: "complete",
        studyId: "study",
      }),
  };
  const changed = jest.fn();
  const coordinator = new UploadCoordinator(
    client as never,
    () => "key",
    () => {},
    changed,
  );
  const one = coordinator.submit(draft);
  const two = coordinator.submit(draft);
  expect(client.upload).toHaveBeenCalledTimes(1);
  finish({ operationId: "key", status: "complete", studyId: "study" });
  await Promise.all([one, two]);
  await coordinator.reconcile();
  expect(changed).toHaveBeenCalledTimes(1);
});
test("pending status is checked manually without another POST or false commit", async () => {
  const client = {
    upload: jest
      .fn()
      .mockResolvedValue({ operationId: "key", status: "pending" }),
    get: jest.fn().mockResolvedValue({ operationId: "key", status: "pending" }),
  };
  const changed = jest.fn();
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    changed,
  );
  await coordinator.submit(draft);
  await expect(coordinator.reconcile()).resolves.toMatchObject({
    status: "pending",
  });
  expect(client.upload).toHaveBeenCalledTimes(1);
  expect(changed).not.toHaveBeenCalled();
});
test("ambiguous retry retains key and locks the submitted payload", async () => {
  const client = {
    upload: jest.fn().mockRejectedValue(new SessionError("AMBIGUOUS", "Lost")),
    get: jest.fn().mockRejectedValue(new SessionError("NETWORK", "Offline")),
  };
  const coordinator = new UploadCoordinator(
    client,
    () => "key",
    () => {},
    jest.fn(),
  );
  await expect(coordinator.submit(draft)).rejects.toMatchObject({
    code: "NETWORK",
  });
  await expect(
    coordinator.submit({ ...draft, title: "changed" }),
  ).rejects.toMatchObject({ code: "DRAFT_LOCKED" });
  expect(client.upload).toHaveBeenCalledTimes(1);
  expect(coordinator.key).toBe("key");
});
test("cleanup aborts and rejects late completion without invalidating another session", async () => {
  let finish!: (value: unknown) => void;
  const client = {
    upload: jest.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    ),
    get: jest.fn(),
  };
  const changed = jest.fn();
  const coordinator = new UploadCoordinator(
    client as never,
    () => "key",
    () => {},
    changed,
  );
  const pending = coordinator.submit(draft).catch((error) => error);
  coordinator.cleanup();
  finish({ operationId: "key", status: "complete", studyId: "private" });
  expect(await pending).toMatchObject({ code: "CANCELLED" });
  expect(changed).not.toHaveBeenCalled();
  expect(client.get).not.toHaveBeenCalled();
  expect(coordinator.key).toBeNull();
});
