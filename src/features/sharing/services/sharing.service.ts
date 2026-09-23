import { sharingRepository } from "../repositories/sharing.repository";
import { v4 as uuidv4 } from "uuid";
import { dateNowWithMinutes } from "@/config/date";
import type {
  ShareLink,
  GenerateShareLinkResult,
  RevokeShareLinkResult,
} from "../types/sharing.types";

interface GenerateShareLinkInput {
  studyId: string;
  doctorName?: string;
  userId: string;
}

/**
 * Service para la lógica de negocio de compartir
 */
export class SharingService {
  async getSharedLinks(userId: string): Promise<ShareLink[]> {
    return sharingRepository.findByUserId(userId);
  }

  async generateShareLink(
    input: GenerateShareLinkInput,
  ): Promise<GenerateShareLinkResult> {
    try {
      const { studyId, doctorName, userId } = input;

      if (!studyId) {
        return {
          success: false,
          message: "ID del estudio es requerido.",
        };
      }

      const uuid = this.generateShareUuid();
      const now = dateNowWithMinutes();
      const cleanDoctorName = doctorName?.trim() || "";

      const linkId = await sharingRepository.create({
        userId,
        studyId,
        doctorName: cleanDoctorName,
        uuid,
        createdAt: now,
      });

      return {
        success: true,
        message: "Link generado exitosamente",
        data: {
          id: linkId,
          uuid,
        },
      };
    } catch (error) {
      console.error("Error en generateShareLink service:", error);
      return {
        success: false,
        message: "Error al generar el link. Por favor, intenta nuevamente.",
      };
    }
  }

  async revokeShareLink(
    linkId: string,
    userId: string,
  ): Promise<RevokeShareLinkResult> {
    try {
      const deleted = await sharingRepository.delete(linkId, userId);

      if (!deleted) {
        return {
          success: false,
          message: "El link no existe o no te pertenece.",
        };
      }

      return {
        success: true,
        message: "Link eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error en revokeShareLink service:", error);
      return {
        success: false,
        message: "Error al revocar el link.",
      };
    }
  }

  private generateShareUuid(): string {
    const uuid = uuidv4();
    const timestamp = new Date().getTime().toString();
    const formattedTimestamp =
      timestamp.match(/.{1,4}/g)?.join("-") || timestamp;
    return `${uuid}-${formattedTimestamp}`;
  }
}

export const sharingService = new SharingService();
