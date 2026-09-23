import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { SHARE_LINK_EXPIRATION_HOURS } from "@/config/constants";
import { dateNowWithMinutes } from "@/config/date";
import { RowDataPacket } from "mysql2/promise";
import { readFile } from "fs/promises";
import { join } from "path";
import moment from "moment";
import { isValidFilePath } from "@/lib/security-utils";

interface LinkRow extends RowDataPacket {
  id: number;
  id_usuario: number;
  id_estudio: number;
  nombre_medico: string;
  uuid: string;
  created_at: string;
  fecha_abierto: string;
}

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
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    // Obtener el UUID del link compartido
    const { uuid } = await params;

    // Buscar el link en la tabla links
    const [linkRows] = await pool.execute<LinkRow[]>(
      `SELECT id, id_usuario, id_estudio, nombre_medico, uuid, created_at, fecha_abierto 
       FROM links 
       WHERE uuid = ?`,
      [uuid],
    );

    if (linkRows.length === 0) {
      return NextResponse.json(
        { error: "Link no encontrado.", errorType: "notFound" },
        { status: 404 },
      );
    }

    const link = linkRows[0];

    // Verificar si el link tiene fecha_abierto (si no tiene, es el primer acceso)
    if (!link.fecha_abierto) {
      // Actualizar fecha_abierto con la fecha actual
      const currentDate = dateNowWithMinutes();
      await pool.execute(`UPDATE links SET fecha_abierto = ? WHERE uuid = ?`, [
        currentDate,
        uuid,
      ]);
    } else {
      // Verificar si el link expiró
      const fechaAbierto = moment(link.fecha_abierto, "DD-MM-YYYY HH:mm");
      const expirationDate = fechaAbierto
        .clone()
        .add(SHARE_LINK_EXPIRATION_HOURS, "hours");
      const currentDate = moment(dateNowWithMinutes(), "DD-MM-YYYY HH:mm");

      if (currentDate.isAfter(expirationDate)) {
        return NextResponse.json(
          { error: "El link ha sido eliminado.", errorType: "expired" },
          { status: 403 },
        );
      }
    }

    // Obtener el estudio usando id_estudio (y opcionalmente fileId)
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");

    let query = `SELECT id, uuid, id_usuario, file_key, file_name, mime_type 
                 FROM estudios 
                 WHERE id = ?`;
    let queryParams: any[] = [link.id_estudio];

    if (fileId) {
      query = `SELECT e.id_usuario, ea.file_key, ea.file_name, ea.mime_type 
               FROM estudios e 
               JOIN estudios_archivos ea ON e.id = ea.id_estudio 
               WHERE e.id = ? AND ea.id = ?`;
      queryParams = [link.id_estudio, fileId];
    }

    const [studyRows] = await pool.execute<StudyRow[]>(query, queryParams);

    if (studyRows.length === 0) {
      if (fileId) {
        // Fallback backward compatibility
        const [fallbackRows] = await pool.execute<StudyRow[]>(
          `SELECT id, uuid, id_usuario, file_key, file_name, mime_type FROM estudios WHERE id = ? AND file_key IS NOT NULL`,
          [link.id_estudio]
        );
        if (fallbackRows.length > 0) studyRows.push(fallbackRows[0]);
      }
      
      if (studyRows.length === 0) {
        return NextResponse.json(
          { error: "Estudio o archivo no encontrado.", errorType: "notFound" },
          { status: 404 },
        );
      }
    }

    const study = studyRows[0];

    // SEGURIDAD: Validar que file_key no contenga path traversal
    if (!isValidFilePath(study.file_key)) {
      console.error(
        `[SEGURIDAD] Intento de path traversal detectado en link compartido: ${study.file_key}`,
      );
      return NextResponse.json(
        { error: "Ruta de archivo inválida.", errorType: "serverError" },
        { status: 400 },
      );
    }

    // Construir la ruta del archivo
    const baseUploadDir = (
      process.env.DIRECTORY_UPLOADS || "/app/uploads"
    ).replace("./", "");
    const filePath = join(process.cwd(), baseUploadDir, study.file_key);

    // Leer el archivo
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch (error) {
      console.error("Error al leer archivo:", error);
      return NextResponse.json(
        {
          error: "El archivo no pudo ser encontrado en el servidor.",
          errorType: "serverError",
        },
        { status: 404 },
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
    console.error("Error en download-shared-study endpoint:", error);
    return NextResponse.json(
      {
        error: "Error al descargar el archivo. Por favor, intentá nuevamente.",
        errorType: "serverError",
      },
      { status: 500 },
    );
  }
}
