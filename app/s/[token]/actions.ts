"use server";

import { pool } from "@/lib/database";
import { Study } from "@/types";
import { ErrorType } from "@/user-dashboard/study/SharedStudyErrorState";
import { dateNowWithMinutes } from "@/config/date";
import { SHARE_LINK_EXPIRATION_HOURS } from "@/config/constants";
import { RowDataPacket } from "mysql2";
import moment from "moment";

interface StudyResult {
  study: Study | null;
  error?: ErrorType;
}

export async function getSharedStudy(uuid: string): Promise<StudyResult> {
  try {
    const connection = await pool.getConnection();

    try {
      // Buscar el link por UUID en la tabla links
      const [linkRows] = await connection.query<RowDataPacket[]>(
        `SELECT 
          id,
          id_usuario,
          id_estudio,
          nombre_medico,
          uuid,
          created_at,
          fecha_abierto
        FROM links 
        WHERE uuid = ?
        LIMIT 1`,
        [uuid]
      );

      if (!linkRows || linkRows.length === 0) {
        return {
          study: null,
          error: "notFound",
        };
      }

      const linkData = linkRows[0];

      // Verificar si fecha_abierto existe y validar expiración
      if (linkData.fecha_abierto) {
        // Parsear la fecha abierto y sumarle las horas de expiración
        const fechaAbierto = moment(linkData.fecha_abierto, "DD-MM-YYYY HH:mm");
        const expirationDate = fechaAbierto.clone().add(SHARE_LINK_EXPIRATION_HOURS, "hours");

        // Obtener la fecha actual
        const currentDate = moment(dateNowWithMinutes(), "DD-MM-YYYY HH:mm");

        // Si la fecha de expiración es menor que la fecha actual, el link expiró
        if (currentDate.isAfter(expirationDate)) {
          return {
            study: null,
            error: "expired",
          };
        }
      } else {
        // Si fecha_abierto está vacío, es el primer acceso, actualizar con la fecha actual
        const currentDate = dateNowWithMinutes();
        await connection.query(
          `UPDATE links 
          SET fecha_abierto = ? 
          WHERE uuid = ?`,
          [currentDate, uuid]
        );
      }

      // Obtener los datos del estudio usando id_estudio
      const [studyRows] = await connection.query<RowDataPacket[]>(
        `SELECT e.id, e.uuid, e.id_usuario, e.email_usuario, e.id_familiar, e.titulo, e.fecha, 
                e.institucion, e.conclusion, e.descripcion, e.created_at,
                e.file_key, e.file_name, e.mime_type, e.file_size
        FROM estudios e
        WHERE e.id = ?
        LIMIT 1`,
        [linkData.id_estudio]
      );

      if (!studyRows || studyRows.length === 0) {
        return {
          study: null,
          error: "notFound",
        };
      }

      const studyData = studyRows[0];

      // Fetch files array manually
      const [fileRows] = await connection.query<RowDataPacket[]>(
        `SELECT id, file_key, file_name, mime_type, file_size 
         FROM estudios_archivos 
         WHERE id_estudio = ?`,
        [studyData.id]
      );

      let files: any[] = fileRows.map((f) => ({
        id: f.id.toString(),
        fileKey: f.file_key,
        fileName: f.file_name,
        mimeType: f.mime_type,
        size: f.file_size
      }));
      
      if (files.length === 0 && studyData.file_key) {
        files = [{ 
          fileKey: studyData.file_key, 
          fileName: studyData.file_name || "", 
          mimeType: studyData.mime_type || "", 
          size: studyData.file_size || 0 
        }];
      }
      
      files = files.filter(f => f && f.fileKey);

      // Construir el objeto Study
      const study: Study = {
        id: studyData.id.toString(),
        uuid: studyData.uuid,
        userId: studyData.id_usuario.toString(),
        familyMemberId: studyData.id_familiar ? studyData.id_familiar.toString() : undefined,
        title: studyData.titulo || undefined,
        date: studyData.fecha, // Mantener como string DD-MM-YYYY
        institution: studyData.institucion || undefined,
        medico: linkData.nombre_medico,
        conclusion: studyData.conclusion || undefined,
        description: studyData.descripcion || undefined,
        files,
        createdAt: studyData.created_at, // Mantener como string DD-MM-YYYY
      };

      return {
        study,
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching shared study:", error);
    return {
      study: null,
      error: "serverError",
    };
  }
}
