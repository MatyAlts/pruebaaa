import { pool } from "@/src/lib/database/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { FamilyMember } from "../types/family.types";

interface FamilyMemberRow extends RowDataPacket {
  id: number;
  uuid: string;
  id_usuario: number;
  email_usuario: string;
  nombre: string;
  fecha_nacimiento: string | null;
  created_at: string;
  updated_at: string;
  study_count?: number;
  last_study_date?: string | null;
}

interface CreateFamilyMemberData {
  uuid: string;
  userId: string;
  userEmail: string;
  name: string;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Repository para el acceso a datos de familiares
 */
export class FamilyRepository {
  private mapToFamilyMember(row: FamilyMemberRow): FamilyMember {
    let age: number | undefined;

    if (row.fecha_nacimiento) {
      // Calcular edad sin parsear (usando el string directamente)
      const [day, month, year] = row.fecha_nacimiento.split("-").map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      id: row.id.toString(),
      uuid: row.uuid,
      userId: row.id_usuario.toString(),
      name: row.nombre,
      relation: "other", // Por defecto
      dateOfBirth: row.fecha_nacimiento || undefined, // Mantener como string DD-MM-YYYY
      age,
      studyCount: row.study_count,
      lastStudyDate: row.last_study_date || undefined, // Mantener como string DD-MM-YYYY
      createdAt: row.created_at, // Mantener como string DD-MM-YYYY
    };
  }

  async findByUserId(userId: string): Promise<FamilyMember[]> {
    try {
      const [rows] = await pool.execute<FamilyMemberRow[]>(
        `SELECT 
          f.id, 
          f.uuid, 
          f.id_usuario, 
          f.email_usuario, 
          f.nombre, 
          f.fecha_nacimiento, 
          f.created_at, 
          f.updated_at,
          COUNT(e.id) as study_count,
          MAX(e.fecha) as last_study_date
         FROM familiares f
         LEFT JOIN estudios e ON e.id_familiar = f.id
         WHERE f.id_usuario = ? 
         GROUP BY f.id, f.uuid, f.id_usuario, f.email_usuario, f.nombre, f.fecha_nacimiento, f.created_at, f.updated_at
         ORDER BY f.nombre ASC`,
        [userId]
      );

      return rows.map((row) => this.mapToFamilyMember(row));
    } catch (error) {
      console.error("Error al obtener familiares:", error);
      throw error;
    }
  }

  async findById(familyMemberId: string, userId: string): Promise<FamilyMember | null> {
    try {
      const [rows] = await pool.execute<FamilyMemberRow[]>(
        `SELECT 
          f.id, 
          f.uuid, 
          f.id_usuario, 
          f.email_usuario, 
          f.nombre, 
          f.fecha_nacimiento, 
          f.created_at, 
          f.updated_at,
          COUNT(e.id) as study_count,
          MAX(e.fecha) as last_study_date
         FROM familiares f
         LEFT JOIN estudios e ON e.id_familiar = f.id
         WHERE f.id = ? AND f.id_usuario = ?
         GROUP BY f.id, f.uuid, f.id_usuario, f.email_usuario, f.nombre, f.fecha_nacimiento, f.created_at, f.updated_at`,
        [parseInt(familyMemberId), userId]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapToFamilyMember(rows[0]);
    } catch (error) {
      console.error("Error al obtener familiar por ID:", error);
      throw error;
    }
  }

  async findByUuid(uuid: string): Promise<FamilyMember | null> {
    try {
      const [rows] = await pool.execute<FamilyMemberRow[]>(
        `SELECT 
          f.id, 
          f.uuid, 
          f.id_usuario, 
          f.email_usuario, 
          f.nombre, 
          f.fecha_nacimiento, 
          f.created_at, 
          f.updated_at,
          0 as study_count,
          NULL as last_study_date
         FROM familiares f
         WHERE f.uuid = ?`,
        [uuid]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapToFamilyMember(rows[0]);
    } catch (error) {
      console.error("Error al obtener familiar por UUID:", error);
      throw error;
    }
  }

  async create(data: CreateFamilyMemberData): Promise<number> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO familiares (uuid, id_usuario, email_usuario, nombre, fecha_nacimiento, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.uuid, data.userId, data.userEmail, data.name, data.dateOfBirth, data.createdAt, data.updatedAt]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error al crear familiar:", error);
      throw error;
    }
  }

  async delete(familyMemberId: string, userId: string): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM familiares WHERE id = ? AND id_usuario = ?`,
        [parseInt(familyMemberId), userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar familiar:", error);
      throw error;
    }
  }
}

export const familyRepository = new FamilyRepository();
