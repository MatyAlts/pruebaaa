## Why

La instalación iOS inicial ya fue validada, pero `mobile/App.tsx` todavía solo presenta una pantalla de prueba. El siguiente incremento debe demostrar un recorrido real con la misma identidad y datos que la web: Google → estudios propios → detalle/PDF → cerrar sesión.

## What Changes

- Diseñar e incorporar, después de aprobación explícita de seguridad, acceso móvil mediante navegador del sistema sobre Google/NextAuth existente, intercambio de código de un uso con PKCE y sesión Bearer revocable independiente de cookies web.
- Exponer API `/api/mobile/v1` de identidad, estudios propios paginados, detalle y descarga de archivo autorizado, adaptando servicios/repositorios del servidor.
- Añadir navegación nativa, almacenamiento seguro de credencial móvil, estados de carga/vacío/error/reintento y logout con limpieza de información y PDF temporal.
- Mantener representación `files[]` y soporte explícito de archivos legacy; no revelar claves ni rutas del filesystem.
- Sustituir el mensaje de shell de prueba por entrada funcional de login y estudios, conservando apertura local sin Metro.
- Validar contrato y aislamiento entre usuarios con TDD, después backend HTTPS real e IPA en dispositivo. La compilación del IPA no despliega endpoints backend.

Fuera de alcance: familia, escritura/carga/eliminación de estudios, OCR/IA, compartir públicamente, caché médica offline, nuevos proveedores de identidad, App Store y cambios de storage. El entorno HTTPS y Google configurado requieren datos externos antes de ejecutar integración; no se presupone servidor desplegado para este clon.

## Capabilities

### New Capabilities

- `mobile-session`: vínculo de identidad web/móvil, intercambio seguro, expiración, renovación y revocación.
- `mobile-study-reading`: listado paginado, detalle y PDF autorizado, con estados distinguibles y limpieza local.

### Modified Capabilities

- `ios-app-shell`: reemplazar pantalla de prueba por entrada funcional y mantener apertura autónoma; sin conectividad se muestra login o estado offline, sin prometer estudios offline.

## Impact

Rutas nuevas `app/api/mobile/v1/`, puente web acotado de autorización, módulos de sesión móvil servidor, migración aditiva MySQL para códigos/sesiones revocables y extensiones de lectura paginada existentes. Cliente `mobile/` incorpora transporte, navegación y recursos nativos compatibles con Expo 57. Endpoints/cookies web se preservan; su configuración canónica es `src/lib/auth/config.ts` utilizada por `app/api/auth/[...nextauth]/route.ts`, sin refactor masivo del duplicado `lib/auth.ts`.

Gobernanza CRITICAL para autenticación/autorización: este documento autoriza planificación, no código; el diseño y migración requieren revisión humana antes de apply. Lectura de negocio MEDIUM se implementará con checkpoints una vez aprobado el contrato. No se almacenan credenciales en artifacts ni se modifican cuentas/infraestructura externa.
