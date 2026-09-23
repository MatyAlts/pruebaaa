import { createUploadStorage } from "../src/upload-native-storage";
test("native storage protects copied file and refuses oversized source before read", async () => {
  const source = {
    size: 10485761,
    bytes: jest.fn(),
    copy: jest.fn(),
    exists: true,
    delete: jest.fn(),
  };
  const factory = {
    source: () => source,
    destination: jest.fn(),
    clear: jest.fn(),
  };
  const protect = jest.fn();
  const storage = createUploadStorage(factory as never, protect);
  await expect(storage.read("file:///camera/huge.jpg")).rejects.toMatchObject({
    code: "FILE_TOO_LARGE",
  });
  expect(source.bytes).not.toHaveBeenCalled();
});
test("native storage uses async copy destination and removes partial file on copy failure", async () => {
  const target = {
    uri: "file:///cache/misaluteca-uploads/private.png",
    exists: true,
    delete: jest.fn(),
    size: 0,
    bytes: jest.fn(),
    copy: jest.fn(),
  };
  const source = {
    ...target,
    uri: "file:///cache/picker.png",
    size: 8,
    bytes: jest.fn().mockResolvedValue(new Uint8Array(8)),
    copy: jest.fn().mockRejectedValue(new Error("disk full")),
  };
  const storage = createUploadStorage(
    { source: () => source, destination: async () => target, clear: jest.fn() },
    jest.fn(),
  );
  await expect(storage.copy(source.uri, "png")).rejects.toThrow("disk full");
  expect(target.delete).toHaveBeenCalledTimes(1);
});
test("native storage reads a bounded source, copies it, and removes it asynchronously", async () => {
  const target = {
    uri: "file:///cache/misaluteca-uploads/private.pdf",
    exists: true,
    delete: jest.fn(),
    size: 0,
    bytes: jest.fn(),
    copy: jest.fn(),
  };
  const source = {
    ...target,
    uri: "file:///cache/picker.pdf",
    size: 5,
    bytes: jest.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70, 45])),
    copy: jest.fn(),
  };
  const storage = createUploadStorage(
    { source: () => source, destination: async () => target, clear: jest.fn() },
    jest.fn(),
  );
  expect(await storage.read(source.uri)).toHaveLength(5);
  expect(await storage.copy(source.uri, "pdf")).toBe(target.uri);
  await storage.remove(source.uri);
  expect(source.copy).toHaveBeenCalledWith(target);
  expect(source.delete).toHaveBeenCalledTimes(1);
});
