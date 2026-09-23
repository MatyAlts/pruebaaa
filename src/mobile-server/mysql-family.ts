import { randomUUID } from "node:crypto";
import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { ReadingError } from "./studies.ts";
import { familySchemaReady } from "./family-schema.ts";
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function name(input: Record<string, unknown>) {
  if (
    Object.keys(input).some((k) => k !== "name") ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.trim().length > 40
  )
    throw new ReadingError(400, "INVALID_FAMILY_NAME");
  return input.name.trim();
}
const date = `CASE WHEN e.fecha REGEXP '^[0-9]{2}-[0-9]{2}-[1-9][0-9]{3}$' THEN CASE WHEN CAST(SUBSTRING(e.fecha,4,2) AS UNSIGNED) BETWEEN 1 AND 12 THEN CASE WHEN CAST(SUBSTRING(e.fecha,1,2) AS UNSIGNED) BETWEEN 1 AND DAY(LAST_DAY(CONCAT(SUBSTRING(e.fecha,7,4),'-',SUBSTRING(e.fecha,4,2),'-01'))) THEN CONCAT(SUBSTRING(e.fecha,7,4),'-',SUBSTRING(e.fecha,4,2),'-',SUBSTRING(e.fecha,1,2)) END END END`;
const fields = `f.id,f.uuid,f.nombre,COUNT(e.id) AS study_count,MAX(${date}) AS last_date`;
function dto(r: RowDataPacket) {
  return {
    id: String(r.id),
    uuid: String(r.uuid),
    name: String(r.nombre),
    studyCount: Number(r.study_count),
    lastStudyDate: r.last_date
      ? String(r.last_date).split("-").reverse().join("-")
      : null,
  };
}
export class MysqlFamily {
  pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
  async ready() {
    return familySchemaReady(this.pool);
  }
  async list(userId: string) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${fields} FROM familiares f LEFT JOIN estudios e ON e.id_familiar=f.id AND e.id_usuario=f.id_usuario WHERE f.id_usuario=? GROUP BY f.id,f.uuid,f.nombre ORDER BY f.nombre,f.id`,
      [userId],
    );
    return rows.map(dto);
  }
  async detail(userId: string, uuid: string) {
    if (!UUID.test(uuid)) throw new ReadingError();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${fields} FROM familiares f LEFT JOIN estudios e ON e.id_familiar=f.id AND e.id_usuario=f.id_usuario WHERE f.id_usuario=? AND f.uuid=? GROUP BY f.id,f.uuid,f.nombre`,
      [userId, uuid],
    );
    if (!rows[0]) throw new ReadingError();
    return dto(rows[0]);
  }
  async create(
    user: { id: string; email: string },
    input: Record<string, unknown>,
  ) {
    const value = name(input),
      uuid = randomUUID(),
      now = new Date().toISOString().slice(0, 19);
    await this.pool.query<ResultSetHeader>(
      "INSERT INTO familiares(uuid,id_usuario,email_usuario,nombre,created_at,updated_at) VALUES(?,?,?,?,?,?)",
      [uuid, user.id, user.email, value, now, now],
    );
    return this.detail(user.id, uuid);
  }
  async rename(userId: string, uuid: string, input: Record<string, unknown>) {
    const value = name(input);
    await this.detail(userId, uuid);
    const [result] = await this.pool.query<ResultSetHeader>(
      "UPDATE familiares SET nombre=?,updated_at=? WHERE uuid=? AND id_usuario=?",
      [value, new Date().toISOString().slice(0, 19), uuid, userId],
    );
    if (!result.affectedRows) throw new ReadingError();
    return this.detail(userId, uuid);
  }
  async operation(userId: string, operationId: string) {
    if (!UUID.test(operationId)) throw new ReadingError();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT operation_id,status FROM mobile_cleanup_operations WHERE operation_id=? AND id_usuario=?",
      [operationId, userId],
    );
    if (!rows[0]) throw new ReadingError();
    return {
      operationId: String(rows[0].operation_id),
      status: String(rows[0].status),
    };
  }
  async remove(userId: string, uuid: string, input: Record<string, unknown>) {
    if (
      Object.keys(input).some((k) => k !== "confirmation") ||
      input.confirmation !== "misaluteca"
    )
      throw new ReadingError(400, "CONFIRMATION_REQUIRED");
    if (!UUID.test(uuid)) throw new ReadingError();
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [family] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM familiares WHERE uuid=? AND id_usuario=? FOR UPDATE",
        [uuid, userId],
      );
      if (!family[0]) throw new ReadingError();
      const [studies] = await connection.query<RowDataPacket[]>(
        "SELECT id,id_usuario,file_key FROM estudios WHERE id_familiar=? FOR UPDATE",
        [family[0].id],
      );
      if (studies.some((s) => String(s.id_usuario) !== userId))
        throw new ReadingError(409, "INCONSISTENT_FAMILY_OWNERSHIP");
      const ids = studies.map((s) => s.id),
        keys = new Set<string>(
          studies.filter((s) => s.file_key).map((s) => String(s.file_key)),
        );
      if (ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        const [files] = await connection.query<RowDataPacket[]>(
          `SELECT file_key FROM estudios_archivos WHERE id_estudio IN (${placeholders}) FOR UPDATE`,
          ids,
        );
        for (const f of files) keys.add(String(f.file_key));
        const [links] = await connection.query<RowDataPacket[]>(
          "SELECT COLUMN_NAME,COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='links'",
        );
        if (links.length) {
          if (
            !["id_estudio", "id_usuario"].every((k) =>
              links.some(
                (r) =>
                  r.COLUMN_NAME === k &&
                  /^int(?:\([0-9]+\))?$/.test(r.COLUMN_TYPE),
              ),
            )
          )
            throw new ReadingError(409, "INCOMPATIBLE_LINK_SCHEMA");
          const [engine] = await connection.query<RowDataPacket[]>(
            "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='links'",
          );
          if (engine[0]?.ENGINE !== "InnoDB")
            throw new ReadingError(409, "INCOMPATIBLE_LINK_SCHEMA");
          const [foreign] = await connection.query<RowDataPacket[]>(
            `SELECT id_usuario FROM links WHERE id_estudio IN (${placeholders}) FOR UPDATE`,
            ids,
          );
          if (foreign.some((r) => String(r.id_usuario) !== userId))
            throw new ReadingError(409, "INCONSISTENT_LINK_OWNERSHIP");
          await connection.query(
            `DELETE FROM links WHERE id_estudio IN (${placeholders}) AND id_usuario=?`,
            [...ids, userId],
          );
        }
      }
      const operationId = randomUUID(),
        status = keys.size ? "pending" : "complete",
        now = Date.now();
      await connection.query(
        "INSERT INTO mobile_cleanup_operations(operation_id,id_usuario,status,created_at,updated_at) VALUES(?,?,?,?,?)",
        [operationId, userId, status, now, now],
      );
      for (const key of keys)
        await connection.query(
          "INSERT INTO mobile_cleanup_files(operation_id,file_key) VALUES(?,?)",
          [operationId, key],
        );
      if (ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        await connection.query(
          `DELETE FROM estudios_archivos WHERE id_estudio IN (${placeholders})`,
          ids,
        );
        await connection.query(
          `DELETE FROM estudios WHERE id IN (${placeholders}) AND id_usuario=?`,
          [...ids, userId],
        );
      }
      await connection.query(
        "DELETE FROM familiares WHERE id=? AND id_usuario=?",
        [family[0].id, userId],
      );
      await connection.commit();
      return { operationId, status };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
