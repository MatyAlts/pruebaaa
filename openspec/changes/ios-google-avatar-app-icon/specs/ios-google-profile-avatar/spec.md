## Purpose

Presentar la foto de la identidad Google autenticada en Cuenta sin bloquear el uso del perfil ni exponer credenciales durante la descarga.

## ADDED Requirements

### Requirement: Avatar Google con respaldo
Cuenta SHALL mostrar la foto de la identidad actual cuando esté disponible y pueda cargarse. SHALL mantener una inicial o marcador local cuando falte la imagen, durante carga, ante error o sin conectividad, sin impedir leer el perfil ni cerrar sesión.

#### Scenario: Foto disponible
- **WHEN** la sesión actual contiene una imagen válida y su carga finaliza correctamente
- **THEN** Cuenta presenta esa foto dentro del espacio reservado del avatar.

#### Scenario: Imagen ausente o fallida
- **WHEN** no hay foto, su carga falla o el dispositivo no puede descargarla
- **THEN** se conserva el respaldo local sin diálogos de error ni cambios de tamaño del perfil.

### Requirement: Privacidad y aislamiento del avatar
La aplicación SHALL descargar únicamente imágenes mediante HTTPS de hosts de imágenes Google permitidos, sin credenciales móviles ni parámetros añadidos por la aplicación. SHALL rechazar URLs malformadas, con credenciales, destinos ajenos o esquemas locales. SHALL reemplazar inmediatamente la imagen al cambiar de identidad y no presentar una foto perteneciente a una sesión anterior. No SHALL crear un proxy servidor de URLs arbitrarias.

#### Scenario: URL ajena o insegura
- **WHEN** la identidad contiene una URL HTTP, local, con credenciales o cuyo host no pertenece a la lista permitida
- **THEN** se presenta el respaldo y no se inicia la descarga.

#### Scenario: Cambio de cuenta durante carga
- **WHEN** una descarga antigua termina después de cerrar sesión o cambiar de usuario
- **THEN** su resultado no reemplaza el avatar de la nueva identidad.

#### Scenario: Descarga sin secretos
- **WHEN** se solicita la imagen válida de Google
- **THEN** la solicitud no incluye tokens de sesión, cookies de la API ni cabeceras Authorization de Mi Saluteca.
