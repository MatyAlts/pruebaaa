import { test } from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { readFile, mkdtemp, mkdir, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { migrateManagement, managementSchemaReady } from '../../src/mobile-server/management-schema.ts';
import { MysqlStudyDeletion } from '../../src/mobile-server/mysql-study-deletion.ts';
import { MysqlStudyAnalysis } from '../../src/mobile-server/mysql-study-analysis.ts';
import { assertUploadSession } from '../../src/mobile-server/upload-session.ts';
import { studyCleanupBatch } from '../../src/mobile-server/study-cleanup.ts';
import {spawn} from 'node:child_process';
import {symlink} from 'node:fs/promises';
test('TEST MySQL real deletion transaction, revocation, durable cleanup, shared quota and no provider retry', { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== '1' }, async () => {
    const options = { host: '127.0.0.1', port: 33316, user: 'root', password: 'isolated-test-password', multipleStatements: true };
    const name = 'misaluteca_mobile_management_test', admin = await mysql.createConnection(options);
    await admin.query(`DROP DATABASE IF EXISTS ${name};CREATE DATABASE ${name}`);
    await admin.end();
    const pool = mysql.createPool({ ...options, database: name, connectionLimit: 6 });
    try {
        await pool.query(await readFile('database/mobile-test-bootstrap.sql', 'utf8'));
        await pool.query(await readFile('database/mobile-auth.sql', 'utf8'));
        await pool.query("INSERT INTO users(id,email) VALUES(1,'one@example.invalid'),(2,'two@example.invalid')");
        assert.equal(await managementSchemaReady(pool, 'delete'), false);
        assert.equal(await migrateManagement(pool, name, 'delete', true), true);
        assert.equal(await migrateManagement(pool, name, 'analyze', true), true);
        await assert.rejects(migrateManagement(pool, 'foreign', 'delete', true));
        const token = 'management_fixture', until = Date.now() + 600000;
        await pool.query('INSERT INTO mobile_auth_sessions(id,user_id,access_hash,access_expires_at,expires_at) VALUES(?,?,?,?,?)', ['management', 1, createHash('sha256').update(token).digest('hex'), until, until]);
        const session = (c: Parameters<typeof assertUploadSession>[0]) => assertUploadSession(c, token, '1');
        await pool.query("INSERT INTO estudios(id,uuid,id_usuario,email_usuario,fecha,file_key) VALUES(1,'own',1,'one@example.invalid','18-09-2026','1/a.pdf'),(2,'foreign',2,'two@example.invalid','18-09-2026',NULL)");
        await pool.query("INSERT INTO estudios_archivos(id_estudio,file_key,file_name,mime_type,file_size) VALUES(1,'1/b.pdf','b.pdf','application/pdf',10)");
        await pool.query('CREATE TABLE links(id INT PRIMARY KEY,id_usuario INT NOT NULL,id_estudio INT NOT NULL) ENGINE=InnoDB;INSERT INTO links VALUES(1,1,1)');
        const deletion = new MysqlStudyDeletion(pool), key = randomUUID(), input = { confirmation: 'misaluteca', idempotencyKey: key };
        await assert.rejects(deletion.remove('1', '2', input, session), { status: 404 });
        await pool.query("UPDATE mobile_auth_sessions SET revoked=1 WHERE id='management'");
        await assert.rejects(deletion.remove('1', '1', input, session), { status: 401 });
        await pool.query("UPDATE mobile_auth_sessions SET revoked=0 WHERE id='management'");
        const root = await mkdtemp(join(tmpdir(), 'study-delete-'));
        await mkdir(join(root, '1'));
        await writeFile(join(root, '1/a.pdf'), 'ficticio');
        await writeFile(join(root, '1/b.pdf'), 'ficticio');
        assert.equal((await deletion.remove('1', '1', input, session)).status, 'committed');
        assert.equal((await deletion.remove('1', '1', input, session)).operationId, key);
        await assert.rejects(deletion.remove('1', '2', input, session), { status: 409 });
        await assert.rejects(deletion.status('2', key), { status: 404 });
        const [links] = await pool.query('SELECT * FROM links');
        assert.deepEqual(links, []);
        await access(join(root, '1/a.pdf'));
        await studyCleanupBatch(pool, root, Date.now(), { unlink: async () => { throw Object.assign(Error('TEST'), { code: 'EACCES' }); } });
        assert.equal((await deletion.status('1', key)).status, 'committed');
        await studyCleanupBatch(pool, root, Date.now() + 10000);
        assert.equal((await deletion.status('1', key)).status, 'complete');
        await assert.rejects(access(join(root, '1/a.pdf')));
        await assert.rejects(access(join(root, '1/b.pdf')));
        await pool.query("INSERT INTO estudios(id,uuid,id_usuario,email_usuario,fecha,file_key) VALUES(3,'rollback',1,'one@example.invalid','18-09-2026','1/rollback.pdf')");
        await pool.query("CREATE TRIGGER reject_study_delete BEFORE DELETE ON estudios FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='TEST rollback'");
        const rollbackKey=randomUUID();await assert.rejects(deletion.remove('1','3',{confirmation:'misaluteca',idempotencyKey:rollbackKey},session));
        const [retained]=await pool.query('SELECT id FROM estudios WHERE id=3');assert.equal((retained as unknown[]).length,1);await assert.rejects(deletion.status('1',rollbackKey),{status:404});
        await pool.query('DROP TRIGGER reject_study_delete');
        await deletion.remove('1','3',{confirmation:'misaluteca',idempotencyKey:rollbackKey},session);
        const worker=spawn(process.execPath,['scripts/mobile-cleanup-worker.mjs'],{env:{...process.env,DB_HOST:'127.0.0.1',DB_PORT:'33316',DB_USER:'root',DB_PASSWORD:'isolated-test-password',DB_NAME:name,DIRECTORY_UPLOADS:root},stdio:'ignore'});
        try{let complete=false;for(let i=0;i<100;i++){if((await deletion.status('1',rollbackKey)).status==='complete'){complete=true;break;}await new Promise(r=>setTimeout(r,100));}assert.equal(complete,true);}finally{worker.kill('SIGTERM');await new Promise(r=>worker.once('exit',r));}
        await pool.query("INSERT INTO estudios(id,uuid,id_usuario,email_usuario,fecha,file_key) VALUES(4,'legacy-delete',1,'one@example.invalid','18-09-2026','own-legacy.pdf');UPDATE estudios SET file_key='other-legacy.pdf' WHERE id=2");
        await writeFile(join(root,'own-legacy.pdf'),'ficticio');const legacyKey=randomUUID();await deletion.remove('1','4',{confirmation:'misaluteca',idempotencyKey:legacyKey},session);await studyCleanupBatch(pool,root,Date.now()+20000);assert.equal((await deletion.status('1',legacyKey)).status,'complete');await assert.rejects(access(join(root,'own-legacy.pdf')));
        await pool.query("INSERT INTO estudios(id,uuid,id_usuario,email_usuario,fecha,file_key) VALUES(5,'legacy-shared',1,'one@example.invalid','18-09-2026','shared-legacy.pdf');UPDATE estudios SET file_key='shared-legacy.pdf' WHERE id=2");
        await writeFile(join(root,'shared-legacy.pdf'),'keep');const sharedLegacy=randomUUID();await deletion.remove('1','5',{confirmation:'misaluteca',idempotencyKey:sharedLegacy},session);await studyCleanupBatch(pool,root,Date.now()+21000);assert.equal((await deletion.status('1',sharedLegacy)).status,'committed');await access(join(root,'shared-legacy.pdf'));
        const unsafeKey=randomUUID(),outside=await mkdtemp(join(tmpdir(),'study-outside-'));
        await writeFile(join(outside,'protected.pdf'),'keep');await symlink(outside,join(root,'1/link'),'dir');
        await pool.query("INSERT INTO mobile_study_deletions VALUES(?,1,99,'committed',0,0)",[unsafeKey]);
        await pool.query("INSERT INTO mobile_study_delete_files(operation_id,file_key) VALUES(?,'1/link/protected.pdf'),(?,'../escape.pdf'),(?,'1/shared.pdf')",[unsafeKey,unsafeKey,unsafeKey]);
        await pool.query("UPDATE estudios SET file_key='1/shared.pdf' WHERE id=2");await writeFile(join(root,'1/shared.pdf'),'keep');
        await studyCleanupBatch(pool,root,Date.now()+20000);await access(join(outside,'protected.pdf'));await access(join(root,'1/shared.pdf'));assert.equal((await deletion.status('1',unsafeKey)).status,'committed');
        const old = process.env.LIMIT_ANALYZE;
        process.env.LIMIT_ANALYZE = '1';
        try {
            const analysis = new MysqlStudyAnalysis(pool), id = randomUUID();
            let calls = 0;
            const provider = async () => { calls++; return JSON.stringify({ studyName: 'Ficticio', studyDate: '18-09-2026' }); };
            const result = await analysis.submit('1', { requestId: id, ocrText: 'Ficticio' }, session, provider, '18-09-2026');
            assert.equal(result.status, 'completed');
            assert.equal(calls, 1);
            assert.equal((await analysis.submit('1', { requestId: id, ocrText: 'Ficticio' }, session, provider, '18-09-2026')).status, 'completed');
            assert.equal(calls, 1);
            await assert.rejects(analysis.submit('1', { requestId: randomUUID(), ocrText: 'Ficticio' }, session, provider, '18-09-2026'), { status: 429 });
            await assert.rejects(analysis.status('2', id), { status: 404 });
            assert.ok(!JSON.stringify(await analysis.status('1', id)).includes('suggestions'));
            const ambiguous = randomUUID();
            await assert.rejects(analysis.submit('1', { requestId: ambiguous, ocrText: 'Ficticio' }, session, async () => { throw Error('network'); }, '19-09-2026'), { status: 503 });
            assert.equal((await analysis.status('1', ambiguous)).status, 'unavailable');
            await assert.rejects(analysis.submit('1', { requestId: randomUUID(), ocrText: 'Ficticio' }, session, provider, '19-09-2026'), { status: 429 });
            const fail = randomUUID();
            await assert.rejects(analysis.submit('1', { requestId: fail, ocrText: 'Ficticio' }, session, async () => '{bad', '20-09-2026'), { status: 502 });
            assert.equal((await analysis.status('1', fail)).status, 'failed');
            const [columns] = await pool.query('SHOW COLUMNS FROM mobile_study_analyses');
            assert.ok(!(columns as {
                Field: string;
            }[]).some(r => /text|result|suggestion/.test(r.Field)));
            // Both entry points use this owner-row reservation engine: concurrent
            // operations have exactly one provider invocation with limit one.
            let release!:()=>void,entered!:()=>void;const enteredPromise=new Promise<void>(r=>entered=r),releasePromise=new Promise<void>(r=>release=r);
            const first=analysis.submit('1',{requestId:randomUUID(),ocrText:'Ficticio'},session,async()=>{entered();await releasePromise;calls++;return JSON.stringify({studyName:'Concurrente'});},'21-09-2026');
            await enteredPromise;const before=calls;
            await assert.rejects(analysis.submit('1',{requestId:randomUUID(),ocrText:'Ficticio'},session,provider,'21-09-2026'),{status:429});assert.equal(calls,before);release();await first;assert.equal(calls,before+1);
        }
        finally {
            if (old === undefined)
                delete process.env.LIMIT_ANALYZE;
            else
                process.env.LIMIT_ANALYZE = old;
        }
    }
    finally {
        await pool.end();
    }
});
