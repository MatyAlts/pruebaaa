# Propuesta: carga, familia y perfil para iOS

Fecha: 18 de septiembre de 2026. Estado: propuesta concreta de próxima entrega; no modifica los artifacts existentes ni constituye aprobación de operaciones destructivas, migraciones o despliegues.

## Punto de partida

El usuario mostró la nueva interfaz instalada: login de marca, Inicio, Estudios y Cuenta. En estas capturas los encabezados ya aparecen debajo de la barra de estado y la navegación nativa conserva su material de sistema. Esta evidencia visual no verifica VoiceOver, tamaños de texto alternativos, fallback de otra versión de iOS, filtros con datos, permisos de cámara ni pruebas entre cuentas. No se copian datos personales de las capturas.

`docs/ios-pantallas-roadmap.md` describe el hito anterior como en implementación y todavía menciona el solapamiento de títulos de las capturas anteriores. Es contexto histórico: para el estado vigente deben consultarse CLI, checklists y evidencia de la entrega publicada. Los tres changes de esta propuesta tienen planificación completa y 0/6 tareas ejecutadas cada uno al consultar `openspec instructions apply`.

La API actual expone perfil, lectura propia, resumen y búsqueda. No tiene endpoints móviles de familiares, carga ni edición: `src/mobile-server/http.ts:150` anuncia únicamente las capacidades reales existentes. La carga web utiliza cookies y no se invoca como sustituto del nuevo contrato Bearer.

## Entrega propuesta

1. Cuenta con foto Google y acceso a Configuración del perfil; nombre y email de Google de solo lectura, información de acceso, términos, privacidad, Acerca de y cierre de sesión existente.
2. Familia con lista, agregar, renombrar y detalle con sus estudios. Resúmenes y filtros distinguen paciente propio y familiares de la cuenta.
3. Cargar estudio desde cámara o Archivos de iOS, con formulario equivalente a la web y guardado real para la persona o un familiar propio.
4. Icono iOS derivado del favicon web existente, conservando su artwork y el identificador `com.matyalts.misaluteca`.

Se conservan Inter, colores actuales, tarjetas sólidas para lectura y material nativo en navegación. Formularios deben funcionar con teclado, scroll, Dynamic Type y VoiceOver. No se presentan botones de funcionalidades futuras como operativos.

## Perfil e icono

La foto ya está en el contrato: `src/mobile-server/mysql-auth-store.ts:130` consulta `users.image` y `mobile/src/session.ts:5` admite `image`. Mostrar esa imagen con recorte circular; usar iniciales cuando falta o no carga, incluyendo modo sin conexión. No modificar Google OAuth, solicitar scopes nuevos ni inventar almacenamiento de fotos.

La web muestra identidad de solo lectura (`user-dashboard/settings/SettingsPageClient.tsx:69` y `:82`). No se propone editar email, nombre Google ni contraseña. Los enlaces compartidos y la eliminación de cuenta presentes en la web pertenecen a futuros alcances con autorización específica.

Fuente del icono: `app/favicon.ico`; preparar el recurso de icono requerido por Expo/iOS desde ese artwork, sin redibujar la marca ni introducir generación de imágenes. Verificar calidad a tamaño de icono y ausencia de transparencia en el recurso iOS. Revisar el icono instalado al probar el IPA.

## Formulario de carga: contrato observado

Fuentes: `components/modals/UploadStudyModal.tsx:219`, `:465`, `:519`, `:531`, `:545`; `app/api/upload-study/route.ts:52`; límites en `config/constants.ts:3` y `:14`.

| Campo visible | Nombre enviado | Regla |
|---|---|---|
| Archivos | `files`, repetido | De 1 a 10; PDF, JPEG, PNG o DOCX; máximo 10 MiB por archivo |
| Fecha | `date` | Fecha civil DD-MM-YYYY; valor inicial hoy; límite de campo 30 |
| Nombre del estudio | `title` | Opcional, máximo 400; vacío usa «Estudio médico» |
| Institución | `institution` | Opcional, máximo 400 |
| Médico | `medico` | Opcional, máximo 400 |
| Observaciones | `conclusion` | Opcional, máximo 10000 |
| Notas adicionales | `description` | Opcional, máximo 2000 |
| De quién es este estudio | `familyMemberId` | Para mí o un familiar propio; selección inicial contextual |

La web etiqueta Fecha como opcional, pero `app/api/upload-study/route.ts:83` rechaza fecha vacía. Propuesta para iOS: fecha válida obligatoria, inicialmente hoy, sin cambios de zona horaria; documentar esta corrección de presentación y conservar los campos restantes. No modificar la web como parte de esta entrega.

El máximo de diez archivos **ya existe** tanto en UI como en backend web (`app/api/upload-study/route.ts:68`). El límite de **50 MiB agregados de archivos por carga** es una política nueva propuesta por el diseño móvil, distinta del máximo observado de 10 × 10 MiB. Requiere aprobación explícita y debe mostrarse antes de guardar; el parser además tendrá un límite de bytes multipart con margen acotado para metadata y headers, no una lectura ilimitada.

## Cámara y Archivos

Los artifacts actuales de `ios-study-management` mencionan picker y cancelación genéricos; **no especifican cámara ni Files explícitamente**. La revisión propuesta debe incorporar ambos antes de implementar.

- Cámara: pedir permiso únicamente al elegir Tomar foto, explicar que se usa para adjuntar el estudio y ofrecer Archivos si se deniega. No pedir micrófono ni permisos adicionales sin necesidad. Normalizar captura a JPEG/PNG compatible y verificar el tamaño final; no asumir que HEIC es formato aceptado por el servidor.
- Archivos: document picker del sistema con formatos permitidos y selección múltiple; soportar importación desde proveedores de Files, error de descarga y cancelación sin perder campos manuales.
- Mostrar nombre, tamaño y cantidad de adjuntos; permitir quitar uno antes de guardar. Cancelación no debe guardar un estudio ni consumir cuota. Draft en memoria e imports temporales privados, sin persistir documentos médicos en logs.
- Guardar informa progreso real o estado indeterminado si la API nativa no ofrece bytes enviados; no mostrar porcentajes inventados. Errores de formato, fecha, cuota y red conservan la posibilidad de corregir/reintentar. Un resultado ambiguo se resuelve con la misma clave idempotente, sin duplicar estudio.
- Logout o cambio de generación cancela solicitudes cuando sea posible y descarta resultados tardíos; limpiar imports privados. No exportar automáticamente a Fotos, Files ni otras aplicaciones.

Seleccionar módulos compatibles leyendo documentación primaria de Expo 57, como exige `mobile/AGENTS.md`; permisos y funcionamiento se validan también en IPA instalado.

## Familia y contrato backend a revisar

El formulario web solo pide nombre obligatorio, con trim y máximo 40 (`components/modals/AddFamilyMemberModal.tsx`, `config/constants.ts:4`). No agregar parentesco, cumpleaños, email o invitaciones ficticias.

Endpoints móviles propuestos, actualmente inexistentes:

| Operación | Endpoint |
|---|---|
| Lista / crear | GET / POST `/api/mobile/v1/family-members` |
| Detalle / renombrar | GET / PATCH `/api/mobile/v1/family-members/:uuid` |
| Estudios del familiar | GET `/api/mobile/v1/family-members/:uuid/studies` |
| Crear estudio | POST `/api/mobile/v1/studies`, multipart |

Diseño HIGH/CRITICAL concreto para revisión: dueño derivado exclusivamente del Bearer canónico; familiar validado contra ese dueño en lectura y escritura, UUID ajeno/ausente recibe 404; ningún `userId`, email, ruta o fileKey del cliente determina identidad o almacenamiento. Mantener el listado v1 anterior con scope propio por defecto; nuevos scopes explícitos self/all/family requieren autorización y cursor ligado al usuario y filtros. Resúmenes cuentan todo el historial autorizado, no la primera página.

Upload: validar bytes, MIME y estructura —incluyendo DOCX ZIP con límites de expansión y rutas— antes de publicar archivos; streaming acotado y staging privado; transacción y finalización recuperable sin estudios parciales accesibles; cuota `LIMIT_UPLOAD` con bloqueo concurrente y fecha de contador del servidor; clave idempotente ligada a cuenta y payload. La semántica de contador debe inspeccionarse y fijarse con tests sobre el esquema real antes de afirmar equivalencia: el uploader web tiene comentarios mezclados sobre archivos/estudios. Revisar DDL TEST necesario para familiares, adjuntos, cuota e idempotencia; no asumir que el bootstrap mínimo de lectura ya sirve.

Esta revisión no autoriza migraciones ni escrituras sobre VPS/producción. Las pruebas usan MySQL aislado y fixtures de dos cuentas. Capabilities se publican solo cuando las rutas funcionan; frontend conserva lectura previa mientras el usuario despliega backend.

## Mapeo y revisión de OpenSpec propuesta

| Change existente | Primera fase propuesta | Alcance futuro conservado |
|---|---|---|
| `ios-account-settings` | Foto, perfil readonly, legales, Acerca de, logout; actualizar el supuesto antiguo de que image podría faltar del DTO | Enlaces cuando sharing exista; eliminación permanente, reauth/auth_time y revocación quedan pendientes con su gate CRITICAL |
| `ios-family-records` | GET/POST/PATCH, carpeta familiar, paciente/resumen/filtros y UI reales | DELETE en cascada y outbox destructivo conservan revisión/confirmación independiente |
| `ios-study-management` | POST, cámara/Files, campos exactos, permisos, idempotencia, cuota y cleanup de imports | PATCH/DELETE y exportación opt-in conservan tareas y revisión de privacidad, sin considerarlas terminadas |

Revisar/splittear planificación mediante `openspec-update-change` tras confirmar el alcance por change. Este documento no edita specs existentes, no elimina sus escenarios futuros ni marca sus tareas completas. Icono puede incorporarse a un change acotado de identidad o a una revisión explícita de foundation; no mezclarlo silenciosamente con seguridad.

## Orden, validación y resultado

Primero perfil/avatar/icono con contratos actuales. Después aprobar e implementar Familia antes de habilitar upload para paciente familiar; seguir con contrato de carga y cámara/Files. Implementar por comportamiento con safety net, RED ejecutado, GREEN, triangulación y refactor; verificar MySQL/HTTP con dos cuentas, tests móviles, tipos/lint, Doctor, Docker e IPA en macOS.

Aceptación física pendiente: avatar real/fallback, icono, denegar permiso, tomar foto, cancelar cámara/Files, adjuntos de cada formato, límites, teclado/texto grande, familiar propio, resultado y actualización de Inicio/Estudios, error de red y logout durante carga. Los resultados de pruebas automáticas no sustituyen estas comprobaciones.

Resultado esperado: documentos y familiares guardados en el backend real, foto Google visible cuando está disponible, configuración fiel a la identidad Google y nuevo IPA verificable. Eliminación de cuenta/familia/estudios, exportar, enlaces temporales y OCR/IA permanecen como desarrollos futuros con sus gates explícitos; no forman parte del permiso solicitado en esta propuesta.
