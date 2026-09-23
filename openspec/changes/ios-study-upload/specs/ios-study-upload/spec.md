## Purpose

Permitir incorporar documentación clínica desde iOS con paciente explícito, adjuntos privados y resultado durable recuperable sin duplicación.

## ADDED Requirements

### Requirement: Native capture and clinical fields
La app SHALL permitir cargar desde Inicio, Estudios y familiar mediante cámara y Files, respetando campos, fecha civil y límites del diseño.

#### Scenario: Camera and Files
- **WHEN** se toma JPEG o se adjunta PDF/PNG/JPEG desde Files y hay permiso
- **THEN** se muestran adjuntos editables antes de enviar y paciente inicial correcto.

#### Scenario: Cancellation or denied permission
- **WHEN** se cancela picker o se niega cámara
- **THEN** no se envía ni consume cuota y se permite volver o revisar permisos.

#### Scenario: Validation boundaries
- **WHEN** fecha es inválida, falta adjunto o campos/10 archivos/10 MiB/50 MiB exceden límites
- **THEN** se informa el campo o límite sin enviar; límites de campo/archivo se permiten exactamente; cuerpo multipart completo también debe caber en 50 MiB, incluido overhead.

### Requirement: Private authenticated ingestion
El servidor SHALL aplicar streaming limitado, verificación de formato y dueño Bearer sin confiar en rutas, identificadores o MIME del cliente.

#### Scenario: Genuine attachment
- **WHEN** propietario vigente sube PDF/JPEG/PNG compatible
- **THEN** sólo se usan staging y claves privadas generadas dentro de su almacenamiento.

#### Scenario: Foreign family or malicious body
- **WHEN** paciente es ajeno, contenido contradice firma o cuerpo supera límites aun sin Content-Length
- **THEN** responde 404/415/413 respectivamente y no crea estudio, cuota ni archivos finales huérfanos.

### Requirement: Durable idempotent commit and quota
El servidor SHALL guardar todos los adjuntos, estudio y cuota una sola vez por clave/fingerprint y recuperar fallos mediante ledger durable.

#### Scenario: Concurrent retries
- **WHEN** misma carga y clave se envían simultáneamente o tras pérdida de respuesta
- **THEN** devuelven mismo estudio o pending, con una inserción y un incremento.

#### Scenario: Conflicting key or exhausted quota
- **WHEN** misma clave cambia contenido o el día alcanza LIMIT_UPLOAD
- **THEN** responde 409 o 429, sin commit parcial; reset diario conserva el reloj existente.

#### Scenario: Crash and stale lease
- **WHEN** proceso muere durante staging/promoción/antes o después de commit y reinicia Docker
- **THEN** worker real recupera estado consistente y lease anterior no altera archivos ni cuotas.

### Requirement: Upload progress and session lifecycle
La app SHALL mostrar progreso, cancelar y consultar estado ambiguo sin crear duplicados ni mezclar cuentas.

#### Scenario: Refresh once
- **WHEN** carga recibe 401 y renovación es válida
- **THEN** reconstruye cuerpo una vez con misma clave; segundo 401 detiene.

#### Scenario: Lost response or logout
- **WHEN** conexión/abort deja resultado desconocido o se cierra sesión durante envío
- **THEN** consulta estado antes de reintentar, descarta callbacks tardíos y limpia caché del dueño anterior.

### Requirement: Private image reading and list refresh
La app SHALL consultar JPEG/PNG por Bearer y actualizar vistas sólo tras commit confirmado.

#### Scenario: Committed family study
- **WHEN** termina una carga familiar
- **THEN** Inicio/scopes/lista familiar se actualizan y PDF e imágenes son consultables por su dueño.

#### Scenario: Cross-account attachment
- **WHEN** otra cuenta pide adjunto o cambia la sesión durante lectura
- **THEN** no recibe bytes ni caché de la cuenta anterior.

### Requirement: Readiness deployment and evidence
El sistema SHALL habilitar carga sólo con schema y recuperación preparados; conservar login/lectura y registrar pruebas ejecutadas e instalación pendiente.

#### Scenario: Missing TEST schema
- **WHEN** faltan ledger/columnas compatibles o runtime de recuperación
- **THEN** capability de carga está desactivada, login/lectura siguen y guía indica migración manual sin ejecutar SQL por agente.

#### Scenario: Valid build
- **WHEN** concluye implementación
- **THEN** se registran baseline y RED/GREEN/triangulación, HTTP/MySQL/FS/Docker reales y IPA macOS verificado; aceptación física requiere confirmación posterior.
