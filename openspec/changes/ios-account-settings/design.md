## Context

Fuentes inspeccionadas: user-dashboard/settings/SettingsPageClient.tsx; components/modals/DeleteAccountModal.tsx; user-dashboard/server-actions/get-user.ts/delete-account.ts; mobile/src/session.ts; src/mobile-server/mysql-auth-store.ts.

Ver proposal.md para motivación y docs/ios-pantallas-roadmap.md para inventario/dirección de interface-design. Dependencias funcionales: ios-native-foundation, ios-branded-login, ios-study-sharing paraenlaces e ios-family-records paracleanupoutbox; reader/write DDL quecuentaelimina debecompatible y revisado.

La API actual cubre lectura propia/Google, no estas escrituras. El bootstrap TEST mínimo no habilita paridad web completa. Usuario confirmó Google/login, no permisos o aceptación de estas funciones nuevas.

## Goals / Non-Goals

**Goals:** pantallas nativas equivalentes y operaciones reales con aislamiento, estados accesibles y contratos verificables.

**Non-Goals:** simular datos/botones, portar DOM/Server Actions, cambiar la web fuera de adaptaciones focales aprobadas, alterar permisos o procesar datos productivos sin aprobación; no ejecutar apply ni deploy en planificación.

## Decisions

Perfil readonly usa GET /me canónico existente; añadir image opcional solo si DTO/columna disponibles y revisados. Nombre/email siguen vinculados a Google, sin formulario de contraseña. Cuenta tiene legales/acerca de/logout y reutiliza endpoints share-links del change de enlaces, sin duplicación.

Proponer POST /api/mobile/v1/account/deletion {confirmation:'misaluteca'} con Bearer e identidad recientemente autenticada. Registrar auth_time en sesión y ventana 10 min es cambio concreto de seguridad propuesto, no capacidad existente ni permiso heredado: requiere aprobación CRITICAL antes apply. Reautenticación usa flujo Google/PKCE existente y exige la misma identidad canónica; cancelar/cambiar usuario no elimina otra cuenta.

Transacción bloquea usuario, revoca todas sus familias móviles y refresh history, elimina enlaces/adjuntos/estudios/familiares/usuario y registra outbox de archivos sin FK a usuario borrado. Respuesta204 confirma commit de datos; archivos privados quedan inaccesibles y worker limpia físicamente con retry. No prometer borrado de copias exportadas ni físico instantáneo. Revisar FK/schema real TEST, no confiar en CASCADE ausente.

Tokens web JWT pueden sobrevivir a borrar fila usuario: diseño debe comprobar existencia canónica en rutas web relevantes de archivos/enlaces y auth callback con pruebas focales antes modificar esas áreas. No asumir logout móvil revoca cookies Google/web. Ingreso posterior Google puede recrear cuenta vacía según comportamiento web actual; informar que no se elimina cuenta Google. Si red deja resultado ambiguo, limpiar privado local e informar estado no confirmado sin afirmar éxito. Este cambio de datos/revocación requiere diseño aprobado separado del login visual.

Identidad: CSS actual Mi Saluteca, Inter y spacing4pt, carpeta clínica/paciente/fecha/adjuntos. Usar superficies sólidas, sheets/forms nativos y barra de sistema de foundation. Contraste normal ≥ 4.5:1/grande ≥ 3:1; verde de marca como acento con tinta oscura, nunca blanco ilegible. Dynamic Type, VoiceOver, teclado/scroll, loading/empty/error/cancel/retry se diseñan como comportamiento.

## Risks / Trade-offs

Borrado irreversible y usuario puedenvolverlogincrearcuentavacía → copyclaroyGoogleidentityno se borra. Archivos fueraapp no se borran; cleanupoutbox no significa físicaeraseinstantánea. Cambioauth_time/recentauthentication material se revisa explícito antesapply, no silentlyscopecambioauthapprovedantes. Perfilpresentation/logoutchanges seguros independientessecurity implementation.

## Migration Plan

Revisar y aprobar el diseño concreto del dominio antes apply cuando sea CRITICAL/HIGH; no se solicita aprobación durante esta planificación. Safety net y un RED mínimo ejecutado, GREEN confirmado, triangulación ≥ 2casos y refactor con rerun por comportamiento. Validación SQL/HTTP en MySQL dedicado de prueba, sin credenciales de producción ni llamadas pagas automáticas. Migración TEST/deploy requieren autorización externa específica.

Backend publica capability sólo después de endpoint real compatible; UI no presenta acciones futuras como disponibles. Rollback UI/IPA a versión anterior y backend compatible; mantener outbox y datos necesarios para operaciones ya confirmadas, sin borrar tablas de negocio. Distinguir commit de datos y cleanup físico cuando aplique; ninguna aceptación manual se completa por mocks. No archivar changes previos ni cambiar su evidencia.
