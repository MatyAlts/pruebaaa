import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Configuración del pool
  waitForConnections: true,
  connectionLimit: 10, // Máximo 10 conexiones simultáneas
  queueLimit: 0, // Sin límite en la cola de espera

  // Keep-alive para mantener conexiones vivas
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Timeouts
  connectTimeout: 10000, // 10 segundos para establecer conexión

});
pool.on("connection", (conn) => {
  conn.query(`
    SET SESSION sql_mode =
      IF(
        FIND_IN_SET('STRICT_TRANS_TABLES', @@sql_mode) > 0,
        @@sql_mode,
        CONCAT(@@sql_mode, ',STRICT_TRANS_TABLES')
      )
  `);
});