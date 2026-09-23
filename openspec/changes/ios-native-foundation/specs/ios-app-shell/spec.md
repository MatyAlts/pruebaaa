## MODIFIED Requirements

### Requirement: Pantalla inicial nativa identificable
La aplicación SHALL presentar una entrada nativa final en español con el nombre Mi Saluteca e identidad visual actual de la web, sin mensajes de versión de prueba. El contenido SHALL permanecer legible dentro del área segura, con controles accesibles y recursos locales incluso sin sesión o sin red.

#### Scenario: Primera apertura
- **WHEN** se abre por primera vez la aplicación instalada en un iPhone compatible
- **THEN** se muestra entrada de marca y las acciones disponibles reales, sin exigir datos médicos, cuenta Apple ni configuración de desarrollo para dibujar la interfaz.

#### Scenario: Reapertura
- **WHEN** se cierra y vuelve a abrir la aplicación
- **THEN** la entrada y recursos locales se muestran sin Metro; mientras se restaura la sesión no se exponen rutas privadas y un fallo de red no bloquea la presentación local.
