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
}

export async function getFamilyMemberByUuid(
  uuid: string
): Promise<FamilyMember | null> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      console.error("No hay sesión activa");
      return null;
    }

    // Consultar el familiar por UUID y verificar que pertenezca al usuario
    const [rows] = await pool.execute<FamilyMemberRow[]>(
      `SELECT id, uuid, id_usuario, email_usuario, nombre, fecha_nacimiento, created_at, updated_at 
       FROM familiares 
       WHERE uuid = ? AND id_usuario = ?
       LIMIT 1`,
      [uuid, session.user.userId]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    // Calcular edad si existe fecha de nacimiento
    let age: number | undefined;

    if (row.fecha_nacimiento) {
      // Calcular edad sin parsear (usando el string directamente)
      const [day, month, year] = row.fecha_nacimiento.split("-").map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
    }

    // Mapear el resultado al tipo FamilyMember
    const familyMember: FamilyMember = {
      id: row.id.toString(),
      uuid: row.uuid,
      userId: row.id_usuario.toString(),
      name: row.nombre,
      relation: "other", // Por defecto, puedes actualizar esto cuando agregues el campo a la BD
      dateOfBirth: row.fecha_nacimiento || undefined, // Mantener como string DD-MM-YYYY
      age,
      createdAt: row.created_at, // Mantener como string DD-MM-YYYY
    };

    return familyMember;
  } catch (error) {
    console.error("Error al obtener familiar por UUID:", error);
    return null;
  }
}
