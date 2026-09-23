# Evidencia de Familia nativa

Fecha: 18-09-2026. Change `ios-family-records`, tarea 1.5. Implementación local aprobada por el usuario; no se ejecutó SQL ni se desplegó en la VPS desde este trabajo.

## Pantallas y contratos reales

- Familia aparece solamente tras `familyRead:true` del servidor autenticado. Alta/renombrado dependen de `familyWrite`; eliminación de `familyDelete`, incluida la disponibilidad real del worker interno. Un backend anterior mantiene Estudios/Cuenta y no habilita Familia por inferencia.
- Carpetas reales con nombre, cantidad y última fecha; detalle consultado por UUID. Formulario equivalente a la web: solamente nombre, trim, entre 1 y 40 unidades UTF-16 como la validación del backend. No hay campos ficticios ni carga de estudios anticipada.
- Estudios del familiar reutilizan lista, búsqueda, filtros, cursor por fecha, detalle y PDF nativo. La tab Estudios conserva `self` por defecto; selección explícita propia/todos/familiar utiliza `scope` y `familyUuid` reales.
- Tarjetas y detalle identifican al paciente. VoiceOver anuncia al paciente en el hint de cada carpeta clínica, incluso con títulos iguales. El DTO antiguo sin paciente conserva «mi historial».
- Inicio habilitado para familia consulta `summary?scope=all` y presenta conteos completos del servidor. La mutación confirmada invalida las pantallas ya montadas mediante revisión de historial en SessionProvider; un rechazo SQL no anuncia éxito ni invalida como si hubiera commit.
- La eliminación explica la irreversibilidad y la cascada sobre estudios, documentos y enlaces. Exige escribir exactamente `misaluteca`; cancelar o texto incorrecto no envía DELETE. Tras 202 distingue eliminación lógica y limpieza física pendiente; solo estado `complete` verificado permite anunciar limpieza completa. Respuestas desconocidas se mantienen pendientes; un identificador ausente evita consultas ambiguas y pide comprobar el historial sin repetir la eliminación.
- Consulta de operación ligada al identificador recibido: polling automático acotado a tres intentos separados por un segundo, con comprobación manual posterior. Fallas/estado inválido no convierten pendiente en completa. Logout/desmontaje detienen actualización y polling; generaciones de consulta descartan carpetas/páginas antiguas.
- Un único modal nativo cambia entre detalle/formulario/confirmación, evitando presentar simultáneamente sheets al editar. SafeAreaView en modal y lista con insets `never`; primer FlatList de Familia mantiene insets UIKit automáticos. Scroll ajustable al teclado, Inter local, Dynamic Type, blancos clínicos sólidos y navegación nativa existente con Glass. Se preservaron avatar de Google e icono.

## Safety net y validación

Safety net: `npm --workspace misaluteca-ios test` **110/110**, 19 suites, antes de modificar producción.

| Verificación final | Resultado |
|---|---|
| Jest/RNTL completo | **144/144**, 23 suites; no skips |
| TypeScript móvil | PASS |
| ESLint móvil | 0 errores; 2 warnings previos de `require` en mocks de tabs |
| Expo Doctor | **21/21** |
| Export iOS | PASS; 1311 módulos, Hermes 2.8 MB, fuentes y recursos locales |
| Review independiente de frontend | PASS; contratos, scopes, carreras, capacidades, confirmación y semántica de limpieza |

El último ajuste de tipos fue exclusivamente la firma genérica del mock de escritura del test; TypeScript pasó y la suite focal Familia volvió a pasar **16/16**. No se debilitaron tipos de producción. Una ejecución amplia intermedia pasó 142/142; la definitiva incorpora los dos casos de VoiceOver y pasa 144/144. Expo Doctor y export no requieren credenciales del backend.

## TDD Cycle Evidence

| Task / comportamiento | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.5 Escritura autenticada | `mobile/__tests__/session.test.ts` | Unit/transport | 110/110 | `write` inexistente, ejecutado | 20/20 inicial | 22/22; Bearer, refresh401, logout tardío | PASS |
| 1.5 Capabilities | `mobile/__tests__/capabilities.test.ts` | Unit | 110/110 | flag omitido, ejecutado | 4/4 inicial | 5/5; false/ausente/valores no booleanos | PASS |
| 1.5 Carpetas | `mobile/__tests__/FamilyScreen.test.tsx` | RNTL | 110/110 | módulo inexistente, ejecutado | 1/1 inicial | carpeta real / familiar404 | PASS |
| 1.5 Alta/validación/renombrado | `mobile/__tests__/FamilyScreen.test.tsx` | RNTL | 110/110 | CTA ausente; validación enviada indebidamente; editar ausente, ejecutados | 3/3 → 4/4 → 5/5 | trim, 0/40/41, cancelación, rechazo SQL, doble tap | PASS |
| 1.5 DELETE/operaciones | `mobile/__tests__/FamilyScreen.test.tsx` | RNTL | 110/110 | DELETE CTA, comprobación, polling y estados desconocidos, ejecutados por incremento | 6/6 → 8/8 → 10/10 → 13/13 → 16/16 | cancelación/texto incorrecto, rollback visible, pending/complete, tres intentos, estados inválidos | PASS; modal único |
| 1.5 Estudios/scopes | `mobile/__tests__/StudiesScreen.test.tsx`, `FamilyScreen.test.tsx` | RNTL | 110/110 | ruta familiar, selector de paciente y detalle real inexistentes, ejecutados | 12/12 → 13/13; Familia7/7 | cursor/filtros, cambio de familiar/página tardía, PDF real | PASS |
| 1.5 Envelope HTTP | `mobile/__tests__/StudiesScreen.test.tsx`, `HomeScreen.test.tsx`, `FamilyScreen.test.tsx` | RNTL | 110/110 | `{study}` no renderizaba médico/PDF, ejecutados | Estudios14/14; Inicio+Familia16/16 | detalle propio/familiar; mocks coinciden con API real | PASS |
| 1.5 Inicio/invalidation | `mobile/__tests__/HomeScreen.test.tsx`, `family-invalidation.test.tsx`, `FamilyScreen.test.tsx` | RNTL/integration | 110/110 | summary self y conteo montado anterior, ejecutados | Inicio5/5; integración1/1 | mutación confirmada / rechazo SQL sin invalidación, backend legado | PASS |
| 1.5 Navegación | `mobile/__tests__/tabs-layout.test.tsx`, `family-route.test.tsx` | RNTL | 110/110 | tab/módulo ausentes, ejecutados | tabs6/6; ruta1/1 | ruta3/3; legado, solo lectura, logout | PASS |
| 1.5 Paciente accesible | `mobile/__tests__/clinical-patient-accessibility.test.tsx`, `StudyDetail.test.tsx` | RNTL | 110/110 | paciente suprimido en hint/detalle, ejecutados | hint1/1; detalle3/3 | hint2/2: mismo título y DTO legado; Reduce Motion existente | PASS |

Un RED de alta incluyó además un timeout ambiental del primer render RN en Windows bajo carga concurrente (9.3 s frente a límite 5 s); el fallo esperado de CTA ausente quedó comprobado por separado. La suite nueva Familia usa límite de 30 s para inicialización, conservando deadlines de `waitFor` y todos los umbrales de tests anteriores. Un mock inicial de integración no emitía el estado de restore: se corrigió el fixture y se volvió a ejecutar RED para demostrar el conteo montado sin refrescar antes de implementar invalidation. Se corrigieron errores puntuales de copy codificado por PowerShell y matcher de test durante GREEN; no se etiquetan como evidencia de comportamiento. Hubo warnings ocasionales de timers internos de VirtualizedList fuera de act en corridas intermedias; la corrida final completa pasó sin esos warnings y sin ocultar console.error.

## Limitaciones y aceptación pendiente

La compilación macOS y publicación del candidato se completaron según la evidencia siguiente. Tarea 1.6 permanece pendiente de aceptación física del usuario: teclado, texto ampliado, VoiceOver, CRUD, confirmación de cascada, dos cuentas y fixtures propios. Los mocks no certifican el dispositivo ni seguridad SQL; esas verificaciones MySQL/HTTP corresponden a evidencia del backend. La corrección de carga web sigue pospuesta; cámara/Files/subida no forman parte de esta entrega.

Referencia oficial leída antes de código: [Expo SDK57](https://docs.expo.dev/versions/v57.0.0/). Se mantuvo SDK57/RN0.86 e infraestructura existente sin dependencias nuevas.

## IPA macOS verificado

- [Run 35306211706](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35306211706): **SUCCESS**, primer intento, commit móvil `507c33d0097ed620f04d0ef0457e76d3363e00a5`. Job de 13 min 17 s (04:14:38–04:27:55 UTC); Release `iphoneos` concluyó `BUILD SUCCEEDED`. No se repitió el workflow ni se cambiaron umbrales anteriores.
- CI real: **144/144 pruebas móviles**, 23 suites; **21/21 Python**; lint/typecheck PASS; dependencias compatibles; Doctor **21/21**. MacOS26/Xcode26.4.1, Node24.18.0, CocoaPods1.17.0, Expo57.0.23/RN0.86.3/React19.2.3.
- [Artefacto IPA 10532305973](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35306211706/artifacts/10532305973); diagnóstico exacto **10532335877**. Solo existe un artefacto de cada nombre en este run exitoso. Descargados en `mobile/build/family-35306211706/ipa` y `diagnostics`, ambos ignorados por Git.
- IPA **12.780.825 bytes**, SHA-256 `121f05659cdbf4c2d903fdbd6454e94c5e3a74f18d287647d3805eeaedfce58a`. ZIP íntegro, una `.app`, ejecutable Mach-O ARM64 para dispositivo, bundle Hermes de **2.757.736 bytes**, magic `c61fbc03c103191f`.
- Identidad conservada: `com.matyalts.misaluteca`, iOS mínimo16.4, origen público HTTPS `saluteca.matyalts.me` realmente incluido en el bundle. Sin `_CodeSignature` ni `embedded.mobileprovision`: requiere firma local con Impactor y no certifica instalación nueva.
- El bundle contiene rutas/capabilities reales de familia, operaciones, selección «Todos los pacientes», confirmación `misaluteca`, mensaje de limpieza pendiente y allowlist `googleusercontent.com`; no se confunde el origen compilado con readiness del backend desplegado.
- `Info.plist` del IPA coincide exactamente con el JSON diagnóstico nativo. Icono `AppIcon`, PNG compilado `AppIcon60x60` y `Assets.car` **169.432 bytes** conservados. Metadatos `assetutil`: icono iPhone1024×1024, RGB, opaco, rendition `App-Icon-1024x1024@1x.png`.
- Catálogo prebuild1024×1024RGB: PNG SHA-256 `97b2961e391a8391a6bb057ad5aed0d2a24d42ea18281a28ff77e01da431a28d`, mismo archivo que el catálogo de la entrega anterior. Todos los píxeles coinciden con `mobile/assets/icon.png` mediante Pillow/ImageChops. Expo recomprime el PNG: no se afirma igualdad de hash con la fuente. La inclusión compilada se comprueba en Assets.car/Info.plist; no se intenta decodificar PNG AppleCgBI como PNG estándar.
- **Auditoría independiente del candidato: PASS**; reprodujo ZIP/Mach-O/Hermes/ausencia de firma, manifest/commit, origen, strings familiares y fidelidad del icono.

El backend puede recibir después una corrección propia de EasyPanel sin modificar estas fuentes móviles. El candidato queda ligado a este commit exacto; no afirma que la migración familiar haya sido aplicada en VPS ni que el backend desplegado habilite todavía sus capabilities.
