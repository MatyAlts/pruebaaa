"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { sharingService } from "../services/sharing.service";
import type { GenerateShareLinkResult } from "../types/sharing.types";

interface GenerateShareLinkData {
  studyId: string;
  doctorName?: string;
}

export async function generateShareLink(data: GenerateShareLinkData): Promise<GenerateShareLinkResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, inicia sesión.",
      };
    }

    return await sharingService.generateShareLink({
      studyId: data.studyId,
      doctorName: data.doctorName,
      userId: session.user.userId,
    });
  } catch (error) {
    console.error("Error en generateShareLink action:", error);
    return {
      success: false,
      message: "Error al generar el link. Por favor, intenta nuevamente.",
    };
  }
}
