import { z } from "zod";

/**
 * Schema para validar la subida de un estudio
 */
export const uploadStudySchema = z.object({
  file: z
    .instanceof(File, { message: "El archivo es requerido" })
    .refine((file) => file.size > 0, "El archivo no puede estar vacío")
    .refine((file) => file.size <= 10 * 1024 * 1024, "El archivo no puede superar los 10 MB"),
  
  title: z
    .string()
    .max(400, "El título no puede superar los 400 caracteres")
    .nullable()
    .optional(),
  
  date: z
    .string({ message: "La fecha es requerida" })
    .min(1, "La fecha es requerida")
    .max(30, "La fecha no puede superar los 30 caracteres"),
  
  institution: z
    .string()
    .max(400, "La institución no puede superar los 400 caracteres")
    .nullable()
    .optional(),
  
  conclusion: z
    .string()
    .max(10000, "La conclusión no puede superar los 10000 caracteres")
    .nullable()
    .optional(),
  
  description: z
    .string()
    .max(2000, "Las notas adicionales no pueden superar los 2000 caracteres")
    .nullable()
    .optional(),
  
  familyMemberId: z
    .string()
    .nullable()
    .optional(),
});

export type UploadStudyInput = z.infer<typeof uploadStudySchema>;

/**
 * Schema para validar la actualización de un estudio
 */
export const updateStudySchema = z.object({
  title: z
    .string()
    .max(400, "El título no puede superar los 400 caracteres")
    .nullable()
    .optional(),
  
  date: z
    .string()
    .max(30, "La fecha no puede superar los 30 caracteres")
    .optional(),
  
  institution: z
    .string()
    .max(400, "La institución no puede superar los 400 caracteres")
    .nullable()
    .optional(),
  
  conclusion: z
    .string()
    .max(10000, "La conclusión no puede superar los 10000 caracteres")
    .nullable()
    .optional(),
  
  description: z
    .string()
    .max(2000, "Las notas adicionales no pueden superar los 2000 caracteres")
    .nullable()
    .optional(),
});

export type UpdateStudyInput = z.infer<typeof updateStudySchema>;

/**
 * Schema para validar el ID de un estudio
 */
export const studyIdSchema = z.object({
  studyId: z.string().min(1, "ID de estudio requerido"),
});

/**
 * Schema para el análisis de estudio con IA
 */
export const analyzeStudySchema = z.object({
  file: z
    .instanceof(File, { message: "El archivo es requerido" })
    .refine((file) => file.size > 0, "El archivo no puede estar vacío")
    .refine((file) => file.size <= 10 * 1024 * 1024, "El archivo no puede superar los 10 MB"),
});

export type AnalyzeStudyInput = z.infer<typeof analyzeStudySchema>;
