## Context

Fuentes inspeccionadas: components/modals/ShareModal.tsx, SharedLinksModal.tsx; user-dashboard/server-actions/generate-share-link.ts/revoke-shared-link.ts; app/s/[token]/actions.ts; app/api/download-shared-study/[uuid]/route.ts; config/constants.ts.

Ver proposal.md para motivación y docs/ios-pantallas-roadmap.md para inventario/dirección de interface-design. Dependencias funcionales: ios-home-study-reading, ios-family-records; Cuenta shell desdefoundation. Nuevas cargas disponibles trasstudy-management, no requisito para compartir estudios yaexistentes.

La API actual cubre lectura propia/Google, no estas escrituras. El bootstrap TEST mínimo no habilita paridad web completa. Usuario confirmó Google/login, no permisos o aceptación de estas funciones nuevas.

## Goals / Non-Goals

**Goals:** pantallas nativas equivalentes y operaciones reales con aislamiento, estados accesibles y contratos verificables.

**Non-Goals:** simular datos/botones, portar DOM/Server Actions, cambiar la web fuera de adaptaciones focales aprobadas, alterar permisos o procesar datos productivos sin aprobación; no ejecutar apply ni deploy en planificación.

## Decisions

API nueva: POST /api/mobile/v1/studies/:id/share-links {doctorName,vinculo}, GET /share-links y DELETE /share-links/:id idempotente. Validar estudio/familiar propio con Bearer canónico. Vínculo usa enum medico/familiar/otro existente; doctorName máximo400 se propone reutilizando límite del campo médico y requiere revisión. URL respuesta es origen HTTPS canónico del backend + /s/token, nunca access/refresh ni rutas de filesystem.

Conservar formato UUID aleatorio de enlaces web existente y TTL24 h desde primera apertura, no desde creación. Fecha fecha_abierto DD-MM-YYYY HH:mm mantiene zona/convenciones existentes. Bloqueo SQL garantiza un único inicio concurrente; revocación conserva compatibilidad con semántica web de backdate si no se añade columna. Comprobar lector /s/token y todos los endpoints públicos de archivos, no solo la lista de enlaces. No asumir que hay tabla links en bootstrap TEST ni modificarla sin DDL real revisado.

Sheet nativa recoge destinatario/vínculo y presenta URL real; compartir texto y copiar URL mediante APIs compatibles. Cancelar share sheet no se anuncia como enviado. No enviar PDF como sustituto de enlace temporal. Estado de enlaces vive en memoria y logout lo limpia. Las previsualizaciones externas pueden consumir primera apertura según comportamiento web actual: documentar límite, no prometer primer acceso humano.

Diseño de permisos, privacidad, tokens públicos, expiración y revocación CRITICAL requiere aprobación antes apply. Web mantiene comportamiento compatible; correcciones necesarias se acotan y revisan, no auditoría/rewrite general.

Identidad: CSS actual Mi Saluteca, Inter y spacing4pt, carpeta clínica/paciente/fecha/adjuntos. Usar superficies sólidas, sheets/forms nativos y barra de sistema de foundation. Contraste normal ≥ 4.5:1/grande ≥ 3:1; verde de marca como acento con tinta oscura, nunca blanco ilegible. Dynamic Type, VoiceOver, teclado/scroll, loading/empty/error/cancel/retry se diseñan como comportamiento.

## Risks / Trade-offs

Compartir cambia frontera privacidad → aprobación diseño owner/family/token/TTL/primarywebreader antes escribir. Copias externas y previewbots no quedanlimpiadasporlogout. Revocación necesita comprobartodosdownloadroutes y sesiónwebactualcompat sin broadunapprovedfix.

## Migration Plan

Revisar y aprobar el diseño concreto del dominio antes apply cuando sea CRITICAL/HIGH; no se solicita aprobación durante esta planificación. Safety net y un RED mínimo ejecutado, GREEN confirmado, triangulación ≥ 2casos y refactor con rerun por comportamiento. Validación SQL/HTTP en MySQL dedicado de prueba, sin credenciales de producción ni llamadas pagas automáticas. Migración TEST/deploy requieren autorización externa específica.

Backend publica capability sólo después de endpoint real compatible; UI no presenta acciones futuras como disponibles. Rollback UI/IPA a versión anterior y backend compatible; mantener outbox y datos necesarios para operaciones ya confirmadas, sin borrar tablas de negocio. Distinguir commit de datos y cleanup físico cuando aplique; ninguna aceptación manual se completa por mocks. No archivar changes previos ni cambiar su evidencia.
