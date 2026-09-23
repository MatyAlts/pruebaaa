import mysql from 'mysql2/promise';
import {migrateManagement} from '../src/mobile-server/management-schema.ts';
const [flag,name,kind,mode]=process.argv.slice(2);
if(process.argv.length!==6||flag!=='--test-database'||name!==process.env.DB_NAME||!['delete','analyze'].includes(kind)||!['--check','--apply'].includes(mode)){
 console.error('Uso TEST: node scripts/migrate-mobile-management.mjs --test-database <DB_NAME> delete|analyze --check|--apply');process.exitCode=1;
}else{
 const pool=mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:name,multipleStatements:true,connectionLimit:1});
 try{console.log(JSON.stringify({database:name,status:await migrateManagement(pool,name,kind,mode==='--apply')?'ready':'migration-required'}));}catch{console.error('Esquema TEST incompatible o conexión no disponible. Revisar antes de continuar.');process.exitCode=1;}finally{await pool.end();}
}
