"use server";

import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FamilyMember } from "@/types";
import { RowDataPacket } from "mysql2/promise";

interface FamilyMemberRow extends RowDataPacket {
  id: number;
  uuid: string;
  id_usuario: number;
  email_usuario: string;
  nombre: string;
  fecha_nacimiento: string | null;
  created_at: string;
  updated_at: string;
  study_count: number;
  last_study_date: string | null;
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      console.error("No hay sesión activa");
      return [];
    }

    // Consultar los familiares del usuario con la cantidad de estudios y fecha del último estudio
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
      [session.user.userId]
    );

    // Mapear los resultados al tipo FamilyMember
    const familyMembers: FamilyMember[] = rows.map((row) => {
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
        relation: "other", // Por defecto, puedes actualizar esto cuando agregues el campo a la BD
        dateOfBirth: row.fecha_nacimiento || undefined, // Mantener como string DD-MM-YYYY
        age,
        studyCount: row.study_count,
        lastStudyDate: row.last_study_date || undefined, // Mantener como string DD-MM-YYYY
        createdAt: row.created_at, // Mantener como string DD-MM-YYYY
      };
    });

    return familyMembers;
  } catch (error) {
    console.error("Error al obtener familiares:", error);
    return [];
  }
}
