import { familyRepository } from "../repositories/family.repository";
import { v4 as uuidv4 } from "uuid";
import { dateNowWithMinutes } from "@/config/date";
import type { FamilyMember, FamilyMemberResult } from "../types/family.types";

interface CreateFamilyMemberInput {
  name: string;
  dateOfBirth?: string;
  userId: string;
  userEmail: string;
}

/**
 * Service para la lógica de negocio de familiares
 */
export class FamilyService {
  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    return familyRepository.findByUserId(userId);
  }

  async getFamilyMemberById(familyMemberId: string, userId: string): Promise<FamilyMember | null> {
    return familyRepository.findById(familyMemberId, userId);
  }

  async getFamilyMemberByUuid(uuid: string): Promise<FamilyMember | null> {
    return familyRepository.findByUuid(uuid);
  }

  async createFamilyMember(input: CreateFamilyMemberInput): Promise<FamilyMemberResult> {
    try {
      const { name, dateOfBirth, userId, userEmail } = input;

      // Validaciones
      if (!name || name.trim() === "") {
        return {
          success: false,
          message: "El nombre es obligatorio.",
        };
      }

      if (name.length > 200) {
        return {
          success: false,
          message: "El nombre no puede superar los 200 caracteres.",
        };
      }

      if (dateOfBirth && dateOfBirth.length > 30) {
        return {
          success: false,
          message: "La fecha de nacimiento no es válida.",
        };
      }

      const uuid = this.generateFamilyMemberUuid();
      const now = dateNowWithMinutes();

      const familyMemberId = await familyRepository.create({
        uuid,
        userId,
        userEmail,
        name: name.trim(),
        dateOfBirth: dateOfBirth || null,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        message: "Familiar agregado exitosamente",
        familyMemberId,
      };
    } catch (error) {
      console.error("Error en createFamilyMember service:", error);
      return {
        success: false,
        message: "Error al agregar el familiar. Por favor, intenta nuevamente.",
      };
    }
  }

  async deleteFamilyMember(familyMemberId: string, userId: string): Promise<FamilyMemberResult> {
    try {
      const deleted = await familyRepository.delete(familyMemberId, userId);

      if (!deleted) {
        return {
          success: false,
          message: "El familiar no existe o no te pertenece.",
        };
      }

      return {
        success: true,
        message: "Familiar eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error en deleteFamilyMember service:", error);
      return {
        success: false,
        message: "Error al eliminar el familiar.",
      };
    }
  }

  private generateFamilyMemberUuid(): string {
    const uuid = uuidv4();
    const timestamp = new Date().getTime().toString();
    const formattedTimestamp = timestamp.match(/.{1,4}/g)?.join("-") || timestamp;
    return `${uuid}-${formattedTimestamp}`;
  }
}

export const familyService = new FamilyService();
