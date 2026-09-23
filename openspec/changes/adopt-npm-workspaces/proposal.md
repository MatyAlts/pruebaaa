## Why

El repositorio instala la web de Next.js en la raíz y Expo en `mobile/` como dos proyectos npm independientes. Ambos instalan físicamente React 19.2.3; Expo Doctor informa 20/21 comprobaciones y detecta esa duplicación aunque las versiones sean compatibles. Un único grafo npm reducirá esa ambigüedad y hará reproducibles los comandos de web, móvil, Docker y CI desde una instalación coherente.

## What Changes

- Convertir el manifiesto de la raíz en el coordinador de npm workspaces, conservando la web en la raíz y declarando `mobile/` como workspace.
- Sustituir los dos lockfiles e instalaciones independientes por un único `package-lock.json` generado desde la raíz, sin actualizar versiones de dependencias.
- Exponer comandos por workspace para que los checks Expo y las pruebas móviles se ejecuten de forma determinista desde la raíz.
- Adaptar el workflow de IPA, el workflow de backend y el Dockerfile para instalar desde el lockfile único, manteniendo una imagen web de runtime sin dependencias móviles innecesarias.
- Añadir una migración verificable y reversible que no elimine instalaciones o lockfiles anteriores hasta haber comprobado la instalación única y sus baselines.

## Capabilities

### New Capabilities
- `npm-workspace-management`: Instalar y ejecutar los paquetes web y móvil desde un único grafo npm reproducible.

### Modified Capabilities
- `ios-unsigned-build`: La compilación manual de IPA SHALL seguir siendo reproducible cuando la aplicación Expo sea un workspace instalado desde el lockfile de la raíz.

## Impact

Se modificarán `package.json`, el lockfile de la raíz, la configuración de npm necesaria para workspaces, `mobile/package.json`, `.dockerignore`, `Dockerfile` y los workflows de GitHub Actions. Se retirará el lockfile independiente de `mobile/` sólo después de la validación. No se modifican versiones de paquetes, UI nativa, APIs web, autenticación, datos ni el identificador iOS; `ios-native-foundation` permanece como change separado y podrá retomar sus checks cuando esta migración esté validada.
