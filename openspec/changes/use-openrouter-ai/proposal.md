## Why

El usuario solicita usar el mismo modelo de análisis mediante OpenRouter y disponer de una guía completa de variables de despliegue. Hoy existen dos flujos OpenAI: servicio de features y Server Action usada por UploadStudyModal.

## What Changes

- **BREAKING**: ambos flujos utilizarán exclusivamente OPENROUTER_API_KEY, endpoint OpenRouter y modelo openai/gpt-4o-mini. OPENAI_API_KEY deja de habilitar análisis.
- Conservar prompts, temperatura, JSON, DTO y controles de sesión/cuota existentes; inicialización del cliente posterior a validaciones.
- Errores del proveedor no expondrán credenciales ni contenido médico en respuesta/logs.
- Inventariar variables runtime, build públicas, MySQL y Actions con placeholders y pasos de configuración.

## Capabilities

### New Capabilities

- `study-ai-provider`: contrato del análisis existente a través de OpenRouter y configuración del proveedor.

### Modified Capabilities

Ninguna: las specs principales actuales cubren shell y empaquetado iOS.

## Impact

Dos callsites IA, pruebas aisladas SDK/Server Action, documentación EasyPanel y ejemplo de entorno. Sin nuevas dependencias, llamadas pagas, modificaciones de auth, despliegues VPS ni cambios en IPA. El contexto histórico OpenSpec sobre build con clave OpenAI está obsoleto: el build ya funciona sin clave.
