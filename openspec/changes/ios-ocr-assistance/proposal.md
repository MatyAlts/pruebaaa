## Why

La web ayuda a completar metadatos con OCR y OpenRouter, pero utiliza APIs DOM/pdfjs/Tesseract que no funcionan como módulo iOS. Se requiere asistencia nativa opcional con privacidad explícita y revisión humana.

## What Changes

- Elegir adjunto del formulario, extraer texto local y mostrar progreso/cancel/revisión.
- PDF textual/PDF escaneado/JPEG/PNG y DOCX extracciónbounded compatible; sin portarDOMworkers.
- Enviar solo texto elegido a backend OpenRouter con consentimiento y cuota server.
- Autocompletar campos existentes sin guardar automáticamente ni sobrescribir edición posterior.

## Capabilities

### New Capabilities

- `ios-ocr-assistance`: Elegir adjunto del formulario, extraer texto local y mostrar progreso/cancel/revisión.

### Modified Capabilities

Ninguna en specs principales. Referenciar contratos en changes previos al implementar; las ampliaciones de privacidad se revisan explícitamente, sin reescribirlos ahora.

## Impact

Fuentes inspeccionadas: lib/ocr-utils.ts; components/modals/UploadStudyModal.tsx; user-dashboard/server-actions/analyze-study.ts; src/features/studies/services/analyze-study.service.ts; config/constants.ts.

Dependencias funcionales: ios-study-upload existente y use-openrouter-ai implementado. Edición/eliminación/sharing no son prerrequisitos de asistencia al formulario.

Ampliar el puente Swift privado existente con Vision/PDFKit, sin subir documentos a OpenRouter. El bootstrap TEST no contiene count_analyze/date_analyze: preflight y SQL aditivo manual necesarios antes de anunciar IA. Sin llamadas pagas en pruebas automatizadas.

APIs/adaptadores/DDL propuestos para funcionalidad nativa real. Planificación solamente; aprobación de diseño CRITICAL/HIGH antes apply según Decisions. No código ni migración/deploy autorizados por este documento. Mapa y dirección visual en docs/ios-pantallas-roadmap.md.
