import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function run(
  options: {
    key?: string;
    oldKey?: string;
    content?: string | null;
    failure?: boolean;
    text?: string;
  } = {},
) {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  delete env.OPENROUTER_API_KEY;
  if (options.key !== "")
    env.OPENROUTER_API_KEY =
      options.key ?? "openrouter-isolated-never-transmitted";
  if (options.oldKey) env.OPENAI_API_KEY = options.oldKey;
  const response = options.failure
    ? { error: { message: "private-key-and-OCR-must-not-leak" } }
    : {
        choices: [
          {
            message: {
              content:
                options.content === undefined
                  ? JSON.stringify({
                      titulo: "Prueba",
                      institucion: "Ficticia",
                      fecha: "17-09-2026",
                      conclusion: "Sin datos personales",
                    })
                  : options.content,
            },
          },
        ],
      };
  const script = `
    const calls=[];const logs=[];console.error=(...args)=>logs.push(args.map(String).join(' '));
    globalThis.fetch=async(input,init)=>{calls.push({url:String(input),authorization:new Headers(init.headers).get('authorization'),payload:JSON.parse(init.body)});return new Response(JSON.stringify(${JSON.stringify(response)}),{status:${options.failure ? 400 : 200},headers:{'Content-Type':'application/json'}})};
    const {analyzeStudyService}=await import('./src/features/studies/services/analyze-study.service.ts');
    const result=await analyzeStudyService.analyzeStudyWithAI(${JSON.stringify(options.text ?? "Documento ficticio")});
    console.log(JSON.stringify({result,calls,logs}));`;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { cwd: process.cwd(), env, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("service SDK sends OpenRouter credentials, same model and JSON contract", () => {
  const { result, calls } = run();
  assert.equal(calls[0].url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(
    calls[0].authorization,
    "Bearer openrouter-isolated-never-transmitted",
  );
  assert.equal(calls[0].payload.model, "openai/gpt-4o-mini");
  assert.equal(calls[0].payload.temperature, 0.3);
  assert.deepEqual(calls[0].payload.response_format, { type: "json_object" });
  assert.match(calls[0].payload.messages[0].content, /NO inventes información/);
  assert.match(calls[0].payload.messages[1].content, /Documento ficticio$/);
  assert.deepEqual(result, {
    success: true,
    data: {
      titulo: "Prueba",
      institucion: "Ficticia",
      fecha: "17-09-2026",
      conclusion: "Sin datos personales",
    },
  });
});
test("service ignores old key and explains missing OpenRouter configuration", () => {
  const { result, calls } = run({
    key: "",
    oldKey: "old-key-never-transmitted",
  });
  assert.equal(result.success, false);
  assert.match(result.message, /OPENROUTER_API_KEY/);
  assert.equal(calls.length, 0);
});
test("service provider errors cannot expose response secrets in result or logs", () => {
  const output = run({ failure: true });
  assert.equal(output.result.success, false);
  assert.doesNotMatch(
    JSON.stringify({ result: output.result, logs: output.logs }),
    /private-key-and-OCR-must-not-leak/,
  );
});
test("service invalid JSON fails safely and empty response is rejected", () => {
  const invalid = run({ content: "private-key-and-OCR-must-not-leak" });
  assert.equal(invalid.result.success, false);
  assert.doesNotMatch(
    JSON.stringify({ result: invalid.result, logs: invalid.logs }),
    /private-key-and-OCR-must-not-leak/,
  );
  const empty = run({ content: null });
  assert.equal(empty.result.success, false);
  assert.match(empty.result.message, /OpenRouter/);
});
test("service maps missing fields to empty strings for a different OCR input", () => {
  const { result, calls } = run({
    text: "Otra prueba ficticia",
    content: JSON.stringify({ titulo: "Otro" }),
  });
  assert.deepEqual(result.data, {
    titulo: "Otro",
    institucion: "",
    fecha: "",
    conclusion: "",
  });
  assert.match(calls[0].payload.messages[1].content, /Otra prueba ficticia$/);
});
