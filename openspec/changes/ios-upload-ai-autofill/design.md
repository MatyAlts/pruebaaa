## Context

Carga móvil actual admite PDF/JPEG/PNG, máximo10MB por adjunto, caché privada y coordinador. SalutecaPreview ya compila PDFKit/UIKit; ampliar con Vision del sistema. Web usa user-dashboard/server-actions/analyze-study.ts, OpenRouter openai/gpt-4o-mini y cuota count_analyze/date_analyze. Bootstrap/migraciones TEST presentes carecen de esos campos. Servicio alternativo AnalyzeStudyService no tiene cuota y no debe convertirse en bypass.

## Goals / Non-Goals

**Goals:** ayudar a completar el borrador actual con sugerencias revisables, aisladas por sesión/campo, cuota compartida y consentimiento explícito.

**Non-Goals:** DOCX/ZIP, nueva librería pesada, diagnóstico médico, guardar automáticamente, modificar auth, procesar documentos productivos en tests, ejecutar DDL/VPS o llamadas pagas reales sin autorización posterior. ios-ocr-assistance conserva su propuesta futura completa.

## Decisions

1. Selección explícita de un adjunto actual. Módulo Swift existente valida URI canónica bajo caché protegida, tipo y bytes≤10MB. PDFPage.string para PDF textual, render serial+VNRecognizeTextRequest para página escaneada/JPEG/PNG. Máximo20páginas/lado2048/texto20000caracteres; abortar exceso, vacío, archivo cifrado/inválido con error útil. Trabajo cancelable y limpieza de bitmaps/texto temporales al cancelar/logout; no alterar ledger de carga ni borrar su adjunto. Carga manual sigue disponible. Fuentes primarias: Apple Vision VNRecognizeTextRequest y PDFKit PDFPage.string.

2. Pantalla premium/fuente sistema iOS existente muestra progreso, texto extraído revisable y aviso de envío del texto al backend/OpenRouter. Consentimiento explícito por operación: no subir documento/binario, no analizar automáticamente por seleccionar cámara/Files. POST /api/mobile/v1/studies/analyze {requestId:UUID,ocrText:string}, Bearer canónico existente, UTF8body≤80KB y texto≤20000, valida identidad/sesión/revocación. Clave OPENROUTER_API_KEY sólo backend runtime, modelo openai/gpt-4o-mini/prompt web actual incluidos médico y fecha DD-MM-YYYY. Validar JSON y límites/campos/fecha; no aceptar campos desconocidos ni sugerencias inválidas como hechos.

3. Preflight exige LIMIT_ANALYZE entero positivo, count_analyze/date_analyze y tabla de operaciones/reservas con índice único dueño/requestId. SQL aditivo TEST manual revisable, sin DDL automático ni destrucción. Adaptación focal de acción web y endpoint comparten reserva concurrente por usuario/día config/date y mismo límite: éxito validado convierte reserva en count_analyze, errores definitivos del proveedor/JSON inválido liberan reserva sin incrementar cuota de éxito, consistente con la semántica web. El proveedor puede facturar aunque falle el parseo: explicitarlo, no prometer refund económico. Reserva incierta tras timeout/proceso muerto queda unavailable/unknown y ocupa capacidad conservadoramente hasta fin de ventana diaria; no liberar para iniciar retry automático. Operaciones nuevas requieren petición explícita/consentimiento nuevo. No resetear cuota por desplegar.

4. POST misma requestId nunca repite llamada proveedor. GET /api/mobile/v1/study-analyses/:requestId propio devuelve sólo status pending/completed/failed/unavailable, no texto ni respuesta clínica. Texto y sugerencias viven sólo en memoria durante request; no persistirlas ni logs. Si se pierde la respuesta pagada y GET indica completed/unavailable, comunicar que no pueden recuperarse sugerencias: continuar manualmente o iniciar una operación nueva explícita potencialmente con coste/cuota adicional; nunca cargar otra llamada en silencio. Cancelar cliente no garantiza cancelar proveedor: reconciliar estado/reserva, no reenviar. Capability studiesAnalyze se anuncia sólo con infraestructura disponible; extracción/carga manual independientes.

5. Capturar generación de sesión/borrador/adjunto y versión por campo al iniciar. Mostrar diff de título, institución, médico, fecha y conclusión; usuario acepta campos seleccionados. No sobrescribir campo cambiado después de iniciar sin confirmación específica, no cambiar paciente/archivos y nunca guardar estudio. Fecha mantiene día calendario sin conversión timezone, respeta STUDY_FIELD_LIMITS y validación existente. Resultados de borrador cerrado/logout/adjunto distinto se descartan. VoiceOver, Dynamic Type y Reduce Motion compatibles con componentes premium actuales.

## Risks / Trade-offs

No persistir contenido médico impide recuperar sugerencias tras pérdida de respuesta: priorizar privacidad y comunicar indisponibilidad, conservando requestId sin retry pago automático. Cuota web actual no protege concurrencia: la adaptación focal requiere aprobación explícita del diseño. Tests capturan SDK/fetch; verificar Swift real mediante build/fixtures ficticios en iPhone, sin afirmar calidad OCR por mocks. Prueba IA real requiere consentimiento posterior y texto ficticio.
