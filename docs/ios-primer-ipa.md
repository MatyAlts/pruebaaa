# Primera versión iOS

La aplicación Expo vive en `mobile/` como el workspace `misaluteca-ios`. La instalación vigente se coordina desde la raíz junto con la web; el único lockfile versionado es `package-lock.json` en la raíz.

## Herramientas y compatibilidad

Baseline verificada el 17/09/2026 mediante dist-tags npm: Expo estable `57.0.23`, plantilla `expo-template-blank-typescript@57.0.25`, React Native `0.86.3`, React `19.2.3`. Node fijado en Actions: `24.18.0`; mínimo del SDK: `22.13.x`. iPhone requiere **iOS 16.4 o superior**. El usuario reportó **iPhone 17 Pro con iOS 27.2**, confirmó instalación/apertura mediante captura y luego cierre completo/reapertura en modo avión con Metro detenido, mostrando todo correctamente.

El workflow usa `macos-26` y selecciona Xcode `26.4.1` explícitamente. El inventario oficial lo lista con build `17E202`; SDK 57 requiere Xcode 26.4 o superior. La imagen es mutable: preflight falla si deja de contener esa versión y registra versión efectiva de imagen, Node, npm, CocoaPods y Xcode.

Fuentes: [matriz Expo](https://docs.expo.dev/versions/latest/), [inventario macOS 26](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md). La aplicación móvil se resuelve mediante el workspace npm de la raíz.

## Verificaciones locales

Desde la raíz:

```sh
npm ci --no-audit --no-fund
npm run mobile:lint
npm run mobile:typecheck
npm run mobile:test
npm run mobile:test:scripts
npm run mobile:install:check
npm run mobile:doctor
npm --workspace misaluteca-ios exec -- expo config --json
npm run mobile:export:ios
```

Python 3 ejecuta los tests/scripts sin dependencias externas. En Windows el test de symlink puede omitirse si faltan permisos; macOS debe ejecutarlo. La exportación JavaScript en Windows produce bundle/assets y **no demuestra una compilación iOS ni instalación real**. `npm --workspace misaluteca-ios run start` inicia Metro para desarrollo; no se necesita para una app Release instalada.

`app.config.ts` mantiene identidad y recursos. El bundle ID provisional es `com.matyalts.misaluteca`; `IOS_BUNDLE_IDENTIFIER` permite cambiarlo antes del prebuild. No hay Team Apple configurado. El logo se copia del recurso local existente de la web; la primera pantalla usa tipografía del sistema porque no había archivos Inter locales.

## Actions → IPA

El workflow vigente instala con `npm ci` en la raíz, usa el lockfile raíz para la caché y selecciona `misaluteca-ios` para cada comando Expo. La primera build nativa comprobada, [run 35257849499](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35257849499), commit `43c8333570da22632e4b38a505827bacbda6fde2`, es evidencia histórica anterior a la migración a workspaces. Descargar el [artifact MiSaluteca-unsigned](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35257849499/artifacts/10513129418), extraer el ZIP y elegir `MiSaluteca-unsigned.ipa` en Impactor. La retención es de siete días; después debe ejecutarse nuevamente el workflow. Compilación y comprobación pasaron. El usuario confirmó que instaló este IPA con Impactor, conservando `com.matyalts.misaluteca`, y que funcionó en su iPhone.

Copia descargada en este workspace: `mobile/build/ci-35257849499/artifacts/MiSaluteca-unsigned-43c8333570da22632e4b38a505827bacbda6fde2/MiSaluteca-unsigned.ipa`. Esta carpeta está ignorada por git y no se comparte mediante el repositorio. `manifest.json` identifica las herramientas y el commit; `verification.json` contiene el mensaje textual de comprobación.

1. En GitHub, abrir **Actions → iOS unsigned IPA → Run workflow** sobre la rama que contiene estos archivos.
2. Esperar preflight, checks móviles, prebuild, pods y compilación `Release` con destino genérico iOS y SDK `iphoneos`.
3. Descargar el artifact **MiSaluteca-unsigned-<commit>** y extraer el ZIP de GitHub: contiene `MiSaluteca-unsigned.ipa`, `manifest.json` y `verification.json`.
4. Conservar commit y URL del run. El checker inspecciona estructura, plataforma, ejecutable ARM64 y bundle; su éxito indica un candidato para firma local.

No se usan Apple ID, certificados, perfiles, Expo login ni Secrets. El IPA carece de firma y no se instala directamente. Si build/checker falla, no se publica como entrega válida; `ios-diagnostics-<run>` conserva logs durante siete días. También el artifact del IPA vence a los siete días.

## Firma e instalación personal

Descargar [Impactor oficial](https://github.com/claration/Impactor) para el sistema local y seguir sus instrucciones vigentes de conexión del iPhone y componentes Apple requeridos. Conectar y confiar en la computadora; seleccionar el IPA descargado y usar una cuenta Apple gratuita/Personal Team **localmente** para firmar e instalar. Las credenciales no deben agregarse al repositorio ni a GitHub.

En iPhone, confiar en el desarrollador en Ajustes cuando se solicite y activar Developer Mode si iOS lo requiere (Ajustes → Privacidad y seguridad → Modo desarrollador, con reinicio/confirmación). [Apple: Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device).

La firma gratuita necesita renovación aproximadamente cada siete días y tiene límites de dispositivos, identificadores y capacidades. [Apple: cuenta de desarrollador](https://developer.apple.com/help/account/basics/about-your-developer-account). Registrar el bundle ID finalmente usado: Impactor podría cambiarlo. Si falla firma/instalación, guardar mensaje de error sin datos de cuenta y revisar compatibilidad del sideloader antes de avanzar.

## Evidencia física de aceptación

El 17/09/2026 el usuario informó «Funciono excelente mira» y adjuntó [primera pantalla.jpg](<primera pantalla.jpg>). La captura muestra logo, nombre y mensaje español de prueba en un iPhone, legibles y sin cortes visibles junto a las áreas superior e inferior del sistema. Se registra firma/instalación/apertura exitosa reportada por el usuario; no se infieren de la imagen el método de firma, el bundle ID final ni la ausencia de Metro/red.

Posteriormente confirmó explícitamente cierre completo y reapertura en modo avión con Metro detenido: «Sí, abrió y mostró todo correctamente». Esa confirmación aporta la evidencia manual de reapertura y autonomía sin servidor de desarrollo ni internet; no se deduce solamente de la captura. No se registró por separado la desconexión física del cable/computadora; Metro detenido y modo avión prueban la autonomía requerida del shell.

Sobre la instalación del IPA generado, confirmó «Usé Impactor y no cambié el identificador». Se registra método Impactor, bundle ID final `com.matyalts.misaluteca` y build instalada del run/commit indicado como datos reportados por el usuario, sin inferirlos de la captura ni inspeccionar el dispositivo.

Registro sin Apple ID, UDID ni credenciales:

| Dato / prueba | Resultado |
|---|---|
| Fecha y modelo de iPhone | Reporte recibido el 17/09/2026; modelo reportado: iPhone 17 Pro |
| Versión de iOS (>=16.4) | Reportada por usuario: 27.2; apertura exitosa reportada |
| Commit y URL del run | IPA generado e instalado según reporte del usuario: `43c8333570da22632e4b38a505827bacbda6fde2`, [run 35257849499](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35257849499) |
| Bundle ID finalmente instalado | `com.matyalts.misaluteca`, conservado según confirmación del usuario |
| Firma e instalación | Impactor; éxito reportado por usuario |
| Primera apertura: nombre, mensaje y logo | Confirmada por reporte y captura de pantalla |
| Cierre y reapertura | Éxito confirmado explícitamente por usuario después de cierre completo |
| Metro detenido | Confirmado por usuario durante la reapertura; desconexión física no registrada por separado |
| Apertura sin internet | Confirmada por usuario en modo avión: mostró todo correctamente |
| Legibilidad y área segura | Captura legible y sin cortes visibles; no sustituye prueba de otros tamaños/orientaciones |
| Errores / limitaciones | Sin errores reportados; datos de instalación reportados por usuario, sin inspección directa del dispositivo; otros tamaños/orientaciones no evaluados |

Task4.3 completada mediante reporte de instalación con Impactor/identificador conservado, captura legible y confirmación manual de cierre/reapertura offline con Metro detenido. Las 15 tareas de `initialize-ios-app` están completas; el change permanece sin archivar. CI y prueba física son resultados separados, ambos con evidencia registrada. TestFlight y App Store quedan fuera de esta versión y requieren el circuito de firma/distribución posterior.
