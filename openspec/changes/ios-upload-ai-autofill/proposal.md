## Why

El formulario iOS ya admite PDF/JPEG/PNG pero requiere completar metadatos manualmente. El usuario solicita asistencia equivalente a la web con revisión humana y sin exponer claves o enviar documentos completos al proveedor.

## What Changes

- Extraer texto local de un adjunto PDF/JPEG/PNG del borrador mediante el puente Swift existente y Vision/PDFKit.
- Revisar texto, consentir envío y solicitar sugerencias de título, institución, médico, fecha y conclusión a OpenRouter mediante backend autenticado.
- Cuota diaria compartida con la web, requestId y reconciliación sin reintentos pagados automáticos.
- Aplicar sugerencias aceptadas sin guardar automáticamente ni sobrescribir ediciones posteriores.
- Mantener carga manual, permisos y coordinador de carga existentes; preflight y SQL TEST manual.

## Capabilities

### New Capabilities

- `ios-upload-ai-autofill`: asistencia IA opcional para los formatos actuales de carga móvil.

### Modified Capabilities

Ninguna.

## Impact

Puente SalutecaPreview, formulario premium, endpoint y cuota OpenRouter compartida con acción web, tests/guía EasyPanel. Diseño CRITICAL/HIGH pendiente de aprobación antes de source. No incluye DOCX/ZIP, edición ni sharing: ios-ocr-assistance conserva su propuesta futura completa, sin reducir sus formatos/tareas. No llamadas pagas automatizadas, DDL ni despliegue VPS.
