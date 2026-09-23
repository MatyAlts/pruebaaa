# Avatar Google e icono iOS: evidencia de implementación

## Alcance

Cuenta utiliza `User.image` de la sesión existente mediante una imagen nativa. No se modifican OAuth, PKCE, tokens, endpoints, tablas, permisos de fotos ni el identificador `com.matyalts.misaluteca`. La inicial permanece durante carga, ausencia, error y falta de red. El nombre conserva su lectura accesible y el cierre de sesión sigue disponible.

La instancia de imagen está identificada por `user.id` y URL validada. Cambiar de usuario o URL desmonta la instancia anterior y reinicia el respaldo; sus callbacks tardíos no afectan la cuenta nueva. Una descarga fallida retira la imagen y una notificación posterior de éxito no sustituye el respaldo.

## Descarga de avatar

El selector conserva la URL exacta del proveedor y acepta HTTPS en `googleusercontent.com` o subdominios con límite de etiqueta, hasta 2048 caracteres, sin userinfo, fragmento ni puertos ajenos a HTTPS. Rechaza hosts que imitan el sufijo, etiquetas vacías, esquemas locales y URLs con espacios o controles.

La prueba integrada inspecciona la fuente del `Image` real: exclusivamente `{ uri }`, sin cabeceras, cookies ni tokens añadidos por Mi Saluteca. Además se inspeccionó el transporte instalado de React Native 0.86.3: `Libraries/Image/Image.ios.js` transmite la fuente al componente nativo y `React/Base/RCTConvert.mm` crea el `NSURLRequest` a partir de ella; las cabeceras sólo proceden del campo explícito `headers`, que este componente no proporciona. El cliente autenticado es independiente (`expo/fetch`, sin interceptores globales sobre Image). Esta evidencia es inspección de adaptador y fuente, no una captura de tráfico en dispositivo. No se afirma eliminar la caché de imágenes del sistema ni impedir cookies ajenas a la API que el sistema pudiera gestionar para el dominio Google.

Todas las identidades y URLs de pruebas son ficticias; no se versionan imágenes, URLs ni datos personales de cuentas reales.

## Icono: origen, reproducción y revisión visual

- Origen: frame único RGBA de **238×229** de `app/favicon.ico`.
- SHA-256 del original: `e982881bf4f50eb399817c4b0575952a0498a9e9c61eb93ab107e91e227a40aa`.
- Conversión determinista con Pillow **12.3.0**, Lanczos, proporción conservada en caja de 864×864, centrado sobre blanco RGB de 1024×1024. El margen mínimo es 80 px; no se dibujan esquinas redondeadas ni se rediseña la marca.
- Recurso: `mobile/assets/icon.png`, SHA-256 `244a4c2626ee336fa5c1d0972f4c30017b2ff8af7c2eefdec87f0916591a1b81`.
- Inspección real Pillow: **1024×1024, RGB**, sin canal alfa. Expo ya usa `./assets/icon.png`; se reemplazó ese recurso conservando la configuración y el bundle.
- Se compararon visualmente el frame original, el PNG de 1024 px y una reducción de 60×60 px: carpeta azul y círculo verde con corazón azul conservan forma, proporción y legibilidad, sin recortes. Las vistas temporales permanecen en `mobile/build/`, ignorado por Git.
- El escalado conserva la referencia raster, pero **no recupera detalle ausente** en el original pequeño. Los bordes ampliados conservan esa limitación; la revisión a 60 px no justifica redibujar la marca.

Reproducir desde la raíz del repo:

```sh
python -m pip install -r mobile/scripts/requirements.txt
python mobile/scripts/generate_app_icon.py app/favicon.ico mobile/assets/icon.png
python -m unittest discover -s mobile/scripts -p test_generate_app_icon.py
```

Pillow es una herramienta Python de generación y verificación; no agrega dependencias al cliente nativo ni al backend. GitHub Actions prepara Python 3.13 e instala la versión fijada antes de ejecutar las pruebas de scripts.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 URL proveedor | `mobile/__tests__/google-avatar-url.test.ts` | Unit | Cuenta/sesión 22/22 | Módulo ausente; después HTTP; luego 7 restricciones y 4 malformadas fallaron antes de sus implementaciones | 1/1 → 2/2 → 17/17 → 21/21 | HTTPS base/subdominio/443; ausente, HTTP, userinfo, longitud, host ajeno/imitado, fragmento, etiquetas/espacios/controles | Comprobación focal conjunta 32/32 PASS |
| 1.2 Avatar Cuenta | `mobile/__tests__/GoogleAvatar.test.tsx` | RNTL | Cuenta/sesión 22/22 | Ausencia de Image; después éxito tardío tras error falló 1/11 | 1/1 → 10/10 → 11/11 | Foto, carga, ausencia, error/offline, misma URL con otra identidad, URL nueva, logout y callbacks anteriores | Separación de instancia por identidad/URL y estado de carga; suites focales 31/31 y 32/32 PASS |
| 2.1/2.2 Conversión | `mobile/scripts/test_generate_app_icon.py` | Python/Pillow | Scripts anteriores: 16 PASS, 1 omitido por plataforma | Importación del generador ausente | 1/1 | 4/4: proporción rectangular, aplanado alfa/color, archivo inválido y fuente inexistente | Generador mínimo, sin redibujo; 4/4 PASS |

El primer borrador RNTL consultaba una inicial decorativa oculta sin `includeHiddenElements`; se corrigió la consulta y se repitió RED, que confirmó entonces la ausencia del componente Image. No se implementó producción antes del RED válido.

## Validación local

- Jest móvil: **19 suites, 110/110 pruebas PASS** (78 anteriores y 32 nuevas).
- Python: **21 pruebas ejecutadas, 20 PASS y 1 omitida**, una prueba anterior reservada a permisos Unix/macOS; no se declara como ejecutada en Windows.
- TypeScript: **PASS** (`tsc --noEmit`).
- ESLint móvil: **0 errores, 2 advertencias anteriores** en `tabs-layout.test.tsx` por `require()`. Se utilizó exclusión transitoria del backup ignorado `node_modules.pre-workspaces-backup/**`; no se cambian reglas de lint.
- Expo dependency check: dependencias compatibles; Expo Doctor **21/21 PASS**.
- Export iOS: **PASS**, bundle Hermes de 2,7 MB y 33 recursos locales, sin depender de Metro para la distribución.
- `git diff --check`: PASS para los cambios rastreados; el cierre del commit debe verificar también los archivos nuevos ya preparados.

Comandos ejecutados desde la raíz: `npm --workspace misaluteca-ios test`, `npm --workspace misaluteca-ios run test:scripts`, `npm --workspace misaluteca-ios run typecheck`, `npm --workspace misaluteca-ios run lint -- --ignore-pattern node_modules.pre-workspaces-backup/**`, `npm --workspace misaluteca-ios exec -- expo install --check`, `npm --workspace misaluteca-ios exec -- expo-doctor`, y `npm --workspace misaluteca-ios run export:ios` con el origen HTTPS TEST público configurado.

Documentación primaria consultada antes de implementar: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [configuración e icono Expo 57](https://docs.expo.dev/versions/v57.0.0/config/app/#icon), [Image React Native](https://reactnative.dev/docs/image), junto a las fuentes instaladas exactas de React Native 0.86.3 para el transporte iOS.

## Packaging y aceptación física

El workflow registra el catálogo `AppIcon.appiconset` generado por prebuild y los metadatos reales de `Assets.car` (`assetutil --info`) e `Info.plist` (`plutil`) tras compilar. Se verificaron esos recursos del build real, además del IPA, su commit y el identificador conservado; no se confunde la fuente PNG con aceptación en dispositivo.

Primer intento CI: [35303067332](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35303067332), commit `cbb84768380fba04efae1ca1e114a791417092c5`. Python 3.13 y Pillow se instalaron correctamente; lint y tipos pasaron, y las 32 pruebas nuevas de avatar/URL pasaron. La suite anterior `StudiesScreen.test.tsx`, cuyo código no cambió en esta entrega y había pasado en el build anterior, falló en dos casos: el primero excedió 5000 ms y el siguiente encontró todavía la fila del caso anterior en vez del resultado esperado. Hubo actualizaciones de VirtualizedList fuera de `act` por temporizadores nativos. El job terminó antes de prebuild; **no produjo un IPA**. Se repitió una vez el mismo commit, sin cambiar pruebas ni lógica anterior de Estudios; el intento 2 pasó todas las verificaciones, lo que confirma que la falla observada fue transitoria en esa ejecución.

### Candidato macOS verificado

- Run **35303067332, intento 2: SUCCESS**, job de 10 min 34 s; macOS 26, Xcode 26.4.1, Node 24.18.0, Python 3.13.15 y Pillow 12.3.0.
- Pruebas CI: **110/110 móviles**, **21/21 Python sin omisiones**, TypeScript/lint PASS, dependencias compatibles y Expo Doctor **21/21**.
- Commit compilado: `cbb84768380fba04efae1ca1e114a791417092c5`.
- IPA `MiSaluteca-unsigned.ipa`: **12.770.749 bytes**, SHA-256 `72a66be9a31f7bd9514424b7c41043121ca6a9ace6460928abe08cc32bbe4f67`.
- Verificador real: `.app` única, ZIP íntegro, Mach-O ARM64 ejecutable para `iphoneos`, bundle Hermes de **2.733.986 bytes** (magic `c61fbc03c103191f`), con el origen HTTPS TEST público compilado. Sin `_CodeSignature` ni `embedded.mobileprovision`: requiere firma con Impactor.
- `Info.plist` real del IPA: `CFBundleIdentifier=com.matyalts.misaluteca`, `MinimumOSVersion=16.4`, `CFBundlePrimaryIcon.CFBundleIconName=AppIcon`, `CFBundleIconFiles=[AppIcon60x60]`.
- Catálogo de prebuild: `AppIcon.appiconset/Contents.json` referencia `App-Icon-1024x1024@1x.png`, universal iOS 1024×1024.
- PNG de catálogo: **1024×1024 RGB**, SHA-256 `97b2961e391a8391a6bb057ad5aed0d2a24d42ea18281a28ff77e01da431a28d`. Expo recomprime el PNG, por lo que el hash de archivo difiere de la fuente; comparación real con Pillow `ImageChops.difference` sobre RGB obtiene `getbbox() is None`: **todos los píxeles son idénticos al icono fuente**.
- `Assets.car` real dentro del IPA: **169.432 bytes**. Su diagnóstico nativo muestra **AssetType: Icon Image**, `Name=AppIcon`, `Idiom=phone`, **RGB**, **Opaque=true**, **1024×1024**, y `RenditionName=App-Icon-1024x1024@1x.png`; además una entrada MultiSized Image referencia ese mismo índice 1024. Coincide con el icono declarado en Info.plist y con el catálogo generado.
- El IPA también incluye PNG de icono compilado de 120×120; contiene el chunk Apple `CgBI`, que Pillow no decodifica directamente en Windows. No se afirma una comparación de píxeles de ese PNG compilado. La fidelidad se comprobó en el catálogo generado y la inclusión nativa mediante los metadatos de Assets.car y del IPA real.
- Artefacto IPA GitHub **10531161621**; diagnóstico exacto del intento exitoso **10531525811**. GitHub conservó también el diagnóstico del intento anterior bajo el mismo nombre, por lo que se descargó adicionalmente el ID exacto exitoso para evitar mezclar evidencia. Los archivos se mantienen ignorados en `mobile/build/google-avatar-icon-35303067332/`, con ese diagnóstico en `successful-diagnostics/`.
- Revisión independiente del artefacto: **PASS**. Otra revisión reprodujo la identidad de píxeles entre fuente y catálogo, verificó la igualdad entre Info.plist del IPA y el JSON diagnóstico, y comprobó nombre/atributos del icono compilado, presencia de Assets.car, commit, tamaño y hash del IPA. No sustituyó la aceptación física pendiente.

**Aceptación física pendiente (tarea 3.2):** instalar el IPA firmado con Impactor y comprobar foto Google real, respaldo cuando no se puede descargar, cambio de cuenta y nuevo icono en pantalla de inicio/ficha del sistema. No requiere deploy backend. El modo avión puede seguir mostrando una imagen ya almacenada por la caché nativa; no debe afirmarse que fuerza un error de descarga.

### Confirmación parcial del usuario — 18-09-2026

El usuario confirmó que el icono cambió y que la foto de Google aparece en Perfil en su iPhone. Se registra esa comprobación física sin copiar datos personales. No confirmó respaldo ante fallo de descarga, cambio entre cuentas ni todas las comprobaciones de la ficha del sistema; la tarea 3.2 permanece pendiente por sus criterios restantes. No se deduce el commit del IPA instalado únicamente de esta confirmación.
