import { PdfCoordinator } from "../src/pdf";
test("image attachment downloads with expected MIME and uses protected private preview", async () => {
  const downloadAttachment = jest.fn().mockResolvedValue(new Uint8Array([255,216,255]));
  const files = { save: jest.fn().mockResolvedValue("file:///cache/misaluteca-pdfs/photo.jpg"), remove: jest.fn(), clear: jest.fn() }; const preview = jest.fn();
  const pdf = new PdfCoordinator({ download: jest.fn(), downloadAttachment }, files, { preview, close: jest.fn() });
  await pdf.open("study", "image", "image/jpeg");
  expect(downloadAttachment).toHaveBeenCalledWith("/studies/study/files/image", "image/jpeg"); expect(files.save).toHaveBeenCalledWith(expect.any(Uint8Array), "image/jpeg"); expect(preview).toHaveBeenCalledWith("file:///cache/misaluteca-pdfs/photo.jpg"); expect(files.remove).toHaveBeenCalledTimes(1);
});
test("unsupported attachment and unavailable image reader never write a cache file", async () => {
  const files = { save: jest.fn(), remove: jest.fn(), clear: jest.fn() }; const reader = { download: jest.fn() };
  const pdf = new PdfCoordinator(reader, files, { preview: jest.fn(), close: jest.fn() });
  await expect(pdf.open("study", "image", "image/heic")).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" });
  await expect(pdf.open("study", "image", "image/png")).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" }); expect(files.save).not.toHaveBeenCalled();
});
test("viewer failure removes the file and failed download never writes one", async () => {
  const files = {
    save: jest.fn(async () => "file:///cache/misaluteca-pdfs/test.pdf"),
    remove: jest.fn(async () => {}),
    clear: jest.fn(async () => {}),
  };
  const pdf = new PdfCoordinator(
    { download: async () => new Uint8Array([1]) },
    files,
    {
      preview: async () => {
        throw new Error("invalid native PDF");
      },
      close: async () => {},
    },
  );
  await expect(pdf.open("12", "1")).rejects.toThrow("invalid native PDF");
  expect(files.remove).toHaveBeenCalledTimes(1);
  files.save.mockClear();
  const unavailable = new PdfCoordinator(
    {
      download: async () => {
        throw new Error("offline");
      },
    },
    files,
    { preview: jest.fn(), close: async () => {} },
  );
  await expect(unavailable.open("12", "1")).rejects.toThrow("offline");
  expect(files.save).not.toHaveBeenCalled();
});
test("closing the viewer always removes the temporary PDF", async () => {
  const remove = jest.fn(async () => {});
  const preview = jest.fn(async () => {});
  const files = {
    save: jest.fn(async () => "file:///cache/misaluteca-pdfs/test.pdf"),
    remove,
    clear: jest.fn(async () => {}),
  };
  const pdf = new PdfCoordinator(
    { download: async () => new Uint8Array([1]) },
    files,
    { preview, close: async () => {} },
  );
  await pdf.open("12", "legacy");
  expect(preview).toHaveBeenCalledWith(
    "file:///cache/misaluteca-pdfs/test.pdf",
  );
  expect(remove).toHaveBeenCalledWith("file:///cache/misaluteca-pdfs/test.pdf");
});
test("logout during pending file save removes late PDF and never presents it", async () => {
  let complete!: (uri: string) => void;
  const remove = jest.fn(async () => {});
  const preview = jest.fn(async () => {});
  const files = {
    save: jest.fn(
      () =>
        new Promise<string>((resolve) => {
          complete = resolve;
        }),
    ),
    remove,
    clear: jest.fn(async () => {}),
  };
  const pdf = new PdfCoordinator(
    { download: async () => new Uint8Array([1]) },
    files,
    { preview, close: async () => {} },
  );
  const request = pdf.open("12", "legacy");
  await Promise.resolve();
  await pdf.cleanup();
  complete("file:///cache/misaluteca-pdfs/late.pdf");
  await expect(request).rejects.toMatchObject({ code: "CANCELLED" });
  expect(preview).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalledWith("file:///cache/misaluteca-pdfs/late.pdf");
});
