## 1. Baseline y contratos de migración

- [x] 1.1 Registrar antes de editar los baselines de `npm run test:mobile-backend`, typecheck/build web, y los checks móviles actuales (lint, typecheck, Jest, scripts y Expo Doctor 20/21); conservar el baseline de lint web preexistente y verificar que no haya fallas nuevas atribuibles a la migración.
- [x] 1.2 RED: añadir pruebas de contrato que fallen contra la estructura actual y describan el manifiesto raíz con `mobile/` como workspace, un solo lockfile y resolución de los comandos móvil/web desde raíz; ejecutar y registrar el fallo mínimo antes de cambiar manifiestos.
- [x] 1.3 GREEN y triangulación: modificar sólo los manifiestos y aliases necesarios, regenerar el lockfile raíz sin actualizar versiones declaradas, y ejecutar las pruebas de contrato con al menos un caso de selector móvil y otro de comando web que pasen.

## 2. Instalación única y seguridad de la migración

- [x] 2.1 Verificar los paths exactos de las instalaciones recreables y ejecutar una instalación limpia desde la raíz; eliminar `mobile/package-lock.json` únicamente después de comprobar que el lockfile raíz contiene ambos paquetes y revisar el diff para descartar cambios de versiones directas.
- [x] 2.2 Ejecutar los comandos móviles mediante workspace (lint, typecheck, Jest, scripts, export iOS, `expo install --check` y Expo Doctor) y demostrar Doctor 21/21; si una dependencia queda duplicada, añadir un caso RED que la detecte, aplicar el cambio mínimo y volver a ejecutar GREEN y un segundo caso de resolución.
- [x] 2.3 Ejecutar los checks web desde la raíz, incluyendo las pruebas de backend y el build TypeScript/Next aplicable; comparar con 1.1 y documentar exclusivamente las fallas preexistentes que se mantengan.

## 3. Docker y automatización

- [x] 3.1 RED: ampliar las pruebas de contrato de automatización para que fallen si Docker requiere el lockfile móvil o si el workflow IPA instala desde `mobile/` en lugar del lockfile raíz; cubrir separadamente el workflow backend que no ejecuta Expo.
- [x] 3.2 GREEN y triangulación: adaptar `.dockerignore`, Dockerfile y los dos workflows para usar el lockfile raíz, selector explícito de `misaluteca-ios` en el IPA y una imagen Next sin runtime móvil; ejecutar las pruebas de contrato con los casos de IPA y backend en verde.
- [x] 3.3 Ejecutar `docker build` sin credenciales, comprobar el build/arranque de Next y verificar que la imagen no incorpora recursos ni `node_modules` de Expo; corregir sólo las fallas introducidas por la migración y repetir las pruebas afectadas.

## 4. IPA, reversión y cierre

- [x] 4.1 Despachar el workflow macOS manual desde el commit de migración y verificar IPA sin firma, manifest, diagnósticos y que las validaciones móviles usan el lockfile raíz; registrar el run y no marcar instalación física como realizada sin evidencia separada.
- [x] 4.2 Documentar los comandos de instalación por workspace, la secuencia segura de migración y la reversión mediante el commit anterior; verificar que restaurar manifiestos/lockfiles versionados recupera el estado previo sin tocar código, uploads, datos ni secretos.
- [x] 4.3 Repetir las pruebas de contrato y los checks de integración finales; registrar para cada tarea evidencia de safety net, RED ejecutado, GREEN ejecutado, dos casos triangulados y refactor sin regresiones antes de marcarla completa.
