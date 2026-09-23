# Pantallas iOS: evidencia de implementación

## Alcance implementado

Se usa la entrada real de Expo Router (`mobile/app/`), no la antigua pantalla `App.tsx` conservada por compatibilidad de pruebas. Login fullscreen con un único logo local, marca actual web, Google multicolor idéntico al SVG del modal web, CTA «Acceder con Google», enlaces HTTPS de Términos/Privacidad y estados de restauración, cancelación, red y reintento. Google continúa mediante el navegador externo y MobileClient/PKCE existentes.

Inicio usa `/studies/summary`, mostrando únicamente `propiosTotal` y documentos recientes autorizados. No cuenta las filas recientes ni inventa cifras familiares. Estudios usa cards clínicas, búsqueda título/descripción y filtros enviados al servidor, sort opt-in por fecha, paginación y refresh. Detalle muestra metadata real, descripción, conclusión, adjuntos y PDFKit existente; otros formatos informan disponibilidad sin CTAs falsos. Cuenta presenta identidad Google y logout real, sin agregar eliminación ni administración de enlaces.

Las capacidades se cargan autenticadas y se ligan a la referencia de identidad y cliente canónicos: la respuesta de una identidad anterior no habilita pantallas nuevas. Inicio y búsqueda avanzada se habilitan exclusivamente con flags explícitos. Un backend anterior mantiene Estudios/Cuenta y las lecturas v1, sin depender de los nuevos endpoints. No se agregan Familia, carga, edición ni compartir antes de sus changes.

## Diseño y áreas seguras

Persona: quien necesita recuperar un estudio antes de una consulta. Dirección: archivador médico calmado, papel sólido, carpeta azul y tinta. Paleta actual web `#2F416A`, `#43599E`, `#7ABB85`, blanco y `#F8FAFC`; verde como superficie/acento con tinta oscura, sin texto blanco de bajo contraste. Inter 400/500/600/700 se carga localmente una vez en el proveedor; spacing 4 pt, radios 12/16 y sombras suaves. Los documentos, resumen, perfil y detalle comparten jerarquía clínica; Liquid Glass queda en las tabs nativas existentes.

Las capturas del usuario mostraron títulos de Estudios/Cuenta superpuestos a la barra de estado. Esas pantallas utilizaban Views sin scroll. Expo Router SDK 57 ajusta automáticamente el primer ScrollView de una tab iOS. Inicio/Cuenta ahora usan ScrollView y Estudios FlatList con `contentInsetAdjustmentBehavior="automatic"`; no se suma un SafeAreaView duplicando los insets de la tab. Los modales independientes usan su propia SafeAreaView. [Fuente primaria de Expo](https://docs.expo.dev/router/advanced/native-tabs/#safe-area-handling).

Se conservan texto escalable y contenido sin truncamiento de líneas; controles mínimos de 44 pt, roles/labels/estados para VoiceOver. Los modales consultan Reduce Motion y su cambio de preferencia, con animación desactivada hasta conocer el valor. `react-native-svg` 15.15.4 se instaló mediante Expo SDK 57 dentro del workspace para el logo Google local y pictogramas de documentos.

## TDD Cycle Evidence

| Task / comportamiento | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| Login 1.2, CTA único | `mobile/__tests__/LoginScreen.test.tsx` | RNTL real | 51/51 | Módulo LoginScreen inexistente | Login mínimo ejecutado PASS | Doubletap, restore, cancel, red, retry | Entry real integrado; PASS |
| Login 1.3, enlaces y feedback público | mismo archivo + `router-entry.test.tsx` | RNTL/Linking | 51/51 | Falta enlace Términos; CTA real todavía antiguo; mensaje Bearer visible | HTTPS configurado, Entry y allowlist; PASS | Privacidad/browser fallo/offline conocido/cancel/restore | Layout y Google SVG; PASS |
| Reading 1.4, query servidor | `mobile/__tests__/study-reader.test.ts` | Unit | 51/51 | studyQuery no existe | Query mínimo ejecutado PASS | Búsqueda Unicode, filtros y cursor encoded | Extraído contrato común; PASS |
| Reading 1.4, Estudios | `mobile/__tests__/StudiesScreen.test.tsx` | RNTL/adapter HTTP | 3/3 existentes | Query sin sort; sheet ausente; reset ausente; paginación pierde filtros; página tardía altera cursor; month01/year0000 | Correcciones por comportamiento ejecutadas PASS | Detalle/PDF/otros MIME, errores/retry, búsquedas tardías, filtros/reset, paginación, mes canónico y año inválido | FlatList, cards clínicas, sheet y detalle compartido; PASS |
| Reading 1.4, Inicio | `mobile/__tests__/HomeScreen.test.tsx` | RNTL/adapter HTTP | 51/51 | Módulo inexistente; error no capturado; reciente no accionable | Resumen, error/retry y detalle/PDF ejecutados PASS | 42 estudios/1 reciente, cero real, fallo sin cero inventado, cliente anterior tardío | Cards/recentes y guardas; PASS |
| Foundation, Cuenta/safe area | `mobile/__tests__/native-routes.test.tsx` | RNTL | 2/2 existentes | Cuenta no tiene ScrollView | Auto insets con perfil real ejecutado PASS | Estudios loading/error y Cuenta identidad conservados | Jerarquía visual compartida; PASS |
| Reading, disponibilidad autenticada | `mobile/__tests__/capabilities.test.ts`, `tabs-layout.test.tsx` | Unit/RNTL | 2/2 + 4/4 existentes | Se descartan flags nuevos; Inicio ausente con flag servidor real | Flags explícitos y tabs ejecutados PASS | Legacy/flags ausentes, anónimo, StrictMode y logout contra restore tardío | Snapshot capacidades por identidad; PASS |
| Accesibilidad, Reduce Motion | `mobile/__tests__/StudyDetail.test.tsx` | RNTL/native preference | Reading tests green | Modal slide aun con preferencia activa | Preferencia nativa ejecutada PASS | Preferencia true→none y false→slide | Hook compartido en filtros/detalle; PASS |

Desviación puntual del gate: la ejecución RED de «reciente accionable» devolvió un session_id todavía activo antes de editar la implementación. Al recuperar su salida confirmó el fallo contra el código anterior (no existía botón del reciente), y después GREEN confirmó los tres casos de Inicio. Se registra esta desviación del orden de espera; no se afirma haber inspeccionado ese RED antes de escribir GREEN. No hubo producción ni credenciales usadas por estas pruebas.

Un primer rerun de `native-routes` después de incorporar SVG excedió el timeout de 5 s durante compilación fría. El rerun focalizado pasó sin cambiar timeout ni reglas; las suites completas posteriores pasaron. Lint detectó dos errores nuevos de setState síncrono dentro de efectos: se corrigieron mediante montaje del sheet únicamente cuando está abierto y snapshot de capacidades por identidad, sin silenciar reglas. Los avisos nuevos de refs en cleanup se retiraron mediante guards locales/mounted conservando pruebas de respuestas tardías.

## Verificación local

- Baseline: 13 suites, 51/51 pruebas móviles PASS.
- Suites finales: 17 suites, 78/78 PASS, sin snapshots.
- Typecheck móvil PASS.
- Lint móvil PASS: 0 errores y 2 warnings ya existentes en mocks `require()` de `tabs-layout.test.tsx`; sin modificar reglas.
- Expo Doctor: 21/21 PASS.
- Export iOS final: PASS, 1307 módulos, Hermes `entry-207e6c115db89af1dc9ec7740e6ef72a.hbc` (2,7 MB), logo y tipografías Inter presentes en bundle; ejecutado después del refactor final de efectos.
- `git diff --check`: sin errores de whitespace.

## Aceptación y límites

Las capturas del usuario prueban el funcionamiento del IPA anterior, Google, tabs nativas y perfil en el dominio visible `saluteca.matyalts.me`; no prueban estas nuevas pantallas ni todos los escenarios de sesión/ownership. Este equipo Windows no ofrece simulador iOS: no se generó una captura artificial presentada como render nativo. La revisión de fuente y RNTL no sustituye la aceptación visual física.

Pendientes explícitos: instalación del nuevo IPA por Impactor, top/bottom safe areas reales, scroll y filtro con historial no vacío, abrir/cerrar PDF y regreso a posición/filtros, Google externo/cancel/retry, apertura sin Metro/red, VoiceOver, Dynamic Type grande y Reduce Transparency/Increase Contrast/Reduce Motion. El mínimo iOS y el bundle identifier permanecen configurados por Foundation. Login 2.1 y Reading 2.1 quedan sin marcar hasta reunir su evidencia completa.

La presentación responsive del puente web «Conectar Mi Saluteca» la implementó el executor backend sin cambiar escape/formularios/CSRF/validaciones/protocolo. Su evidencia MySQL/HTTP se registra por separado en [ios-production-api-evidence.md](ios-production-api-evidence.md).

## Build macOS y candidato IPA verificado

[Run 35300380022](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35300380022) terminó **SUCCESS** sobre el commit exacto `ab440fd75210bc4bffd6fc3a59ddde54179771d7`. Job macOS 26 desde `2026-09-18T02:42:15Z` hasta `02:57:22Z`; compilación Release para dispositivo de `02:44:30Z` a `02:56:52Z`, con `** BUILD SUCCEEDED **` en diagnósticos. Pasaron npm ci del workspace, lint/typecheck, 78/78 pruebas móviles, 17 tests Python de empaquetado/verificación, chequeo de dependencias Expo, Doctor 21/21, prebuild, pods, compilación, empaquetado/verificación y uploads.

Manifest: Expo 57.0.23, RN 0.86.3, React 19.2.3, Node 24.18.0, Xcode 26.4.1 (17E202), CocoaPods 1.17.0, imagen macOS `20260907.0351.1`. El diagnóstico incluye compilación del módulo PDFKit SalutecaPreview y de RNSVG; no se infiere aceptación visual de esa compilación.

Se descargaron los artifacts IPA/manifest/verificación y diagnósticos al directorio ignorado `mobile/build/production-35300380022/`. Se volvió a ejecutar `mobile/scripts/verify_ipa.py` sobre el **IPA descargado real**, con resultado PASS: aplicación única `MiSaluteca.app`, executable Mach-O ARM64, plataforma `iphoneos`, bundle incluido y ZIP íntegro.

| Comprobación del candidato | Resultado |
|---|---|
| Archivo | `MiSaluteca-unsigned-ab440fd75210bc4bffd6fc3a59ddde54179771d7/MiSaluteca-unsigned.ipa` |
| Tamaño | 12.653.561 bytes |
| SHA-256 | `6bfd9f79835525c8f2a8b32d7634c6cacbe7fff84626df804cd0731ff1e90049` |
| Bundle identifier | `com.matyalts.misaluteca` |
| Plataforma / mínimo | `iphoneos` / iOS 16.4 |
| URL scheme | `com.matyalts.misaluteca` |
| Hermes | Header real `0x1f1903c103bc1fc6`, main.jsbundle de 2.731.600 bytes |
| Backend incluido | `https://saluteca.matyalts.me` presente en bytecode |
| Nueva UI incluida | Strings reales de login y «Documentos adjuntos» presentes en bytecode |
| Recursos | Tipografías Inter 400/500/600/700 incluidas en assets del IPA |
| Firma de app | Sin embedded.mobileprovision ni app CodeResources; Mach-O sin LC_CODE_SIGNATURE, consistente con candidato unsigned |

El candidato requiere firma local con Impactor. Este resultado demuestra compilación y contenido del artefacto, **no instalación ni aceptación física de las nuevas pantallas**. El backend TEST debe recibir los endpoints de este commit para habilitar Inicio/búsqueda avanzada y el nuevo estilo del puente; el backend anterior conserva las pantallas propias compatibles.
