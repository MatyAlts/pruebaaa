## Context

Fuentes inspeccionadas: lib/ocr-utils.ts; components/modals/UploadStudyModal.tsx; user-dashboard/server-actions/analyze-study.ts; src/features/studies/services/analyze-study.service.ts; config/constants.ts.

Ver proposal.md y docs/ios-pantallas-roadmap.md. Dependencias funcionales: ios-study-upload existente y use-openrouter-ai implementado; management/delete/sharing no bloquean asistencia.

La API actual cubre Google, lectura, carga y Familia; no análisis móvil. La acción web usada por UploadStudyModal es user-dashboard/server-actions/analyze-study.ts: valida sesión cookie y cuota count_analyze/date_analyze, incluye médico y usa OpenRouter. El servicio alternativo AnalyzeStudyService no implementa cuota: no invocarlo como bypass. Bootstrap TEST y migraciones presentes no contienen esos campos IA.

## Goals / Non-Goals

**Goals:** pantallas nativas equivalentes y operaciones reales con aislamiento, estados accesibles y contratos verificables.

**Non-Goals:** simular datos/botones, portar DOM/Server Actions, cambiar la web fuera de adaptaciones focales aprobadas, alterar permisos o procesar datos productivos sin aprobación; no ejecutar apply ni deploy en planificación.

## Decisions

Extender módulo Swift SalutecaPreview existente con funciones de extracción/cancelación aisladas de preview. PDFKit ya está compilado; añadir Vision del sistema para imágenes/escaneados. No OCR en @expo/ui ni Tesseract DOM móvil. Sólo URIs canónicas de caché privada, validar formato/tamaño antes de procesar y nunca aceptar archivo remoto/ruta arbitraria. DOCX necesita ZIP/XML acotado verificado como tarea, no una dependencia ficticia.

Preflight valida count_analyze/date_analyze, LIMIT_ANALYZE entero positivo y reservas durables necesarias; capability apagada si falta infraestructura. SQL aditivo dedicado TEST y supervisor documentados para ejecución manual separada, sin DDL automático. Mantener cuota diaria por fecha config/date y contar sólo éxito, incluyendo solicitudes concurrentes de web/móvil en el mismo límite mediante adaptación focal de la acción web. Reservas limitadas, timeout y reconciliación conservadora evitan resetear cuota o duplicar cargos; no reintentar llamadas pagas automáticamente. Cliente envía requestId para consultar operación tras respuesta ambigua. Mantener OPENROUTER_API_KEY sólo runtime backend y modelo openai/gpt-4o-mini/prompt actual incluyendo doctor, sin logs ni retención persistente de texto/respuesta clínica; operación guarda estado/cuota, no contenido. Cambios focales de cuota web requieren misma aprobación de diseño.

Módulo local Expo/Swift propone Vision VNRecognizeTextRequest para JPEG/PNG, PDFKit PDFPage.string para PDFs textuales y render por página + Vision para PDFs escaneados. Fuente primaria Apple: https://developer.apple.com/documentation/vision/vnrecognizetextrequest. Trabajo serial/cancelable con límites propuestos20 páginas, lado de imagen2048 y texto20000caracteres; son parámetros de recursos revisables antes apply, no hechos del OCR actual.

DOCX válido extrae word/document.xml de ZIP local acotado, rechazando expansión excesiva, rutas inseguras y XML con DTD/entities. Biblioteca ZIP Swift compatible se elige mediante tarea específica de verificación primaria/spike de fixtures; no asumir SDK DOM/Tesseract ni dependencia instalada. Si esa compatibilidad falla, presentar bloqueo concreto sin quitar paridad de formato silenciosamente. Archivos≤10 MB; caché privada, texto/bitmaps se limpian en cancelación/logout; no logs ni persistencia médica.

Usuario revisa texto local y pulsa Analizar con IA tras aviso explícito de envío de información al backend/OpenRouter. Nuevo POST /api/mobile/v1/studies/analyze {ocrText}, Bearer canónico, body UTF8≤80KB y texto≤20000. LIMIT_ANALYZE debe ser entero configurado y cuota diaria de acción existente se comprueba en servidor con concurrencia/reserva y cuenta solo éxito; fallos liberan reserva. Clave OpenRouter únicamente backend, prompts/modelo fixed actuales y DTO de acción incluye médico. Tests capturan SDK/fetch, no llamadas pagas automáticas.

Sugerencias se presentan para aceptar/editar; no guardar estudio automáticamente ni sobrescribir cambios manuales hechos después de iniciar análisis. Generación de sesión/campo impide resultados tardíos. Carga manual permanece funcional sin OCR, sin proveedor configurado o sin red. Consentimiento/retención/envío de datos y cuota son diseño CRITICAL con aprobación previa al apply; prueba proveedor real solo posterior y autorizada con texto ficticio.

Identidad: CSS actual Mi Saluteca, Inter y spacing4pt, carpeta clínica/paciente/fecha/adjuntos. Usar superficies sólidas, sheets/forms nativos y barra de sistema de foundation. Contraste normal ≥ 4.5:1/grande ≥ 3:1; verde de marca como acento con tinta oscura, nunca blanco ilegible. Dynamic Type, VoiceOver, teclado/scroll, loading/empty/error/cancel/retry se diseñan como comportamiento.

## Risks / Trade-offs

OCR médico y proveedor externo puedencontenir errores o datos sensibles → opt-inpreview/cancel/humanreview y diseño privacidad aprobado. Performance/resourcesnativeprobe acotadodocumentado20pages/2048/20k propuestos; no prueba físicapormocks. DOCXboundedextractor requiere compatibilidad/primarysource verificado no pkgnamefantasma. Manualupload funciona sin IA/red/providerconfigured.

## Migration Plan

Revisar y aprobar el diseño concreto del dominio antes apply cuando sea CRITICAL/HIGH; no se solicita aprobación durante esta planificación. Safety net y un RED mínimo ejecutado, GREEN confirmado, triangulación ≥ 2casos y refactor con rerun por comportamiento. Validación SQL/HTTP en MySQL dedicado de prueba, sin credenciales de producción ni llamadas pagas automáticas. Migración TEST/deploy requieren autorización externa específica.

Backend publica capability sólo después de endpoint real compatible; UI no presenta acciones futuras como disponibles. Rollback UI/IPA a versión anterior y backend compatible; mantener outbox y datos necesarios para operaciones ya confirmadas, sin borrar tablas de negocio. Distinguir commit de datos y cleanup físico cuando aplique; ninguna aceptación manual se completa por mocks. No archivar changes previos ni cambiar su evidencia.
