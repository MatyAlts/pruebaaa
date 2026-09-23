## Why

La aplicación funcional mantiene una sola pantalla de prueba y no ofrece estructura iOS reconocible. Se necesita una navegación nativa y un sistema visual fiel a la web antes de migrar las demás pantallas.

## What Changes

- Traducir tokens actuales de marca, Inter, spacing y componentes a React Native accesible.
- Migrar entrada a Expo Router compatible SDK 57, proveedor de sesión único y stacks protegidos.
- Tabs nativas con Liquid Glass de sistema iOS 26 y fallback nativo desde iOS 16.4; inicialmente Estudios y Cuenta reales.
- Retirar mensaje de versión de prueba; conservar apertura local Release y recursos bundled.

## Capabilities

### New Capabilities

- `ios-native-navigation`: Traducir tokens actuales de marca, Inter, spacing y componentes a React Native accesible.

### Modified Capabilities

- `ios-app-shell`: sustituir presentación de prueba por entrada final de marca, manteniendo apertura autónoma Release.

## Impact

Fuentes observadas: mobile/App.tsx, mobile/index.ts, mobile/src/session.ts, StudiesScreen.tsx; components/layout/Sidebar.tsx; app/styles/variables.css; .interface-design/system.md (paleta obsoleta).

Dependencias funcionales: connect-ios-studies implementado localmente; no depende de endpoints de familia/escritura.

Planificación solamente; no código, despliegues ni aceptación manual inferida. Dirección visual y mapa completo en docs/ios-pantallas-roadmap.md.
