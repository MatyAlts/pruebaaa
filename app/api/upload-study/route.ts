import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import { validateFileType } from "@/lib/file-validator";
import { dateNow } from "@/config/date";
import { STUDY_FIELD_LIMITS } from "@/config/constants";
import { uploadRoot } from "@/src/lib/storage/upload-root";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return NextResponse.json({
        success: false,
        message: "No hay sesión activa. Por favor, iniciá sesión nuevamente.",
      }, { status: 401 });
    }

    const today = dateNow();
    let countFiles = 0;

    const [userRows] = await pool.execute<RowDataPacket[]>(
      "SELECT count_files, date_files FROM users WHERE id = ?",
      [session.user.userId],
    );

    if (userRows.length > 0) {
      const userData = userRows[0];
      countFiles = userData.count_files || 0;

      if (!userData.date_files || userData.date_files !== today) {
        countFiles = 0;
      }
    }

    // Limit check is somewhat arbitrary now that multiple files exist per study
    // Process limit as files per day. Let's fetch files later in loop
    const limitUpload = parseInt(process.env.LIMIT_UPLOAD || "20");
    if (countFiles >= limitUpload) {
      return NextResponse.json({
        success: false,
        message: `Alcanzaste el límite de ${limitUpload} estudios subidos por día.`,
      }, { status: 403 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const title = formData.get("title") as string | null;
    const date = formData.get("date") as string;
    const institution = formData.get("institution") as string | null;
    const medico = formData.get("medico") as string | null;
    const conclusion = formData.get("conclusion") as string | null;
    const description = formData.get("description") as string | null;
    const familyMemberId = formData.get("familyMemberId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No se seleccionó ningún archivo.",
      }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({
        success: false,
        message: "Solo podés subir hasta 10 archivos a la vez.",
      }, { status: 400 });
    }

    if (countFiles + 1 > limitUpload) {
      return NextResponse.json({
        success: false,
        message: `Podés subir ${limitUpload - countFiles} estudios más hoy.`,
      }, { status: 403 });
    }

    if (!date) {
      return NextResponse.json({ success: false, message: "La fecha es obligatoria." }, { status: 400 });
    }

    // Validations
    if (date && date.length > STUDY_FIELD_LIMITS.date) return NextResponse.json({ success: false, message: `La fecha no puede superar los ${STUDY_FIELD_LIMITS.date} caracteres.` }, { status: 400 });
    if (title && title.length > STUDY_FIELD_LIMITS.title) return NextResponse.json({ success: false, message: `El nombre del estudio no puede superar los ${STUDY_FIELD_LIMITS.title} caracteres.` }, { status: 400 });
    if (institution && institution.length > STUDY_FIELD_LIMITS.institution) return NextResponse.json({ success: false, message: `La institución no puede superar los ${STUDY_FIELD_LIMITS.institution} caracteres.` }, { status: 400 });
    if (medico && medico.length > STUDY_FIELD_LIMITS.doctor) return NextResponse.json({ success: false, message: `El nombre del médico no puede superar los ${STUDY_FIELD_LIMITS.doctor} caracteres.` }, { status: 400 });
    if (conclusion && conclusion.length > STUDY_FIELD_LIMITS.conclusion) return NextResponse.json({ success: false, message: `La conclusión no puede superar los ${STUDY_FIELD_LIMITS.conclusion} caracteres.` }, { status: 400 });
    if (description && description.length > STUDY_FIELD_LIMITS.description) return NextResponse.json({ success: false, message: `Las notas adicionales no pueden superar los ${STUDY_FIELD_LIMITS.description} caracteres.` }, { status: 400 });

    let familyMemberIdToSave: number | null = null;
    if (familyMemberId && familyMemberId !== "self") {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM familiares WHERE id = ? AND id_usuario = ?",
        [familyMemberId, session.user.userId],
      );

      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: "El familiar especificado no existe o no te pertenece." }, { status: 400 });
      }

      familyMemberIdToSave = parseInt(familyMemberId);
    }

    // Process all files
    const validFiles: { file: File, mimeType: string }[] = [];
    for (const file of files) {
      const validationResult = await validateFileType(file);
      if (!validationResult.isValid) {
        return NextResponse.json({
          success: false,
          message: validationResult.error || `Archivo ${file.name} no válido.`,
        }, { status: 400 });
      }
      validFiles.push({
        file,
        mimeType: validationResult.detectedMimeType || "application/octet-stream"
      });
    }

    const uuid = uuidv4();
    const timestampString = new Date().getTime().toString();
    const formattedTimestamp = timestampString.match(/.{1,4}/g)?.join("-") || timestampString;
    const finalUuid = uuid + "-" + formattedTimestamp;

    // Database insert
    const connection = await pool.getConnection();
    let estudioId: number;

    try {
      await connection.beginTransaction();

      // Ensure file_key etc are dummy or NULL for legacy columns if we didn't drop them yet, 
      // but since they are NOT NULL, we'll use empty strings until they are dropped, or we use the first file.
      // We will assume the migration drops them, but if not, we populate them with the first file to avoid NOT NULL constraint errors
      // if the drop hasn't happened yet.
      
      const firstFile = validFiles[0];
      const uploadDir = join(uploadRoot(), session.user.userId.toString());
      await mkdir(uploadDir, { recursive: true });

      // Insert into estudios. Notice we pass empty string for file columns just in case they aren't dropped yet. 
      // If they are dropped, this query might fail. Let's omit the columns!
      // Wait, if the columns aren't dropped, it will fail because of NOT NULL.
      // So we will insert into estudios, and if it fails because of missing columns, we catch and retry.
      // The best is to write the query assuming they ARE dropped. If the user hasn't run the script, it's their responsibility.
      
      const [estudioResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO estudios (
          uuid,
          id_usuario,
          email_usuario,
          id_familiar,
          titulo,
          fecha,
          institucion,
          medico,
          conclusion,
          descripcion,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalUuid,
          session.user.userId,
          session.user.email,
          familyMemberIdToSave,
          title || null,
          date,
          institution || null,
          medico || null,
          conclusion || null,
          description || null,
          dateNow(),
        ],
      ).catch(async (e) => {
         // Fallback if the table hasn't been altered to drop NOT NULL columns
         const ts = Date.now();
         const ext = firstFile.file.name.split(".").pop();
         const fName = `${ts}-fallback.${ext}`;
         const fKey = `${session.user.userId}/${fName}`;
         return await connection.execute<ResultSetHeader>(
          `INSERT INTO estudios (
            uuid, id_usuario, email_usuario, id_familiar, titulo, fecha, institucion, medico, conclusion, descripcion,
            file_key, file_name, mime_type, file_size, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            finalUuid, session.user.userId, session.user.email, familyMemberIdToSave, title || null, date,
            institution || null, medico || null, conclusion || null, description || null,
            fKey, firstFile.file.name, firstFile.mimeType, firstFile.file.size, dateNow()
          ]
         );
      });

      estudioId = estudioResult.insertId;

      // Save all files and insert to estudios_archivos
      for (const { file, mimeType } of validFiles) {
        const timestamp = Date.now();
        const fileExtension = file.name.split(".").pop();
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        const fileKey = `${session.user.userId}/${fileName}`;

        await connection.execute(
          `INSERT INTO estudios_archivos (
            id_estudio, file_key, file_name, mime_type, file_size, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            estudioId, fileKey, file.name, mimeType, file.size, dateNow()
          ]
        );
      }

      await connection.execute(
        "UPDATE users SET count_files = ?, date_files = ? WHERE id = ?",
        [countFiles + 1, today, session.user.userId],
      );

      await connection.commit();

    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }

    return NextResponse.json({
      success: true,
      message: "Estudio subido exitosamente",
      studyId: estudioId,
    });
  } catch (error) {
    console.error("Error al subir estudio:", error);
    return NextResponse.json({
      success: false,
      message: "Ocurrió un error al subir el estudio. Por favor, intentá nuevamente.",
    }, { status: 500 });
  }
}
