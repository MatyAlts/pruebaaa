import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MobileStudies,
  ReadingError,
  type OwnedStudy,
} from "../../src/mobile-server/studies.ts";
const own: OwnedStudy = {
  id: "12",
  uuid: "study-test",
  userId: "17",
  date: "17-09-2026",
  medico: "Prueba",
  files: [
    {
      id: "1",
      fileKey: "17/a.pdf",
      fileName: "Prueba.pdf",
      mimeType: "application/pdf",
      size: 12,
    },
  ],
  createdAt: "17-09-2026",
};
function fixture(studies: OwnedStudy[] = [own]) {
  const pages: unknown[] = [];
  const repository = {
    ids: async (userId: string, before: string | null, limit: number) => {
      pages.push({ userId, before, limit });
      return studies
        .filter(
          (s) =>
            s.userId === userId &&
            !s.familyMemberId &&
            (!before || Number(s.id) < Number(before)),
        )
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, limit)
        .map((s) => s.id);
    },
    study: async (id: string, userId: string) =>
      studies.find((s) => s.id === id && s.userId === userId) ?? null,
  };
  return { pages, reader: new MobileStudies(repository) };
}
test('legacy self PDFs retain authorized non-user-prefixed private keys',async()=>{
 const root=await mkdtemp(join(tmpdir(),'legacy-self-pdf-'));await mkdir(join(root,'pruebas'));await writeFile(join(root,'pruebas/ejemplo.pdf'),'%PDF-1.7\nlegacy');
 const reader=fixture([{...own,files:[{...own.files[0],fileKey:'pruebas/ejemplo.pdf'}]}]).reader;
 assert.equal((await reader.file('17','12','1',root)).bytes.toString(),'%PDF-1.7\nlegacy');
});
test("paginated own studies have stable continuation without private paths", async () => {
  const f = fixture([
    own,
    { ...own, id: "11" },
    { ...own, id: "10", familyMemberId: "3" },
    { ...own, id: "9", userId: "99" },
  ]);
  const page = await f.reader.list("17", { limit: "1", cursor: null });
  assert.deepEqual(
    page.items.map((s) => s.id),
    ["12"],
  );
  assert.equal(page.nextCursor, "12");
  const next = await f.reader.list("17", {
    limit: "1",
    cursor: page.nextCursor,
  });
  assert.deepEqual(
    next.items.map((s) => s.id),
    ["11"],
  );
  assert.equal(next.nextCursor, null);
  assert.ok(!JSON.stringify(page).includes("17/a.pdf"));
});
test("empty data differs from repository errors and bad pagination", async () => {
  assert.deepEqual(
    await fixture([]).reader.list("17", { limit: null, cursor: null }),
    { items: [], nextCursor: null },
  );
  for (const query of [
    { limit: "0", cursor: null },
    { limit: "51", cursor: null },
    { limit: "1.1", cursor: null },
    { limit: "20", cursor: "evil" },
  ])
    await assert.rejects(fixture().reader.list("17", query), ReadingError);
  const reader = new MobileStudies({
    ids: async () => {
      throw new Error("database unavailable");
    },
    study: async () => null,
  });
  await assert.rejects(
    reader.list("17", { limit: null, cursor: null }),
    /database unavailable/,
  );
});
test("detail hides foreign, family and missing studies identically", async () => {
  const f = fixture([own, { ...own, id: "10", familyMemberId: "3" }]);
  assert.equal((await f.reader.detail("17", "12")).files[0].id, "1");
  for (const [user, id] of [
    ["99", "12"],
    ["17", "10"],
    ["17", "999"],
  ])
    await assert.rejects(
      f.reader.detail(user, id),
      (e: unknown) => e instanceof ReadingError && e.status === 404,
    );
});
test("legacy file id is explicit and invalid file does not fall back", async () => {
  const f = fixture([{ ...own, files: [{ ...own.files[0], id: undefined }] }]);
  assert.equal((await f.reader.detail("17", "12")).files[0].id, "legacy");
  await assert.rejects(
    f.reader.file("17", "12", "999", "unused"),
    ReadingError,
  );
});
test("PDF bytes are authorized and confined to upload root", async () => {
  const root = await mkdtemp(join(tmpdir(), "saluteca-test-"));
  await mkdir(join(root, "17"));
  await writeFile(join(root, "17/a.pdf"), "%PDF-1.7\ntest");
  const f = fixture();
  const pdf = await f.reader.file("17", "12", "1", root);
  assert.equal(pdf.bytes.toString(), "%PDF-1.7\ntest");
  await assert.rejects(f.reader.file("99", "12", "1", root), ReadingError);
  await assert.rejects(f.reader.file("17", "12", "2", root), ReadingError);
  const malicious = fixture([
    { ...own, files: [{ ...own.files[0], fileKey: "../outside.pdf" }] },
  ]);
  await assert.rejects(
    malicious.reader.file("17", "12", "1", root),
    ReadingError,
  );
});
test("missing, non-PDF and oversized content reject", async () => {
  const root = await mkdtemp(join(tmpdir(), "saluteca-test-"));
  await mkdir(join(root, "17"));
  const f = fixture();
  await assert.rejects(f.reader.file("17", "12", "1", root), ReadingError);
  await writeFile(join(root, "17/a.pdf"), "not a PDF");
  await assert.rejects(
    f.reader.file("17", "12", "1", root),
    (e: unknown) => e instanceof ReadingError && e.status === 415,
  );
  await writeFile(join(root, "17/a.pdf"), Buffer.alloc(10 * 1024 * 1024 + 1));
  await assert.rejects(
    f.reader.file("17", "12", "1", root),
    (e: unknown) => e instanceof ReadingError && e.status === 413,
  );
});
