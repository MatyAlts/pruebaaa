## Why

La pantalla Cuenta ya muestra la identidad real, pero reemplaza la foto disponible de Google por una inicial. El icono instalado conserva el recurso del scaffold; debe representar la carpeta médica con corazón que identifica la web.

## What Changes

- Mostrar la imagen Google entregada por la sesión existente, con inicial de respaldo durante carga, ausencia, error o falta de red.
- Convertir el símbolo original del favicon web en un icono iOS opaco de 1024×1024, conservando proporciones y colores, reconociendo la resolución limitada de la fuente y verificando el recurso compilado en el IPA.
- Conservar autenticación, identificador de bundle y apariencia de navegación actuales; no agregar permisos de fotos para leer el avatar.

## Capabilities

### New Capabilities

- `ios-google-profile-avatar`: presentación de foto Google con respaldo seguro y aislamiento entre usuarios.
- `ios-web-brand-app-icon`: identidad del icono instalado equivalente al favicon de la web.

### Modified Capabilities

Ninguna. Las capacidades principales actuales de shell y build permanecen vigentes; este change agrega aceptación de identidad visual.

## Impact

Cuenta y componentes móviles de identidad; `mobile/assets/icon.png`, configuración Expo y evidencia de packaging. No requiere nuevas tablas, endpoints, secretos ni migraciones. La URL ya existe en `Identity.image` y `User.image`; cualquier modificación de autenticación queda fuera del alcance.
