import OpenAI from "openai";
import type { AnalyzeStudyResult } from "../types/study.types";

/**
 * Service para análisis de estudios con IA
 */
export class AnalyzeStudyService {
  /**
   * Analiza un estudio médico usando OpenRouter
   */
  async analyzeStudyWithAI(ocrText: string): Promise<AnalyzeStudyResult> {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return {
          success: false,
          message: "API Key de OpenRouter no configurada. Configurá la variable de entorno OPENROUTER_API_KEY.",
        };
      }

      if (!ocrText || ocrText.trim().length === 0) {
        return {
          success: false,
          message: "No se pudo extraer texto del documento.",
        };
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      });

      const systemPrompt = `Sos un asistente médico especializado en analizar estudios médicos extraídos por OCR. Tu tarea es extraer y CORREGIR información específica de un estudio médico proporcionado.

IMPORTANTE: El texto proviene de OCR y puede tener palabras pegadas sin espacios. DEBÉS corregir estos errores de espaciado.

Debes identificar y extraer:

1. **Nombre del estudio**: El nombre del estudio tal como aparece en el documento. Ejemplos comunes:
   - "Hemograma completo"
   - "Análisis de laboratorio"
   - "Informe de electrocardiograma"
   - "Eco Doppler"
   - "Tomografía computada"
   - "Electroencefalograma"
   - "Radiografía de tórax"
   - "Resonancia magnética"
   - "Ecografía abdominal"
   
   Si encuentras palabras pegadas como "Hemogramacompleto", corregilo a "Hemograma completo".

2. **Institución**: El nombre de la institución, hospital, laboratorio o clínica que realizó el estudio.
   Si encuentras palabras pegadas como "HospitalItaliano", corregilo a "Hospital Italiano".

3. **Fecha del estudio**: La fecha en que se realizó el estudio. Puede aparecer como "Fecha", "Date", "Fecha del estudio", etc.
   - DEVOLVÉ la fecha en formato DD-MM-YYYY
   - Ejemplos de conversión:
     * "15/03/2024" → "15-03-2024"
     * "2024-03-15" → "15-03-2024"
     * "15 de marzo de 2024" → "15-03-2024"
     * "March 15, 2024" → "15-03-2024"
   - Si NO encontrás fecha explícita, devolvé string vacío

4. **Conclusión o Resumen**: La conclusión del estudio. Buscá secciones como "Conclusión", "Diagnóstico", "Impresión diagnóstica", "Resultado" o similar.
   
   **REGLAS PARA LA CONCLUSIÓN:**
   - Copiá el contenido completo de la conclusión
   - SI hay palabras pegadas (ej: "normalsinpatología", "estudiodentrodelímitesnormales"), DEBÉS agregar espacios para que sea legible
   - Ejemplos de corrección:
     * "normalsinpatología" → "normal sin patología"
     * "estudiodentrodelímitesnormales" → "estudio dentro de límites normales"
     * "seobserva" → "se observa"
     * "noseobservan" → "no se observan"
   - NO cambies palabras médicas, NO resumas, NO interpretes
   - SOLO corregí el espaciado para que sea legible
   - Mantené el contenido médico exactamente como está

REGLAS GENERALES:
- Si NO encontrás algún dato, devolvé string vacío ("") 
- NO inventes información que no esté en el texto
- SÍ podés y DEBÉS agregar espacios entre palabras pegadas
- NO cambies el significado ni el contenido, solo el espaciado

Respondé ÚNICAMENTE en formato JSON válido:
{
  "titulo": "nombre con espaciado correcto o cadena vacía",
  "institucion": "nombre con espaciado correcto o cadena vacía",
  "fecha": "fecha en formato DD-MM-YYYY o cadena vacía",
  "conclusion": "conclusión con espaciado correcto o cadena vacía"
}`;

      const userPrompt = `Analizá el siguiente estudio médico y extraé la información solicitada:

${ocrText}`;

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Temperatura moderada para permitir correcciones de espaciado
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        return {
          success: false,
          message: "No se recibió respuesta de la API de OpenRouter.",
        };
      }

      const parsedResponse = JSON.parse(responseText);

      return {
        success: true,
        data: {
          titulo: parsedResponse.titulo || "",
          institucion: parsedResponse.institucion || "",
          fecha: parsedResponse.fecha || "",
          conclusion: parsedResponse.conclusion || "",
        },
      };
    } catch {
      console.error("Error al analizar estudio con IA mediante OpenRouter.");
      return {
        success: false,
        message: "Error al analizar el estudio con OpenRouter. Intent\u00e1 nuevamente.",
      };
    }
  }
}

// Export singleton instance
export const analyzeStudyService = new AnalyzeStudyService();
