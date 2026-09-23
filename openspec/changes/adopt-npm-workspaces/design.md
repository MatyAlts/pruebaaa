## Context

La raíz es hoy el paquete `saluteca-web` de Next.js 16 y `mobile/` es el paquete `misaluteca-ios` de Expo 57. Cada uno tiene `package.json`, `package-lock.json` y `node_modules` propios; los dos fijan React 19.2.3. El workflow de backend instala desde la raíz. El workflow de IPA cambia su directorio por defecto a `mobile/`, usa `mobile/package-lock.json` para la caché y ejecuta allí `npm ci`. El Dockerfile copia sólo el manifiesto y lockfile de la raíz, mientras `.dockerignore` excluye `mobile/` para que la imagen web no incorpore la app nativa.

La inspección de Expo Doctor informó 20/21 comprobaciones: identifica dos instalaciones físicas de la misma versión de React, aunque no un conflicto de versiones. Véanse `proposal.md` y las delta specs para los contratos de instalación y de IPA.

## Goals / Non-Goals

**Goals:**

- Tener `mobile/` como workspace npm sin mover la aplicación web ni la Expo.
- Generar y versionar un único lockfile raíz que represente ambos manifiestos con las versiones ya fijadas.
- Hacer explícito en scripts y CI qué comandos se dirigen al paquete móvil.
- Mantener Docker centrado en la aplicación web y el workflow IPA centrado en Expo.
- Demostrar que Expo Doctor queda verde además de los checks de ambos paquetes.

**Non-Goals:**

- Actualizar Expo, React, React Native, Next.js o cualquier otra dependencia.
- Cambiar UI, rutas, APIs, autenticación, secretos, datos o el bundle identifier.
- Convertir el código a paquetes compartidos, habilitar Yarn/pnpm o mover `mobile/` a otro repositorio.
- Cerrar las pruebas físicas pendientes de `ios-native-foundation`.

## Decisions

### La raíz conserva la web y declara `mobile/` como workspace

El manifiesto raíz seguirá siendo el paquete ejecutable de Next.js y añadirá el campo `workspaces` para `mobile/`; no se introduce un directorio `apps/` ni se traslada código. npm generará un solo `package-lock.json` desde la raíz y se retirará `mobile/package-lock.json` cuando la instalación limpia esté verificada. Esto minimiza el diff y conserva los paths conocidos por EasyPanel, Next y el Dockerfile.

Se descarta un segundo repositorio porque rompería la coordinación de API/IPA actual, y se descarta silenciar Expo Doctor porque dejaría dos árboles físicos y no mejora la reproducibilidad.

### Los comandos se nombran por workspace desde la raíz

El paquete móvil conserva sus scripts Expo. La raíz expondrá aliases explícitos para la familia móvil o CI invocará `npm --workspace misaluteca-ios run <script>`. Esto evita depender de que el proceso herede `mobile/` como directorio actual, y permite que `npm ci` sea siempre el primer paso desde la raíz. Los scripts web existentes continúan siendo comandos raíz.

Se descarta reescribir scripts Expo a rutas relativas manuales: aumentaría el riesgo de cambiar el cwd requerido por Metro, prebuild y los scripts de IPA.

### CI usa el lockfile raíz con ejecución dirigida al paquete correcto

El workflow de IPA instalará en la raíz, usará `package-lock.json` para su caché y seleccionará el workspace `misaluteca-ios` para lint, tipos, Jest, scripts, Doctor, export y prebuild. Los pasos nativos conservarán paths bajo `mobile/` para Pods, `xcodebuild`, artefactos y upload. El workflow backend hará `npm ci` desde raíz como hoy y no ejecutará Expo.

El Dockerfile seguirá instalando sólo lo necesario para Next. La implementación ajustará sus copias y la exclusión de Docker para que npm pueda validar el lockfile único sin incluir el árbol ni recursos de Expo en las capas de build/runtime. Se comprobará con un build real que la imagen mantiene `npm start` de la web. No se acepta instalar todos los workspaces en la imagen de runtime por conveniencia.

### Migración reproducible y recuperable

La implementación capturará primero baselines de web, móvil y Docker. Luego modificará manifiestos, regenerará el lockfile con una única versión de npm compatible con CI, realizará una instalación limpia y sólo entonces eliminará el lockfile móvil del control de versiones. La recuperación consiste en revertir el commit de la migración, que restablece ambos manifiestos/lockfiles versionados; no se borra código, uploads, credenciales ni datos. La limpieza de `node_modules` locales será una operación explícita sobre los dos paths exactos y únicamente tras comprobar que ambos son directorios de dependencias recreables.

## Risks / Trade-offs

- [npm puede hoistear una dependencia Expo a una ubicación que Metro no resuelva igual] → ejecutar tests, export, prebuild y una compilación macOS de IPA desde instalación limpia; conservar los ajustes de resolución necesarios en la app sólo si los tests RED los exigen.
- [El Dockerfile puede invalidar el lockfile por no copiar el manifiesto del workspace] → diseñar sus capas para copiar los manifiestos mínimos antes de `npm ci`, usar la modalidad npm que excluya workspaces de la imagen web y verificar `docker build` y arranque web.
- [El workflow IPA puede mezclar paths raíz/móvil] → cambiar cada comando de npm a selector de workspace y mantener explícitos los paths de Xcode y artefactos bajo `mobile/`.
- [El cambio de lockfile altera transitorios aunque no se actualicen dependencias declaradas] → revisar el diff de lockfile, registrar las versiones de npm y rechazar cambios de versiones directas no previstos.
- [Una limpieza de instalaciones locales puede borrar material ajeno] → no usar globs ni comandos recursivos hasta resolver y mostrar los paths exactos `node_modules` de raíz y `mobile/node_modules`.

## Migration Plan

1. Registrar los baselines actuales y la salida de Doctor 20/21 sin modificar archivos de aplicación.
2. Añadir workspaces y aliases, regenerar el lockfile raíz con las versiones declaradas, e instalar mediante `npm ci` desde raíz.
3. Adaptar Docker y ambos workflows a la instalación raíz y a la selección explícita del paquete móvil.
4. Eliminar el lockfile móvil únicamente después de que el lockfile raíz y la instalación limpia lo sustituyan; revisar `git diff` para confirmar que no se cambian versiones directas.
5. Ejecutar pruebas web/móviles, Docker, Doctor y la compilación macOS de IPA. Si falla una comprobación atribuible a la migración, revertir el commit de esta change y restaurar el lockfile independiente desde Git antes de continuar.

## Open Questions

- Ninguna: npm es el gestor ya empleado por los dos paquetes y la ruta `mobile/` está fijada por los workflows y la aplicación actual.
