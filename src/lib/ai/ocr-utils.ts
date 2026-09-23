"use client";

import { createWorker } from "tesseract.js";

export interface OCRResult {
  text: string;
  success: boolean;
  error?: string;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (message: string) => void,
): Promise<OCRResult> {
  try {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Determinar tipo de archivo
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await extractTextFromPDF(file, onProgress);
    } else if (
      fileType.startsWith("image/") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png")
    ) {
      return await extractTextFromImage(file, onProgress);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      return await extractTextFromDOCX(file, onProgress);
    } else {
      return {
        success: false,
        text: "",
        error: "Tipo de archivo no soportado",
      };
    }
  } catch (error) {
    console.error("Error en extractTextFromFile:", error);
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

async function extractTextFromPDF(
  file: File,
  onProgress?: (message: string) => void,
): Promise<OCRResult> {
  try {
    onProgress?.("Cargando PDF...");

    // Importar PDF.js dinámicamente
    const pdfjsLib = await import("pdfjs-dist");

    // Configurar el worker de PDF.js - usar la versión del paquete instalado
    // La versión debe coincidir con la instalada en node_modules
    const pdfjsVersion = pdfjsLib.version || "5.4.624";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

    // Leer el PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    onProgress?.(`PDF cargado: ${totalPages} páginas. Inicializando...`);

    // Crear worker de Tesseract
    const worker = await createWorker("spa", 1);

    let fullText = "";

    // Procesar cada página
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.(`Procesando página ${pageNum} de ${totalPages}...`);

      // Obtener la página
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Escala 2x para mejor calidad

      // Crear canvas
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo crear el contexto del canvas");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Renderizar la página en el canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // Convertir canvas a blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      // Aplicar OCR a la página
      onProgress?.(`Analizando página ${pageNum} de ${totalPages}...`);
      const {
        data: { text },
      } = await worker.recognize(blob);

      // Agregar el texto de esta página
      fullText += `${text}\n`;
    }

    await worker.terminate();

    return {
      success: true,
      text: fullText.trim(),
    };
  } catch (error) {
    console.error("Error en extractTextFromPDF:", error);
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "Error al procesar PDF",
    };
  }
}

async function extractTextFromImage(
  file: File,
  onProgress?: (message: string) => void,
): Promise<OCRResult> {
  try {
    onProgress?.("Inicializando analisis de imagen...");

    const worker = await createWorker("spa", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(`Reconociendo texto: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    onProgress?.("Procesando imagen...");
    const {
      data: { text },
    } = await worker.recognize(file);

    await worker.terminate();

    return {
      success: true,
      text: text.trim(),
    };
  } catch (error) {
    console.error("Error en extractTextFromImage:", error);
    return {
      success: false,
      text: "",
      error:
        error instanceof Error ? error.message : "Error al procesar imagen",
    };
  }
}

async function extractTextFromDOCX(
  file: File,
  onProgress?: (message: string) => void,
): Promise<OCRResult> {
  try {
    onProgress?.("Cargando archivo DOCX...");

    // Importar mammoth y html2canvas dinámicamente
    const mammoth = await import("mammoth");
    const html2canvas = (await import("html2canvas")).default;

    // Leer el archivo DOCX
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.("Convirtiendo DOCX a HTML...");
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlContent = result.value;

    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error("El documento DOCX está vacío o no se pudo leer");
    }

    // Crear un contenedor temporal para renderizar el HTML
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "800px";
    container.style.padding = "40px";
    container.style.backgroundColor = "white";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "14px";
    container.style.lineHeight = "1.6";
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    onProgress?.("Inicializando...");

    // Crear worker de Tesseract
    const worker = await createWorker("spa", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(`Reconociendo texto: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Convertir documento a imagen
    onProgress?.("Convirtiendo documento a imagen...");
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/png");
    });

    onProgress?.("Analizando documento...");
    const {
      data: { text },
    } = await worker.recognize(blob);

    document.body.removeChild(container);
    await worker.terminate();

    return {
      success: true,
      text: text.trim(),
    };
  } catch (error) {
    console.error("Error en extractTextFromDOCX:", error);
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "Error al procesar DOCX",
    };
  }
}
