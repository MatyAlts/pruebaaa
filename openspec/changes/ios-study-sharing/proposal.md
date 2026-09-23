## Why

La web comparte enlaces temporales y permite revocarlos; iOS no dispone de endpoints para esas acciones. La paridad requiere conservar autorización y expiración, no enviar documentos sin control.

## What Changes

- Sheet destinatario/vínculo para generar enlace y compartir/copiar URL real.
- Listado enlaces y revocación desde Cuenta, estados primera apertura/expirado/revocado.
- Endpoints Bearer controlados y compatibilidad lector web /s/token24 h desde primera apertura.
- No sustituir URL temporal por compartir PDF ni exponer credenciales sesión.

## Capabilities

### New Capabilities

- `ios-study-sharing`: Sheet destinatario/vínculo para generar enlace y compartir/copiar URL real.

### Modified Capabilities

Ninguna en specs principales. Referenciar contratos en changes previos al implementar; las ampliaciones de privacidad se revisan explícitamente, sin reescribirlos ahora.

## Impact

Fuentes inspeccionadas: components/modals/ShareModal.tsx, SharedLinksModal.tsx; user-dashboard/server-actions/generate-share-link.ts/revoke-shared-link.ts; app/s/[token]/actions.ts; app/api/download-shared-study/[uuid]/route.ts; config/constants.ts.

Dependencias funcionales: ios-home-study-reading, ios-family-records; Cuenta shell desdefoundation. Nuevas cargas disponibles trasstudy-management, no requisito para compartir estudios yaexistentes.

APIs/adaptadores/DDL propuestos para funcionalidad nativa real. Planificación solamente; aprobación de diseño CRITICAL/HIGH antes apply según Decisions. No código ni migración/deploy autorizados por este documento. Mapa y dirección visual en docs/ios-pantallas-roadmap.md.
