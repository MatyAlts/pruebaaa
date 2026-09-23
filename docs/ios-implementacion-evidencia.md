# Evidencia: initialize-ios-app

## Alcance y baseline

Implementación local en `mobile/`, sin modificaciones del backend, autenticación, datos ni dotfiles globales. El estado git inicial incluía únicamente setup OpenSpec/skills sin versionar; no había móvil ni runner web. `npm ci` web pasó (463 paquetes).

El scaffold declarativo se generó con `expo-template-blank-typescript@57.0.25`, copiando configuración/assets/entrada y descartando su pantalla antes de implementar comportamiento. `mobile/scripts/` ya había sido creado por el trabajo paralelo: la herramienta generó la plantilla en un directorio temporal para evitar sobrescribir scripts; se eliminó luego.

La primera ejecución web después de añadir entrada móvil detectó `mobile/index.ts` sin `App`; ese error fue introducido por scaffold, no preexistente. Para obtener baseline comparable se ejecutó TypeScript con config temporal extendiendo la original y excluyendo `mobile`, y ESLint con `--ignore-pattern mobile/**`. TypeScript pasó sin errores; ESLint reportó **23 errores y 48 warnings preexistentes** (require en `app.js`, tipos any en rutas/acciones antiguas y texto JSX en términos). No se corrigieron. El primer build compiló JavaScript en 24.2 segundos y falló en el TypeScript móvil aún sin pantalla; no se considera baseline nativa ni fallo web preexistente. La configuración temporal fue eliminada.

Exclusión TypeScript móvil e ignores implementados. El usuario aprobó explícitamente la excepción al safety net con “Sí, sólo aislar mobile y continuar”. Se agregó únicamente `mobile/**` a los ignores globales de ESLint web; no se corrigieron errores anteriores.

## Checkpoint de versiones

`npm view expo dist-tags --json`: latest y sdk-57 `57.0.23`; next/canary no seleccionados. `npm view expo-template-blank-typescript dist-tags --json`: latest/sdk-57 `57.0.25`. Plantilla estable produjo RN `0.86.3`, React `19.2.3`, TypeScript `6.0.3`. Se fijaron versiones exactas y lockfile propio. Expo install-check indicó dos parches dev posteriores a plantilla: @types/react `19.2.4`, eslint-config-expo `57.0.2`; se alinearon.

La matriz oficial SDK 57 exige Node >=22.13.x, iOS >=16.4 y Xcode >=26.4. Workflow fija Node `24.18.0`, `macos-26` y Xcode `26.4.1` (inventario build17E202); no usa macos-latest. macOS15 no tiene Xcode26.4 y fue descartado. [Expo](https://docs.expo.dev/versions/latest/), [inventario runner](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md).

Runner: Jest29.7.0 / jest-expo57.0.5 / React Native Testing Library13.3.3 / react-test-renderer19.2.3. RNTL14.0.1 introducía reconciler con peer React19.3; se seleccionó13.3.3 compatible con React fijado. Antes de la pantalla no existían tests móviles; baseline de comportamiento existente: cero. El mock oficial de safearea simula contexto nativo para tests y no reemplaza la prueba física.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.1 pantalla inicial | `mobile/__tests__/App.test.tsx` | Render nativo | Nuevo comportamiento, cero tests previos | Ejecutado: import App inexistente; luego render nativo necesitó mock de safearea | Ejecutado: primera apertura 1/1 | Ejecutado: 2/2; apertura y reapertura/re-render con fetch indisponible, identidad/mensaje y cero solicitudes | Mock oficial con import limpio; ejecutado 2/2 |
| 3.1 empaquetado | `mobile/scripts/test_package_ipa.py` | Unidad/filesystem ZIP | Nuevos scripts | Ejecutado antes de implementación: módulos ausentes | Fixtures válidas verificadas y contenido/permisos preservados | Diferente app, origen ausente/ambiguo, symlink y rechazo previo a entrega | Suite verde tras simplificación; symlink requiere macOS |
| 3.2 comprobador | `mobile/scripts/test_verify_ipa.py` | Unidad/binario ZIP/plist | Nuevos scripts | Ejecutado antes de implementación: módulos ausentes | IPA fixture dispositivo con executable/bundle | Simulador ARM, ZIP/estructura inválidos, ejecutable/bundle ausentes/vacíos, Hermes binario y Mach-O thin/FAT | Suite verde; 17 casos, uno omitido en Windows por permisos de symlink |

Los tests de render verifican comportamiento de componentes, no garantizan funcionamiento en iPhone real. Los fixtures binarios verifican estructura, no firma ni instalabilidad.

## Verificaciones

- `npm ci` móvil: exitoso, 953 paquetes; lockfile propio sincronizado con versiones exactas.
- Pantalla: tests finales 2/2 pasando tras triangulación/refactor; sin snapshots.
- Export iOS: exitoso, 592 módulos; Hermes `index-d46edc04e27a9c59547d5dd5cd66cdb6.hbc` ~1.4MB, logo local23KB, metadata205B. Windows no demuestra build nativa.
- Scripts Python: 17 casos, 16 pasan y1 omitido (symlink sin permisos Windows). macOS debe ejecutar17/17.
- Checks móviles finales: lint sin errores/warnings, typecheck exitoso, Expo install-check dependencias actualizadas y doctor21/21. El comando npm de Python usa patrón predeterminado para evitar las comillas simples literales de cmd.exe en Windows.
- Workflow: actionlint oficial1.7.12, checksum SHA256 verificado, exit0 sin warnings/errors. ShellCheck/Pyflakes externos ausentes deshabilitados; revisión independiente confirmó comandos, paths y pipefail.
- `openspec validate initialize-ios-app --strict`: válido.
- Web tras exclusión TypeScript: `tsc --noEmit` exitoso; build compiló JS en15.3segundos y pasó TypeScript, luego falló al recolectar páginas por falta de `OPENAI_API_KEY` del backend existente. No se agregaron credenciales ni se cambió esa inicialización. No se afirma build web completo.
- Web tras ignore ESLint autorizado: `npm run lint` conserva exactamente71 problemas (23 errores y48 warnings), sin paths móviles procesados ni errores añadidos. No se repararon fallas previas; aislamiento completo task2.2 comprobado.

Scaffold, package/config, ignores y YAML son excepciones declarativas explícitas del diseño: se validan con herramientas reales (ci, doctor, install-check, lint, TS, export, actionlint), sin tests tautológicos de existencia.

## Validación CI real y apertura física reportada

Primer run real [35257685035](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35257685035), commit `8309578`, confirmó Xcode26.4.1/build17E202 pero falló en preflight: `grep -q` cerraba el pipe de una segunda invocación `xcodebuild -version`, que abortaba por broken pipe bajo pipefail. Se ajustó la verificación para leer el archivo de diagnóstico ya producido y exigir versión exacta, sin alterar toolchain ni desactivar pipefail. No publicó IPA; diagnósticos sí disponibles.

Segundo run [35257849499](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35257849499), commit `43c8333570da22632e4b38a505827bacbda6fde2`, terminó exitosamente el 17/09/2026; job de 6m44s. Pasaron lint, TypeScript, Jest **2/2**, Python **17/17 sin omisiones**, Expo install-check/doctor, prebuild y pods. `xcodebuild` completó **BUILD SUCCEEDED** en Release, SDK `iphoneos`, destino genérico iOS y firma desactivada. El log confirma la fase de bundling y `MiSaluteca.app/main.jsbundle` producido.

Se descargaron el [artifact IPA y manifest](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35257849499/artifacts/10513129418) y los [diagnósticos](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35257849499/artifacts/10513549212), con retención de siete días. La copia local está en `mobile/build/ci-35257849499/artifacts/`, ignorada por git. El IPA real es `MiSaluteca-unsigned-43c8333570da22632e4b38a505827bacbda6fde2/MiSaluteca-unsigned.ipa` dentro de esa carpeta; se ejecutó nuevamente `python mobile/scripts/verify_ipa.py <ruta-IPA>` en Windows, con salida exitosa: candidato para firma local, instalación pendiente.

Inspección del ZIP descargado: **7.133.326 bytes**, 68 entradas y una única raíz `Payload/MiSaluteca.app`; bundle ID `com.matyalts.misaluteca`; plist `iphoneos`/`iPhoneOS`, mínimo iOS16.4 y SDK `iphoneos26.4`. Ejecutable `MiSaluteca` de 1.113.064 bytes, Mach-O64 ARM64/MH_EXECUTE. Bundle Hermes de **1.436.259 bytes**, magic `c61fbc03c103191f`. SHA256 del IPA: `dc32a78478792409f059726472dfc6fb36f945e71c6d263e61f56d043ced8d26`.

Manifest efectivo: Expo57.0.23, RN0.86.3, React19.2.3, Nodev24.18.0, Xcode26.4.1/build17E202, CocoaPods1.17.0 e imagen macos26/20260907.0351.1; el log del runner informa macOS26.6.2. `verification.json` contiene actualmente el diagnóstico textual del checker, no un objeto JSON; el manifest sí es JSON. Los logs conservan warnings de compilación de dependencias y aviso de migración de runtime de Actions a Node24; no impidieron el build.

Task4.2 completada con run, descarga y comprobación real. El 17/09/2026 el usuario confirmó «Funciono excelente mira» y aportó [captura de primera apertura](<primera pantalla.jpg>) del iPhone reportado (iPhone17Pro/iOS27.2). Se registra firma/instalación/apertura exitosa reportada por usuario. La imagen muestra logo, nombre y mensaje español de prueba, legibles y sin cortes visibles en las áreas seguras superior e inferior.

La captura no identifica método de firma, bundle ID final ni commit instalado, y por sí sola no prueba funcionamiento sin Metro o sin internet. La build candidata conocida sigue siendo el commit/run anterior.

El usuario confirmó posteriormente cierre completo/reapertura en modo avión y con Metro detenido: «Sí, abrió y mostró todo correctamente». Se registra evidencia manual de reapertura y autonomía offline, junto con captura legible y reporte de instalación. La aceptación de comportamiento del shell está satisfecha. No se confirmó por separado desconexión física del cable/computadora.

Al consultar sobre el IPA generado y su identificador, confirmó «Usé Impactor y no cambié el identificador». Se registra firma/instalación mediante Impactor, bundle ID final `com.matyalts.misaluteca` y el IPA del run `35257849499`/commit `43c8333570da22632e4b38a505827bacbda6fde2` como datos reportados por el usuario; no se presentan como una inspección directa del dispositivo. Task4.3 completada con apertura/captura, reapertura offline/Metro detenido y trazabilidad de instalación. `initialize-ios-app` queda con **15/15 tareas completas** y sin archivar. Las limitaciones remanentes son la ausencia de inspección directa y de pruebas en otros tamaños/orientaciones; no se extiende la validación a funcionalidades futuras.
