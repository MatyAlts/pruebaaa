import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import jpeg from "jpeg-js";
import { MobileStudies } from "../../src/mobile-server/studies.ts";
import { mobileHttp } from "../../src/mobile-server/http.ts";
test("private JPEG owner receives actual MIME and foreign owner no bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-read-"));
  await mkdir(join(root, "1"));
  const bytes = jpeg.encode(
    { data: Buffer.alloc(8, 255), width: 2, height: 1 },
    80,
  ).data;
  await writeFile(join(root, "1", "photo.jpg"), bytes);
  const study = {
    id: "1",
    uuid: "test",
    userId: "1",
    date: "18-09-2026",
    medico: "",
    createdAt: "",
    files: [
      {
        id: "1",
        fileKey: "1/photo.jpg",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
        size: bytes.length,
      },
    ],
  };
  const reader = new MobileStudies({
    ids: async () => ["1"],
    study: async () => study,
  });
  const file = await reader.file("1", "1", "1", root);
  assert.deepEqual(file.bytes, bytes);
  const deps = {
    auth: { identity: async () => ({ id: "1" }) } as never,
    studies: reader,
    uploadRoot: root,
  };
  const response = await mobileHttp(
    new Request("http://localhost/api/mobile/v1/studies/1/files/1", {
      headers: { Authorization: "Bearer token" },
    }),
    deps,
  );
  assert.equal(response.headers.get("Content-Type"), "image/jpeg");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  await assert.rejects(reader.file("2", "1", "1", root), /NOT_FOUND/);
});
test("private image reading refuses corrupted bytes and canonical-owner traversal aliases", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-bad-"));
  await mkdir(join(root, "1"));
  await writeFile(join(root, "1", "bad.jpg"), "not image");
  const study = {
    id: "1",
    uuid: "x",
    userId: "1",
    date: "18-09-2026",
    medico: "",
    createdAt: "",
    files: [
      {
        id: "1",
        fileKey: "1/bad.jpg",
        fileName: "bad.jpg",
        mimeType: "image/jpeg",
        size: 9,
      },
    ],
  };
  const reader = new MobileStudies({
    ids: async () => [],
    study: async () => study,
  });
  await assert.rejects(reader.file("1", "1", "1", root), /UNSUPPORTED_FILE/);
  study.files[0].fileKey = "1/../1/bad.jpg";
  await assert.rejects(reader.file("1", "1", "1", root), /INVALID_FILE_PATH/);
});
import { PNG } from "pngjs";
test("private PNG route streams validated original bytes with MIME and nosniff", async () => {
  const root = await mkdtemp(join(tmpdir(), "image-png-"));
  await mkdir(join(root, "1"));
  const png = new PNG({ width: 1, height: 2 });
  png.data.fill(127);
  const bytes = PNG.sync.write(png);
  await writeFile(join(root, "1", "a.png"), bytes);
  const reader = new MobileStudies({
    ids: async () => ["1"],
    study: async () => ({
      id: "1",
      uuid: "x",
      userId: "1",
      date: "18-09-2026",
      medico: "",
      createdAt: "",
      files: [
        {
          id: "2",
          fileKey: "1/a.png",
          fileName: "a.png",
          mimeType: "image/png",
          size: bytes.length,
        },
      ],
    }),
  });
  const response = await mobileHttp(
    new Request("http://localhost/api/mobile/v1/studies/1/files/2", {
      headers: { Authorization: "Bearer token" },
    }),
    {
      auth: { identity: async () => ({ id: "1" }) } as never,
      studies: reader,
      uploadRoot: root,
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "image/png");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
});
