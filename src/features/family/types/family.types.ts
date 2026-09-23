/**
 * Types específicos para el feature de Family
 */

export type FamilyRelation = "self" | "parent" | "child" | "spouse" | "sibling" | "other";

export interface FamilyMember {
  id: string;
  uuid: string;
  userId: string;
  name: string;
  relation: FamilyRelation;
  dateOfBirth?: string; // Formato: DD-MM-YYYY
  age?: number;
  notes?: string;
  allergies?: string;
  studyCount?: number;
  lastStudyDate?: string; // Formato: DD-MM-YYYY
  createdAt: string; // Formato: DD-MM-YYYY
}

export const RELATION_LABELS: Record<FamilyRelation, string> = {
  self: "Yo",
  parent: "Padre/Madre",
  child: "Hijo/a",
  spouse: "Pareja",
  sibling: "Hermano/a",
  other: "Otro",
};

export interface CreateFamilyMemberInput {
  name: string;
  relation: FamilyRelation;
  dateOfBirth?: string;
  allergies?: string;
  notes?: string;
}

export interface UpdateFamilyMemberInput {
  name?: string;
  relation?: FamilyRelation;
  dateOfBirth?: string;
  allergies?: string;
  notes?: string;
}

export interface FamilyMemberResult {
  success: boolean;
  message: string;
  familyMemberId?: number;
}
