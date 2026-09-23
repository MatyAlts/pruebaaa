# Evidencia de implementación: connect-ios-studies

## Autorización y límites

17/09/2026: usuario aprobó explícitamente Google web + PKCE/código de un uso, tokens opacos revocables/rotativos y tablas para entorno de prueba VPS, antes de código auth. EasyPanel confirmado; origen propuesto https://saluteca.matyalts.me y callback Google /api/auth/callback/google. Usuario hará primer deployment y luego dará trigger privado para GitHub Secret EASYPANEL_DEPLOY_WEBHOOK. No se comprobó DNS/TLS/Google/VPS ni se invocó hook; no se accedió a DB de producción.

Usuario aprobó dos excepciones puntuales a safety net legacy: inicialización OpenAI después de guards dentro del método (sin API key para importar/build) y params Promise+await en página de detalle Next16. No se corrigió lint web preexistente ni se desactivaron checks de build.

## Baseline y resultados ejecutados

- Antes de cambios: móvil Jest2/2; scripts IPA17 tests PASS con1 skip; web ESLint23 errores+48 warnings, TypeScript previo PASS (sin tipos Next build generados).
- Node24.18.0 runner TS. Docker Desktop iniciado oculto sin modificar WSL/global settings. MySQL8.4 dedicado tmpfs, misaluteca_mobile_test, loopback33316 y3306 (3306 libre verificado); fixtures ficticias, credenciales exclusivamente de test codificadas en harness aislado. No lee DB env reales.
- `RUN_MOBILE_MYSQL_TESTS=1 npm run test:mobile-backend`: agregado40/40 PASS, cero skips, ejecutado serial con --test-concurrency=1. Incluye DB código y refresh concurrentes, replay/revocación que sobreviven commit, rollback SQL, rate inválido persistido, bootstrap fresh test y HTTP Next real con aislamiento entre usuarios, familia/missing404, Bearer401, PDF legacy/no fallback/nosniff, navegador sin sesión y Origin403, logout204 sin Set-Cookie y access401. Incluye triangulación de sesión web ausente next-page3/3 PASS.
- `mobile/npm test`:31/31 PASS,5 suites, sin warnings act después de usar renderAsync/fireEventAsync RNTL para React19. `npm run typecheck` PASS; `npm run lint` PASS0warnings; `npm run test:scripts`17PASS con1skip preexistente.
- `npx expo install --check`: PASS. `npx expo-doctor@latest`:21/21 PASS tras quitar expo-auth-session sin uso y expo-modules-core directo, importar API desde expo y deduplicar. Autolinking apple resolve detecta SalutecaPreview pod y SalutecaPreviewModule. No equivale a compilación Swift.
- TypeScript root global PASS ejecutado; chequeo concurrente con Next dev encontró tipos generados parciales. next typegen regeneró tipos canonical; los dos archivos dev inválidos se preservaron como .bak dentro de .next/dev/types (rutas workspace verificadas, ignored); no se borraron ni se cambiaron tipos fuente. Rechequeo secuencial root tsc --noEmit PASS. La eliminación recursiva de tipos fue rechazada por aprobación automática (blocked by policy); no ocurrió. Alternativa segura aprobada automáticamente: preservar dos archivos concretos con extensión .bak y regenerar tipos canonical, sin borrar datos ni modificar tsconfig fuente. actionlint1.7.12 dos workflows PASS; repetido después de último ajuste mecánico de path duplicado: PASS.
- Docker real sin credenciales IA: builder webpack compiló pero encontró firma PageProps legacy (corregida con aprobación y tests); siguiente webpack compile/types PASS pero prerender privacidad falló useSession undefined. Se descartó la elección opcional webpack y se usó script original Next16/Turbopack: compile27.5s, TypeScript PASS y15/15 static pages PASS. No se infiere causa interna webpack ni se agregó fallback auth. Imagen exportada/unpacked PASS; runtime container no-root arrancó y /api/mobile/v1/me devolvió401/no-store sin credenciales DB; container detenido tras smoke. No demuestra Google/DB remota.

## TDD Cycle Evidence

| Tarea/comportamiento | Test File | Layer | Safety Net | RED ejecutado | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2.2–2.5 núcleo auth | tests/mobile-backend/auth.test.ts | Unit | Módulo nuevo | Grupo inicial13 tests: módulo ausente |13PASS inicial;17PASS actual | PKCE/state/CSRF/user/expiry/replay/rotation/logout | Throttle independiente validado |
| Persistencia transaccional | tests/mobile-backend/store.test.ts | SQL boundary unit | Módulo nuevo | Módulo ausente |3PASS | commit/rollback/release/locks/rate | Sin cambio posterior |
| 2.3/2.4 rate y replay DB | tests/mobile-backend/mysql.integration.test.ts | MySQL8.4 + HTTP Next | DB aislada | Rate inválido no acumulaba por rollback | PASS real | Código y refresh concurrentes, familia revocada, rollback | Separar commit cuota, no simular autenticación |
| 3.1–3.3 lectura propia | tests/mobile-backend/studies.test.ts | Unit+filesystem | Módulo nuevo | Grupo6: módulo ausente |6PASS | Páginas/empty/error/owner/family/legacy/path/PDF límite | Mapper web preservado |
| 3.3 PDF lectura acotada | tests/mobile-backend/pdf-bound.test.ts | Unit handle IO |6 estudios PASS previo | Helper ausente |2PASS | Growing input limitado10MB+1; short reads/EOF | Integración open/stat/read/finallyclose |
| 2/3 HTTP/error/body | tests/mobile-backend/http.test.ts | Handler WebAPI | Módulo nuevo | Grupo4 inicial; después chunked cancel RED real |5PASS | Bearer/cookies/no-store/sanitized errors/body4096 | Stream cancel al superar límite |
| 4.1/4.2/4.5 sesión | mobile/__tests__/session.test.ts | Unit boundaries | Mobile2PASS previo | Grupo6 inicial; RED individuales evil scheme, refresh ambiguo, slow logout, late restore, stream limit, late login |18PASS | Single-flight/invalid refresh/network/cancel/logout/valid invalid PDF | Generation guards y cierre local antes de remote |
| 4.2 proof PKCE | mobile/__tests__/proof.test.ts | Pure unit | Módulo nuevo | Helper ausente; después entropía corta RED |3PASS | Dos RNG independientes; vector SHA256 conocido; fail closed length | API exportada por expo |
| 4.3 pantalla estudios | mobile/__tests__/StudiesScreen.test.tsx | UI integration | Mobile2PASS previo | Missing screen RED→GREEN; retry/empty RED→GREEN; paging/PDF RED→GREEN |3PASS | Detalle/atrás/error/retry/vacío/paging/PDF vs otro formato | Harness async React19; lint effect corregido y suite verde |
| 4.1/4.5 apertura/logout UI | mobile/__tests__/App.test.tsx | UI+session |2PASS previo | Entrada Google/config RED→GREEN |4PASS | Baseline apertura/offline y logout UI antes de remote | Wrapper root tipado, texto UTF8 preservado |
| 4.4 contrato PDF | mobile/__tests__/pdf.test.ts | Unit IO/viewer boundary | Módulo nuevo | Missing coordinator RED→GREEN; late save/logout RED→GREEN |3PASS | Dismiss/error elimina; failed download no save; late file no presentation | Native real separado |
| Bootstrap TEST | tests/mobile-backend/bootstrap.integration.test.ts | MySQL8.4 schema | DB dedicada | SQL ausente |1PASS | INSERT/UPDATE Google, lectura vacía, FK migration y reapply fail | No alter existing business tables |
| Excepción AI | tests/mobile-backend/ai-import.test.ts | Module runtime subprocess |1PASS empty OCR antes de edit | Missingcredentials al importar sin env key |2PASS | Missing key y empty OCR no invocan API | Constructor después de guards |
| Excepción PageProps | tests/mobile-backend/next-page.test.ts | SSR source ejecutada (TS transpile memory) |1PASS params objeto antes de edit | Promise resolvía consulta con undefined |3PASS | Promise id distinto y sesión ausente no consulta | Firma/await únicamente; Next build real PASS |

**Desviación histórica estricta explícita:** al crear módulos nuevos se escribieron grupos iniciales de tests antes de ejecutar un único RED por módulo ausente (auth13/estudios6/HTTP4/sesión6). Esto no demuestra ciclos mínimos independientes por comportamiento y no cumple la instrucción de escribir solo el test necesario para fallar. No se reconstruye ni inventa evidencia retroactiva. Los fixes y nuevos comportamientos siguientes tuvieron RED individual ejecutado, mínimo GREEN, triangulación y ejecución posterior. Fixtures/mocks prueban fronteras, no Google real. SQL/config/deps/YAML/docs se verifican por ejecución/schema/CLI, sin tests tautológicos de archivos.

## Pendientes de aceptación

Deployment inicial EasyPanel/DNS/TLS/Google y revisión SQL por responsable; API real y Google en navegador; instalación del nuevo IPA con Impactor; iPhone Google→lista→detalle→PDFKit→cerrar→logout/renew/offline con dos cuentas. La compilación Swift macOS ya pasó, como registra la sección de Actions. No marcar las tareas manuales por Jest, inspección de código ni builds. El transporte usa expo/fetch real (Swift credentials omit y redirect error verificados en SDK57 instalado); fetch global RN no ofrece esas garantías. Visor PDFKit propio sin acción exportar/compartir, protección de archivos complete, cleanup temporal; no promete borrar capturas/copias externas.

Expo export iOS con origen público de prueba PASS: bundle Hermes .hbc,628 módulos, branding; no equivale a compilación nativa ni prueba contra VPS.

## Revisión final y refactor ejecutado

Prettier3.9.7 (versión verificada en registry oficial npm) vía npx, sin agregar dependencias/lockfiles; únicamente source/tests nuevos y App/test móvil modificados. No formateó archivos legacy AI/page. Después del formato: backend agregado40/40PASS contra DB/HTTP real, móvil31/31PASS, mobile lint/typecheck y root next typegen→tsc secuencial PASS, git diff --check PASS.

Hallazgos de revisión móvil solucionados mediante tres ciclos RED individuales reales: refresh viejo NETWORK tras logout+newlogin borraba sesión nueva→guard generation; SecureStore.set pendiente permitía finalizar logout antes de escribir/limpiar→cola de mutaciones set/remove con escritura y limpieza stale atómicas, logout espera cola; refresh inválido ocultaba user solo tras cleanup lento→invalidateaccess/usernull síncrono antes de awaits y sin update tardío. GREEN primero y luego triangulación old401 y refreshwrite pendiente→logout→relogin; sesión18/18 y agregado móvil31/31. Lecturas SecureStore no se serializan, para que logout no espere un restore tardío; generation descarta ese resultado. Ningún test pretende Google real.
## GitHub Actions y artefacto real

Commit implementado/publicado por coordinación: `3f730c0de10f813d1d42ac81af7f5f93989fa8e3`.

- Backend [run35266952451](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35266952451) **SUCCESS** en Ubuntu: tests dedicados MySQL8.4/HTTP y Docker build sin credenciales. Salida real del hook: «Hook no configurado: deployment omitido. Primer deploy corresponde al responsable de EasyPanel.» No se llamó VPS.
- iOS [run35266997394](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35266997394) **SUCCESS**: macOS26/Xcode26.4.1/CocoaPods1.17.0, validations+pods+Release iphoneos+checker+artefactos. SHA exacto coincide con manifest; input público API https://saluteca.matyalts.me. Descargados IPA y diagnósticos en `mobile/build/ci-35266997394` (ignored, no se versiona binario).
- Log nativo contiene `SwiftCompile normal arm64 Compiling SalutecaPreviewModule.swift` del target SalutecaPreview y `BUILD SUCCEEDED`. Mach-O real incluye metadata SalutecaPreviewModule y dependencia PDFKit.framework/PDFKit.
- IPA validado localmente con verify_ipa.py: candidato para firma local, iphoneos. Info.plist bundle identifier com.matyalts.misaluteca, mínimoiOS16.4 y scheme com.matyalts.misaluteca (Expo también lo añade desde bundle identifier, duplicado equivalente). Payload/MiSaluteca.app/main.jsbundle es bytecode Hermes (magic c61fbc03c103191f); pool binario incluye exactamente el origen público https://saluteca.matyalts.me.
- IPA7295783 bytes, SHA256 `e0d7b225121b06477196b8a9e08ff3a437e9e060e6ee1b943da5bc6a931d9b54`. Inspección JSON local no sensible en directorio ignored. Sin inferir instalación, ejecución iPhone, Google real ni disponibilidad de ese dominio por estos resultados.

Compilación nativa requerida por4.4 completada.5.3 permanece pendiente porque nueva IPA aún no se instaló mediante Impactor;1.2/5.2/5.4 siguen externas. No archive todavía.

## Confirmación posterior del usuario

17/09/2026: el usuario informó: «ya probé toda la app en iOS y puedo iniciar sesión con Google». Se registra una prueba en dispositivo y el inicio de sesión Google exitoso. La siguiente etapa solicitada es reemplazar la presentación de prueba por pantallas equivalentes a la web, con login de la misma identidad visual y navegación nativa iOS con Liquid Glass.

Esta confirmación no identifica el run del IPA instalado ni la URL del backend utilizado, ni detalla los escenarios de dos cuentas, expiración/renovación y limpieza local sin red. El checklist conserva pendientes los criterios específicos sin evidencia y no se archiva automáticamente el change.
