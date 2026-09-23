"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { studyService } from "../services/study.service";

interface DeleteStudyResult {
  success: boolean;
  message: string;
}

/**
 * Server action para eliminar un estudio
 */
export async function deleteStudy(studyId: string): Promise<DeleteStudyResult> {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, iniciá sesión nuevamente.",
      };
    }

    // 2. Llamar al servicio
    return await studyService.deleteStudy(studyId, session.user.userId);
  } catch (error) {
    console.error("Error en deleteStudy action:", error);
    return {
      success: false,
      message: "Ocurrió un error al eliminar el estudio.",
    };
  }
}
