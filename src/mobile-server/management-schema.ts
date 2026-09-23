import type { Pool, RowDataPacket } from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
type Kind = 'delete' | 'analyze';
export const managementDefinitions: Record<string, Record<string, string>> = {
    mobile_study_deletions: { operation_id: 'char(36)', id_usuario: 'int', study_id: 'int', status: 'varchar(12)', created_at: 'bigint', updated_at: 'bigint' },
    mobile_study_delete_files: { id: 'bigint', operation_id: 'char(36)', file_key: 'varchar(500)', status: 'varchar(10)', attempts: 'int', next_attempt: 'bigint', lease_until: 'bigint', lease_token: 'char(36)' },
    mobile_study_analyses: { id_usuario: 'int', request_id: 'char(36)', quota_day: 'varchar(10)', status: 'varchar(12)', created_at: 'bigint', updated_at: 'bigint' },
};
const tablesFor = (kind: Kind) => kind === 'delete' ? ['mobile_study_deletions', 'mobile_study_delete_files'] : ['mobile_study_analyses'];
const incompatible = () => { throw Error('INCOMPATIBLE_MANAGEMENT_SCHEMA'); };
// InnoDB checks NO ACTION immediately, identically to RESTRICT.
const restrictive = (rule: unknown) => rule === 'RESTRICT' || rule === 'NO ACTION';
async function columns(pool: Pool, table: string) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [table]);
    return rows;
}
async function engine(pool: Pool, table: string) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [table]);
    return rows;
}
async function indexes(pool: Pool, table: string) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT INDEX_NAME,NON_UNIQUE,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_list,MAX(SUB_PART IS NOT NULL) AS has_prefix FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? GROUP BY INDEX_NAME,NON_UNIQUE', [table]);
    return rows;
}
function hasIndex(rows: RowDataPacket[], names: string, primary = false, unique = false) {
    return rows.some(r => r.columns_list === names && !Number(r.has_prefix ?? 0) && (!primary || r.INDEX_NAME === 'PRIMARY') && (!(primary || unique) || Number(r.NON_UNIQUE) === 0));
}
async function foreignKeys(pool: Pool, table: string) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT k.COLUMN_NAME,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL', [table]);
    return rows;
}
async function baseCompatible(pool: Pool, kind: Kind) {
    const definitions: Record<string, Record<string, string>> = { users: { id: 'int' }, mobile_auth_sessions: { id: 'varchar(43)', user_id: 'int', access_hash: 'char(64)', access_expires_at: 'bigint', expires_at: 'bigint', revoked: 'tinyint(1)' }, ...(kind === 'delete' ? { estudios: { id: 'int', id_usuario: 'int', file_key: 'varchar(500)' }, estudios_archivos: { id: 'int', id_estudio: 'int', file_key: 'varchar(500)' } } : {}) };
    for (const [table, fields] of Object.entries(definitions)) {
        if ((await engine(pool, table))[0]?.ENGINE !== 'InnoDB')
            throw Error('INCOMPATIBLE_TEST_BASE');
        const rows = await columns(pool, table);
        for (const [name, type] of Object.entries(fields)) {
            const row = rows.find(r => r.COLUMN_NAME === name), nullableFile = table === 'estudios' && name === 'file_key';
            if (!row || (row.COLUMN_TYPE !== type && !(name === 'revoked' && row.COLUMN_TYPE === 'tinyint')) || (!nullableFile && row.IS_NULLABLE !== 'NO'))
                throw Error('INCOMPATIBLE_TEST_BASE');
        }
        const keys = await indexes(pool, table);
        if (!hasIndex(keys, 'id', true))
            throw Error('INCOMPATIBLE_TEST_BASE');
        if (table === 'mobile_auth_sessions' && !hasIndex(keys, 'access_hash', false, true))
            throw Error('INCOMPATIBLE_TEST_BASE');
        if (table === 'estudios_archivos' && !keys.some(r => String(r.columns_list).split(',')[0] === 'id_estudio' && !Number(r.has_prefix ?? 0)))
            throw Error('INCOMPATIBLE_TEST_BASE');
        if (table !== 'users') {
            const ownerColumn = table === 'mobile_auth_sessions' ? 'user_id' : table === 'estudios' ? 'id_usuario' : 'id_estudio';
            const referencedTable = table === 'estudios_archivos' ? 'estudios' : 'users';
            const foreign = await foreignKeys(pool, table);
            if (!foreign.some(r => r.COLUMN_NAME === ownerColumn && r.REFERENCED_TABLE_NAME === referencedTable && r.REFERENCED_COLUMN_NAME === 'id' && (restrictive(r.DELETE_RULE) || table === 'estudios_archivos' && r.DELETE_RULE === 'CASCADE')))
                throw Error('INCOMPATIBLE_TEST_BASE');
        }
    }
    if (kind === 'delete' && (await engine(pool, 'links')).length) {
        if ((await engine(pool, 'links'))[0]?.ENGINE !== 'InnoDB')
            throw Error('INCOMPATIBLE_LINK_SCHEMA');
        const rows = await columns(pool, 'links');
        for (const name of ['id_usuario', 'id_estudio'])
            if (!rows.some(r => r.COLUMN_NAME === name && r.COLUMN_TYPE === 'int' && r.IS_NULLABLE === 'NO'))
                throw Error('INCOMPATIBLE_LINK_SCHEMA');
    }
}
async function quotaColumns(pool: Pool) {
    const rows = (await columns(pool, 'users')).filter(r => ['count_analyze', 'date_analyze'].includes(r.COLUMN_NAME));
    if (rows.length === 1)
        throw Error('PARTIAL_QUOTA_SCHEMA');
    for (const row of rows)
        if (row.EXTRA !== '' || (row.COLUMN_NAME === 'count_analyze' ? row.COLUMN_TYPE !== 'int' || (row.COLUMN_DEFAULT !== null && String(row.COLUMN_DEFAULT) !== '0') : !/^varchar\((10|20)\)$/.test(row.COLUMN_TYPE) || row.IS_NULLABLE !== 'YES' || row.COLUMN_DEFAULT !== null))
            throw Error('INCOMPATIBLE_QUOTA_SCHEMA');
    return rows;
}
async function validateManagementTable(pool: Pool, table: string, rows: RowDataPacket[]) {
    if ((await engine(pool, table))[0]?.ENGINE !== 'InnoDB' || rows.length !== Object.keys(managementDefinitions[table]).length)
        incompatible();
    for (const [name, type] of Object.entries(managementDefinitions[table])) {
        const row = rows.find(r => r.COLUMN_NAME === name);
        const expectedDefault = table === 'mobile_study_delete_files' && name === 'status' ? 'pending' : table === 'mobile_study_delete_files' && ['attempts', 'next_attempt', 'lease_until'].includes(name) ? '0' : null;
        const expectedExtra = table === 'mobile_study_delete_files' && name === 'id' ? 'auto_increment' : '';
        if (!row || row.COLUMN_TYPE !== type || row.IS_NULLABLE !== (name === 'lease_token' ? 'YES' : 'NO') || (row.COLUMN_DEFAULT === null ? null : String(row.COLUMN_DEFAULT)) !== expectedDefault || row.EXTRA !== expectedExtra)
            incompatible();
    }
    const keys = await indexes(pool, table);
    const primary = table === 'mobile_study_deletions' ? 'operation_id' : table === 'mobile_study_delete_files' ? 'id' : 'id_usuario,request_id';
    const owner = table === 'mobile_study_deletions' ? 'id_usuario,operation_id' : table === 'mobile_study_delete_files' ? 'operation_id,file_key' : 'id_usuario,request_id';
    if (!hasIndex(keys, primary, true) || !hasIndex(keys, owner, false, true))
        incompatible();
    if (table === 'mobile_study_delete_files' && !hasIndex(keys, 'status,next_attempt,lease_until'))
        incompatible();
    if (table === 'mobile_study_analyses' && !hasIndex(keys, 'id_usuario,quota_day,status'))
        incompatible();
    const foreign = await foreignKeys(pool, table);
    const column = table === 'mobile_study_delete_files' ? 'operation_id' : 'id_usuario', target = table === 'mobile_study_delete_files' ? 'mobile_study_deletions' : 'users', referenced = table === 'mobile_study_delete_files' ? 'operation_id' : 'id';
    if (foreign.length !== 1 || !foreign.some(r => r.COLUMN_NAME === column && r.REFERENCED_TABLE_NAME === target && r.REFERENCED_COLUMN_NAME === referenced && restrictive(r.DELETE_RULE)))
        incompatible();
}
export async function managementSchemaReady(pool: Pool, kind: Kind): Promise<boolean> {
    const names = tablesFor(kind), all = await Promise.all(names.map(name => columns(pool, name)));
    if (all.every(rows => !rows.length))
        return false;
    if (all.some(rows => !rows.length))
        throw Error('PARTIAL_MANAGEMENT_SCHEMA');
    await baseCompatible(pool, kind);
    for (let index = 0; index < names.length; index++)
        await validateManagementTable(pool, names[index], all[index]);
    if (kind === 'analyze' && !(await quotaColumns(pool)).length)
        return false;
    return true;
}
export async function migrateManagement(pool: Pool, name: string, kind: Kind, apply = false) {
    const [db] = await pool.query<RowDataPacket[]>('SELECT DATABASE() AS name');
    if (!name || db[0]?.name !== name)
        throw Error('TEST_DATABASE_REQUIRED');
    await baseCompatible(pool, kind);
    const names = tablesFor(kind);
    const [present] = await pool.query<RowDataPacket[]>('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (?)', [names]);
    if (present.length && present.length !== names.length)
        throw Error('PARTIAL_MANAGEMENT_SCHEMA');
    const quota = kind === 'analyze' ? await quotaColumns(pool) : [];
    if (present.length) {
        if (kind === 'analyze' && !quota.length)
            throw Error('PARTIAL_MANAGEMENT_SCHEMA');
        await managementSchemaReady(pool, kind);
    }
    if (!apply)
        return managementSchemaReady(pool, kind);
    if (kind === 'analyze' && !quota.length)
        await pool.query('ALTER TABLE users ADD COLUMN count_analyze INT NOT NULL DEFAULT 0, ADD COLUMN date_analyze VARCHAR(20) NULL');
    if (!present.length)
        await pool.query(await readFile(new URL(`../../database/mobile-test-${kind === 'delete' ? 'study-delete' : 'study-analysis'}.sql`, import.meta.url), 'utf8'));
    return managementSchemaReady(pool, kind);
}
