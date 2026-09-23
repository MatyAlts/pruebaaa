"use server";

import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { unlink } from "fs/promises";
import { join } from "path";

interface DeleteAccountResult {
  success: boolean;
  message: string;
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, iniciá sesión nuevamente.",
      };
    }

    const userId = parseInt(session.user.userId);
    if (isNaN(userId)) {
      return {
        success: false,
        message: "ID de usuario no válido.",
      };
    }

    // Obtener todos los archivos asociados a los estudios del usuario para eliminarlos físicamente
    const [studyRows] = await pool.execute<RowDataPacket[]>(
      "SELECT file_key FROM estudios WHERE id_usuario = ?",
      [userId]
    );

    const [fileRows] = await pool.execute<RowDataPacket[]>(
      "SELECT ea.file_key FROM estudios_archivos ea JOIN estudios e ON ea.id_estudio = e.id WHERE e.id_usuario = ?",
      [userId]
    );

    const fileKeys = new Set([
      ...studyRows.map((row) => row.file_key as string),
      ...fileRows.map((row) => row.file_key as string)
    ].filter(Boolean));

    // Iniciar transacción para asegurar que todo se elimine correctamente
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Eliminar todos los enlaces compartidos (links)
      // Esto debería hacerse automáticamente con CASCADE si está configurado
      // pero lo hacemos manualmente para estar seguros
      await connection.execute<ResultSetHeader>(
        "DELETE FROM links WHERE id_estudio IN (SELECT id FROM estudios WHERE id_usuario = ?)",
        [userId]
      );

      // 2. Eliminar todos los estudios del usuario
      await connection.execute<ResultSetHeader>(
        "DELETE FROM estudios WHERE id_usuario = ?",
        [userId]
      );

      // 3. Eliminar todos los familiares del usuario
      await connection.execute<ResultSetHeader>(
        "DELETE FROM familiares WHERE id_usuario = ?",
        [userId]
      );

      // 4. Eliminar el usuario
      await connection.execute<ResultSetHeader>(
        "DELETE FROM users WHERE id = ? LIMIT 1",
        [userId]
      );

      // Si todo salió bien, hacer commit
      await connection.commit();
    } catch (error) {
      // Si algo falla, hacer rollback
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // Eliminar los archivos físicos del sistema de archivos
    // Esto se hace después del commit para asegurar que la BD esté consistente
    const baseUploadDir = (process.env.DIRECTORY_UPLOADS || "/app/uploads").replace("./", "");
    
    for (const fileKey of fileKeys) {
      try {
        const filePath = join(process.cwd(), baseUploadDir, fileKey);
        await unlink(filePath);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.error(`Error al eliminar el archivo físico ${fileKey}:`, fileError);
        }
        // Continuamos aunque falle la eliminación de algún archivo físico
      }
    }

    return {
      success: true,
      message: "Tu cuenta y todos tus datos han sido eliminados exitosamente",
    };
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return {
      success: false,
      message:
        "Ocurrió un error al eliminar tu cuenta. Por favor, intentá nuevamente o contactá con soporte.",
    };
  }
}
