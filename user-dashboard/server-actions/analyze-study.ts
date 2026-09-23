"use server";
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/database';
import { randomUUID } from 'node:crypto';
import { MysqlStudyAnalysis } from '@/src/mobile-server/mysql-study-analysis';
export interface AnalysisResult {
    success: boolean;
    studyName?: string;
    institution?: string;
    doctor?: string;
    conclusion?: string;
    studyDate?: string;
    message?: string;
}
export async function analyzeStudyWithAI(ocrText: string): Promise<AnalysisResult> {
    try {
        const current = await getServerSession(authOptions), owner = current?.user?.userId;
        if (!owner)
            return { success: false, message: 'No hay sesión activa. Por favor, iniciá sesión nuevamente.' };
        if (!process.env.OPENROUTER_API_KEY)
            return { success: false, message: 'API Key de OpenRouter no configurada: OPENROUTER_API_KEY.' };
        if (!ocrText?.trim())
            return { success: false, message: 'No se pudo extraer texto del documento.' };
        const engine = new MysqlStudyAnalysis(pool);
        if (!await engine.ready())
            return { success: false, message: 'El análisis de OpenRouter no está habilitado. Revisá la migración TEST y LIMIT_ANALYZE.' };
        const result = await engine.submit(String(owner), { requestId: randomUUID(), ocrText }, async () => {
            const latest = await getServerSession(authOptions);
            if (String(latest?.user?.userId ?? '') !== String(owner))
                throw Error('SESSION_EXPIRED');
        });
        if (!('suggestions' in result) || !result.suggestions)
            return { success: false, message: 'No se pudo recuperar la respuesta de OpenRouter. Completá los campos manualmente.' };
        const value = result.suggestions;
        return { success: true, studyName: value.title, institution: value.institution, doctor: value.medico, studyDate: value.date, conclusion: value.conclusion };
    }
    catch (error) {
        if ((error as {
            status?: number;
        }).status === 429)
            return { success: false, message: 'Alcanzaste el límite de ' + process.env.LIMIT_ANALYZE + ' análisis con inteligencia artificial por día.' };
        console.error('Error al analizar estudio con IA mediante OpenRouter.');
        return { success: false, message: 'Error al analizar el estudio con OpenRouter. Intentá nuevamente.' };
    }
}
