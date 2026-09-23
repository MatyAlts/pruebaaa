## Context

Fuentes inspeccionadas: user-dashboard/family/FamilyDashboard/FamilyDashboard.tsx, FamilyMemberDetail.tsx, FamilyMemberActions.tsx; components/modals/AddFamilyMemberModal.tsx; user-dashboard/server-actions/new-member-family.ts/edit-family-member.ts/delete-family-member.ts; config/constants.ts.

Ver proposal.md para motivación y docs/ios-pantallas-roadmap.md para inventario/dirección de interface-design. Dependencias funcionales: ios-home-study-reading. Upload de estudios familiares depende después ios-study-management; no CTA upload antes.

La API actual cubre lectura propia/Google, no estas escrituras. El bootstrap TEST mínimo no habilita paridad web completa. Usuario confirmó Google/login, no permisos o aceptación de estas funciones nuevas.

## Goals / Non-Goals

**Goals:** pantallas nativas equivalentes y operaciones reales con aislamiento, estados accesibles y contratos verificables.

**Non-Goals:** simular datos/botones, portar DOM/Server Actions, cambiar la web fuera de adaptaciones focales aprobadas, alterar permisos o procesar datos productivos sin aprobación; no ejecutar apply ni deploy en planificación.

## Decisions

API nueva: GET/POST /api/mobile/v1/family-members; GET/PATCH/DELETE /family-members/:uuid y GET /family-members/:uuid/studies. Validar siempre id_usuario desde Bearer canónico y familiar perteneciente a la cuenta; UUID ajeno o ausente devuelve404. POST/PATCH acepta solo nombre con trim y máximo40 caracteres. Rechazar userId/email enviados como identidad.

Extender consultas Estudios con scope=self|all|family y familyUuid validado; el contrato anterior sigue scope=self. DTO de paciente identifica kind/self/family, id y nombre. Resumen usa consultas completas propio/familiar/total, no filas cargadas. La tab Familia y sus filtros aparecen tras capability servidor real. Subir no aparece hasta write disponible.

DELETE requiere confirmation=misaluteca e informa cascada de estudios, adjuntos y enlaces. Transacción SQL aplica borrado autorizado y encola rutas privadas confinadas en outbox aditiva sin FK a filas borradas. Worker acotado reintenta unlink y trata ENOENT como éxito idempotente. Respuesta202 con operationId y estado; GET operations está ligado al mismo dueño. UI diferencia commit aplicado de limpieza física pendiente; no promete borrado completo antes de comprobarlo.

Revisar DDL real TEST de familiares y referencias observadas antes de preparar migración; no suponer tablas/CASCADE del bootstrap mínimo. El diseño concreto de autorización, cascada, outbox y DDL requiere aprobación CRITICAL/HIGH antes apply. Protocolos Google existentes permanecen.

Identidad: CSS actual Mi Saluteca, Inter y spacing4pt, carpeta clínica/paciente/fecha/adjuntos. Usar superficies sólidas, sheets/forms nativos y barra de sistema de foundation. Contraste normal ≥ 4.5:1/grande ≥ 3:1; verde de marca como acento con tinta oscura, nunca blanco ilegible. Dynamic Type, VoiceOver, teclado/scroll, loading/empty/error/cancel/retry se diseñan como comportamiento.

## Risks / Trade-offs

Borrado cascadearía salud/datos → CRITICAL/HIGH review de ownership, DDL, límites y cleanup antes producción de este change. Referencia web borra filesystem antes DB y no es contrato a copiar: transaction+outbox evita falsa atomicidad. Filesystem no participa en SQLtx; worker inaccesible a app y rutas confinadas. Web permanece intacta.

## Migration Plan

Revisar y aprobar el diseño concreto del dominio antes apply cuando sea CRITICAL/HIGH; no se solicita aprobación durante esta planificación. Safety net y un RED mínimo ejecutado, GREEN confirmado, triangulación ≥ 2casos y refactor con rerun por comportamiento. Validación SQL/HTTP en MySQL dedicado de prueba, sin credenciales de producción ni llamadas pagas automáticas. Migración TEST/deploy requieren autorización externa específica.

Backend publica capability sólo después de endpoint real compatible; UI no presenta acciones futuras como disponibles. Rollback UI/IPA a versión anterior y backend compatible; mantener outbox y datos necesarios para operaciones ya confirmadas, sin borrar tablas de negocio. Distinguir commit de datos y cleanup físico cuando aplique; ninguna aceptación manual se completa por mocks. No archivar changes previos ni cambiar su evidencia.
