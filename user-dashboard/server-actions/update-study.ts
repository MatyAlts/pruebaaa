"use server";

import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { STUDY_FIELD_LIMITS } from "@/config/constants";

interface UpdateStudyParams {
  studyId: string;
  title?: string;
  date: string;
  institution?: string;
  medico: string;
  conclusion?: string;
  description?: string;
  familyMemberId?: string;
}

interface UpdateStudyResult {
  success: boolean;
  message: string;
}

export async function updateStudy(
  params: UpdateStudyParams
): Promise<UpdateStudyResult> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, iniciá sesión nuevamente.",
      };
    }

    const { studyId, title, date, institution, medico, conclusion, description, familyMemberId } = params;

    // Validaciones
    if (!studyId) {
      return {
        success: false,
        message: "ID de estudio no válido.",
      };
    }

    if (!date) {
      return {
        success: false,
        message: "La fecha es obligatoria.",
      };
    }

    // Validaciones de longitud de campos
    if (date && date.length > STUDY_FIELD_LIMITS.date) {
      return {
        success: false,
        message: `La fecha no puede superar los ${STUDY_FIELD_LIMITS.date} caracteres.`,
      };
    }

    if (title && title.length > STUDY_FIELD_LIMITS.title) {
      return {
        success: false,
        message: `El nombre del estudio no puede superar los ${STUDY_FIELD_LIMITS.title} caracteres.`,
      };
    }

    if (institution && institution.length > STUDY_FIELD_LIMITS.institution) {
      return {
        success: false,
        message: `La institución no puede superar los ${STUDY_FIELD_LIMITS.institution} caracteres.`,
      };
    }

    if (medico && medico.length > STUDY_FIELD_LIMITS.doctor) {
      return {
        success: false,
        message: `El nombre del médico no puede superar los ${STUDY_FIELD_LIMITS.doctor} caracteres.`,
      };
    }

    if (conclusion && conclusion.length > STUDY_FIELD_LIMITS.conclusion) {
      return {
        success: false,
        message: `La conclusión no puede superar los ${STUDY_FIELD_LIMITS.conclusion} caracteres.`,
      };
    }

    if (description && description.length > STUDY_FIELD_LIMITS.description) {
      return {
        success: false,
        message: `Las notas no pueden superar los ${STUDY_FIELD_LIMITS.description} caracteres.`,
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

    // Verificar que el estudio pertenezca al usuario
    const [studyRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM estudios WHERE id = ? AND id_usuario = ?",
      [studyIdNum, session.user.userId]
    );

    if (studyRows.length === 0) {
      return {
        success: false,
        message: "El estudio no existe o no tenés permiso para modificarlo.",
      };
    }

    // Verificar si el familiar pertenece al usuario (si se especificó)
    let familyMemberIdToSave: number | null = null;
    if (familyMemberId && familyMemberId !== "self") {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM familiares WHERE id = ? AND id_usuario = ?",
        [familyMemberId, session.user.userId]
      );

      if (rows.length === 0) {
        return {
          success: false,
          message: "El familiar especificado no existe o no te pertenece.",
        };
      }

      familyMemberIdToSave = parseInt(familyMemberId);
    }

    // Actualizar el estudio en la base de datos
    await pool.execute<ResultSetHeader>(
      `UPDATE estudios 
       SET titulo = ?, 
           fecha = ?, 
           institucion = ?,
           medico = ?,
           conclusion = ?,
           descripcion = ?, 
           id_familiar = ?,
           updated_at = NOW()
       WHERE id = ? AND id_usuario = ?`,
      [
        title || null,
        date,
        institution || null,
        medico || null,
        conclusion || null,
        description || null,
        familyMemberIdToSave,
        studyIdNum,
        session.user.userId,
      ]
    );

    return {
      success: true,
      message: "Estudio actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error al actualizar estudio:", error);
    return {
      success: false,
      message:
        "Ocurrió un error al actualizar el estudio. Por favor, intentá nuevamente.",
    };
  }
}
