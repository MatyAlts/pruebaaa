"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { studyService } from "../services/study.service";
import type { UploadStudyResult } from "../types/study.types";

/**
 * Server action para subir un estudio
 */
export async function uploadStudy(formData: FormData): Promise<UploadStudyResult> {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, iniciá sesión nuevamente.",
      };
    }

    // 2. Extraer datos del FormData
    const file = formData.get("file") as File;
    const title = formData.get("title") as string | null;
    const date = formData.get("date") as string;
    const institution = formData.get("institution") as string | null;
    const medico = formData.get("medico") as string | null;
    const conclusion = formData.get("conclusion") as string | null;
    const description = formData.get("description") as string | null;
    const familyMemberId = formData.get("familyMemberId") as string | null;

    // 3. Validaciones básicas
    if (!file) {
      return {
        success: false,
        message: "No se seleccionó ningún archivo.",
      };
    }

    if (!date) {
      return {
        success: false,
        message: "La fecha es obligatoria.",
      };
    }

    // 4. Llamar al servicio
    return await studyService.uploadStudy({
      file,
      title,
      date,
      institution,
      medico,
      conclusion,
      description,
      familyMemberId,
      userId: session.user.userId,
      userEmail: session.user.email || "",
    });
  } catch (error) {
    console.error("Error en uploadStudy action:", error);
    return {
      success: false,
      message: "Ocurrió un error al subir el estudio. Por favor, intentá nuevamente.",
    };
  }
}
