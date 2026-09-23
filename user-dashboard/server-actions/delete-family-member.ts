"use server";

import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { unlink } from "fs/promises";
import { join } from "path";

interface DeleteFamilyMemberResult {
  success: boolean;
  message: string;
}

export async function deleteFamilyMember(
  uuid: string
): Promise<DeleteFamilyMemberResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, iniciá sesión nuevamente.",
      };
    }

    if (!uuid) {
      return {
        success: false,
        message: "ID del familiar no válido.",
      };
    }

    // Obtener ID numérico del familiar (asumiendo que estudios usa id_familiar numérico)
    const [familiarRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM familiares WHERE uuid = ? AND id_usuario = ?",
      [uuid, session.user.userId]
    );

    if (familiarRows.length === 0) {
      return {
        success: false,
        message: "El familiar no existe o no tenés permiso para eliminarlo.",
      };
    }

    const familiarId = familiarRows[0].id;

    // Buscar estudios asociados para eliminar sus archivos físicos
    const [estudiosRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, file_key FROM estudios WHERE id_familiar = ? AND id_usuario = ?",
      [familiarId, session.user.userId]
    );

    const baseUploadDir = (process.env.DIRECTORY_UPLOADS || "/app/uploads").replace("./", "");
    const fileKeysToDelete: string[] = [];

    for (const estudio of estudiosRows) {
      if (estudio.file_key) {
        fileKeysToDelete.push(estudio.file_key);
      }
      // Buscar archivos en estudios_archivos
      const [archivosRows] = await pool.execute<RowDataPacket[]>(
        "SELECT file_key FROM estudios_archivos WHERE id_estudio = ?",
        [estudio.id]
      );
      archivosRows.forEach(row => {
        if (row.file_key && !fileKeysToDelete.includes(row.file_key)) {
          fileKeysToDelete.push(row.file_key);
        }
      });
    }

    // Eliminar archivos físicos
    for (const fileKey of fileKeysToDelete) {
      if (!fileKey) continue;
      try {
        const filePath = join(process.cwd(), baseUploadDir, fileKey);
        await unlink(filePath);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.error(`Error al eliminar el archivo físico ${fileKey}:`, fileError);
        }
      }
    }

    // Eliminar estudios explícitamente
    await pool.execute<ResultSetHeader>(
      "DELETE FROM estudios WHERE id_familiar = ? AND id_usuario = ?",
      [familiarId, session.user.userId]
    );

    // Luego eliminar el familiar
    await pool.execute<ResultSetHeader>(
      "DELETE FROM familiares WHERE id = ? AND id_usuario = ?",
      [familiarId, session.user.userId]
    );

    return {
      success: true,
      message: "Familiar y sus estudios eliminados exitosamente.",
    };
  } catch (error) {
    console.error("Error al eliminar familiar:", error);
    return {
      success: false,
      message: "Ocurrió un error al eliminar el familiar. Por favor, intentá nuevamente.",
    };
  }
}
