import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
async function pageFixture(authenticated = true) {
  const captured: unknown[] = [];
  const nativeRequire = createRequire(import.meta.url);
  const source = await readFile(
    new URL("../../app/app/studies/[id]/page.tsx", import.meta.url),
    "utf8",
  );
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports: Record<string, unknown> = {};
  const mocks: Record<string, unknown> = {
    "next-auth": {
      getServerSession: async () =>
        authenticated ? { user: { userId: "17" } } : null,
    },
    "next/navigation": {
      redirect: () => {
        throw new Error("redirect");
      },
    },
    "@/src/lib/auth/config": { authOptions: {} },
    "@/src/features/studies/api": {
      getStudyById: async (id: unknown) => {
        captured.push(id);
        return null;
      },
    },
    "@/src/features/family/api": { getFamilyMembers: async () => [] },
    "@/components/layout/AppShell": { default: () => null },
    "react-bootstrap": { Button: () => null },
    "@/user-dashboard/study/StudyDetailClient": { default: () => null },
  };
  runInNewContext(javascript, {
    exports,
    require: (id: string) => mocks[id] ?? nativeRequire(id),
  });
  return {
    captured,
    page: exports.default as (props: { params: unknown }) => Promise<unknown>,
  };
}
test("study page safety baseline preserves requested id with existing synchronous params", async () => {
  const f = await pageFixture();
  await f.page({ params: { id: "12" } });
  assert.deepEqual(f.captured, ["12"]);
});
test("Next16 promised params reaches the repository with the resolved id", async () => {
  const f = await pageFixture();
  await f.page({ params: Promise.resolve({ id: "13" }) });
  assert.deepEqual(f.captured, ["13"]);
});

test("missing web session redirects before loading a study", async () => {
  const f = await pageFixture(false);
  await assert.rejects(
    f.page({ params: Promise.resolve({ id: "12" }) }),
    /redirect/,
  );
  assert.deepEqual(f.captured, []);
});
