## Why

La cuenta móvil solo identifica al usuario y permite logout. La web muestra perfil Google, privacidad, enlaces y eliminación permanente: se necesitan ajustes iOS equivalentes con borrado real seguro.

## What Changes

- Cuenta native agrupada: perfilGoogle readonly, OAuth, privacidad/legal/acerca de y enlaces.
- Logout existente sin regresión, y eliminar cuenta con confirmación misaluteca, contexto consecuencias y operación autorizada.
- Nuevo endpoint delete-account revoca sesiones y datos de cuenta; limpieza de archivos controlada.
- No formulario contraseña ni editar nombre/email que Google administra.

## Capabilities

### New Capabilities

- `ios-account-settings`: Cuenta native agrupada: perfilGoogle readonly, OAuth, privacidad/legal/acerca de y enlaces.

### Modified Capabilities

Ninguna en specs principales. Referenciar contratos en changes previos al implementar; las ampliaciones de privacidad se revisan explícitamente, sin reescribirlos ahora.

## Impact

Fuentes inspeccionadas: user-dashboard/settings/SettingsPageClient.tsx; components/modals/DeleteAccountModal.tsx; user-dashboard/server-actions/get-user.ts/delete-account.ts; mobile/src/session.ts; src/mobile-server/mysql-auth-store.ts.

Dependencias funcionales: ios-native-foundation, ios-branded-login, ios-study-sharing paraenlaces e ios-family-records paracleanupoutbox; reader/write DDL quecuentaelimina debecompatible y revisado.

APIs/adaptadores/DDL propuestos para funcionalidad nativa real. Planificación solamente; aprobación de diseño CRITICAL/HIGH antes apply según Decisions. No código ni migración/deploy autorizados por este documento. Mapa y dirección visual en docs/ios-pantallas-roadmap.md.
