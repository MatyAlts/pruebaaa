## Why

El acceso iOS actual es un botón genérico dentro de una pantalla de prueba. El usuario pide la misma identidad y composición del acceso Google web con una pantalla iOS propia.

## What Changes

- Login native fullscreen con logo Mi Saluteca, tipografía y CTA Acceder con Google.
- Textos y enlaces Términos/Política de Privacidad equivalentes al modal web.
- Restauración, loading, cancelación, errores y reintento claros; red caída no bloquea dibujo local.
- Reutilizar navegador externo y MobileClient aprobados, sin cambio de protocolo auth.

## Capabilities

### New Capabilities

- `ios-branded-login`: Login native fullscreen con logo Mi Saluteca, tipografía y CTA Acceder con Google.

### Modified Capabilities

Ninguna. Las specs principales no cubren esta funcionalidad; no modificar cambios previos abiertos.

## Impact

Fuentes observadas: landing/components/LoginModal/LoginModal.tsx; landing/components/Navbar/Navbar.tsx; public/images/Logo_Saluteca_AzulNew.png; mobile/assets/brand.png; mobile/src/native-adapters.ts; session.ts.

Dependencias funcionales: ios-native-foundation.

Planificación solamente; no código, despliegues ni aceptación manual inferida. Dirección visual y mapa completo en docs/ios-pantallas-roadmap.md.
