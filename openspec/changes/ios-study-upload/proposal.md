## Why

La app iOS ya permite iniciar sesión y consultar estudios propios y familiares, pero necesita volver a la web para incorporar documentación. El usuario aprobó cargar desde cámara o Files con los mismos campos clínicos, límites explícitos y reintentos seguros.

## What Changes

- Formulario nativo desde Inicio, Estudios y un familiar; cámara y Files para PDF, JPEG y PNG.
- Hasta 10 adjuntos, 10 MiB por archivo y 50 MiB por carga, con progreso, cancelación y recuperación sin duplicados.
- API multipart autenticada, cuota diaria existente, ledger durable e idempotencia por propietario.
- Lectura privada de imágenes junto al visor PDF existente.
- Migración aditiva TEST, worker integrado y guía manual; no ejecutar SQL ni desplegar en VPS.
- Excluir DOCX, edición, borrado, OCR y exportación. La propuesta previa `ios-study-management` no se considera implementada ni sustituida en sus demás funcionalidades.

## Capabilities

### New Capabilities
- `ios-study-upload`: captura, formulario, almacenamiento consistente, cuota, idempotencia, recuperación y consulta de adjuntos privados.

### Modified Capabilities
Ninguna: las especificaciones principales actuales sólo contienen shell y empaquetado; las capacidades de lectura y Familia están en changes aún no archivados.

## Impact

`mobile/`, API `/api/mobile/v1`, `src/mobile-server`, MySQL TEST y filesystem privado `DIRECTORY_UPLOADS`. Incorporar Expo ImagePicker y DocumentPicker compatibles con Expo 57; conservar sesión Google/PKCE, bundle identifier y build IPA. El usuario ya confirmó funcionamiento del backend y carga web tras la corrección de `/app/uploads`; el contexto histórico de configuración no reemplaza esta confirmación. Baselines informados: 80 pruebas backend y 144 móviles, por verificar antes de modificar.
