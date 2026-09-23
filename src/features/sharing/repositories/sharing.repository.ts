import { pool } from "@/src/lib/database/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { ShareLink } from "../types/sharing.types";

interface ShareLinkRow extends RowDataPacket {
  id: number;
  id_usuario: number;
  id_estudio: number;
  nombre_medico: string;
  uuid: string;
  created_at: string;
  fecha_abierto: string;
  estudio_titulo?: string;
  estudio_fecha?: string;
}

interface CreateShareLinkData {
  userId: string;
  studyId: string;
  doctorName: string;
  uuid: string;
  createdAt: string;
}

/**
 * Repository para el acceso a datos de links compartidos
 */
export class SharingRepository {
  private mapToShareLink(row: ShareLinkRow): ShareLink {
    return {
      id: row.id.toString(),
      userId: row.id_usuario.toString(),
      studyId: row.id_estudio.toString(),
      doctorName: row.nombre_medico,
      uuid: row.uuid,
      createdAt: row.created_at,
      openedAt: row.fecha_abierto || undefined,
      studyTitle: row.estudio_titulo || undefined,
      studyDate: row.estudio_fecha || undefined,
    };
  }

  async findByUserId(userId: string): Promise<ShareLink[]> {
    try {
      const [rows] = await pool.execute<ShareLinkRow[]>(
        `SELECT 
          l.id,
          l.id_usuario,
          l.id_estudio,
          l.nombre_medico,
          l.uuid,
          l.created_at,
          l.fecha_abierto,
          e.titulo as estudio_titulo,
          e.fecha as estudio_fecha
        FROM links l
        INNER JOIN estudios e ON l.id_estudio = e.id
        WHERE l.id_usuario = ?
        ORDER BY l.created_at DESC`,
        [userId]
      );

      return rows.map((row) => this.mapToShareLink(row));
    } catch (error) {
      console.error("Error al obtener links compartidos:", error);
      throw error;
    }
  }

  async create(data: CreateShareLinkData): Promise<number> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO links (id_usuario, id_estudio, nombre_medico, uuid, created_at, fecha_abierto) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.userId, parseInt(data.studyId), data.doctorName, data.uuid, data.createdAt, ""]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error al crear link compartido:", error);
      throw error;
    }
  }

  async delete(linkId: string, userId: string): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM links WHERE id = ? AND id_usuario = ?`,
        [parseInt(linkId), userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar link compartido:", error);
      throw error;
    }
  }
}

export const sharingRepository = new SharingRepository();
