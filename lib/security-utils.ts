/**
 * Utilidades de seguridad para validación de rutas de archivos
 */

/**
 * Valida que una ruta de archivo no contenga secuencias peligrosas de path traversal
 * @param filePath - Ruta del archivo a validar
 * @returns true si la ruta es segura, false si contiene patrones peligrosos
 */
export function isValidFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== "string") {
    return false;
  }

  // Patrones peligrosos a detectar
  const dangerousPatterns = [
    "..", // Path traversal
    "\0", // Null byte
    "\x00", // Null byte (hex)
  ];

  // Verificar que no contenga ningún patrón peligroso
  return !dangerousPatterns.some((pattern) => filePath.includes(pattern));
}
