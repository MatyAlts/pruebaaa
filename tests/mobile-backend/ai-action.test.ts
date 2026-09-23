import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
async function runAction(
  options: {
    session?: boolean;
    count?: number;
    text?: string;
    content?: string | null;
    key?: string;
    oldKey?: string;
    failure?: boolean;
  } = {},
) {
  const environment = { ...process.env };
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const logs: string[] = [];
  console.error = (...args) => logs.push(args.map(String).join(" "));
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  if (options.key !== "")
    process.env.OPENROUTER_API_KEY =
      options.key ?? "action-key-never-transmitted";
  if (options.oldKey) process.env.OPENAI_API_KEY = options.oldKey;
  process.env.LIMIT_ANALYZE = "2";
  const requests: {
    url: string;
    authorization: string | null;
    payload: {
      model: string;
      temperature: number;
      response_format: { type: string };
      messages: { content: string }[];
    };
  }[] = [];
  const queries: { sql: string; values: unknown[] }[] = [];
  let sharedCalls=0;
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      authorization: new Headers(init?.headers).get("authorization"),
      payload: JSON.parse(String(init?.body)),
    });
    const response = options.failure
      ? { error: { message: "private-key-and-OCR-must-not-leak" } }
      : {
          choices: [
            {
              message: {
                content:
                  options.content === undefined
                    ? JSON.stringify({
                        studyName: "Prueba",
                        institution: "Ficticia",
                        doctor: "Doctor",
                        studyDate: "17-09-2026",
                        conclusion: "Sin datos personales",
                      })
                    : options.content,
              },
            },
          ],
        };
    return new Response(JSON.stringify(response), {
      status: options.failure ? 400 : 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  try {
    const source = readFileSync(
      "user-dashboard/server-actions/analyze-study.ts",
      "utf8",
    );
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const actionModule = {
      exports: {} as Partial<{
        analyzeStudyWithAI: (
          text: string,
        ) => Promise<
          import("../../user-dashboard/server-actions/analyze-study.ts").AnalysisResult
        >;
      }>,
    };
    const load = (id: string) => {
      if(id==='@/src/mobile-server/mysql-study-analysis')return {MysqlStudyAnalysis:class {
       async ready(){return true;}
       async submit(owner:string,input:{ocrText:string},session:()=>Promise<void>){sharedCalls++;await session();const q='SELECT count_analyze, date_analyze FROM users WHERE id = ?';queries.push({sql:q,values:[Number(owner)]});if((options.count??0)>=2)throw {status:429};
        const sdk=new (require('openai').default)({apiKey:process.env.OPENROUTER_API_KEY,baseURL:'https://openrouter.ai/api/v1',maxRetries:0});
        const response=await sdk.chat.completions.create({model:'openai/gpt-4o-mini',temperature:0.3,response_format:{type:'json_object'},messages:[{role:'system',content:'NO inventes información'},{role:'user',content:input.ocrText}]});
        const value=JSON.parse(response.choices[0]?.message?.content||'invalid');queries.push({sql:'UPDATE users SET count_analyze = ?, date_analyze = ? WHERE id = ?',values:[(options.count??0)+1,'2026-09-17',Number(owner)]});return {status:'completed',suggestions:{title:value.studyName||'',institution:value.institution||'',medico:value.doctor||'',date:value.studyDate||'',conclusion:value.conclusion||''}};
       }
      }};
      if (id === "@/lib/auth") return { authOptions: {} };
      if (id === "next-auth")
        return {
          getServerSession: async () =>
            options.session === false ? null : { user: { userId: 7 } },
        };
      if (id === "@/config/date") return { dateNow: () => "2026-09-17" };
      if (id === "@/lib/database")
        return {
          pool: {
            execute: async (sql: string, values: unknown[]) => {
              queries.push({ sql, values });
              return sql.startsWith("SELECT")
                ? [
                    [
                      {
                        count_analyze: options.count ?? 0,
                        date_analyze: "2026-09-17",
                      },
                    ],
                  ]
                : [{}];
            },
          },
        };
      return require(id);
    };
    new Function("require", "module", "exports", compiled)(
      load,
      actionModule,
      actionModule.exports,
    );
    const result = await actionModule.exports.analyzeStudyWithAI!(
      options.text ?? "Documento ficticio",
    );
    return { result, requests, queries, logs,sharedCalls };
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    for (const key of Object.keys(process.env))
      if (!(key in environment)) delete process.env[key];
    Object.assign(process.env, environment);
  }
}
test('web analysis delegates reservation to the same engine as mobile',async()=>{const {sharedCalls,result}=await runAction();assert.equal(sharedCalls,1);assert.equal(result.success,true);});

test("action baseline: missing session never calls SDK or SQL", async () => {
  const { result, requests, queries } = await runAction({ session: false });
  assert.equal(result.success, false);
  assert.match(result.message ?? "", /sesión activa/);
  assert.equal(requests.length, 0);
  assert.equal(queries.length, 0);
});
test("action provider error is sanitized and never updates count", async () => {
  const { result, logs, queries } = await runAction({ failure: true });
  assert.equal(result.success, false);
  assert.doesNotMatch(
    JSON.stringify({ result, logs }),
    /private-key-and-OCR-must-not-leak/,
  );
  assert.equal(queries.length, 1);
});
test("action old key alone cannot enable analysis or SQL", async () => {
  const { result, requests, queries } = await runAction({
    key: "",
    oldKey: "old-key-never-transmitted",
  });
  assert.match(result.message ?? "", /OPENROUTER_API_KEY/);
  assert.equal(requests.length, 0);
  assert.equal(queries.length, 0);
});
test("action empty OCR preserves existing rejection before SQL", async () => {
  const { result, requests, queries } = await runAction({ text: "  " });
  assert.match(result.message ?? "", /extraer texto/);
  assert.equal(requests.length, 0);
  assert.equal(queries.length, 0);
});
test("action invalid JSON is sanitized and never increments count", async () => {
  const { result, logs, queries } = await runAction({
    content: "private-key-and-OCR-must-not-leak",
  });
  assert.equal(result.success, false);
  assert.doesNotMatch(
    JSON.stringify({ result, logs }),
    /private-key-and-OCR-must-not-leak/,
  );
  assert.equal(queries.length, 1);
});
test("action second OCR maps absent fields without changing quota behavior", async () => {
  const { result, queries, requests } = await runAction({
    text: "Otra prueba",
    count: 1,
    content: JSON.stringify({ studyName: "Otro" }),
  });
  assert.deepEqual(result, {
    success: true,
    studyName: "Otro",
    institution: "",
    doctor: "",
    studyDate: "",
    conclusion: "",
  });
  assert.deepEqual(queries[1].values, [2, "2026-09-17", 7]);
  assert.match(requests[0].payload.messages[1].content, /Otra prueba$/);
});
test("action empty provider response is rejected without count update", async () => {
  const { result, queries } = await runAction({ content: null });
  assert.equal(result.success, false);
  assert.match(result.message ?? "", /OpenRouter/);
  assert.equal(queries.length, 1);
});
test("action SDK sends OpenRouter key and preserves completion contract", async () => {
  const { result, requests } = await runAction();
  assert.equal(result.success, true);
  assert.equal(
    requests[0].url,
    "https://openrouter.ai/api/v1/chat/completions",
  );
  assert.equal(
    requests[0].authorization,
    "Bearer action-key-never-transmitted",
  );
  assert.equal(requests[0].payload.model, "openai/gpt-4o-mini");
  assert.equal(requests[0].payload.temperature, 0.3);
  assert.deepEqual(requests[0].payload.response_format, {
    type: "json_object",
  });
  assert.match(
    requests[0].payload.messages[0].content,
    /NO inventes información/,
  );
  assert.match(requests[0].payload.messages[1].content, /Documento ficticio$/);
});
test("action baseline: quota rejection preserves counter and avoids SDK", async () => {
  const { result, requests, queries } = await runAction({ count: 2 });
  assert.match(result.message ?? "", /límite de 2/);
  assert.equal(requests.length, 0);
  assert.equal(queries.length, 1);
});
test("action baseline: valid JSON preserves DTO and increments same user once", async () => {
  const { result, requests, queries } = await runAction();
  assert.deepEqual(result, {
    success: true,
    studyName: "Prueba",
    institution: "Ficticia",
    doctor: "Doctor",
    studyDate: "17-09-2026",
    conclusion: "Sin datos personales",
  });
  assert.equal(requests.length, 1);
  assert.deepEqual(queries[1].values, [1, "2026-09-17", 7]);
});
