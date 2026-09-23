import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'mysql2/promise';
import { managementSchemaReady, migrateManagement, managementDefinitions } from '../../src/mobile-server/management-schema.ts';
type Column = {
    COLUMN_NAME: string;
    COLUMN_TYPE: string;
    IS_NULLABLE: string;
    COLUMN_DEFAULT: string | null;
    EXTRA: string;
};
function fixture() {
    const types: Record<string, Record<string, string>> = { ...managementDefinitions, users: { id: 'int', count_analyze: 'int', date_analyze: 'varchar(20)' }, estudios: { id: 'int', id_usuario: 'int', file_key: 'varchar(500)' }, estudios_archivos: { id: 'int', id_estudio: 'int', file_key: 'varchar(500)' }, mobile_auth_sessions: { id: 'varchar(43)', user_id: 'int', access_hash: 'char(64)', access_expires_at: 'bigint', expires_at: 'bigint', revoked: 'tinyint(1)' } };
    const columns: Record<string, Column[]> = {};
    for (const [table, fields] of Object.entries(types))
        columns[table] = Object.entries(fields).map(([COLUMN_NAME, COLUMN_TYPE]) => ({ COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE: ['lease_token', 'date_analyze'].includes(COLUMN_NAME) || table === 'estudios' && COLUMN_NAME === 'file_key' ? 'YES' : 'NO', COLUMN_DEFAULT: table === 'mobile_study_delete_files' && COLUMN_NAME === 'status' ? 'pending' : ['attempts', 'next_attempt', 'lease_until', 'revoked', 'count_analyze'].includes(COLUMN_NAME) ? '0' : null, EXTRA: table === 'mobile_study_delete_files' && COLUMN_NAME === 'id' ? 'auto_increment' : '' }));
    const index = (INDEX_NAME: string, columns_list: string, NON_UNIQUE = 0) => ({ INDEX_NAME, columns_list, NON_UNIQUE });
    const indexes: Record<string, ReturnType<typeof index>[]> = { users: [index('PRIMARY', 'id')], estudios: [index('PRIMARY', 'id'), index('owner', 'id_usuario,id_familiar,id', 1)], estudios_archivos: [index('PRIMARY', 'id'), index('study', 'id_estudio', 1)], mobile_auth_sessions: [index('PRIMARY', 'id'), index('access', 'access_hash')], mobile_study_deletions: [index('PRIMARY', 'operation_id'), index('owner', 'id_usuario,operation_id')], mobile_study_delete_files: [index('PRIMARY', 'id'), index('file', 'operation_id,file_key'), index('claim', 'status,next_attempt,lease_until', 1)], mobile_study_analyses: [index('PRIMARY', 'id_usuario,request_id'), index('reservation', 'id_usuario,quota_day,status', 1)] };
    const fks: Record<string, unknown[]> = { mobile_study_deletions: [{ COLUMN_NAME: 'id_usuario', REFERENCED_TABLE_NAME: 'users', REFERENCED_COLUMN_NAME: 'id', DELETE_RULE: 'RESTRICT' }], mobile_study_delete_files: [{ COLUMN_NAME: 'operation_id', REFERENCED_TABLE_NAME: 'mobile_study_deletions', REFERENCED_COLUMN_NAME: 'operation_id', DELETE_RULE: 'RESTRICT' }], mobile_study_analyses: [{ COLUMN_NAME: 'id_usuario', REFERENCED_TABLE_NAME: 'users', REFERENCED_COLUMN_NAME: 'id', DELETE_RULE: 'RESTRICT' }] };
    fks.mobile_auth_sessions = [{ COLUMN_NAME: 'user_id', REFERENCED_TABLE_NAME: 'users', REFERENCED_COLUMN_NAME: 'id', DELETE_RULE: 'RESTRICT' }];
    fks.estudios = [{ COLUMN_NAME: 'id_usuario', REFERENCED_TABLE_NAME: 'users', REFERENCED_COLUMN_NAME: 'id', DELETE_RULE: 'RESTRICT' }];
    fks.estudios_archivos = [{ COLUMN_NAME: 'id_estudio', REFERENCED_TABLE_NAME: 'estudios', REFERENCED_COLUMN_NAME: 'id', DELETE_RULE: 'CASCADE' }];
    const writes: string[] = [];
    const pool = { query: async (sql: string, args?: unknown[]) => {
            const table = String(args?.[0] ?? /TABLE_NAME='([^']+)'/.exec(sql)?.[1] ?? '');
            if (sql.startsWith('SELECT DATABASE'))
                return [[{ name: 'isolated_test' }]];
            if (sql.includes('TABLE_NAME IN'))
                return [(args?.[0] as string[]).filter(t => columns[t]).map(TABLE_NAME => ({ TABLE_NAME }))];
            if (sql.includes('information_schema.COLUMNS'))
                return [columns[table] ?? []];
            if (sql.includes('information_schema.STATISTICS'))
                return [indexes[table] ?? []];
            if (sql.includes('KEY_COLUMN_USAGE'))
                return [fks[table] ?? []];
            if (sql.includes('information_schema.TABLES'))
                return [columns[table] ? [{ ENGINE: 'InnoDB' }] : []];
            writes.push(sql);
            return [[]];
        } } as unknown as Pool;
    return { pool, columns, indexes, fks, writes };
}
test('valid schemas and nullable legacy zero/NULL quota remain compatible', async () => {
    const f = fixture();
    assert.equal(await managementSchemaReady(f.pool, 'delete'), true);
    f.columns.users.find(c => c.COLUMN_NAME === 'count_analyze')!.IS_NULLABLE = 'YES';
    f.columns.users.find(c => c.COLUMN_NAME === 'count_analyze')!.COLUMN_DEFAULT = null;
    assert.equal(await managementSchemaReady(f.pool, 'analyze'), true);
});
test('InnoDB NO ACTION foreign keys retain restrictive owner semantics', async () => {
    const f = fixture();
    for (const rows of Object.values(f.fks))
        for (const row of rows as { DELETE_RULE: string }[])
            if (row.DELETE_RULE === 'RESTRICT') row.DELETE_RULE = 'NO ACTION';
    assert.equal(await managementSchemaReady(f.pool, 'delete'), true);
    assert.equal(await managementSchemaReady(f.pool, 'analyze'), true);
});
for (const kind of ['delete', 'analyze'] as const)
    test(`${kind} rejects missing primary despite a unique owner key`, async () => {
        const f = fixture(), table = kind === 'delete' ? 'mobile_study_deletions' : 'mobile_study_analyses';
        f.indexes[table] = f.indexes[table].filter(i => i.INDEX_NAME !== 'PRIMARY');
        if (kind === 'analyze')
            f.indexes[table].push({ INDEX_NAME: 'unique', columns_list: 'id_usuario,request_id', NON_UNIQUE: 0 });
        await assert.rejects(managementSchemaReady(f.pool, kind), /INCOMPATIBLE/);
    });
test('rejects unsafe outbox defaults, missing auto increment, and incomplete claim index', async () => {
    for (const mutate of [(f: ReturnType<typeof fixture>) => { f.columns.mobile_study_delete_files.find(c => c.COLUMN_NAME === 'status')!.COLUMN_DEFAULT = 'complete'; }, (f: ReturnType<typeof fixture>) => { f.columns.mobile_study_delete_files.find(c => c.COLUMN_NAME === 'id')!.EXTRA = ''; }, (f: ReturnType<typeof fixture>) => { f.indexes.mobile_study_delete_files = f.indexes.mobile_study_delete_files.filter(i => i.INDEX_NAME !== 'claim'); }]) {
        const f = fixture();
        mutate(f);
        await assert.rejects(managementSchemaReady(f.pool, 'delete'), /INCOMPATIBLE/);
    }
});
test('rejects absent or cascading management foreign keys', async () => {
    for (const cascading of [false, true]) {
        const f = fixture();
        f.fks.mobile_study_delete_files = cascading ? [{ COLUMN_NAME: 'operation_id', REFERENCED_TABLE_NAME: 'mobile_study_deletions', REFERENCED_COLUMN_NAME: 'operation_id', DELETE_RULE: 'CASCADE' }] : [];
        await assert.rejects(managementSchemaReady(f.pool, 'delete'), /INCOMPATIBLE/);
    }
});
test('base owner integer types and session revocation guard are checked before DDL', async () => {
    for (const [table, name] of [['estudios', 'id_usuario'], ['users', 'id'], ['mobile_auth_sessions', 'revoked']]) {
        const f = fixture();
        f.columns[table].find(c => c.COLUMN_NAME === name)!.COLUMN_TYPE = 'varchar(20)';
        await assert.rejects(migrateManagement(f.pool, 'isolated_test', 'delete', true), /INCOMPATIBLE/);
        assert.deepEqual(f.writes, []);
    }
});
test('partial tables or quota fields fail before additive migration writes', async () => {
    const f = fixture();
    delete f.columns.mobile_study_delete_files;
    await assert.rejects(migrateManagement(f.pool, 'isolated_test', 'delete', true), /PARTIAL/);
    assert.deepEqual(f.writes, []);
    const quota = fixture();
    quota.columns.users = quota.columns.users.filter(c => c.COLUMN_NAME !== 'date_analyze');
    await assert.rejects(migrateManagement(quota.pool, 'isolated_test', 'analyze', true), /PARTIAL/);
    assert.deepEqual(quota.writes, []);
});
test('base session and study foreign keys cannot target unrelated ownership tables', async () => {
    for (const table of ['mobile_auth_sessions', 'estudios', 'estudios_archivos']) {
        const f = fixture();
        f.fks[table] = [];
        await assert.rejects(migrateManagement(f.pool, 'isolated_test', 'delete', true), /INCOMPATIBLE/);
        assert.deepEqual(f.writes, []);
    }
});
test('prefix unique key cannot replace full durable attachment identity', async () => {
    const f = fixture();
    Object.assign(f.indexes.mobile_study_delete_files.find(i => i.INDEX_NAME === 'file')!, { has_prefix: 1 });
    await assert.rejects(managementSchemaReady(f.pool, 'delete'), /INCOMPATIBLE/);
});
test('optional links owner types and unexpected durable clinical columns fail preflight', async () => {
    const f = fixture();
    f.columns.links = [{ COLUMN_NAME: 'id_usuario', COLUMN_TYPE: 'varchar(100)', IS_NULLABLE: 'NO', COLUMN_DEFAULT: null, EXTRA: '' }, { COLUMN_NAME: 'id_estudio', COLUMN_TYPE: 'int', IS_NULLABLE: 'NO', COLUMN_DEFAULT: null, EXTRA: '' }];
    await assert.rejects(migrateManagement(f.pool, 'isolated_test', 'delete', true), /INCOMPATIBLE/);
    assert.deepEqual(f.writes, []);
    const clinical = fixture();
    clinical.columns.mobile_study_analyses.push({ COLUMN_NAME: 'ocr_text', COLUMN_TYPE: 'text', IS_NULLABLE: 'YES', COLUMN_DEFAULT: null, EXTRA: '' });
    await assert.rejects(managementSchemaReady(clinical.pool, 'analyze'), /INCOMPATIBLE/);
});
test('generated quota counters cannot advertise analysis capability', async () => {
    const f = fixture();
    f.columns.users.find(column => column.COLUMN_NAME === 'count_analyze')!.EXTRA = 'STORED GENERATED';
    await assert.rejects(managementSchemaReady(f.pool, 'analyze'), /INCOMPATIBLE/);
});
