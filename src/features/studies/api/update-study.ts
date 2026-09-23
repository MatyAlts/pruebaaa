"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { studyService } from "../services/study.service";

interface UpdateStudyResult {
  success: boolean;
  message: string;
}

/**
 * Server action para actualizar un estudio
 */
export async function updateStudy(
  studyId: string,
  formData: FormData
): Promise<UpdateStudyResult> {
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
    const title = formData.get("title") as string | null;
    const date = formData.get("date") as string;
    const institution = formData.get("institution") as string | null;
    const conclusion = formData.get("conclusion") as string | null;
    const description = formData.get("description") as string | null;

    // 3. Llamar al servicio
    return await studyService.updateStudy(studyId, session.user.userId, {
      title,
      date,
      institution,
      conclusion,
      description,
    });
  } catch (error) {
    console.error("Error en updateStudy action:", error);
    return {
      success: false,
      message: "Ocurrió un error al actualizar el estudio.",
    };
  }
}
