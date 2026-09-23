"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { familyService } from "../services/family.service";
import type { FamilyMemberResult } from "../types/family.types";

export async function addFamilyMember(formData: FormData): Promise<FamilyMemberResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId || !session.user.email) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, inicia sesión.",
      };
    }

    const name = formData.get("name") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string | undefined;

    return await familyService.createFamilyMember({
      name,
      dateOfBirth,
      userId: session.user.userId,
      userEmail: session.user.email,
    });
  } catch (error) {
    console.error("Error en addFamilyMember action:", error);
    return {
      success: false,
      message: "Error al agregar el familiar. Por favor, intenta nuevamente.",
    };
  }
}
