import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, symlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseUpload } from "../../src/mobile-server/upload-parser.ts";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { validateAttachmentBytes } from "../../src/mobile-server/upload-parser.ts";
test("JPEG EXIF orientation remains original; PNG CRC and preallocation dimensions are bounded", async () => {
  const root = await mkdtemp(join(tmpdir(), "upload-exif-"));
  const raw = jpeg.encode(
    { data: Buffer.alloc(8, 255), width: 2, height: 1 },
    80,
  ).data;
  const exif = Buffer.from(
    "45786966000049492a0008000000010012010300010000000600000000000000",
    "hex",
  );
  const header = Buffer.alloc(4);
  header.writeUInt16BE(0xffe1);
  header.writeUInt16BE(exif.length + 2, 2);
  const bytes = Buffer.concat([
    raw.subarray(0, 2),
    header,
    exif,
    raw.subarray(2),
  ]);
  const f = new FormData();
  f.set("date", "18-09-2026");
  f.set("patient", "self");
  f.append(
    "files",
    new Blob([bytes as BlobPart], { type: "image/jpeg" }),
    "camera.jpg",
  );
  const staged = await parseUpload(
    new Request("http://localhost", { method: "POST", body: f }),
    root,
    "1",
  );
  assert.deepEqual(await readFile(staged.files[0].path), bytes);
  const png = PNG.sync.write(new PNG({ width: 2, height: 1 }));
  const crc = Buffer.from(png);
  crc[29] ^= 1;
  assert.throws(
    () => validateAttachmentBytes(crc, "image/png", "png"),
    /UNSUPPORTED_FILE/,
  );
  for (const [w, h] of [
    [8193, 1],
    [6000, 5000],
  ]) {
    const bomb = Buffer.from(png);
    bomb.writeUInt32BE(w, 16);
    bomb.writeUInt32BE(h, 20);
    assert.throws(
      () => validateAttachmentBytes(bomb, "image/png", "png"),
      /UNSUPPORTED_FILE/,
    );
  }
});
test(
  "literal multipart body exactly50MiB is accepted, next byte is rejected",
  { timeout: 30000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "upload-envelope-"));
    const prefix = Buffer.from(
      '--b\r\nContent-Disposition: form-data; name="date"\r\n\r\n18-09-2026\r\n--b\r\nContent-Disposition: form-data; name="patient"\r\n\r\nself\r\n',
    );
    const head = Buffer.from(
      '--b\r\nContent-Disposition: form-data; name="files"; filename="a.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
    );
    const end = Buffer.from("--b--\r\n");
    const limit = 50 * 1024 * 1024;
    const overhead = prefix.length + 5 * (head.length + 2) + end.length;
    const files = Array.from({ length: 5 }, (_, i) => {
      const b = Buffer.alloc(10 * 1024 * 1024 - (i === 4 ? overhead : 0), 32);
      b.write("%PDF-1.4");
      b.write("%%EOF", b.length - 5);
      return b;
    });
    const body = Buffer.concat([
      prefix,
      ...files.flatMap((b) => [head, b, Buffer.from("\r\n")]),
      end,
    ]);
    assert.equal(body.length, limit);
    const make = (b: Buffer) =>
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=b" },
        body: b as BodyInit,
      });
    assert.equal((await parseUpload(make(body), root, "1")).files.length, 5);
    await assert.rejects(
      parseUpload(make(Buffer.concat([body, Buffer.from(" ")])), root, "1"),
      /REQUEST_TOO_LARGE/,
    );
  },
);
test("streaming multipart stages genuine PDF under canonical owner", async () => {
  const root = await mkdtemp(join(tmpdir(), "upload-parser-"));
  const form = new FormData();
  form.set("date", "18-09-2026");
  form.set("patient", "self");
  form.append(
    "files",
    new Blob(
      [Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF")],
      { type: "application/pdf" },
    ),
    "report.pdf",
  );
  const parsed = await parseUpload(
    new Request("http://localhost", { method: "POST", body: form }),
    root,
    "1",
  );
  assert.equal(parsed.files.length, 1);
  assert.equal(parsed.fields.patient, "self");
  assert.match(parsed.files[0].path, /1/);
  assert.match((await readFile(parsed.files[0].path)).toString(), /^%PDF/);
});
test(
  "hostile stalled ingestion has a server deadline and cleans private incoming directory",
  { timeout: 5000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "upload-deadline-"));
    let canceled = false;
    const stream = new ReadableStream(
      {
        cancel() {
          canceled = true;
        },
      },
      { highWaterMark: 0 },
    );
    await assert.rejects(
      parseUpload(
        new Request("http://localhost", {
          method: "POST",
          body: stream,
          duplex: "half",
          headers: { "Content-Type": "multipart/form-data; boundary=b" },
        } as RequestInit),
        root,
        "1",
        { timeoutMs: 20 },
      ),
      /UPLOAD_TIMEOUT/,
    );
    assert.equal(canceled, true);
    assert.deepEqual(await readdir(join(root, "1", ".mobile-staging")), []);
  },
);
test(
  "exact 10MiB genuine PDF allowed; excess byte, eleven files and traversal filenames rejected",
  { timeout: 30000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "upload-boundary-"));
    const bytes = Buffer.alloc(10 * 1024 * 1024, 32);
    bytes.write("%PDF-1.4");
    bytes.write("%%EOF", bytes.length - 5);
    const make = (content: Buffer, count = 1, name = "a.pdf") => {
      const f = new FormData();
      f.set("date", "18-09-2026");
      f.set("patient", "self");
      for (let i = 0; i < count; i++)
        f.append(
          "files",
          new Blob([content as BlobPart], { type: "application/pdf" }),
          name,
        );
      return new Request("http://localhost", { method: "POST", body: f });
    };
    assert.equal(
      (await parseUpload(make(bytes), root, "1")).files[0].size,
      bytes.length,
    );
    await assert.rejects(
      parseUpload(make(Buffer.concat([bytes, Buffer.from(" ")])), root, "1"),
      /FILE_TOO_LARGE/,
    );
    assert.equal(
      (await parseUpload(make(Buffer.from("%PDF-1.4\n%%EOF"), 10), root, "1"))
        .files.length,
      10,
    );
    await assert.rejects(
      parseUpload(make(Buffer.from("%PDF-1.4\n%%EOF"), 11), root, "1"),
      /TOO_MANY_FILES/,
    );
    await assert.rejects(
      parseUpload(
        make(Buffer.from("%PDF-1.4\n%%EOF"), 1, "../a.pdf"),
        root,
        "1",
      ),
      /INVALID_FILE_NAME/,
    );
  },
);
test(
  "chunked excess and malformed multipart settle and clean staging, duplicates/traversal reject",
  { timeout: 10000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "upload-limit-"));
    const form = new FormData();
    form.append("date", "18-09-2026");
    form.append("date", "19-09-2026");
    form.set("patient", "self");
    form.append(
      "files",
      new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
      "a.pdf",
    );
    await assert.rejects(
      parseUpload(
        new Request("http://localhost", { method: "POST", body: form }),
        root,
        "1",
      ),
      /INVALID_FIELDS/,
    );
    const bytes = Buffer.from(
      '--b\r\nContent-Disposition: form-data; name="files"; filename="a.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
    );
    let sent = 0;
    const stream = new ReadableStream({
      pull(c) {
        if (!sent) {
          sent++;
          c.enqueue(bytes);
        } else if (sent++ < 54) c.enqueue(Buffer.alloc(1024 * 1024));
        else c.close();
      },
    });
    await assert.rejects(
      parseUpload(
        new Request("http://localhost", {
          method: "POST",
          body: stream,
          duplex: "half",
          headers: { "Content-Type": "multipart/form-data; boundary=b" },
        } as RequestInit),
        root,
        "1",
      ),
      /REQUEST_TOO_LARGE/,
    );
    assert.deepEqual(await readdir(join(root, "1", ".mobile-staging")), []);
    const target = await mkdtemp(join(tmpdir(), "upload-outside-"));
    await mkdir(join(root, "2"));
    await symlink(target, join(root, "2", ".mobile-staging"), "junction");
    await assert.rejects(
      parseUpload(
        new Request("http://localhost", { method: "POST", body: form }),
        root,
        "2",
      ),
      /INVALID_FILE_PATH/,
    );
  },
);
test("genuine raster images decode while truncated/contradictory/HEIC files reject", async () => {
  const root = await mkdtemp(join(tmpdir(), "upload-raster-"));
  const png = new PNG({ width: 2, height: 1 });
  png.data.fill(255);
  const pngBytes = PNG.sync.write(png);
  const jpgBytes = jpeg.encode(
    { data: Buffer.alloc(8, 255), width: 2, height: 1 },
    80,
  ).data;
  for (const [name, type, bytes, valid] of [
    ["a.png", "image/png", pngBytes, true],
    ["a.jpeg", "image/jpeg", jpgBytes, true],
    ["bad.png", "image/png", pngBytes.subarray(0, 30), false],
    ["wrong.png", "image/png", jpgBytes, false],
    ["x.heic", "image/heic", Buffer.from("ftypheic"), false],
  ] as const) {
    const form = new FormData();
    form.set("date", "18-09-2026");
    form.set("patient", "self");
    form.append("files", new Blob([bytes as BlobPart], { type }), name);
    const result = parseUpload(
      new Request("http://localhost", { method: "POST", body: form }),
      root,
      "1",
    );
    if (valid) assert.equal((await result).files[0].mimeType, type);
    else await assert.rejects(result, /UNSUPPORTED_FILE/);
  }
});
