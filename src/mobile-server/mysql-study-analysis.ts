import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import OpenAI from 'openai';
import { ReadingError } from './studies.ts';
import { UUID } from './mysql-family.ts';
import { validateUploadFields } from './upload-validation.ts';
import { managementSchemaReady } from './management-schema.ts';
import { ANALYSIS_PROMPT } from './analysis-prompt.ts';
export function validateAnalysis(input: Record<string, unknown>) {
    if (Object.keys(input).some(k => !['requestId', 'ocrText'].includes(k)) || typeof input.requestId !== 'string' || !UUID.test(input.requestId) || typeof input.ocrText !== 'string' || !input.ocrText.trim() || input.ocrText.length > 20000)
        throw new ReadingError(400, 'INVALID_ANALYSIS');
    return { requestId: input.requestId.toLowerCase(), ocrText: input.ocrText.trim() };
}
export function validateSuggestions(text: string) {
    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        throw new ReadingError(502, 'INVALID_AI_RESPONSE');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).some(k => !['studyName', 'institution', 'doctor', 'studyDate', 'conclusion'].includes(k)))
        throw new ReadingError(502, 'INVALID_AI_RESPONSE');
    for (const v of Object.values(parsed))
        if (typeof v !== 'string')
            throw new ReadingError(502, 'INVALID_AI_RESPONSE');
    const fields = { title: String(parsed.studyName ?? '').trim(), institution: String(parsed.institution ?? '').trim(), medico: String(parsed.doctor ?? '').trim(), date: String(parsed.studyDate ?? '').trim(), conclusion: String(parsed.conclusion ?? '').trim() };
    if (!Object.values(fields).some(value => value.trim()))
        throw new ReadingError(502, 'INVALID_AI_RESPONSE');
    try {
        validateUploadFields({ ...fields, date: fields.date || '01-01-2000', patient: 'self' });
    }
    catch {
        throw new ReadingError(502, 'INVALID_AI_RESPONSE');
    }
    return fields;
}
export class MysqlStudyAnalysis {
    pool: Pool;
    constructor(pool: Pool) { this.pool = pool; }
    async ready() {
        try {
            return !!process.env.OPENROUTER_API_KEY
                && /^[1-9]\d*$/.test(process.env.LIMIT_ANALYZE ?? '')
                && Number.isSafeInteger(Number(process.env.LIMIT_ANALYZE))
                && await managementSchemaReady(this.pool, 'analyze');
        } catch {
            return false;
        }
    }
    async status(owner: string, key: string) {
        if (!UUID.test(key))
            throw new ReadingError();
        const [rows] = await this.pool.query<RowDataPacket[]>('SELECT status,created_at FROM mobile_study_analyses WHERE id_usuario=? AND request_id=?', [owner, key]);
        if (!rows[0])
            throw new ReadingError();
        return { requestId: key, status: rows[0].status === 'pending' && Date.now() - Number(rows[0].created_at) > 120000 ? 'unavailable' : String(rows[0].status) };
    }
    async submit(owner: string, input: Record<string, unknown>, session: (c: PoolConnection) => Promise<void>, provider?: (text: string) => Promise<string>, today = analysisDay()) {
        const { requestId, ocrText } = validateAnalysis(input), c = await this.pool.getConnection();
        try {
            await c.beginTransaction();
            await session(c);
            const [users] = await c.query<RowDataPacket[]>('SELECT count_analyze,date_analyze FROM users WHERE id=? FOR UPDATE', [owner]);
            if (!users[0])
                throw new ReadingError();
            const [prior] = await c.query<RowDataPacket[]>('SELECT status FROM mobile_study_analyses WHERE id_usuario=? AND request_id=? FOR UPDATE', [owner, requestId]);
            if (prior[0]) {
                await c.commit();
                return { requestId, status: String(prior[0].status) };
            }
            const limit = Number(process.env.LIMIT_ANALYZE);
            if (!Number.isSafeInteger(limit) || limit <= 0)
                throw new ReadingError(503, 'ANALYSIS_UNAVAILABLE');
            const [reserved] = await c.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM mobile_study_analyses WHERE id_usuario=? AND quota_day=? AND status IN ('pending','unavailable')", [owner, today]);
            const count = users[0].date_analyze === today ? Number(users[0].count_analyze || 0) : 0;
            if (count + Number(reserved[0]?.n || 0) >= limit)
                throw new ReadingError(429, 'ANALYSIS_LIMIT_REACHED');
            await c.query("INSERT INTO mobile_study_analyses(id_usuario,request_id,quota_day,status,created_at,updated_at) VALUES(?,?,?,'pending',?,?)", [owner, requestId, today, Date.now(), Date.now()]);
            await c.commit();
        }
        catch (e) {
            await c.rollback();
            throw e;
        }
        finally {
            c.release();
        }
        let suggestions: ReturnType<typeof validateSuggestions>;
        try {
            suggestions = validateSuggestions(await (provider ?? openRouterSuggestions)(ocrText));
        }
        catch (e) {
            // Timeouts/network losses cannot prove the provider did not charge: keep capacity.
            const definitive = e instanceof ReadingError || (typeof (e as {
                status?: number;
            }).status === 'number');
            await this.pool.query('UPDATE mobile_study_analyses SET status=?,updated_at=? WHERE id_usuario=? AND request_id=? AND status=\'pending\'', [definitive ? 'failed' : 'unavailable', Date.now(), owner, requestId]);
            throw new ReadingError(definitive ? 502 : 503, definitive ? 'ANALYSIS_FAILED' : 'ANALYSIS_UNAVAILABLE');
        }
        const finish = await this.pool.getConnection();
        try {
            await finish.beginTransaction();
            await session(finish);
            const [users]=await finish.query<RowDataPacket[]>('SELECT count_analyze,date_analyze FROM users WHERE id=? FOR UPDATE', [owner]);
            const count=nextAnalysisCounter({count_analyze:users[0]?.count_analyze,date_analyze:users[0]?.date_analyze},today);
            if(count!==null)await finish.query('UPDATE users SET count_analyze=?,date_analyze=? WHERE id=?', [count,today,owner]);
            await finish.query("UPDATE mobile_study_analyses SET status='completed',updated_at=? WHERE id_usuario=? AND request_id=?", [Date.now(), owner, requestId]);
            await finish.commit();
        }
        catch (e) {
            await finish.rollback();
            throw e;
        }
        finally {
            finish.release();
        }
        return { requestId, status: 'completed', suggestions };
    }
}
export function analysisDay() { const d = new Date(Date.now() - 3 * 3600000); return `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`; }
export function nextAnalysisCounter(user:{count_analyze?:number|null;date_analyze?:string|null},day:string){
 const comparable=(value:string)=>value.split('-').reverse().join('-');
 if(user.date_analyze&&comparable(user.date_analyze)>comparable(day))return null;
 return user.date_analyze===day?Number(user.count_analyze||0)+1:1;
}
export async function openRouterSuggestions(text: string) {
    const sdk = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1', maxRetries: 0, timeout: 90000 });
    const reply = await sdk.chat.completions.create({ model: 'openai/gpt-4o-mini', temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: ANALYSIS_PROMPT }, { role: 'user', content: `Analizá el siguiente estudio médico y extraé la información solicitada:\n\n${text}` }] });
    return reply.choices[0]?.message?.content ?? '';
}
