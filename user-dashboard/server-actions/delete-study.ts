"use server";

import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { unlink } from "fs/promises";
import { join } from "path";

interface DeleteStudyResult {
  success: boolean;
  message: string;
}

export async function deleteStudy(
  studyId: string
): Promise<DeleteStudyResult> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, iniciá sesión nuevamente.",
      };
    }

    // Validación del studyId
    if (!studyId) {
      return {
        success: false,
        message: "ID de estudio no válido.",
      };
    }

    // Convertir studyId a número
    const studyIdNum = parseInt(studyId);
    if (isNaN(studyIdNum)) {
      return {
        success: false,
        message: "ID de estudio no válido.",
      };
    }

    // Verificar que el estudio pertenezca al usuario y obtener el file_key
    const [studyRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, file_key FROM estudios WHERE id = ? AND id_usuario = ?",
      [studyIdNum, session.user.userId]
    );

    if (studyRows.length === 0) {
      return {
        success: false,
        message: "El estudio no existe o no tenés permiso para eliminarlo.",
      };
    }

    const study = studyRows[0];
    const baseUploadDir = (process.env.DIRECTORY_UPLOADS || "/app/uploads").replace("./", "");

    // Obtener archivos de la nueva tabla
    const [fileRows] = await pool.execute<RowDataPacket[]>(
      "SELECT file_key FROM estudios_archivos WHERE id_estudio = ?",
      [studyIdNum]
    );

    // Recopilar todos los file_keys a eliminar (incluyendo el legacy si existe)
    const fileKeysToDelete: string[] = fileRows.map(row => row.file_key);
    if (study.file_key && !fileKeysToDelete.includes(study.file_key)) {
      fileKeysToDelete.push(study.file_key);
    }

    // Eliminar los archivos físicos
    for (const fileKey of fileKeysToDelete) {
      if (!fileKey) continue;
      try {
        const filePath = join(process.cwd(), baseUploadDir, fileKey);
        await unlink(filePath);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.error(`Error al eliminar el archivo físico ${fileKey}:`, fileError);
        }
        // Continuamos aunque falle
      }
    }

    // Eliminar el estudio de la base de datos
    // Los links asociados se eliminarán automáticamente por ON DELETE CASCADE
    await pool.execute<ResultSetHeader>(
      "DELETE FROM estudios WHERE id = ? AND id_usuario = ?",
      [studyIdNum, session.user.userId]
    );

    return {
      success: true,
      message: "Estudio eliminado exitosamente",
    };
  } catch (error) {
    console.error("Error al eliminar estudio:", error);
    return {
      success: false,
      message:
        "Ocurrió un error al eliminar el estudio. Por favor, intentá nuevamente.",
    };
  }
}
