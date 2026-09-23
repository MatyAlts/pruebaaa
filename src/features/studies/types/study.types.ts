/**
 * Types específicos para el feature de Studies
 */

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
  familyMemberId?: string;
  title?: string;
  date: string; // Formato: DD-MM-YYYY
  institution?: string;
  medico: string;
  conclusion?: string;
  description?: string;
  files: StudyFile[];
  createdAt: string; // Formato: DD-MM-YYYY
}

export interface StudyWithOwner extends Study {
  ownerName: string;
  ownerRelation?: string;
}

export interface StudyStats {
  total: number;
  myStudies: number;
  familyStudies: number;
}

export interface StudyFilters {
  search?: string;
  familyMemberId?: string;
  dateFrom?: string; // Formato: DD-MM-YYYY
  dateTo?: string; // Formato: DD-MM-YYYY
}

export interface UploadStudyResult {
  success: boolean;
  message: string;
  studyId?: number;
}

export interface AnalyzeStudyResult {
  success: boolean;
  message?: string;
  data?: {
    titulo?: string;
    fecha?: string;
    institucion?: string;
    conclusion?: string;
  };
}
