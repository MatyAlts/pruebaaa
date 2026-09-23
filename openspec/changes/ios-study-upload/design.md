## Context

Ver propuesta. API Bearer, Filesystem privado, MySQL y supervisor Docker ya existen. Google/PKCE y lecturas de estudios propios/familiares permanecen. La fecha civil usa `DD-MM-YYYY`; el día de cuota conserva `config/date.ts` (reloj menos tres horas).

## Goals / Non-Goals

La unidad de commit es un estudio con todos sus adjuntos y un incremento de cuota. Evitar éxito parcial, duplicados y acceso entre propietarios. No cambiar sesión, cuota web concurrente, OCR, CRUD de edición/borrado ni almacenamiento externo.

## Decisions

### Contrato HTTP

`POST /api/mobile/v1/studies`, Bearer e `Idempotency-Key` UUID. Multipart repetido `files` más campos `date`, `title`, `institution`, `medico`, `conclusion`, `description`, `patient` (`self|family`) y `familyUuid` sólo familiar. Fecha obligatoria civil válida; campos opcionales recortados, título vacío se guarda `Estudio médico`. Máximos Unicode en caracteres: título/institución/médico 400, conclusión 10000, notas 2000. Rechazar campos desconocidos/repetidos incompatibles y paciente extranjero con 404.

Respuesta commit 201 `{studyId,operationId,status:"complete"}`; repetición completa 200 mismo resultado; activa 202 `{operationId,status:"pending"}`. `GET /study-uploads/:idempotencyKey` devuelve `{operationId,status:"pending"|"complete"|"failed",studyId?,errorCode?,retryable?}` del propietario; desconocido/ajeno 404. Operación fallida sólo puede reintentarse con mismo fingerprint si es `retryable`; distinta carga/misma clave 409 `IDEMPOTENCY_CONFLICT`. Validación 400, tamaño 413, formato 415, cuota 429 `UPLOAD_LIMIT_REACHED`, DDL/worker no listo o almacenamiento no disponible (ENOSPC/EACCES antes de commit) 503 `UPLOAD_UNAVAILABLE`; fallas inesperadas 500 sin rutas ni secretos. Detalles internos y rutas no salen del servidor. Capabilities `studiesUpload` y `studyImagesRead` sólo por readiness real.

### Parser, identidad y límites

Parser multipart streaming con límites antes y durante lectura; no `request.formData()` que bufferice 50 MiB. Máximo 10 archivos y al menos uno, 10 MiB cada uno, 50 MiB bytes de adjuntos sumados; límite total de cuerpo multipart 50 MiB incluidos cabeceras/campos. Un total de archivos exactamente 50 MiB puede exceder el cuerpo por overhead y recibir 413; no prometer que ese extremo siempre se acepta. Validar extensión/MIME y firma PDF/JPEG/PNG, sin afirmar antivirus ni validez documental semántica. Cliente informa HEIC no soportado o cámara entrega JPEG mediante adaptación explícita; nunca renombrar bytes HEIC a JPG. Claves generadas por servidor, staging y finales en dueño canónico, sin nombres del cliente, traversal ni symlinks; root absoluto `/app/uploads` y permisos usuario node. Rechazar cuerpo no autorizado antes de ingestión y revalidar sesión/paciente antes de commit.

Parser Busboy y decodificadores puros JavaScript `jpeg-js`/`pngjs`, sin dependencia nativa sharp. Verificar dimensiones antes de asignar/decode: máximo 8192 por lado y 24 megapíxeles por archivo; decodificar de a un adjunto, validar estructura raster y conservar orientación Exif JPEG. La firma sola no valida estructura; estas verificaciones tampoco prometen interpretación clínica, antivirus ni conformidad exhaustiva PDF. Capability `uploadLimits` informa los límites efectivos para UI.

### Ledger y recuperación

Ledger durable único `(owner,idempotencyKey)`, fingerprint canónico de campos/paciente y hashes/orden de adjuntos, estados y lease cercado. Manifiesto durable precede movimientos; promociones privadas no son públicas. Transacción bloquea usuario/cuota, revalida familiar, inserta estudio/archivos, aumenta `count_files` una vez y cierra ledger. Límite `LIMIT_UPLOAD` existente, default 20 estudios/día, no número de adjuntos. Reinicio/disco lleno/desconexión/rollback se recuperan automáticamente mediante worker privado del supervisor Docker; lease obsoleto no promociona/borra ni duplica. Nunca borrar archivo retenido o compartido. La serialización de cuota garantiza solicitudes iOS; web existente no usa ese bloqueo y su carrera concurrente queda documentada, sin prometer cobertura global.

### Cliente nativo

Expo ImagePicker `~57.0.18`, DocumentPicker `~57.0.2` con FileSystem ya presente; autor valida compatibilidad oficial antes de lock. RN XHR multipart ofrece progreso/abort; tras 401 renovar una vez y reconstruir cuerpo con misma clave. Mantener sólo estado de recuperación acotado en memoria por cuenta; no tokens ni archivos clínicos públicos. Mantener adjuntos locales hasta resultado definitivo. Error de red o abort después de envío exige consultar estado antes de nueva operación; claves nuevas sólo para nueva carga. Logout/generación invalidan callbacks y eliminan borrador/caché local propios. Permisos denegados/cancelación no se muestran como fallo de carga.

La clave cliente se mantiene estable en memoria por cuenta durante borrador/reintentos; no persistir borradores clínicos ni preferencias. El ledger durable es del servidor. La consulta recupera resultado de una clave conocida; tras cierre total sin clave no prometer recuperación de borrador ni reenviar automáticamente.

Formulario modal con safe area, branding actual, acciones accesibles y paciente inicial desde familiar o selector self/familia. Confirmación sólo tras commit; invalidar Inicio/listas/summaries en scopes pertinentes. JPEG/PNG privados se obtienen por Bearer en caché local owner-bound; no URLs públicas, navegador ni descarga con sesión web. PDF existente se conserva.

El lector nativo extiende `SalutecaPreview`: PDFKit conserva PDF y `UIImageView` dentro de `UIScrollView` muestra JPEG/PNG, con MIME tipado, validación/dimensiones acotadas, misma protección de archivo y cierre/limpieza ante logout. No compartir, exportar ni guardar en Photos.

## Risks / Trade-offs

- Filesystem y MySQL no tienen transacción distribuida → ledger/manifiesto, promoción privada y recuperación probada mediante fallos de proceso reales.
- Cierre abrupto de iOS puede perder clave y URI temporal → no prometer borrador recuperado ni reenviar automáticamente; revisar historial antes de iniciar otra carga para evitar duplicado manual.
- Proxy puede limitar multipart antes de app → guía EasyPanel para tamaño/timeout suficiente, sin cambiar puerto interno 3000.
- DDL o worker absent → capability desactivada, lectura/login siguen funcionando.

## Migration Plan

Migración TEST revisable que añade ledger y columnas faltantes `users.count_files/date_files`, amplía sólo capacidades insuficientes para los campos web, valida tipos/PK/FK/indexes/engine/nullability y conserva filas. Guía manual: backup, preflight, SQL por usuario, volumen, worker, variables y límites proxy, deploy y smoke. Agentes no ejecutan SQL ni despliegan en VPS. Rollback deshabilita capability/revierte imagen compatible conservando datos/ledger; no borrar estudios para retroceder. CI comprueba Docker con worker, MySQL/HTTP/FS reales y macOS IPA exacto. Aceptación física separada queda pendiente hasta pruebas del usuario.
