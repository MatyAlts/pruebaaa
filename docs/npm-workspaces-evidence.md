# Evidencia de migración npm workspaces

La migración se ejecutó sobre la base `c7cec21880726f9ed561f21b18d0020688d52fbe`.
Los cambios no modifican versiones declaradas de dependencias, código de la web,
API, autenticación ni el bundle identifier iOS.

## Baseline y ciclo TDD

| Tarea | Safety net | RED ejecutado | GREEN y triangulación | Refactor / resultado |
| --- | --- | --- | --- | --- |
| 1.1 | Backend 54 pass/2 skip; TypeScript web y móvil pasaron; Jest móvil 51/51; scripts 17 con 1 skip; lint móvil sin errores con 2 warnings preexistentes; Doctor inicial 20/21 | No aplica: registro de baseline | No aplica | Baseline preservado; lint web previo no se modificó. |
| 1.2–1.3 | Baseline anterior | `tests/workspace-contract.test.mjs`: 3/3 fallaron antes de declarar workspaces y retirar el lockfile móvil. | 3/3 pasaron: workspace raíz, lockfile único y selector móvil/web. | Se añadieron aliases raíz y se conservó `next build`. |
| 2.1–2.2 | Lockfile raíz inspeccionado antes de retirar el lockfile móvil. | El contrato detectó que el lockfile móvil todavía existía. | `npm ci` raíz, resolución de React/Expo desde raíz, Expo install check y Doctor 21/21. Lint, tipos, Jest, scripts y export iOS pasaron mediante workspace. | Se corrigió el separador `npm exec --` para que Expo reciba `--check`. |
| 2.3 | Backend y TypeScript web del baseline. | No aplica: integración existente. | Backend 54 pass/2 skip; `next build` completó compilación, TypeScript, 15/15 páginas y optimización. | Se mantuvieron los warnings históricos de módulos sin `type` y no se alteró el lint web. |
| 3.1–3.2 | Workflows y Dockerfile existentes leídos antes de editarlos. | `tests/workspace-automation-contract.test.mjs`: 3/3 fallaron contra lockfile móvil, cwd móvil y backend no aislado. | Los 3 casos de automatización y los 3 de estructura pasaron: Docker copia el manifiesto móvil para validar el lock raíz, IPA instala en raíz y selecciona workspace, backend no ejecuta Expo. | Docker conserva runtime Next sin copiar `mobile/`. |
| 4.2 | Manifiestos/lockfiles versionados y base anterior verificados. | No aplica: documentación de recuperación. | La guía documenta instalación, selectores y reversión desde la base anterior. | La reversión sólo toca manifiestos/lockfiles y dependencias recreables. |
| 4.3 | Checks anteriores repetidos. | Los seis contratos fueron ejecutados antes de la integración final. | Contratos 6/6; backend, typecheck móvil, Doctor 21/21 y build web final pasaron. | No hubo regresiones atribuibles al cambio. |

La copia temporal local de dependencias, si existe, permanece ignorada y no se
versiona. No se usó como parte de las validaciones publicables.

## Actualización: CI real completado

El run macOS [35297567940](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35297567940), commit `d407d093f4a5b15ca6b2be4108a20b635b490840`, terminó correctamente. Instaló mediante `npm ci` desde la raíz, ejecutó 51/51 tests móviles y Doctor 21/21, generó iOS, instaló pods y compiló Release para dispositivo con Xcode 26.4.1 / SDK iphoneos26.4 sin firma.

Se descargaron e inspeccionaron los dos artifacts: IPA/manifest y diagnósticos (prebuild, pods, herramientas y xcodebuild). El manifest conserva Expo 57.0.23, React Native 0.86.3, React 19.2.3 y mínimo iOS 16.4. El ZIP contiene `Payload/MiSaluteca.app/Info.plist`, ejecutable y `main.jsbundle`; no contiene `_CodeSignature` ni `embedded.mobileprovision`.

- IPA: `MiSaluteca-unsigned.ipa`, 12.212.646 bytes.
- SHA256: `37494f728d0157adb58786dfb3775bdbb19c804fbfc0e2b0d9fc58e4545eb401`.
- Archivos descargados ignorados por Git: `mobile/build/ci-35297567940/`.

El run backend [35297401892](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35297401892), commit `c608431e7eda8c18fa219d9750bc6bceb469b31a`, también terminó correctamente. Ejecutó instalación web aislada y tests DB/HTTP; el build Docker exportó realmente `misaluteca-backend:checked`, imagen `sha256:c7a9d4f30bb8696bad9a9141664d895528a8465f4a24787955eef73236a43a2a`. El hook no estaba configurado y no se realizó despliegue.

La tarea 4.1 está completa. La tarea 3.3 conserva pendiente la comprobación del **arranque de la imagen final** y la inspección efectiva de ausencia de runtime Expo; el workflow sólo construyó/exportó la imagen. Las capturas posteriores del usuario confirman funcionamiento en iPhone, Google y tabs nativas, pero no identifican inequívocamente el IPA instalado.

## Cierre reproducible de Docker preparado

El workflow backend ahora comprueba sobre `misaluteca-backend:checked` que `/app/mobile` no exista y que Expo/React Native no puedan resolverse. Un error de resolución distinto de `MODULE_NOT_FOUND` también falla. Después inicia la imagen final sin credenciales ni variables adicionales, publica un puerto aleatorio sólo en `127.0.0.1`, espera una respuesta HTTP de `/maintenance.html` y compara su contenido con el recurso versionado. Un trap elimina exclusivamente ese contenedor temporal y el archivo de respuesta tanto al pasar como al fallar. El hook de despliegue sólo se evalúa después de ambas comprobaciones.

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3.3: aislamiento de imagen | `tests/workspace-automation-contract.test.mjs` | Contrato de CI y ejecución del script Node en VM | 3/3 previos | Ejecutado: faltaba la inspección real de imagen | 4/4 tras añadir el paso | Script acepta paquetes ausentes y rechaza Expo presente, recursos móviles y error EACCES; rerun final 7/7 | Sin refactor de producción; rerun combinado 11/11 |
| 3.3: arranque y limpieza | `tests/workspace-automation-contract.test.mjs` | Contrato de CI | 4/4 anteriores | Ejecutado: faltaba arranque HTTP antes de hook | 5/5 tras añadir contenedor y prueba HTTP | Contrato exige loopback, contenido esperado, ausencia de secrets/env y cleanup en salida/fallo | Sin refactor; rerun combinado 11/11 |

Durante el primer RED se corrigió además un matcher nuevo que confundía `test:mobile-backend` con un comando del workspace Expo; fue un fallo del test añadido, no una regresión del workflow. No se oculta ese resultado. Estos contratos verifican la configuración y el script de aislamiento; **no sustituyen la ejecución real del contenedor en CI**.

## Docker verificado en CI: tarea 3.3 completa

El run backend [35300376140](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35300376140), commit `ab440fd75210bc4bffd6fc3a59ddde54179771d7`, terminó **SUCCESS** el 18/09/2026 a las 02:45:10 UTC. Pasaron 62/62 pruebas backend, sin fallos ni casos omitidos, y el build Docker exportó la imagen final.

Sobre esa misma imagen `misaluteca-backend:checked` pasaron ambos pasos nuevos: ausencia efectiva de `/app/mobile` y de paquetes resolubles Expo/React Native, y arranque de Next con respuesta HTTP cuyo contenido coincide exactamente con `public/maintenance.html`. La comprobación usó contenedor temporal, puerto aleatorio sólo loopback y ninguna credencial añadida. Esto satisface los criterios restantes de 3.3 y el change queda **12/12**, sin archivarlo automáticamente.

Los logs confirmaron que el hook no estaba configurado: **deployment omitido**. Este resultado no implica despliegue en EasyPanel ni completa las pruebas físicas pendientes de Foundation o las pantallas nuevas.

## Pendientes históricos al publicar la migración

- La tarea 3.3 sigue pendiente: Docker Desktop alcanzó y cacheó
  `npm ci --workspaces=false`, pero quedó detenido exportando capas; no se
  produjo una imagen para comprobar arranque ni contenido final.
- La tarea 4.1 sigue pendiente: el run macOS `35297410636` alcanzó el workflow
  publicado y falló porque npm recibió `--platform` y `--no-install` en lugar
  de Expo; el proyecto se resolvió erróneamente como `mobile/ios`. El workflow
  ahora usa `npm --workspace misaluteca-ios exec -- expo prebuild --platform ios --no-install`.
  El contrato de automatización falló antes de ese cambio y pasó 3/3 después;
  falta publicar y volver a despachar el workflow para obtener IPA, manifest y
  diagnósticos nuevos. No hay evidencia nueva de instalación física.
