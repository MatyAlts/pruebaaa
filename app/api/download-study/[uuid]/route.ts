import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/database";
import { RowDataPacket } from "mysql2/promise";
import { readFile } from "fs/promises";
import { join } from "path";
import { isValidFilePath } from "@/lib/security-utils";

interface StudyRow extends RowDataPacket {
  id: number;
  uuid: string;
  id_usuario: number;
  file_key: string;
  file_name: string;
  mime_type: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "No autorizado. Por favor, iniciá sesión." },
        { status: 401 }
      );
    }

    // Obtener el UUID del estudio y el posible fileId
    const { uuid } = await params;
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");

    let query = `SELECT id, uuid, id_usuario, file_key, file_name, mime_type FROM estudios WHERE uuid = ?`;
    let queryParams: any[] = [uuid];

    if (fileId) {
      query = `SELECT e.id_usuario, ea.file_key, ea.file_name, ea.mime_type 
               FROM estudios e 
               JOIN estudios_archivos ea ON e.id = ea.id_estudio 
               WHERE e.uuid = ? AND ea.id = ?`;
      queryParams = [uuid, fileId];
    }

    // Buscar el estudio (y archivo) en la base de datos
    const [rows] = await pool.execute<StudyRow[]>(query, queryParams);

    if (rows.length === 0) {
      // Fallback: Si se pidió con fileId pero no se encontró, probar buscar en estudios por retrocompatibilidad
      if (fileId) {
        const [fallbackRows] = await pool.execute<StudyRow[]>(
          `SELECT id, uuid, id_usuario, file_key, file_name, mime_type FROM estudios WHERE uuid = ? AND file_key IS NOT NULL`,
          [uuid]
        );
        if (fallbackRows.length > 0) {
           rows.push(fallbackRows[0]);
        }
      }
      
      if (rows.length === 0) {
        return NextResponse.json(
          { error: "Archivo o estudio no encontrado." },
          { status: 404 }
        );
      }
    }

    const study = rows[0];
    // Verificar que el estudio pertenece al usuario
    if (study.id_usuario !== parseInt(session.user.userId)) {
      return NextResponse.json(
        { error: "No tenés permiso para acceder a este archivo." },
        { status: 403 }
      );
    }

    // SEGURIDAD: Validar que file_key no contenga path traversal
    if (!isValidFilePath(study.file_key)) {
      console.error(`[SEGURIDAD] Intento de path traversal detectado: ${study.file_key}`);
      return NextResponse.json(
        { error: "Ruta de archivo inválida." },
        { status: 400 }
      );
    }

    // Construir la ruta del archivo
    const baseUploadDir = (process.env.DIRECTORY_UPLOADS || "/app/uploads").replace("./", "");
    const filePath = join(process.cwd(), baseUploadDir, study.file_key);

    // Leer el archivo
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch (error) {
      console.error("Error al leer archivo:", error);
      return NextResponse.json(
        { error: "El archivo no pudo ser encontrado en el servidor." },
        { status: 404 }
      );
    }

    // Crear la respuesta con el archivo
    const response = new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": study.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(study.file_name)}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error("Error en download-study endpoint:", error);
    return NextResponse.json(
      { error: "Error al descargar el archivo. Por favor, intentá nuevamente." },
      { status: 500 }
    );
  }
}
