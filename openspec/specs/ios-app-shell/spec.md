# ios-app-shell Specification

## Purpose

Permitir validar la apertura y la identidad de Mi Saluteca en un iPhone real antes de incorporar las funcionalidades de negocio del cliente móvil.

## Requirements

### Requirement: Pantalla inicial nativa identificable
La aplicación SHALL presentar una pantalla nativa en español con el nombre Mi Saluteca, identidad visual coherente con la web y un mensaje que identifique esta versión inicial de prueba. El contenido SHALL permanecer legible dentro del área segura del dispositivo.

#### Scenario: Primera apertura
- **WHEN** se abre por primera vez la aplicación instalada en un iPhone compatible
- **THEN** se muestran el nombre y el mensaje de prueba sin solicitar cuenta, datos médicos ni configuración de servidor.

#### Scenario: Reapertura
- **WHEN** se cierra y vuelve a abrir la aplicación
- **THEN** se vuelve a mostrar la pantalla inicial sin estados de carga de servicios externos.

### Requirement: Apertura autónoma de la versión Release
La versión Release SHALL incluir el código JavaScript y los recursos necesarios para mostrar la pantalla inicial sin conexión con un servidor de desarrollo ni con el backend.

#### Scenario: Metro detenido
- **WHEN** se abre la versión Release con Metro detenido y sin computadora de desarrollo conectada
- **THEN** la pantalla inicial y sus recursos locales se muestran correctamente.

#### Scenario: Sin conectividad
- **WHEN** se abre la versión Release sin conexión a internet
- **THEN** se muestra la misma pantalla inicial sin un error que bloquee su uso.
