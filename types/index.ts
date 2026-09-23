// Family Relations
export type FamilyRelation =
  | "self"
  | "parent"
  | "child"
  | "spouse"
  | "sibling"
  | "other";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string; // Formato: DD-MM-YYYY
}

// Family Member interface
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

// Study interface
export interface StudyFile {
  id?: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface Study {
  id: string;
  uuid: string;
  userId: string;
  familyMemberId?: string; // null = estudio del usuario principal
  title?: string;
  date: string; // Formato: DD-MM-YYYY
  institution?: string;
  medico: string;
  conclusion?: string;
  description?: string;
  files: StudyFile[];
  createdAt: string; // Formato: DD-MM-YYYY
}

// Share Link interface
export interface StudyShareLink {
  id: string;
  studyId: string;
  token: string;
  expiresAt: string; // Formato: DD-MM-YYYY HH:mm
  revokedAt?: string; // Formato: DD-MM-YYYY HH:mm
  viewsCount: number;
  createdAt: string; // Formato: DD-MM-YYYY HH:mm
}

// Helper type for study with owner info
export interface StudyWithOwner extends Study {
  ownerName: string;
  ownerRelation?: FamilyRelation;
}

export const RELATION_LABELS: Record<FamilyRelation, string> = {
  self: "Yo",
  parent: "Padre/Madre",
  child: "Hijo/a",
  spouse: "Pareja",
  sibling: "Hermano/a",
  other: "Otro",
};
