import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDeletion } from '../../src/mobile-server/mysql-study-deletion.ts';
import { validateAnalysis, validateSuggestions,nextAnalysisCounter,openRouterSuggestions } from '../../src/mobile-server/mysql-study-analysis.ts';
import { MysqlStudyDeletion } from '../../src/mobile-server/mysql-study-deletion.ts';
import { MysqlStudyAnalysis } from '../../src/mobile-server/mysql-study-analysis.ts';
import type { Pool } from 'mysql2/promise';
import { managementSchemaReady } from '../../src/mobile-server/management-schema.ts';
import { mobileHttp } from '../../src/mobile-server/http.ts';
import { studyCleanupBatch,deletionFilePath,isAmbiguousDeletionKey } from '../../src/mobile-server/study-cleanup.ts';
import {mkdtemp,mkdir,symlink,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('deletion requires explicit confirmation and forbids client file paths', () => {
    assert.deepEqual(validateDeletion({ confirmation: 'misaluteca', idempotencyKey: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    assert.throws(() => validateDeletion({ confirmation: 'misaluteca', idempotencyKey: 'bad' }));
    assert.throws(() => validateDeletion({ confirmation: 'misaluteca', idempotencyKey: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', fileKey: '1/secret.pdf' }));
});
test('deletion cleanup accepts confined legacy filenames but refuses foreign prefixes and symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'legacy-delete-'));await mkdir(join(root,'1'));
 assert.equal(await deletionFilePath(root,'1','legacy.pdf'),join(await realpath(root),'legacy.pdf'));
 await assert.rejects(deletionFilePath(root,'1','2/private.pdf'));
 await assert.rejects(deletionFilePath(root,'1','../outside.pdf'));
 assert.equal(isAmbiguousDeletionKey('unrelated-legacy.pdf'),false);
 assert.equal(isAmbiguousDeletionKey('1/sub/../alias.pdf'),true);
 await symlink(root,join(root,'1/alias'),process.platform==='win32'?'junction':'dir');await assert.rejects(deletionFilePath(root,'1','1/alias/legacy.pdf'));
});
test('mobile provider uses unchanged web prompt fixed model and no SDK retries',async()=>{
 const originalFetch=globalThis.fetch,key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='fictitious-test-key';let calls=0;
 globalThis.fetch=async(_input,init)=>{calls++;const payload=JSON.parse(String(init?.body));assert.equal(payload.model,'openai/gpt-4o-mini');assert.match(payload.messages[0].content,/Médico/);assert.match(payload.messages[0].content,/NO inventes información/);return new Response(JSON.stringify({error:{message:'fictitious'}}),{status:503,headers:{'content-type':'application/json'}});};
 try{await assert.rejects(openRouterSuggestions('Texto ficticio'));assert.equal(calls,1);}finally{globalThis.fetch=originalFetch;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});
test('late analysis does not overwrite a newer day quota and nullable counters normalize',()=>{
 assert.equal(nextAnalysisCounter({count_analyze:3,date_analyze:'19-09-2026'},'18-09-2026'),null);
 assert.equal(nextAnalysisCounter({count_analyze:null,date_analyze:'18-09-2026'},'18-09-2026'),1);
 assert.equal(nextAnalysisCounter({count_analyze:9,date_analyze:'17-09-2026'},'18-09-2026'),1);
});
test('study cleanup refuses schema absent and never unlinks data', async () => {
    let called = 0;
    assert.equal(await studyCleanupBatch({ query: async () => [[]] } as unknown as Pool, 'unused', Date.now(), { unlink: async () => { called++; } }), 0);
    assert.equal(called, 0);
});
test('mobile DELETE and analysis enforce capability and pass canonical owner session callback', async () => {
    const identity = async () => ({ id: '1', email: 'fixture@example.invalid' });
    const dependencies = { auth: { identity }, studies: {}, uploadRoot: 'unused', studyDeletion: { ready: async () => true, remove: async (owner: string, id: string) => { assert.equal(owner, '1'); assert.equal(id, '1'); return { operationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', status: 'committed' }; } }, studyDeleteReady: true, analysis: { ready: async () => true, submit: async (owner: string) => { assert.equal(owner, '1'); return { requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', status: 'completed' }; } } };
    const request = new Request('https://test.invalid/api/mobile/v1/studies/1', { method: 'DELETE', headers: { authorization: 'Bearer fixture', 'content-type': 'application/json' }, body: JSON.stringify({ confirmation: 'misaluteca', idempotencyKey: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }) });
    const response = await mobileHttp(request, dependencies as never);
    assert.equal(response.status, 202);
    const ai = await mobileHttp(new Request('https://test.invalid/api/mobile/v1/studies/analyze', { method: 'POST', headers: { authorization: 'Bearer fixture', 'content-type': 'application/json' }, body: JSON.stringify({ requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ocrText: 'Ficticio' }) }), dependencies as never);
    assert.equal(ai.status, 200);
});
test('management readiness remains false when schema is missing', async () => {
    assert.equal(await managementSchemaReady({ query: async () => [[]] } as unknown as Pool, 'delete'), false);
});
test('deletion transaction commits all references only after session check and preserves quota', async () => {
    const sql: string[] = [];
    let commit = false;
    const c = { beginTransaction: async () => { }, query: async (q: string) => { sql.push(q); return [q.startsWith('SELECT study_id') ? [] : q.startsWith('SELECT id,file_key') ? [{ id: 1, file_key: '1/a.pdf' }] : q.startsWith('SELECT file_key') ? [{ file_key: '1/b.pdf' }] : []]; }, commit: async () => { commit = true; }, rollback: async () => { }, release: () => { } };
    const s = new MysqlStudyDeletion({ getConnection: async () => c } as unknown as Pool);
    const result = await s.remove('1', '1', { confirmation: 'misaluteca', idempotencyKey: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }, async () => { sql.push('SESSION'); });
    assert.equal(result.status, 'committed');
    assert.equal(commit, true);
    assert.equal(sql[0], 'SESSION');
    assert.equal(sql.filter(q => q.startsWith('INSERT INTO mobile_study_delete_files')).length, 2);
    assert.ok(sql.some(q => q.startsWith('DELETE FROM estudios_archivos')));
    assert.ok(!sql.some(q => q.includes('count_files')));
    await assert.rejects(s.remove('1', '1', { confirmation: 'misaluteca', idempotencyKey: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }, async () => { throw Error('revoked'); }));
});
test('analysis reserve never repeats provider for duplicate request and returns no durable result', async () => {
    const queries: string[] = [];
    let provider = 0;
    const c = { beginTransaction: async () => { }, query: async (q: string) => { queries.push(q); return [q.startsWith('SELECT count_analyze') ? [{ count_analyze: 0, date_analyze: '18-09-2026' }] : q.startsWith('SELECT status') ? [{ status: 'completed' }] : []]; }, commit: async () => { }, rollback: async () => { }, release: () => { } };
    const service = new MysqlStudyAnalysis({ getConnection: async () => c } as unknown as Pool);
    const result = await service.submit('1', { requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ocrText: 'Ficticio' }, async () => { }, async () => { provider++; return '{}'; });
    assert.equal(result.status, 'completed');
    assert.equal(provider, 0);
    assert.ok(!('suggestions' in result));
});
test('analysis validates text only and rejects oversized or client identity', () => {
    assert.equal(validateAnalysis({ requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ocrText: ' Ficticio ' }).ocrText, 'Ficticio');
    assert.throws(() => validateAnalysis({ requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ocrText: 'x'.repeat(20001) }));
    assert.throws(() => validateAnalysis({ requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ocrText: 'Ficticio', userId: '2' }));
});
test('unsafe LIMIT_ANALYZE configuration disables capability before SQL',async()=>{
 const oldLimit=process.env.LIMIT_ANALYZE,oldKey=process.env.OPENROUTER_API_KEY;process.env.LIMIT_ANALYZE='9007199254740993';process.env.OPENROUTER_API_KEY='fictitious';let queries=0;
 try{assert.equal(await new MysqlStudyAnalysis({query:async()=>{queries++;throw Error('SQL must not run');}} as unknown as Pool).ready(),false);assert.equal(queries,0);}finally{if(oldLimit===undefined)delete process.env.LIMIT_ANALYZE;else process.env.LIMIT_ANALYZE=oldLimit;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;}
});
test('incompatible optional management infrastructure hides capability without blocking manual reading/upload',async()=>{
 const oldLimit=process.env.LIMIT_ANALYZE,oldKey=process.env.OPENROUTER_API_KEY;process.env.LIMIT_ANALYZE='1';process.env.OPENROUTER_API_KEY='fictitious';
 const pool={query:async()=>{throw Error('INCOMPATIBLE_MANAGEMENT_SCHEMA');}} as unknown as Pool;
 try{assert.equal(await new MysqlStudyAnalysis(pool).ready(),false);assert.equal(await new MysqlStudyDeletion(pool).ready(),false);}finally{if(oldLimit===undefined)delete process.env.LIMIT_ANALYZE;else process.env.LIMIT_ANALYZE=oldLimit;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;}
});
test('suggestions reject unknown fields, overlong values and invalid civil dates', () => {
    assert.equal(validateSuggestions(JSON.stringify({ studyName: 'Ficticio', studyDate: '29-02-2024' })).date, '29-02-2024');
    assert.throws(() => validateSuggestions(JSON.stringify({ studyDate: '29-02-2025' })));
    assert.throws(() => validateSuggestions(JSON.stringify({ doctor: 'x'.repeat(401) })));
    assert.throws(() => validateSuggestions(JSON.stringify({ diagnosis: 'inventado' })));
    assert.throws(() => validateSuggestions('{}'));
});
