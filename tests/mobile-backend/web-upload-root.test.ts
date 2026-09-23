import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import * as filesystem from "node:fs/promises";
import { resolve, join, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const projectRoot = process.cwd();
function loadSource(file: string, replacements: Record<string, unknown>) {
  const output = ts.transpileModule(readFileSync(resolve(projectRoot, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)((id: string) => {
    if (id in replacements) return replacements[id];
    if (id === "@/src/lib/storage/upload-root") return loadSource("src/lib/storage/upload-root.ts", {});
    return nativeRequire(id);
  }, loaded, loaded.exports);
  return loaded.exports as Record<string, (...args: unknown[]) => Promise<unknown>>;
}

async function temporary(t: TestContext) {
  const directory = await filesystem.mkdtemp(join(tmpdir(), "saluteca-upload-root-"));
  t.after(async () => {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
    await filesystem.rm(directory, { recursive: true, force: true });
  });
  return directory;
}

async function upload(configured: string | undefined) {
  const previous = process.env.DIRECTORY_UPLOADS;
  if (configured === undefined) delete process.env.DIRECTORY_UPLOADS;
  else process.env.DIRECTORY_UPLOADS = configured;
  const rows: { sql: string; values: unknown[] }[] = [];
  const execute = async (sql: string, values: unknown[]) => {
    rows.push({ sql, values });
    if (sql.startsWith("SELECT count_files")) return [[{ count_files: 0, date_files: "18-09-2026" }]];
    if (sql.includes("INSERT INTO estudios (")) return [{ insertId: 73 }];
    return [{ affectedRows: 1 }];
  };
  const connection = { execute, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {} };
  const route = loadSource("app/api/upload-study/route.ts", {
    "next/server": { NextResponse: { json: Response.json } },
    "@/lib/database": { pool: { execute, getConnection: async () => connection } },
    "next-auth": { getServerSession: async () => ({ user: { userId: 17, email: "fixture@example.invalid" } }) },
    "@/lib/auth": { authOptions: {} },
    "fs/promises": filesystem,
    uuid: { v4: () => "fictional-study" },
    "@/lib/file-validator": { validateFileType: async () => ({ isValid: true, detectedMimeType: "application/pdf" }) },
    "@/config/date": { dateNow: () => "18-09-2026" },
    "@/config/constants": { STUDY_FIELD_LIMITS: { date: 30, title: 400, institution: 400, doctor: 400, conclusion: 10000, description: 2000 } },
  });
  const bytes = Buffer.from("%PDF-1.7\nDocumento ficticio sin datos personales\n");
  const form = new FormData();
  form.append("files", new File([bytes], "fixture.pdf", { type: "application/pdf" }));
  form.append("date", "18-09-2026");
  form.append("familyMemberId", "self");
  try {
    const response = await route.POST({ formData: async () => form }) as Response;
    assert.equal(response.status, 200);
    assert.equal((await response.json()).studyId, 73);
    const attachment = rows.find(row => row.sql.includes("INSERT INTO estudios_archivos"));
    assert.ok(attachment);
    assert.equal(attachment.values[0], 73);
    const key = String(attachment.values[1]);
    assert.match(key, /^17\/[^/]+\.pdf$/);
    assert.equal(attachment.values[2], "fixture.pdf");
    assert.deepEqual(await filesystem.readFile(join(configured || "./uploads", key)), bytes);
  } finally {
    if (previous === undefined) delete process.env.DIRECTORY_UPLOADS;
    else process.env.DIRECTORY_UPLOADS = previous;
  }
}

test("unset DIRECTORY_UPLOADS preserves the uploads directory relative to cwd", async t => {
  const root = await temporary(t);
  const original = process.cwd();
  try {
    process.chdir(root);
    await upload(undefined);
    assert.equal((await filesystem.readdir(join(root, "uploads", "17"))).length, 1);
  } finally {
    process.chdir(original);
  }
});

for (const mode of ["absolute", "relative"] as const) {
test(`web upload writes its actual PDF under the ${mode} configured volume`, async t => {
  const root = await temporary(t);
  const configured = join(root, "volume");
  await upload(mode === "absolute" ? configured : relative(process.cwd(), configured));
});

test(`study service uploads into the same ${mode} private root and keeps its owner file key`, async t => {
  const root = join(await temporary(t), "service-volume");
  const previous = process.env.DIRECTORY_UPLOADS;
  process.env.DIRECTORY_UPLOADS = mode === "absolute" ? root : relative(process.cwd(), root);
  let stored: Record<string, unknown> | undefined;
  const exported = loadSource("src/features/studies/services/study.service.ts", {
    "../repositories/study.repository": { studyRepository: { create: async (input: Record<string, unknown>) => { stored = input; return 74; } } },
    "@/src/lib/storage/file-validator": { validateFileType: async () => ({ isValid: true }) },
    "@/config/date": { dateNow: () => "18-09-2026" },
    uuid: { v4: () => "fictional-service-study" },
  }) as unknown as { StudyService: new () => { uploadStudy(input: unknown): Promise<{ success: boolean; studyId: number }> } };
  const bytes = Buffer.from("%PDF-1.7\nServicio ficticio\n");
  try {
    const result = await new exported.StudyService().uploadStudy({ file: new File([bytes], "service.pdf", { type: "application/pdf" }), title: "Prueba", date: "18-09-2026", institution: null, medico: null, conclusion: null, description: null, familyMemberId: "self", userId: "17", userEmail: "fixture@example.invalid" });
    assert.equal(result.success, true);
    assert.equal(result.studyId, 74);
    assert.ok(stored);
    assert.equal(stored.userId, "17");
    assert.match(String(stored.fileKey), /^17\/[^/]+\.pdf$/);
    assert.deepEqual(await filesystem.readFile(join(root, String(stored.fileKey))), bytes);
  } finally {
    if (previous === undefined) delete process.env.DIRECTORY_UPLOADS;
    else process.env.DIRECTORY_UPLOADS = previous;
  }
});

test(`study service deletion removes its existing file from the configured ${mode} root`, async t => {
  const root = join(await temporary(t), "delete-volume");
  await filesystem.mkdir(join(root, "17"), { recursive: true });
  const key = "17/existing.pdf";
  await filesystem.writeFile(join(root, key), "%PDF-1.7\nFixture\n");
  const previous = process.env.DIRECTORY_UPLOADS;
  process.env.DIRECTORY_UPLOADS = mode === "absolute" ? root : relative(process.cwd(), root);
  const exported = loadSource("src/features/studies/services/study.service.ts", {
    "../repositories/study.repository": { studyRepository: { findById: async () => ({ files: [{ fileKey: key }] }), delete: async () => true } },
    "@/src/lib/storage/file-validator": { validateFileType: async () => ({ isValid: true }) },
    "@/config/date": { dateNow: () => "18-09-2026" },
    uuid: { v4: () => "fictional-service-study" },
  }) as unknown as { StudyService: new () => { deleteStudy(id: string, owner: string): Promise<{ success: boolean }> } };
  try {
    assert.equal((await new exported.StudyService().deleteStudy("73", "17")).success, true);
    await assert.rejects(filesystem.stat(join(root, key)), { code: "ENOENT" });
  } finally {
    if (previous === undefined) delete process.env.DIRECTORY_UPLOADS;
    else process.env.DIRECTORY_UPLOADS = previous;
  }
});
}
