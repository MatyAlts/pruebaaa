"use server";

import { pool } from "@/lib/database";
import { dateNowWithMinutes } from "@/config/date";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResultSetHeader } from "mysql2/promise";
import { MAX_FAMILY_MEMBER_NAME_LENGTH } from "@/config/constants";

interface EditFamilyMemberData {
  uuid: string;
  name: string;
}

interface EditFamilyMemberResponse {
  success: boolean;
  message: string;
}

export async function editFamilyMember(
  data: EditFamilyMemberData
): Promise<EditFamilyMemberResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, inicia sesión.",
      };
    }

    if (!data.uuid) {
      return {
        success: false,
        message: "ID del familiar no válido.",
      };
    }

    if (!data.name || data.name.trim() === "") {
      return {
        success: false,
        message: "El nombre es obligatorio.",
      };
    }

    if (data.name.length > MAX_FAMILY_MEMBER_NAME_LENGTH) {
      return {
        success: false,
        message: `El nombre no puede superar los ${MAX_FAMILY_MEMBER_NAME_LENGTH} caracteres.`,
      };
    }

    const now = dateNowWithMinutes();

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE familiares 
       SET nombre = ?, updated_at = ? 
       WHERE uuid = ? AND id_usuario = ?`,
      [data.name.trim(), now, data.uuid, session.user.userId]
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "El familiar no existe o no tienes permiso para editarlo.",
      };
    }

    return {
      success: true,
      message: "Familiar actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error al actualizar familiar:", error);
    return {
      success: false,
      message: "Error al actualizar el familiar. Por favor, intenta nuevamente.",
    };
  }
}
