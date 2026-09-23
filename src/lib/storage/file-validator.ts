import { fileTypeFromBuffer } from 'file-type';

export interface FileValidationResult {
  isValid: boolean;
  fileType?: string;
  error?: string;
}

/**
 * Valida de manera segura que el archivo sea un tipo permitido
 * Verifica tanto el MIME type como los magic bytes del archivo
 */
export async function validateFileType(file: File): Promise<FileValidationResult> {
  try {
    // Leer los primeros bytes del archivo (suficiente para magic bytes)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validar con file-type (usa magic bytes, más seguro)
    const fileTypeResult = await fileTypeFromBuffer(buffer);

    // Tipos permitidos (basados en magic bytes)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    ];

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];

    // Si file-type no puede determinar el tipo, verificar extensión y MIME type declarado
    if (!fileTypeResult) {
      const declaredMimeType = file.type.toLowerCase();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // Para DOCX, file-type puede no detectarlo correctamente
      // Validar basándose en MIME type y extensión
      if (declaredMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
        fileExtension === 'docx') {
        // Verificar que sea realmente un ZIP (DOCX es un ZIP)
        const zipSignature = buffer.slice(0, 4);
        const isProbablyZip = zipSignature[0] === 0x50 &&
          zipSignature[1] === 0x4B &&
          (zipSignature[2] === 0x03 || zipSignature[2] === 0x05 || zipSignature[2] === 0x07);

        if (isProbablyZip) {
          return {
            isValid: true,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          };
        }
      }

      return {
        isValid: false,
        error: 'No se pudo determinar el tipo de archivo. Asegurate de que sea un PDF, JPG, PNG o DOCX válido.'
      };
    }

    // Verificar que el tipo detectado esté en la lista de permitidos
    if (!allowedMimeTypes.includes(fileTypeResult.mime)) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido: ${fileTypeResult.mime}. Solo se aceptan PDF, JPG, PNG y DOCX.`
      };
    }

    // Verificar que la extensión coincida con el tipo detectado
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: 'Extensión de archivo no válida.'
      };
    }

    // Verificar que el MIME type declarado coincida con el detectado
    const declaredMimeType = file.type.toLowerCase();
    if (declaredMimeType !== fileTypeResult.mime &&
      !(declaredMimeType === 'image/jpg' && fileTypeResult.mime === 'image/jpeg')) {
      return {
        isValid: false,
        error: 'El tipo de archivo declarado no coincide con el contenido real del archivo.'
      };
    }

    // Validaciones adicionales de seguridad

    // 1. Tamaño máximo (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'El archivo supera el tamaño máximo permitido de 10 MB.'
      };
    }

    // 2. Tamaño mínimo (evitar archivos vacíos o corruptos)
    const minSize = 100; // 100 bytes
    if (file.size < minSize) {
      return {
        isValid: false,
        error: 'El archivo es demasiado pequeño o está corrupto.'
      };
    }

    // 3. Verificar que el nombre del archivo no contenga caracteres peligrosos
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(file.name)) {
      return {
        isValid: false,
        error: 'El nombre del archivo contiene caracteres no permitidos.'
      };
    }

    return {
      isValid: true,
      fileType: fileTypeResult.mime
    };

  } catch (error) {
    console.error('Error al validar archivo:', error);
    return {
      isValid: false,
      error: 'Error al validar el archivo: ' + (error instanceof Error ? error.message : 'Error desconocido')
    };
  }
}

/**
 * Versión simplificada para validación rápida solo con MIME type
 * (menos segura, pero útil para validación inicial en el cliente)
 */
export async function quickValidateFileType(file: File): Promise<FileValidationResult> {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'Extensión de archivo no válida. Solo se aceptan: PDF, JPG, PNG, DOCX.'
    };
  }

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, PNG, DOCX.'
    };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'El archivo supera el tamaño máximo permitido de 10 MB.'
    };
  }

  return {
    isValid: true,
    fileType: file.type
  };
}
