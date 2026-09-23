"use server";

import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResultSetHeader } from "mysql2/promise";
import moment from "moment";

interface RevokeSharedLinkResponse {
  success: boolean;
  message: string;
}

export async function revokeSharedLink(
  linkId: number,
): Promise<RevokeSharedLinkResponse> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, inicia sesión.",
      };
    }

    // Cambiar fecha_abierto a 1 mes antes para revocar el acceso
    const oneMonthAgo = moment()
      .subtract(1, "month")
      .format("DD-MM-YYYY HH:mm");

    // Actualizar el link solo si pertenece al usuario
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE links 
       SET fecha_abierto = ? 
       WHERE id = ? AND id_usuario = ?`,
      [oneMonthAgo, linkId, session.user.userId],
    );

    // Verificar si se actualizó algún registro
    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "No se encontró el link o no tenés permiso para revocarlo.",
      };
    }

    return {
      success: true,
      message: "Link eliminado exitosamente",
    };
  } catch (error) {
    console.error("Error al revocar link:", error);
    return {
      success: false,
      message: "Error al revocar el link. Por favor, intenta nuevamente.",
    };
  }
}
