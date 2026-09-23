## MODIFIED Requirements

### Requirement: Pantalla inicial nativa identificable
La aplicación SHALL presentar una entrada nativa en español con el nombre Mi Saluteca e identidad visual coherente con la web. SHALL ofrecer login al no existir sesión móvil y acceso a estudios al tener una sesión validada, manteniendo contenido legible dentro del área segura.

#### Scenario: Primera apertura
- **WHEN** se abre por primera vez la aplicación instalada en un iPhone compatible
- **THEN** se muestra entrada de login con identidad local, sin pedir datos médicos ni configuración manual de servidor.

#### Scenario: Reapertura
- **WHEN** se cierra y vuelve a abrir la aplicación
- **THEN** se muestra la entrada local y se resuelve la sesión móvil guardada hacia estudios o login sin depender de Metro.

### Requirement: Apertura autónoma de la versión Release
La versión Release SHALL incluir código JavaScript y recursos de entrada para abrir sin servidor de desarrollo. Los estudios y login SHALL requerir backend conectado; la falta de red SHALL mostrarse como estado recuperable sin prometer estudios offline.

#### Scenario: Metro detenido
- **WHEN** se abre la versión Release con Metro detenido y sin computadora de desarrollo conectada
- **THEN** la entrada nativa y sus recursos locales se muestran correctamente.

#### Scenario: Sin conectividad
- **WHEN** se abre la versión Release sin conexión a internet
- **THEN** se muestra entrada local de login o estado de conexión con reintento, sin bloquear la apertura ni presentar estudios como sincronizados.
