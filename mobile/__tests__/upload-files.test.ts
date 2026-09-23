import { PrivateUploadFiles } from "../src/upload-files";
test("copies valid camera JPEG into protected private cache and removes picker temporary", async () => {
  const storage = {
    read: jest.fn().mockResolvedValue(new Uint8Array([255, 216, 255, 0])),
    copy: jest.fn().mockResolvedValue("file:///private/upload.jpg"),
    protect: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
    clear: jest.fn(),
  };
  const files = new PrivateUploadFiles(storage);
  expect(
    await files.import({
      uri: "file:///camera/image.jpg",
      name: "image.jpg",
      mimeType: "image/jpeg",
      size: 4,
    }),
  ).toEqual({
    uri: "file:///private/upload.jpg",
    name: "image.jpg",
    mimeType: "image/jpeg",
    size: 4,
  });
  expect(storage.protect).toHaveBeenCalledWith("file:///private/upload.jpg");
  expect(storage.remove).toHaveBeenCalledWith("file:///camera/image.jpg");
});
test("a new account import waits for old cache cleanup to finish", async () => {
  let finish!: () => void;
  const storage = {
    read: jest.fn().mockResolvedValue(new Uint8Array([255, 216, 255])),
    copy: jest.fn().mockResolvedValue("file:///private/new.jpg"),
    protect: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ),
  };
  const files = new PrivateUploadFiles(storage);
  const clearing = files.clear();
  const pending = files.import({
    uri: "file:///camera/new.jpg",
    name: "new.jpg",
    mimeType: "image/jpeg",
    size: 3,
  });
  await Promise.resolve();
  expect(storage.read).not.toHaveBeenCalled();
  finish();
  await clearing;
  expect((await pending).uri).toBe("file:///private/new.jpg");
});
test.each([
  ["application/pdf", [37, 80, 68, 70, 45], "pdf"],
  ["image/png", [137, 80, 78, 71, 13, 10, 26, 10], "png"],
])(
  "imports verified %s using its actual format",
  async (mimeType, bytes, extension) => {
    const data = new Uint8Array(bytes as number[]);
    const storage = {
      read: jest.fn().mockResolvedValue(data),
      copy: jest.fn().mockResolvedValue(`file:///private/file.${extension}`),
      protect: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    };
    await new PrivateUploadFiles(storage).import({
      uri: "file:///picker/file",
      name: "file",
      mimeType: mimeType as string,
      size: data.length,
    });
    expect(storage.copy).toHaveBeenCalledWith("file:///picker/file", extension);
  },
);
test("HEIC or renamed bytes are rejected and picker temporary removed", async () => {
  const storage = {
    read: jest
      .fn()
      .mockResolvedValue(new Uint8Array([0, 0, 0, 0, 102, 116, 121, 112])),
    copy: jest.fn(),
    protect: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  };
  await expect(
    new PrivateUploadFiles(storage).import({
      uri: "file:///camera/image.heic",
      name: "image.jpg",
      mimeType: "image/jpeg",
      size: 8,
    }),
  ).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" });
  expect(storage.copy).not.toHaveBeenCalled();
  expect(storage.remove).toHaveBeenCalledWith("file:///camera/image.heic");
});
test("logout during private copy removes the late file without returning private data", async () => {
  let finish!: (uri: string) => void;
  const storage = {
    read: jest.fn().mockResolvedValue(new Uint8Array([255, 216, 255])),
    copy: jest.fn(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    ),
    protect: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  };
  const files = new PrivateUploadFiles(storage);
  const pending = files
    .import({
      uri: "file:///camera/image.jpg",
      name: "image.jpg",
      mimeType: "image/jpeg",
      size: 3,
    })
    .catch((error) => error);
  await Promise.resolve();
  await files.clear();
  finish("file:///private/late.jpg");
  expect(await pending).toMatchObject({ code: "CANCELLED" });
  expect(storage.remove).toHaveBeenCalledWith("file:///private/late.jpg");
});
