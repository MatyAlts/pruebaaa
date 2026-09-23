/**
 * Types específicos para el feature de Sharing
 */

export interface ShareLink {
  id: string;
  studyId: string;
  userId: string;
  doctorName: string;
  uuid: string;
  createdAt: string;
  openedAt?: string;
  studyTitle?: string;
  studyDate?: string;
}

export interface GenerateShareLinkResult {
  success: boolean;
  message: string;
  data?: {
    id: number;
    uuid: string;
  };
}

export interface RevokeShareLinkResult {
  success: boolean;
  message: string;
}
