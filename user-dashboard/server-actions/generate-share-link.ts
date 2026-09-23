"use server";

import { pool } from "@/lib/database";
import { dateNowWithMinutes } from "@/config/date";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

interface GenerateShareLinkData {
  studyId: string;
  doctorName?: string;
  vinculo?: string;
}

interface GenerateShareLinkResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    uuid: string;
  };
}

export async function generateShareLink(
  data: GenerateShareLinkData
): Promise<GenerateShareLinkResponse> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, inicia sesión.",
      };
    }

    // Validar que studyId esté presente
    if (!data.studyId) {
      return {
        success: false,
        message: "ID del estudio es requerido.",
      };
    }

    const now = dateNowWithMinutes();
    const nombreMedico = data.doctorName?.trim() || "";
    const vinculo = data.vinculo || "medico";
    const studyId = parseInt(data.studyId, 10);

    // SEGURIDAD: Verificar que el estudio existe y pertenece al usuario
    const [studyRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM estudios WHERE id = ? AND id_usuario = ?",
      [studyId, session.user.userId]
    );

    if (studyRows.length === 0) {
      return {
        success: false,
        message: "El estudio no existe o no tenés permiso para compartirlo.",
      };
    }

    // Generar UUID
    const finalUuid = uuidv4();

    // Insertar el link en la base de datos
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO links (id_usuario, id_estudio, nombre_medico, vinculo, uuid, created_at, fecha_abierto) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [session.user.userId, studyId, nombreMedico, vinculo, finalUuid, now, ""]
    );

    return {
      success: true,
      message: "Link generado exitosamente",
      data: {
        id: result.insertId,
        uuid: finalUuid,
      },
    };
  } catch (error) {
    console.error("Error al generar link de compartir:", error);
    return {
      success: false,
      message: "Error al generar el link. Por favor, intenta nuevamente.",
    };
  }
}
