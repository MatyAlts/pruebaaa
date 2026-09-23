"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { familyService } from "../services/family.service";
import type { FamilyMember } from "../types/family.types";

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return [];
    }

    return await familyService.getFamilyMembers(session.user.userId);
  } catch (error) {
    console.error("Error en getFamilyMembers action:", error);
    return [];
  }
}

export async function getFamilyMemberById(familyMemberId: string): Promise<FamilyMember | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.userId) {
      return null;
    }

    return await familyService.getFamilyMemberById(familyMemberId, session.user.userId);
  } catch (error) {
    console.error("Error en getFamilyMemberById action:", error);
    return null;
  }
}

export async function getFamilyMemberByUuid(uuid: string): Promise<FamilyMember | null> {
  try {
    return await familyService.getFamilyMemberByUuid(uuid);
  } catch (error) {
    console.error("Error en getFamilyMemberByUuid action:", error);
    return null;
  }
}
