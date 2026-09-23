# npm workspaces

La raíz del repositorio coordina la web Next.js y el paquete Expo
`misaluteca-ios` ubicado en `mobile/`. El único lockfile versionado es
`package-lock.json` en la raíz. No se usa ni se debe regenerar un lockfile
dentro de `mobile/`.

## Instalación y comandos

En un clon limpio, instalar una sola vez desde la raíz:

```powershell
npm ci --no-audit --no-fund
```

Comandos de la web desde la raíz:

```powershell
npm run build
npm run test:mobile-backend
```

Comandos de Expo desde la raíz:

```powershell
npm run mobile:lint
npm run mobile:typecheck
npm run mobile:test
npm run mobile:test:scripts
npm run mobile:install:check
npm run mobile:doctor
npm run mobile:export:ios
```

Para un comando puntual se puede usar el selector explícito:

```powershell
npm --workspace misaluteca-ios run <script>
npm --workspace misaluteca-ios exec -- expo <comando>
```

El workflow del IPA instala con `npm ci` en la raíz y selecciona el workspace
para Expo. Docker y el workflow del backend usan `npm ci --workspaces=false`
para construir sólo la aplicación Next.js; no deben ejecutar Expo ni copiar
recursos móviles a la imagen final.

## Secuencia segura de la migración

1. Registrar los checks web y móviles antes de editar manifiestos.
2. Declarar `mobile/` en `workspaces`, regenerar el lockfile raíz con npm y
   comprobar que contiene el paquete `mobile`.
3. Ejecutar `npm ci` desde la raíz y validar los comandos mediante el selector
   `misaluteca-ios`.
4. Eliminar únicamente el lockfile versionado `mobile/package-lock.json` una
   vez que los pasos anteriores pasen.

`node_modules`, `.expo`, `dist`, `build` y los respaldos locales de
dependencias son recreables e ignorados. No forman parte de la migración
versionada ni contienen código, uploads, datos de MySQL o secretos.

## Reversión

La base anterior a esta migración es `c7cec21880726f9ed561f21b18d0020688d52fbe`.
Después de publicar el commit de migración, la reversión normal es:

```powershell
git revert <commit-de-adopt-npm-workspaces>
npm ci --no-audit --no-fund
```

Si se necesita recuperar sólo los manifiestos y lockfiles para investigar un
fallo antes de publicar, restaurarlos desde la base sin tocar código de la
aplicación, `uploads`, archivos de entorno ni bases de datos:

```powershell
git restore --source c7cec21880726f9ed561f21b18d0020688d52fbe -- package.json package-lock.json mobile/package.json mobile/package-lock.json
```

Ese comando recupera el lockfile móvil histórico y deja intactos los datos de
la aplicación. Luego se puede ejecutar `npm ci` para recrear dependencias.
