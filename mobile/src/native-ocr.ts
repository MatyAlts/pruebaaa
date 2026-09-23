import { requireOptionalNativeModule } from 'expo';

export type OcrResult = { text: string; pages: number };
export type NativeOcrModule = {
  extractText(uri: string, requestId: string): Promise<unknown>;
  cancelExtraction(requestId: string): Promise<void>;
};
const requestPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createNativeOcr(resolve: () => NativeOcrModule | null = () => requireOptionalNativeModule<NativeOcrModule>('SalutecaPreview')) {
  const active = new Map<string, object>();
  return {
    async extract(uri: string, requestId: string): Promise<OcrResult> {
      if (!requestPattern.test(requestId) || !uri.startsWith('file:///') || !/\.(pdf|jpe?g|png)$/i.test(uri)) throw new Error('Adjunto local inválido.');
      if (active.has(requestId)) throw new Error('La extracción ya está en progreso.');
      const module = resolve();
      if (!module?.extractText) throw new Error('La extracción nativa no está disponible en esta compilación.');
      const token = {};
      active.set(requestId, token);
      try {
        const value = await module.extractText(uri, requestId);
        if (active.get(requestId) !== token) throw new Error('Extracción cancelada.');
        if (!value || typeof value !== 'object') throw new Error('Resultado de extracción inválido.');
        const result = value as Partial<OcrResult>;
        if (typeof result.text !== 'string' || !result.text.trim() || result.text.length > 20000 || !Number.isInteger(result.pages) || result.pages! < 1 || result.pages! > 20) throw new Error('El documento no contiene texto válido dentro de los límites.');
        return { text: result.text, pages: result.pages! };
      } finally {
        if (active.get(requestId) === token) active.delete(requestId);
      }
    },
    async cancel(requestId: string) {
      active.delete(requestId);
      await resolve()?.cancelExtraction?.(requestId);
    },
    async clear() {
      const ids = [...active.keys()];
      active.clear();
      await Promise.allSettled(ids.map(id => resolve()?.cancelExtraction?.(id)));
    },
  };
}
