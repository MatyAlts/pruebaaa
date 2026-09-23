## Purpose
Mantener una instalación npm única y reproducible para la web y la aplicación Expo del repositorio, sin duplicar físicamente sus dependencias compartidas.

## ADDED Requirements

### Requirement: Instalación única de los paquetes del repositorio
El repositorio SHALL declarar la aplicación web de la raíz y `mobile/` como paquetes de una única instalación npm, respaldada por un único lockfile versionado en la raíz. La instalación limpia con `npm ci` desde la raíz SHALL resolver las dependencias declaradas de ambos paquetes sin requerir un segundo lockfile o una instalación dentro de `mobile/`.

#### Scenario: Clon limpio
- **WHEN** un colaborador instala el repositorio clonado mediante `npm ci` desde la raíz
- **THEN** puede resolver tanto los comandos de la web como los del paquete móvil desde el mismo lockfile.

#### Scenario: Dependencia React compartida
- **WHEN** la web y Expo declaran la misma versión compatible de React
- **THEN** la instalación evita una segunda copia física de esa dependencia por el proyecto npm independiente anterior.

### Requirement: Comandos aislados y reproducibles por paquete
Los comandos de validación y desarrollo SHALL poder invocarse desde la raíz indicando el paquete correspondiente, sin cambiar sus semánticas de web o Expo. Los comandos móviles SHALL ejecutarse con el contexto de `mobile/` y los comandos de la web SHALL conservar el contexto de la raíz.

#### Scenario: Validación móvil desde la raíz
- **WHEN** CI o un colaborador ejecuta la validación móvil mediante el selector de workspace
- **THEN** lint, typecheck, Jest, scripts y Expo Doctor usan el paquete Expo y la instalación única.

#### Scenario: Build web desde la raíz
- **WHEN** CI o Docker ejecuta el build de producción web
- **THEN** Next.js usa el paquete de la raíz y no requiere instalar o ejecutar la aplicación Expo.

### Requirement: Migración y reversión comprobables
La migración SHALL conservar una ruta de reversión documentada hasta que las validaciones web, móviles, Docker e IPA hayan pasado con el lockfile único. La eliminación de instalaciones o lockfiles previos SHALL ocurrir sólo después de verificar que el lockfile raíz los representa y que `npm ci` reproduce el grafo esperado.

#### Scenario: Fallo durante la migración
- **WHEN** una validación detecta que el grafo único no reproduce un paquete o un workflow
- **THEN** el equipo puede restaurar los manifiestos y lockfiles versionados del commit anterior sin perder código ni datos de aplicación.
