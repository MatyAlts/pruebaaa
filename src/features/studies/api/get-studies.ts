"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { studyService } from "../services/study.service";
import type { Study, StudyStats } from "../types/study.types";

/**
 * Obtiene todos los estudios del usuario actual
 */
export async function getStudies(): Promise<Study[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return [];
    }

    return await studyService.getStudiesByUser(session.user.userId);
  } catch (error) {
    console.error("Error en getStudies action:", error);
    return [];
  }
}

/**
 * Obtiene estudios recientes (últimos 6)
 */
export async function getRecentStudies(): Promise<Study[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return [];
    }

    return await studyService.getRecentStudies(session.user.userId);
  } catch (error) {
    console.error("Error en getRecentStudies action:", error);
    return [];
  }
}

/**
 * Obtiene las estadísticas del dashboard
 */
export async function getStudiesStats(): Promise<StudyStats> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return {
        total: 0,
        myStudies: 0,
        familyStudies: 0,
      };
    }

    return await studyService.getStudiesStats(session.user.userId);
  } catch (error) {
    console.error("Error en getStudiesStats action:", error);
    return {
      total: 0,
      myStudies: 0,
      familyStudies: 0,
    };
  }
}

/**
 * Obtiene un estudio específico por su ID
 */
export async function getStudyById(studyId: string): Promise<Study | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return null;
    }

    return await studyService.getStudyById(studyId, session.user.userId);
  } catch (error) {
    console.error("Error en getStudyById action:", error);
    return null;
  }
}

/**
 * Obtiene un estudio por UUID (para compartir, sin auth)
 */
export async function getStudyByUuid(uuid: string): Promise<Study | null> {
  try {
    return await studyService.getStudyByUuid(uuid);
  } catch (error) {
    console.error("Error en getStudyByUuid action:", error);
    return null;
  }
}

/**
 * Obtiene los estudios de un familiar específico por su ID
 */
export async function getStudiesByFamilyMember(familyMemberId: string): Promise<Study[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return [];
    }

    return await studyService.getStudiesByFamilyMember(session.user.userId, familyMemberId);
  } catch (error) {
    console.error("Error en getStudiesByFamilyMember action:", error);
    return [];
  }
}

/**
 * Obtiene el conteo de estudios de un familiar
 */
export async function getStudyCountByFamilyMember(familyMemberId: string): Promise<number> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return 0;
    }

    return await studyService.getStudyCountByFamilyMember(session.user.userId, familyMemberId);
  } catch (error) {
    console.error("Error en getStudyCountByFamilyMember action:", error);
    return 0;
  }
}

/**
 * Obtiene la fecha del último estudio de un familiar
 */
export async function getLastStudyDateByFamilyMember(familyMemberId: string): Promise<string | undefined> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return undefined;
    }

    const date = await studyService.getLastStudyDateByFamilyMember(session.user.userId, familyMemberId);
    return date || undefined;
  } catch (error) {
    console.error("Error en getLastStudyDateByFamilyMember action:", error);
    return undefined;
  }
}
