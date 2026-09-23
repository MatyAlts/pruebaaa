import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { ReadingError } from './studies.ts';
import { UUID } from './mysql-family.ts';
import { managementSchemaReady } from './management-schema.ts';
export function validateDeletion(input: Record<string, unknown>) {
    if (Object.keys(input).some(k => !['confirmation', 'idempotencyKey'].includes(k)) || input.confirmation !== 'misaluteca' || typeof input.idempotencyKey !== 'string' || !UUID.test(input.idempotencyKey))
        throw new ReadingError(400, 'CONFIRMATION_REQUIRED');
    return input.idempotencyKey.toLowerCase();
}
export class MysqlStudyDeletion {
    pool: Pool;
    constructor(pool: Pool) { this.pool = pool; }
    async ready() {
        try {
            return await managementSchemaReady(this.pool, 'delete');
        } catch {
            return false;
        }
    }
    async status(owner: string, key: string) {
        if (!UUID.test(key))
            throw new ReadingError();
        const [rows] = await this.pool.query<RowDataPacket[]>('SELECT operation_id,status FROM mobile_study_deletions WHERE id_usuario=? AND operation_id=?', [owner, key]);
        if (!rows[0])
            throw new ReadingError();
        return { operationId: String(rows[0].operation_id), status: String(rows[0].status) };
    }
    async remove(owner: string, id: string, input: Record<string, unknown>, session: (c: PoolConnection) => Promise<void>) {
        const key = validateDeletion(input);
        if (!/^[1-9]\d*$/.test(id))
            throw new ReadingError();
        const c = await this.pool.getConnection();
        try {
            await c.beginTransaction();
            await session(c);
            // Owner row serializes duplicate keys without a race on an absent operation.
            await c.query('SELECT id FROM users WHERE id=? FOR UPDATE', [owner]);
            const [prior] = await c.query<RowDataPacket[]>('SELECT study_id,status FROM mobile_study_deletions WHERE id_usuario=? AND operation_id=? FOR UPDATE', [owner, key]);
            if (prior[0]) {
                if (String(prior[0].study_id) !== id)
                    throw new ReadingError(409, 'IDEMPOTENCY_CONFLICT');
                await c.commit();
                return { operationId: key, status: String(prior[0].status) };
            }
            const [studies] = await c.query<RowDataPacket[]>('SELECT id,file_key FROM estudios WHERE id=? AND id_usuario=? FOR UPDATE', [id, owner]);
            if (!studies[0])
                throw new ReadingError();
            const [files] = await c.query<RowDataPacket[]>('SELECT file_key FROM estudios_archivos WHERE id_estudio=? FOR UPDATE', [id]);
            const keys = new Set<string>([studies[0], ...files].filter(r => r.file_key).map(r => String(r.file_key)));
            const [tables] = await c.query<RowDataPacket[]>("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='links'");
            if (tables.length) {
                if (tables[0].ENGINE !== 'InnoDB')
                    throw new ReadingError(409, 'INCOMPATIBLE_LINK_SCHEMA');
                const [links] = await c.query<RowDataPacket[]>('SELECT id_usuario FROM links WHERE id_estudio=? FOR UPDATE', [id]);
                if (links.some(r => String(r.id_usuario) !== owner))
                    throw new ReadingError(409, 'INCONSISTENT_LINK_OWNERSHIP');
                await c.query('DELETE FROM links WHERE id_estudio=? AND id_usuario=?', [id, owner]);
            }
            const now = Date.now(), status = keys.size ? 'committed' : 'complete';
            await c.query('INSERT INTO mobile_study_deletions(operation_id,id_usuario,study_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?)', [key, owner, id, status, now, now]);
            for (const file of keys)
                await c.query('INSERT INTO mobile_study_delete_files(operation_id,file_key) VALUES(?,?)', [key, file]);
            await c.query('DELETE FROM estudios_archivos WHERE id_estudio=?', [id]);
            await c.query('DELETE FROM estudios WHERE id=? AND id_usuario=?', [id, owner]);
            await c.commit();
            return { operationId: key, status };
        }
        catch (e) {
            await c.rollback();
            throw e;
        }
        finally {
            c.release();
        }
    }
}
