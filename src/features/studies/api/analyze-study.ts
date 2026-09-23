"use server";

import { analyzeStudyService } from "../services/analyze-study.service";
import type { AnalyzeStudyResult } from "../types/study.types";

/**
 * Server action para analizar un estudio médico con IA
 */
export async function analyzeStudyWithAI(ocrText: string): Promise<AnalyzeStudyResult> {
  return await analyzeStudyService.analyzeStudyWithAI(ocrText);
}
