import { pool } from "@/src/lib/database/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { Study, StudyFile } from "../types/study.types";

interface StudyRow extends RowDataPacket {
  id: number;
  uuid: string;
  id_usuario: number;
  email_usuario: string;
  id_familiar: number | null;
  titulo: string | null;
  fecha: string;
  institucion: string | null;
  medico: string | null;
  conclusion: string | null;
  descripcion: string | null;
  file_key?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

interface CreateStudyData {
  uuid: string;
  userId: string;
  userEmail: string;
  familyMemberId: string | null;
  title: string | null;
  date: string;
  institution: string | null;
  medico: string | null;
  conclusion: string | null;
  description: string | null;
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface UpdateStudyData {
  title?: string | null;
  date?: string;
  institution?: string | null;
  medico?: string | null;
  conclusion?: string | null;
  description?: string | null;
}

const BASE_QUERY = `
  SELECT e.id, e.uuid, e.id_usuario, e.email_usuario, e.id_familiar, e.titulo, e.fecha, 
         e.institucion, e.medico, e.conclusion, e.descripcion, e.created_at, e.updated_at,
         e.file_key, e.file_name, e.mime_type, e.file_size
  FROM estudios e
`;

/**
 * Repository para el acceso a datos de estudios
 * Responsabilidad: queries SQL y mapeo de datos
 */
export class StudyRepository {
  /**
   * Convierte una fila de DB a entidad Study
   */
  private mapToStudy(row: StudyRow, fileRows: any[]): Study {
    let files: StudyFile[] = fileRows
      .filter((f) => f.id_estudio === row.id)
      .map((f) => ({
        id: f.id.toString(),
        fileKey: f.file_key,
        fileName: f.file_name,
        mimeType: f.mime_type,
        size: f.file_size,
      }));
    
    if (files.length === 0 && row.file_key) {
      files = [{ 
        fileKey: row.file_key, 
        fileName: row.file_name || "", 
        mimeType: row.mime_type || "", 
        size: row.file_size || 0 
      }];
    }
    
    files = files.filter(f => f && f.fileKey);

    return {
      id: row.id.toString(),
      uuid: row.uuid,
      userId: row.id_usuario.toString(),
      familyMemberId: row.id_familiar ? row.id_familiar.toString() : undefined,
      title: row.titulo || undefined,
      date: row.fecha, // Mantener como string DD-MM-YYYY
      institution: row.institucion || undefined,
      medico: row.medico || "",
      conclusion: row.conclusion || undefined,
      description: row.descripcion || undefined,
      files,
      createdAt: row.created_at, // Mantener como string DD-MM-YYYY
    };
  }

  private async fetchStudiesWithFiles(query: string, params: any[]): Promise<Study[]> {
    const [rows] = await pool.execute<StudyRow[]>(query, params);

    if (rows.length === 0) return [];

    const studyIds = rows.map((r) => r.id);
    const placeholders = studyIds.map(() => '?').join(',');

    const [fileRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, id_estudio, file_key, file_name, mime_type, file_size 
       FROM estudios_archivos 
       WHERE id_estudio IN (${placeholders})`,
      studyIds
    );

    return rows.map((r) => this.mapToStudy(r, fileRows));
  }

  /**
   * Obtiene todos los estudios de un usuario
   */
  async findByUserId(userId: string): Promise<Study[]> {
    try {
      return await this.fetchStudiesWithFiles(
        `${BASE_QUERY} WHERE e.id_usuario = ? ORDER BY e.fecha DESC, e.created_at DESC`,
        [userId]
      );
    } catch (error) {
      console.error("Error al obtener estudios por usuario:", error);
      throw error;
    }
  }

  /**
   * Obtiene un estudio específico por ID
   */
  async findById(studyId: string, userId: string): Promise<Study | null> {
    try {
      const studies = await this.fetchStudiesWithFiles(
        `${BASE_QUERY} WHERE e.id = ? AND e.id_usuario = ?`,
        [parseInt(studyId), userId]
      );

      return studies.length > 0 ? studies[0] : null;
    } catch (error) {
      console.error("Error al obtener estudio por ID:", error);
      throw error;
    }
  }

  /**
   * Obtiene un estudio por UUID (para compartir)
   */
  async findByUuid(uuid: string): Promise<Study | null> {
    try {
      const studies = await this.fetchStudiesWithFiles(
        `${BASE_QUERY} WHERE e.uuid = ?`,
        [uuid]
      );

      return studies.length > 0 ? studies[0] : null;
    } catch (error) {
      console.error("Error al obtener estudio por UUID:", error);
      throw error;
    }
  }

  /**
   * Obtiene estudios de un familiar específico
   */
  async findByFamilyMember(userId: string, familyMemberId: string): Promise<Study[]> {
    try {
      return await this.fetchStudiesWithFiles(
        `${BASE_QUERY} WHERE e.id_usuario = ? AND e.id_familiar = ? ORDER BY e.fecha DESC, e.created_at DESC`,
        [userId, parseInt(familyMemberId)]
      );
    } catch (error) {
      console.error("Error al obtener estudios del familiar:", error);
      throw error;
    }
  }

  /**
   * Cuenta estudios de un familiar
   */
  async countByFamilyMember(userId: string, familyMemberId: string): Promise<number> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count 
         FROM estudios e
         WHERE e.id_usuario = ? AND e.id_familiar = ?`,
        [userId, parseInt(familyMemberId)]
      );

      return rows[0]?.count || 0;
    } catch (error) {
      console.error("Error al contar estudios del familiar:", error);
      throw error;
    }
  }

  /**
   * Obtiene la fecha del último estudio de un familiar
   */
  async getLastStudyDate(userId: string, familyMemberId: string): Promise<string | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT fecha 
         FROM estudios e
         WHERE e.id_usuario = ? AND e.id_familiar = ? 
         ORDER BY e.fecha DESC, e.created_at DESC 
         LIMIT 1`,
        [userId, parseInt(familyMemberId)]
      );

      if (rows.length > 0 && rows[0].fecha) {
        return rows[0].fecha; // Retornar como string DD-MM-YYYY
      }

      return null;
    } catch (error) {
      console.error("Error al obtener última fecha de estudio:", error);
      throw error;
    }
  }

  /**
   * Crea un nuevo estudio (metadata only)
   */
  async create(data: CreateStudyData): Promise<number> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO estudios (
          uuid,
          id_usuario,
          email_usuario,
          id_familiar,
          titulo,
          fecha,
          institucion,
          medico,
          conclusion,
          descripcion,
          file_key,
          file_name,
          mime_type,
          file_size,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.uuid,
          data.userId,
          data.userEmail,
          data.familyMemberId ? parseInt(data.familyMemberId) : null,
          data.title,
          data.date,
          data.institution,
          data.medico,
          data.conclusion,
          data.description,
          data.fileKey,
          data.fileName,
          data.mimeType,
          data.fileSize,
          data.createdAt,
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error al crear estudio:", error);
      throw error;
    }
  }

  /**
   * Actualiza un estudio
   */
  async update(studyId: string, userId: string, data: UpdateStudyData): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.title !== undefined) {
        updates.push("titulo = ?");
        values.push(data.title);
      }
      if (data.date !== undefined) {
        updates.push("fecha = ?");
        values.push(data.date);
      }
      if (data.institution !== undefined) {
        updates.push("institucion = ?");
        values.push(data.institution);
      }
      if (data.medico !== undefined) {
        updates.push("medico = ?");
        values.push(data.medico);
      }
      if (data.conclusion !== undefined) {
        updates.push("conclusion = ?");
        values.push(data.conclusion);
      }
      if (data.description !== undefined) {
        updates.push("descripcion = ?");
        values.push(data.description);
      }

      if (updates.length === 0) {
        return false;
      }

      values.push(parseInt(studyId), userId);

      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE estudios SET ${updates.join(", ")} WHERE id = ? AND id_usuario = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar estudio:", error);
      throw error;
    }
  }

  /**
   * Elimina un estudio
   */
  async delete(studyId: string, userId: string): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM estudios WHERE id = ? AND id_usuario = ?`,
        [parseInt(studyId), userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar estudio:", error);
      throw error;
    }
  }

  /**
   * Verifica si un familiar pertenece a un usuario
   */
  async verifyFamilyMemberOwnership(userId: string, familyMemberId: string): Promise<boolean> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM familiares WHERE id = ? AND id_usuario = ?",
        [parseInt(familyMemberId), userId]
      );

      return rows.length > 0;
    } catch (error) {
      console.error("Error al verificar familiar:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const studyRepository = new StudyRepository();
