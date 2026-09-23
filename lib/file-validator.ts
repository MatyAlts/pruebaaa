import { MAX_FILE_SIZE } from '@/config/constants';
import { fileTypeFromBuffer } from 'file-type';

export interface FileValidationResult {
  isValid: boolean;
  fileType?: string;
  detectedMimeType?: string; // MIME type detectado por magic bytes (confiable)
  error?: string;
}

/**
 * Valida de manera segura que el archivo sea un tipo permitido
 * Verifica tanto el MIME type como los magic bytes del archivo
 * Incluye validaciones anti-malware y detección de contenido malicioso
 */
export async function validateFileType(file: File): Promise<FileValidationResult> {
  try {
    // Leer todo el archivo para validación completa
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
          // Validar que sea DOCX legítimo (no ZIP con extensión falsa)
          const docxValidation = validateDOCXStructure(buffer);
          if (!docxValidation.isValid) {
            return docxValidation;
          }
          
          return {
            isValid: true,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            detectedMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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

    // Validaciones anti-malware específicas por tipo de archivo
    const malwareCheck = checkForMaliciousContent(buffer, fileTypeResult.mime);
    if (!malwareCheck.isValid) {
      return malwareCheck;
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
    const maxSize = MAX_FILE_SIZE;
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

    // 4. Verificar extensión doble (ej: archivo.pdf.exe)
    const nameParts = file.name.split('.');
    if (nameParts.length > 2) {
      // Verificar que no haya extensiones ejecutables ocultas
      const dangerousExts = ['exe', 'bat', 'cmd', 'com', 'scr', 'vbs', 'js', 'jar', 'sh'];
      for (let i = 1; i < nameParts.length - 1; i++) {
        if (dangerousExts.includes(nameParts[i].toLowerCase())) {
          return {
            isValid: false,
            error: 'El nombre del archivo contiene extensiones sospechosas.'
          };
        }
      }
    }

    return {
      isValid: true,
      fileType: fileTypeResult.mime,
      detectedMimeType: fileTypeResult.mime // Retornar MIME detectado, no el del cliente
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

/**
 * Verifica contenido malicioso específico por tipo de archivo
 */
function checkForMaliciousContent(buffer: Buffer, mimeType: string): FileValidationResult {
  try {
    const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000)); // Primeros 50KB

    // Validaciones para PDFs
    if (mimeType === 'application/pdf') {
      // Detectar JavaScript embebido en PDF (muy común en malware)
      if (content.includes('/JavaScript') || content.includes('/JS')) {
        return {
          isValid: false,
          error: 'El PDF contiene JavaScript, lo cual no está permitido por razones de seguridad.'
        };
      }

      // Detectar /Launch (puede ejecutar comandos)
      if (content.includes('/Launch')) {
        return {
          isValid: false,
          error: 'El PDF contiene acciones de ejecución, lo cual no está permitido.'
        };
      }

      // Detectar /AA (Automatic Actions)
      if (content.includes('/AA')) {
        return {
          isValid: false,
          error: 'El PDF contiene acciones automáticas sospechosas.'
        };
      }

      // Detectar /OpenAction (ejecuta al abrir) - Removido porque causa muchos falsos positivos (usualmente solo indica la página inicial o nivel de zoom)
      // if (content.includes('/OpenAction')) {
      //   return {
      //     isValid: false,
      //     error: 'El PDF contiene acciones de apertura automática sospechosas.'
      //   };
      // }

      // Detectar shellcode común (patrones hexadecimales sospechosos)
      const shellcodePatterns = [
        /\\x90\\x90\\x90/g, // NOP sled
        /%u9090/g, // NOP sled codificado
      ];

      for (const pattern of shellcodePatterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            error: 'El PDF contiene patrones sospechosos de shellcode.'
          };
        }
      }
    }

    // Validaciones para imágenes (JPEG, PNG)
    if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
      // Detectar scripts embebidos en metadatos
      const scriptPatterns = [
        /<script/gi,
        /javascript:/gi,
        /onerror=/gi,
        /onload=/gi,
        /<iframe/gi,
      ];

      for (const pattern of scriptPatterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            error: 'La imagen contiene código ejecutable embebido.'
          };
        }
      }

      // Verificar que no sea un ejecutable disfrazado
      // Detectar magic bytes de ejecutables dentro del archivo
      const executableSignatures = [
        'MZ', // EXE/DLL
        'PE\0\0', // PE format
        '\x7fELF', // ELF (Linux)
      ];

      const bufferStart = buffer.slice(0, 1000).toString('binary');
      for (const signature of executableSignatures) {
        if (bufferStart.includes(signature)) {
          return {
            isValid: false,
            error: 'El archivo contiene firmas de ejecutable.'
          };
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    // Si no puede convertir a string, no es un problema
    return { isValid: true };
  }
}

/**
 * Valida la estructura de un archivo DOCX
 */
function validateDOCXStructure(buffer: Buffer): FileValidationResult {
  try {
    const content = buffer.toString('binary', 0, Math.min(buffer.length, 10000));

    // Un DOCX válido debe contener estos componentes básicos
    const hasContentTypes = content.includes('[Content_Types].xml');
    const hasDocProps = content.includes('docProps/');
    const hasWord = content.includes('word/');

    if (!hasContentTypes || !hasDocProps || !hasWord) {
      return {
        isValid: false,
        error: 'El archivo DOCX no tiene una estructura válida.'
      };
    }

    // Detectar macros (archivos DOCM disfrazados)
    if (content.includes('vbaProject.bin') || content.includes('application/vnd.ms-office.vbaProject')) {
      return {
        isValid: false,
        error: 'El documento contiene macros, las cuales no están permitidas por seguridad.'
      };
    }

    // Detectar OLE objects embebidos (pueden contener malware)
    if (content.includes('oleObject')) {
      return {
        isValid: false,
        error: 'El documento contiene objetos OLE embebidos, los cuales no están permitidos.'
      };
    }

    // Detectar ActiveX controls
    if (content.includes('activeX')) {
      return {
        isValid: false,
        error: 'El documento contiene controles ActiveX, los cuales no están permitidos.'
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Error al validar la estructura del documento.'
    };
  }
}
