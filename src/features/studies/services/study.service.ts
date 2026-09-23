import { studyRepository } from "../repositories/study.repository";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { validateFileType } from "@/src/lib/storage/file-validator";
import { dateNow } from "@/config/date";
import type { Study, StudyStats, UploadStudyResult } from "../types/study.types";
import { uploadRoot } from "@/src/lib/storage/upload-root";

interface UploadStudyInput {
  file: File;
  title: string | null;
  date: string;
  institution: string | null;
  medico: string | null;
  conclusion: string | null;
  description: string | null;
  familyMemberId: string | null;
  userId: string;
  userEmail: string;
}

interface UpdateStudyInput {
  title?: string | null;
  date?: string;
  institution?: string | null;
  medico?: string | null;
  conclusion?: string | null;
  description?: string | null;
}

/**
 * Service para la lógica de negocio de estudios
 * Orquesta repositories y maneja reglas de negocio
 */
export class StudyService {
  /**
   * Obtiene todos los estudios de un usuario
   */
  async getStudiesByUser(userId: string): Promise<Study[]> {
    return studyRepository.findByUserId(userId);
  }

  /**
   * Obtiene estudios recientes (últimos 6)
   */
  async getRecentStudies(userId: string): Promise<Study[]> {
    const allStudies = await this.getStudiesByUser(userId);
    return allStudies.slice(0, 6);
  }

  /**
   * Obtiene estadísticas de estudios
   */
  async getStudiesStats(userId: string): Promise<StudyStats> {
    const allStudies = await this.getStudiesByUser(userId);

    return {
      total: allStudies.length,
      myStudies: allStudies.filter((s) => !s.familyMemberId).length,
      familyStudies: allStudies.filter((s) => s.familyMemberId).length,
    };
  }

  /**
   * Obtiene un estudio por ID
   */
  async getStudyById(studyId: string, userId: string): Promise<Study | null> {
    return studyRepository.findById(studyId, userId);
  }

  /**
   * Obtiene un estudio por UUID (para compartir)
   */
  async getStudyByUuid(uuid: string): Promise<Study | null> {
    return studyRepository.findByUuid(uuid);
  }

  /**
   * Obtiene estudios de un familiar
   */
  async getStudiesByFamilyMember(userId: string, familyMemberId: string): Promise<Study[]> {
    return studyRepository.findByFamilyMember(userId, familyMemberId);
  }

  /**
   * Obtiene el conteo de estudios de un familiar
   */
  async getStudyCountByFamilyMember(userId: string, familyMemberId: string): Promise<number> {
    return studyRepository.countByFamilyMember(userId, familyMemberId);
  }

  /**
   * Obtiene la fecha del último estudio de un familiar
   */
  async getLastStudyDateByFamilyMember(
    userId: string,
    familyMemberId: string
  ): Promise<string | null> {
    return studyRepository.getLastStudyDate(userId, familyMemberId);
  }

  /**
   * Sube un nuevo estudio
   * Maneja validación, almacenamiento de archivo y creación en DB
   */
  async uploadStudy(input: UploadStudyInput): Promise<UploadStudyResult> {
    try {
      const { file, title, date, institution, medico, conclusion, description, familyMemberId, userId, userEmail } = input;

      // 1. Validar archivo
      const validationResult = await validateFileType(file);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: validationResult.error || "Archivo no válido.",
        };
      }

      // 2. Validar campos
      const validationError = this.validateStudyFields({
        date,
        title,
        institution,
        medico,
        conclusion,
        description,
      });

      if (validationError) {
        return {
          success: false,
          message: validationError,
        };
      }

      // 3. Verificar si el familiar pertenece al usuario (si se especificó)
      if (familyMemberId && familyMemberId !== "self") {
        const isValid = await studyRepository.verifyFamilyMemberOwnership(userId, familyMemberId);
        if (!isValid) {
          return {
            success: false,
            message: "El familiar especificado no existe o no te pertenece.",
          };
        }
      }

      // 4. Guardar archivo en filesystem
      // TODO: En producción, migrar a S3/R2
      const fileKey = await this.saveFile(file, userId);

      // 5. Generar UUID único
      const uuid = this.generateStudyUuid();

      // 6. Guardar en base de datos
      const studyId = await studyRepository.create({
        uuid,
        userId,
        userEmail,
        familyMemberId: familyMemberId === "self" ? null : familyMemberId,
        title,
        date,
        institution,
        medico,
        conclusion,
        description,
        fileKey,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        createdAt: dateNow(),
      });

      return {
        success: true,
        message: "Estudio subido exitosamente",
        studyId,
      };
    } catch (error) {
      console.error("Error en uploadStudy service:", error);
      return {
        success: false,
        message: "Ocurrió un error al subir el estudio. Por favor, intentá nuevamente.",
      };
    }
  }

  /**
   * Actualiza un estudio
   */
  async updateStudy(
    studyId: string,
    userId: string,
    input: UpdateStudyInput
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validar campos si están presentes
      const validationError = this.validateStudyFields(input);
      if (validationError) {
        return {
          success: false,
          message: validationError,
        };
      }

      // Actualizar en DB
      const updated = await studyRepository.update(studyId, userId, input);

      if (!updated) {
        return {
          success: false,
          message: "No se pudo actualizar el estudio. Verificá que exista y te pertenezca.",
        };
      }

      return {
        success: true,
        message: "Estudio actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error en updateStudy service:", error);
      return {
        success: false,
        message: "Ocurrió un error al actualizar el estudio.",
      };
    }
  }

  /**
   * Elimina un estudio
   */
  async deleteStudy(
    studyId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Obtener el estudio para eliminar el archivo
      const study = await studyRepository.findById(studyId, userId);

      if (!study) {
        return {
          success: false,
          message: "El estudio no existe o no te pertenece.",
        };
      }

      // 2. Eliminar archivo del filesystem
      try {
        if (study.files && study.files.length > 0) {
          // TODO: Si hay múltiples archivos, habría que iterar y eliminar todos.
          // Por ahora eliminamos el principal (como funcionaba antes).
          await this.deleteFile(study.files[0].fileKey);
        }
      } catch (error) {
        console.error("Error al eliminar archivo:", error);
        // Continuar con la eliminación de DB aunque falle el archivo
      }

      // 3. Eliminar de DB
      const deleted = await studyRepository.delete(studyId, userId);

      if (!deleted) {
        return {
          success: false,
          message: "No se pudo eliminar el estudio.",
        };
      }

      return {
        success: true,
        message: "Estudio eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error en deleteStudy service:", error);
      return {
        success: false,
        message: "Ocurrió un error al eliminar el estudio.",
      };
    }
  }

  /**
   * Valida los campos de un estudio
   */
  private validateStudyFields(fields: Partial<UpdateStudyInput>): string | null {
    const { date, title, institution, medico, conclusion, description } = fields;

    if (date && date.length > 30) {
      return "La fecha no puede superar los 30 caracteres.";
    }

    if (title && title.length > 400) {
      return "El nombre del estudio no puede superar los 400 caracteres.";
    }

    if (institution && institution.length > 400) {
      return "La institución no puede superar los 400 caracteres.";
    }

    if (medico && medico.length > 400) {
      return "El nombre del médico no puede superar los 400 caracteres.";
    }

    if (conclusion && conclusion.length > 10000) {
      return "La conclusión no puede superar los 10000 caracteres.";
    }

    if (description && description.length > 2000) {
      return "Las notas adicionales no pueden superar los 2000 caracteres.";
    }

    return null;
  }

  /**
   * Guarda un archivo en el filesystem
   * Retorna el fileKey (ruta relativa)
   */
  private async saveFile(file: File, userId: string): Promise<string> {
    const uploadDir = join(uploadRoot(), userId);
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // El fileKey es la ruta relativa desde uploads/
    return `${userId}/${fileName}`;
  }

  /**
   * Elimina un archivo del filesystem
   */
  private async deleteFile(fileKey: string): Promise<void> {
    const filePath = join(uploadRoot(), fileKey);

    try {
      await unlink(filePath);
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
      throw error;
    }
  }

  /**
   * Genera un UUID único para el estudio
   */
  private generateStudyUuid(): string {
    const uuid = uuidv4();
    const timestampString = new Date().getTime().toString();
    const formattedTimestamp = timestampString.match(/.{1,4}/g)?.join("-") || timestampString;
    return `${uuid}-${formattedTimestamp}`;
  }
}

// Export singleton instance
export const studyService = new StudyService();
