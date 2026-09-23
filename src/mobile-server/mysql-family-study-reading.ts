import type { Pool, RowDataPacket } from "mysql2/promise";
import type {
  StudyReadRepository,
  StudyFilters,
  OwnedStudy,
} from "./studies.ts";
import { MysqlFamily } from "./mysql-family.ts";
import { filtered } from "./mysql-study-reading.ts";
export const CIVIL_DATE = `CASE WHEN fecha REGEXP '^[0-9]{2}-[0-9]{2}-[1-9][0-9]{3}$' THEN CASE WHEN CAST(SUBSTRING(fecha,4,2) AS UNSIGNED) BETWEEN 1 AND 12 THEN CASE WHEN CAST(SUBSTRING(fecha,1,2) AS UNSIGNED) BETWEEN 1 AND DAY(LAST_DAY(CONCAT(SUBSTRING(fecha,7,4),'-',SUBSTRING(fecha,4,2),'-01'))) THEN CONCAT(SUBSTRING(fecha,7,4),'-',SUBSTRING(fecha,4,2),'-',SUBSTRING(fecha,1,2)) END END END`;
export class MysqlFamilyStudyReading implements StudyReadRepository {
  pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
  async family(userId: string, uuid: string) {
    return new MysqlFamily(this.pool).detail(userId, uuid);
  }
  async familyPatient(userId: string, id: string) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT id,nombre FROM familiares WHERE id=? AND id_usuario=?",
      [id, userId],
    );
    return rows[0]
      ? { id: String(rows[0].id), name: String(rows[0].nombre) }
      : null;
  }
  source(filters: StudyFilters) {
    return `(SELECT e.*,${CIVIL_DATE} AS date_key FROM estudios e WHERE e.id_usuario=? AND ${filters.scope === "family" ? "e.id_familiar=? AND EXISTS(SELECT 1 FROM familiares f WHERE f.id=e.id_familiar AND f.id_usuario=e.id_usuario)" : filters.scope === "all" ? "(e.id_familiar IS NULL OR EXISTS(SELECT 1 FROM familiares f WHERE f.id=e.id_familiar AND f.id_usuario=e.id_usuario))" : "e.id_familiar IS NULL"}) owned`;
  }
  params(userId: string, filters: StudyFilters) {
    return filters.scope === "family" ? [userId, filters.familyId!] : [userId];
  }
  async ids(
    userId: string,
    before: string | null,
    limit: number,
    filters: StudyFilters = {},
  ) {
    const { where, params } = filtered(filters);
    if (before) {
      where.push("id<?");
      params.push(before);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM ${this.source(filters)} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC LIMIT ?`,
      [...this.params(userId, filters), ...params, limit],
    );
    return rows.map((r) => String(r.id));
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
        where.push("date_key IS NULL AND id<?");
        params.push(before.id);
      } else {
        where.push("(date_key<? OR date_key IS NULL OR(date_key=? AND id<?))");
        params.push(before.date, before.date, before.id);
      }
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id,date_key FROM ${this.source(filters)} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY date_key DESC,id DESC LIMIT ?`,
      [...this.params(userId, filters), ...params, limit],
    );
    return rows.map((r) => ({
      id: String(r.id),
      date: r.date_key == null ? null : String(r.date_key),
    }));
  }
  async study(id: string, userId: string): Promise<OwnedStudy | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT * FROM estudios WHERE id=? AND id_usuario=?",
      [id, userId],
    );
    const r = rows[0];
    if (!r) return null;
    if (
      r.id_familiar != null &&
      !(await this.familyPatient(userId, String(r.id_familiar)))
    )
      return null;
    const [files] = await this.pool.query<RowDataPacket[]>(
      "SELECT * FROM estudios_archivos WHERE id_estudio=? ORDER BY id",
      [id],
    );
    const map = (f: RowDataPacket) => ({
      id: f.id == null ? undefined : String(f.id),
      fileKey: String(f.file_key),
      fileName: String(f.file_name),
      mimeType: String(f.mime_type),
      size: Number(f.file_size),
    });
    return {
      id: String(r.id),
      uuid: String(r.uuid),
      userId: String(r.id_usuario),
      familyMemberId: r.id_familiar == null ? undefined : String(r.id_familiar),
      title: r.titulo,
      date: String(r.fecha),
      institution: r.institucion,
      medico: r.medico ?? "",
      conclusion: r.conclusion,
      description: r.descripcion,
      createdAt: r.created_at ?? "",
      files: files.length
        ? files.map(map)
        : r.file_key
          ? [map({ ...r, id: undefined } as RowDataPacket)]
          : [],
    };
  }
  async summary(userId: string, filters: StudyFilters = {}) {
    const [counts] = await this.pool.query<RowDataPacket[]>(
      "SELECT SUM(id_familiar IS NULL) AS own_total,SUM(id_familiar IS NOT NULL) AS family_total FROM estudios e WHERE id_usuario=? AND (id_familiar IS NULL OR EXISTS(SELECT 1 FROM familiares f WHERE f.id=e.id_familiar AND f.id_usuario=e.id_usuario))",
      [userId],
    );
    const options = async (column: string) => {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT DISTINCT ${column} AS value FROM ${this.source(filters)} WHERE ${column} IS NOT NULL AND ${column}<>'' ORDER BY value LIMIT 100`,
        this.params(userId, filters),
      );
      return rows;
    };
    return {
      propiosTotal: Number(counts[0].own_total ?? 0),
      familiaresTotal: Number(counts[0].family_total ?? 0),
      recentIds: (await this.datePage(userId, filters, null, 5)).map(
        (r) => r.id,
      ),
      filterOptions: {
        medicos: (await options("medico")).map((r) => String(r.value)),
        institutions: (await options("institucion")).map((r) =>
          String(r.value),
        ),
        years: (await options("YEAR(date_key)"))
          .map((r) => Number(r.value))
          .sort((a, b) => b - a),
      },
    };
  }
}
