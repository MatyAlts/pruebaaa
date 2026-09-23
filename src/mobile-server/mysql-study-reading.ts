import type { Pool, RowDataPacket } from "mysql2/promise";
import type {
  OwnedStudy,
  StudyReadRepository,
  StudyFilters,
} from "./studies.ts";

const DATE_KEY = `CASE WHEN fecha REGEXP '^[0-9]{2}-[0-9]{2}-[1-9][0-9]{3}$' THEN CASE WHEN CAST(SUBSTRING(fecha,4,2) AS UNSIGNED) BETWEEN 1 AND 12 THEN CASE WHEN CAST(SUBSTRING(fecha,1,2) AS UNSIGNED) BETWEEN 1 AND DAY(LAST_DAY(CONCAT(SUBSTRING(fecha,7,4),'-',SUBSTRING(fecha,4,2),'-01'))) THEN CONCAT(SUBSTRING(fecha,7,4),'-',SUBSTRING(fecha,4,2),'-',SUBSTRING(fecha,1,2)) END END END`;
const ownSource = `(SELECT estudios.*,${DATE_KEY} AS date_key FROM estudios WHERE id_usuario=? AND id_familiar IS NULL) owned`;
export function filtered(filters: StudyFilters) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filters.q) {
    where.push(
      "(LOCATE(?,COALESCE(titulo,'')) > 0 OR LOCATE(?,COALESCE(descripcion,'')) > 0)",
    );
    params.push(filters.q, filters.q);
  }
  for (const [key, column] of [
    ["medico", "medico"],
    ["institution", "institucion"],
  ] as const) {
    if (filters[key]) {
      where.push(`${column}=?`);
      params.push(filters[key]);
    }
  }
  if (filters.month) {
    where.push("MONTH(date_key)=?");
    params.push(filters.month);
  }
  if (filters.year) {
    where.push("YEAR(date_key)=?");
    params.push(filters.year);
  }
  return { where, params };
}

export class MysqlStudyReading implements StudyReadRepository {
  private pool: Pool;
  study: (id: string, userId: string) => Promise<OwnedStudy | null>;
  constructor(
    pool: Pool,
    study: (id: string, userId: string) => Promise<OwnedStudy | null>,
  ) {
    this.pool = pool;
    this.study = study;
  }
  async ids(
    userId: string,
    before: string | null,
    limit: number,
    filters: StudyFilters = {},
  ) {
    const criteria = filtered(filters);
    const where = criteria.where;
    const params: (string | number)[] = [userId, ...criteria.params];
    if (before) {
      where.push("id < ?");
      params.push(before);
    }
    params.push(limit);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM ${ownSource} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC LIMIT ?`,
      params,
    );
    return rows.map((row) => String(row.id));
  }
  async datePage(
    userId: string,
    filters: StudyFilters,
    before: { id: string; date: string | null } | null,
    limit: number,
  ) {
    const { where, params } = filtered(filters);
    if (before) {
      if (before.date === null) {
        where.push("date_key IS NULL AND id < ?");
        params.push(before.id);
      } else {
        where.push(
          "(date_key < ? OR date_key IS NULL OR (date_key = ? AND id < ?))",
        );
        params.push(before.date, before.date, before.id);
      }
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id,date_key FROM ${ownSource} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY date_key DESC,id DESC LIMIT ?`,
      [userId, ...params, limit],
    );
    return rows.map((row) => ({
      id: String(row.id),
      date: row.date_key === null ? null : String(row.date_key),
    }));
  }
  async summary(userId: string) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM estudios WHERE id_usuario=? AND id_familiar IS NULL",
      [userId],
    );
    const [medicos] = await this.pool.query<RowDataPacket[]>(
      `SELECT DISTINCT medico AS value FROM ${ownSource} WHERE medico IS NOT NULL AND medico <> '' ORDER BY medico LIMIT 100`,
      [userId],
    );
    const [institutions] = await this.pool.query<RowDataPacket[]>(
      `SELECT DISTINCT institucion AS value FROM ${ownSource} WHERE institucion IS NOT NULL AND institucion <> '' ORDER BY institucion LIMIT 100`,
      [userId],
    );
    const [years] = await this.pool.query<RowDataPacket[]>(
      `SELECT DISTINCT YEAR(date_key) AS value FROM ${ownSource} WHERE date_key IS NOT NULL ORDER BY value DESC LIMIT 100`,
      [userId],
    );
    return {
      propiosTotal: Number(rows[0].total),
      recentIds: (await this.datePage(userId, {}, null, 5)).map((r) => r.id),
      filterOptions: {
        medicos: medicos.map((r) => String(r.value)),
        institutions: institutions.map((r) => String(r.value)),
        years: years.map((r) => Number(r.value)),
      },
    };
  }
}
