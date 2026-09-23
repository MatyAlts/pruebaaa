"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { sharingService } from "../services/sharing.service";
import type { RevokeShareLinkResult } from "../types/sharing.types";

export async function revokeShareLink(linkId: string): Promise<RevokeShareLinkResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, inicia sesión.",
      };
    }

    return await sharingService.revokeShareLink(linkId, session.user.userId);
  } catch (error) {
    console.error("Error en revokeShareLink action:", error);
    return {
      success: false,
      message: "Error al revocar el link.",
    };
  }
}
