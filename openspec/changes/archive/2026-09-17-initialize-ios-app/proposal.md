## Why

MiSaluteca ya dispone de una aplicación web Next.js y backend, pero todavía no existe un cliente nativo ni evidencia de distribución iOS. Validar una aplicación mínima mediante GitHub Actions → IPA → Impactor → iPhone permite resolver compatibilidad y empaquetado antes de migrar funcionalidades.

## What Changes

- Incorporar en `mobile/` una aplicación Expo/React Native TypeScript independiente con una pantalla inicial de Mi Saluteca y recursos locales.
- Mantener dependencias y lockfile móviles separados; ajustar el alcance de TypeScript/ESLint web para preservar sus verificaciones.
- Incorporar tests de comportamiento de la pantalla y del empaquetado, siguiendo TDD cuando exista runner.
- Crear un workflow manual macOS que genere Release para `iphoneos`, incluya JavaScript y assets, y publique un IPA sin firma y evidencia de herramientas/build.
- Documentar instalación y firma local con Impactor/Personal Team gratuito y registrar separadamente la validación en dispositivo.

Supuestos pendientes: versiones publicadas estables compatibles con Xcode disponible, disponibilidad de Actions en el repositorio e instalación efectiva con Impactor. No se considera probado este circuito. Fuera de alcance: autenticación, API, estudios, CRUD, OCR, HealthKit, notificaciones, TestFlight y App Store.

## Capabilities

### New Capabilities

- `ios-app-shell`: apertura nativa de una pantalla mínima con identidad local, independiente de Metro y del backend.
- `ios-unsigned-build`: generación y comprobación de un IPA para dispositivo físico y procedimiento de firma local.

### Modified Capabilities

Ninguna. El CLI no informa specs existentes.

## Impact

Nuevos archivos en `mobile/`, un workflow en `.github/workflows/` y documentación del circuito inicial. Ajustes acotados a `tsconfig.json`, `eslint.config.mjs` y `.gitignore` para aislar móvil y productos generados; no se reorganizan módulos web ni backend. No se requieren credenciales Apple en CI, cuenta Expo ni membresía Apple de pago. Dominio LOW: entorno móvil nuevo y compilación sin datos de usuarios; autenticación/seguridad funcional quedan excluidas.
