# Próximo paso: grupo familiar nativo

Fecha: 18-09-2026. Diseño para revisión del change existente `ios-family-records`; no constituye aprobación ni implementación. CLI confirma sus cuatro artifacts completos y las seis tareas de implementación pendientes. No se modifican sus tareas ni sus escenarios.

## Entrega y contrato

La próxima entrega agrega tab Familia, lista, alta, renombrado, detalle y estudios paginados de cada familiar. El formulario pide solamente nombre: trim, obligatorio, máximo 40 caracteres. No se inventan parentesco, cumpleaños ni invitaciones. Conserva tarjetas clínicas sólidas, navegación nativa, Inter, teclado/scroll, Dynamic Type, VoiceOver y estados de carga, vacío, error y reintento.

| Operación | Ruta bajo `/api/mobile/v1` |
|---|---|
| Lista / alta | GET / POST `/family-members` |
| Detalle / renombrar | GET / PATCH `/family-members/:uuid` |
| Estudios | GET `/family-members/:uuid/studies` |
| Eliminación explícita | DELETE `/family-members/:uuid` |
| Estado de limpieza | GET `/operations/:operationId` |

La cuenta procede únicamente del Bearer canónico existente. El servidor genera UUID y obtiene email del usuario; rechaza identidad enviada por el cliente. Cada operación exige UUID y propietario coincidentes; ajeno o ausente devuelve 404. Consultas de estudios exigen simultáneamente propietario del estudio y del familiar. DTO expone paciente `self` o `family`, identificador y nombre. El listado v1 conserva `scope=self` por defecto; ampliaciones `self|all|family`, filtros y cursor quedan ligados a usuario y selección. Resumen cuenta el historial completo autorizado; fecha civil mantiene orden validado por fecha y desempate ID. Capabilities se anuncian solo con endpoints operativos. No hay botón de subir hasta la entrega de carga.

## Esquema TEST aditivo propuesto

El usuario confirmó que `portfolio` es la base de prueba creada con `database/mobile-test-bootstrap.sql`. Ese bootstrap no contiene `familiares` ni `links`; incluye `estudios.id_familiar` sin foreign key y `estudios_archivos.id_estudio` con borrado en cascada. Esta revisión inspecciona el script local, **no** el servidor desplegado.

Preparar, después de aprobación, `database/mobile-test-family.sql` y su verificación previa de columnas/tipos/índices sobre MySQL aislado. Se conservarán usuarios, sesiones y estudios existentes; una tabla existente incompatible debe provocar rechazo, nunca quedar legitimada mediante `IF NOT EXISTS`.

| Tabla aditiva | Columnas / restricciones propuestas |
|---|---|
| `familiares` | `id INT AUTO_INCREMENT PRIMARY KEY`; `uuid CHAR(36) NOT NULL UNIQUE`; `id_usuario INT NOT NULL`; `email_usuario VARCHAR(255) NOT NULL`; `nombre VARCHAR(255) NOT NULL` con límite de entrada 40; `fecha_nacimiento VARCHAR(10) NULL` por compatibilidad histórica, sin input nuevo; `created_at`, `updated_at VARCHAR(20) NOT NULL`; índice propietario/ID; FK a `users.id` con RESTRICT |
| `mobile_cleanup_operations` | `operation_id CHAR(36) PRIMARY KEY`; `id_usuario INT NOT NULL`; estado pendiente/completa; marcas de creación/actualización. Propietario retenido como dato de autorización sin FK a familiar/estudios eliminados |
| `mobile_cleanup_files` | ID autoincremental; `operation_id` FK a operación con RESTRICT; `file_key VARCHAR(500)`; estado pendiente/completa; intentos, próximo intento y lease de reclamación; índice estado/próximo intento; deduplicación de clave por operación |

Las filas de outbox no dependen mediante FK de datos borrados. Límites concretos de lote, lease y reintento deben fijarse con pruebas antes de habilitar el worker; un fallo permanente sigue visible como pendiente, sin promesa falsa de éxito. No se agrega cascada familiar a `estudios`: el servicio elimina explícitamente dentro de transacción, manteniendo la lectura previa y validando datos inconsistentes. No ejecutar los scripts históricos de familiares: `create-familiares-table.sql` carece de UUID y usa DATE; `migrate-familiares-to-id.sql` modifica una estructura antigua distinta.

## Eliminación incluida en el change actual

El change **ya incluye DELETE destructivo**, no solo alta y edición. La pantalla advierte que eliminará familiar, sus estudios, adjuntos y acceso mediante enlaces, y exige escribir `misaluteca`. Cancelar no envía DELETE ni modifica datos.

Una transacción bloquea el familiar propio y selecciona solamente sus estudios propios. Datos incoherentes asociados a otra cuenta provocan rechazo sin borrarlos. Registra claves legacy y adjuntos deduplicadas en la outbox, invalida enlaces existentes de esos estudios, elimina registros de adjuntos/estudios y finalmente familiar; rollback conserva todo si cualquier paso falla. En el TEST confirmado `links` está ausente: la prevalidación detecta esa ausencia expresamente y no crea una tabla de sharing ficticia. Si hay tabla `links`, verifica sus columnas reales `id_estudio`/`id_usuario` y elimina los enlaces afectados en la misma transacción; incompatibilidad rechaza la operación.

Tras commit devuelve 202 con `operationId` y estado real. Las rutas de lectura ya no permiten acceder a filas borradas. El worker interno reclama lotes con lease, verifica que cada ruta pertenece al directorio privado del propietario, rechaza traversal/symlinks o claves ambiguas/compartidas con estudios conservados y usa la resolución absoluta/relativa correcta de `DIRECTORY_UPLOADS`. Reintenta limpieza física; ENOENT es éxito idempotente. Reiniciar el proceso no pierde la operación. GET de estado exige dueño coincidente y no expone rutas privadas.

**Recuperable significa reintentar limpieza**, no deshacer la eliminación: después del commit no se restauran registros ni archivos eliminados. No hay restauración prometida. El borrado filesystem previo a SQL de la acción web histórica no se copia. El worker necesita integración interna con el proceso desplegado y Docker, nunca un endpoint público que acepte rutas.

## Relación con la carga web pospuesta

La migración familiar es necesaria para Familia aunque el usuario haya pospuesto la reparación de carga web. Esa reparación sigue pospuesta: este diseño no agrega `users.count_files`/`date_files`, no amplía campos de estudio ni cambia el POST web. La resolución privada de rutas del worker nuevo no modifica el uploader web. Por lo tanto **no afirma que subir desde la web quede arreglado**. Cámara, Files y carga real constituyen la entrega siguiente, que requiere el contrato de upload ya propuesto.

## Pruebas, despliegue y autorización

Aplicar el change completo requiere aprobar este diseño de permisos, DDL y eliminación antes de escribir código: tarea 1.1 y reglas del proyecto HIGH/CRITICAL. Después: safety net, RED ejecutado, GREEN, triangulación de dos cuentas, nombres 0/40/41, UUID ajeno, resúmenes completos, rollback, cancelación, rutas confinadas, reintentos/ENOENT y estado ajeno. Verificar MySQL/HTTP reales, tests móviles, tipos/lint, Docker y IPA macOS. Aceptación física permanece pendiente hasta pruebas del usuario.

La autorización solicitada cubre implementación local, migración TEST preparada y probada, worker y pantallas; **no SQL en VPS, importación productiva ni deploy**. El usuario aplicará la migración revisada y desplegará en EasyPanel. OAuth/PKCE y sesiones existentes permanecen intactos.

Pregunta recomendada: **¿Aprobás implementar `ios-family-records` con aislamiento por cuenta, migración TEST aditiva y eliminación de familiar con sus estudios/archivos, confirmación `misaluteca` y limpieza reintentable mediante outbox, sin ejecutar SQL ni desplegar en tu VPS?**

Si se prefiere solo listar/agregar/renombrar inicialmente, es una alternativa válida, pero exige revisar/splittear explícitamente los artifacts antes de apply: no marcar terminado el change completo ni omitir sus escenarios DELETE silenciosamente.

## Fuentes verificadas

- `openspec status --change ios-family-records --json`; proposal, design, tasks y spec del change.
- `docs/ios-next-screens-proposal.md`, `docs/easypanel-web-schema-diagnosis.md`.
- `database/mobile-test-bootstrap.sql`, `database/create-familiares-table.sql`.
- `src/features/family/repositories/family.repository.ts`: UUID y campos reales; no reutilizar su lookup UUID sin dueño como autorización móvil.
- `src/features/studies/repositories/study.repository.ts`: modelo legacy/adjuntos y selección familiar.
- `src/features/sharing/repositories/sharing.repository.ts`: relación de enlaces con estudios.
- `user-dashboard/server-actions/delete-family-member.ts`: comportamiento histórico filesystem/SQL que esta entrega reemplaza únicamente para el contrato móvil nuevo.
