import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
function run(key: string, ocr: string) {
  const environment = { ...process.env };
  delete environment.OPENAI_API_KEY;
  delete environment.OPENROUTER_API_KEY;
  if (key) environment.OPENROUTER_API_KEY = key;
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `globalThis.fetch=()=>{throw new Error('Unexpected external call')};const {analyzeStudyService}=await import('./src/features/studies/services/analyze-study.service.ts');console.log(JSON.stringify(await analyzeStudyService.analyzeStudyWithAI(${JSON.stringify(ocr)})));`,
    ],
    { cwd: process.cwd(), env: environment, encoding: "utf8" },
  );
}
test("safety net: empty OCR preserves existing error without invoking API", () => {
  const result = run("isolated-guard-test-never-transmitted", "   ");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    success: false,
    message: "No se pudo extraer texto del documento.",
  });
});
test("module loads without AI credentials and preserves missing-key response", () => {
  const result = run("", "documento de prueba");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    success: false,
    message:
      "API Key de OpenRouter no configurada. Configurá la variable de entorno OPENROUTER_API_KEY.",
  });
});
