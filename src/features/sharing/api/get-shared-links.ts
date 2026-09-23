"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { sharingService } from "../services/sharing.service";
import type { ShareLink } from "../types/sharing.types";

export async function getSharedLinks(): Promise<ShareLink[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return [];
    }

    return await sharingService.getSharedLinks(session.user.userId);
  } catch (error) {
    console.error("Error en getSharedLinks action:", error);
    return [];
  }
}
