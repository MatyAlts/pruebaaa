// Configuración de tiempos de expiración
export const SHARE_LINK_EXPIRATION_HOURS = 24;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FAMILY_MEMBER_NAME_LENGTH = 40;

// Opciones de vínculo para compartir estudios
export const VINCULO_OPTIONS = [
  { value: "medico", label: "Médico" },
  { value: "familiar", label: "Familiar" },
  { value: "otro", label: "Otro" },
] as const;

// Límites de longitud de campos para estudios médicos
export const STUDY_FIELD_LIMITS = {
  date: 30,
  title: 400,
  institution: 400,
  doctor: 400,
  conclusion: 10000,
  description: 2000,
} as const;


