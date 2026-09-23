# Evidencia de carga de estudios iOS

Fecha: 2026-09-18. Change: `ios-study-upload`. Implementación móvil aprobada; no se ejecutaron acciones en la VPS ni pruebas con servicios pagos.

## Resultado verificado localmente

- Baseline antes de implementar: **144/144 tests, 23 suites**.
- Fuente final tras refactor: **228/228 tests, 34 suites**, sin fallos ni skips (50,395 s).
- TypeScript: PASS (`npm.cmd --workspace misaluteca-ios run typecheck`).
- ESLint: **0 errores**, solamente las **2 advertencias previas** de `tabs-layout.test.tsx`.
- Expo Doctor: **21/21 PASS**.
- Export iOS: PASS, **1326 módulos**, bundle Hermes de aproximadamente 2,8 MB.
- Scripts Python en Windows: **21 tests**, PASS con **1 skip** al crear enlaces por permisos del SO; no se presenta ese skip como compilación de Swift. En el runner macOS fueron **21/21 sin skips**.
- Configuración introspectada: conserva `com.matyalts.misaluteca`; incluye permiso de cámara y excluye permisos de micrófono, lectura de Fotos y escritura en Fotos.

## Ciclo TDD ejecutado

Cada incremento descrito tuvo test escrito y ejecutado en RED antes de modificar producción; se ejecutó GREEN y se trianguló con entradas diferentes. Los números focales corresponden a cada archivo final, no deben sumarse a las suites de integración que ejercitan los mismos componentes.

| Tarea / comportamiento | Test | Capa | Safety net | RED ejecutado | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.1: fecha civil, campos web y límites | `upload-draft.test.ts` | Unidad | Baseline 144/144 | Función ausente; luego fechas y límites inválidos | 9/9 | Fechas imposibles, Unicode, MIME, tamaño y cantidad | Suite final 228/228 PASS tras refactor |
| 2.1: Files y cámara con permiso puntual | `upload-picker.test.ts` | Adaptador SDK | Baseline 144/144 | Dependencias / adaptador ausentes; MIME opcional | 6/6 | Cancelación, denegación, selección múltiple y MIME por extensión | Suite final 228/228 PASS tras refactor |
| 2.1: formulario, progreso, cancelación y reintento | `UploadScreen.test.tsx` | Componente + coordinador real | Baseline 144/144 | Controles ausentes; cámara con 10 archivos; recuperación 404; retorno tardío; error al quitar | 18/18 | Pending bloquea edición/cámara/cierre, failed permite corregir, 413 explica overhead, lote inválido limpia copias | Suite final 228/228 PASS tras refactor |
| 2.1: capacidades y selección de familiares | `UploadEntry.test.tsx` | Integración de servicios y UI | Baseline 144/144 | CTA / progreso / error y reintento de pacientes ausentes | 6/6 | Backend antiguo oculta CTA; lectura de familiares propios; unmount aborta e ignora éxito tardío | Suite final 228/228 PASS tras refactor |
| 2.1: rutas Inicio / Estudios / Familia | `upload-routes.test.tsx`, `family-upload.test.tsx` | Rutas + provider real | Suites existentes verdes | CTA / integración ausentes; remount perdía filtros | 3/3 + 1/1 | Commit confirma y recarga manteniendo búsqueda/paciente; familiar inicia con UUID propio; un único Modal | Suite final 228/228 PASS tras refactor |
| 2.2: multipart con sesión canónica | `session.test.ts` | Cliente con transportes controlados | 22/22 existentes | Método upload ausente | 29/29 | Bearer interno, 401 renueva una sola vez, body nuevo con misma clave, generación y descargas privadas | Suite final 228/228 PASS tras refactor |
| 2.2: XHR | `upload-transport.test.ts` | Transporte | Baseline 144/144 | Transporte ausente | 5/5 | Progreso, FormData sin Content-Type manual, timeout/red/abort ambiguos y origen final | Suite final 228/228 PASS tras refactor |
| 2.2: idempotencia y conciliación | `upload-coordinator.test.ts` | Coordinador | Baseline 144/144 | Coordinador ausente; operación incorrecta; GET antes de reenvío | 12/12 | UUID estable, singleflight, pending no duplica, failed retryable, GET404 permite mismo POST, offline impide reenviar, reset seguro | Suite final 228/228 PASS tras refactor |
| 2.2: archivos temporales privados | `upload-files.test.ts`, `upload-native-storage.test.ts` | Adaptadores de archivos | Baseline 144/144 | Importación / await-copy / protección / clear serializado ausentes | 6/6 + 3/3 | Magic PDF/JPEG/PNG, HEIC renombrado rechazado, 10 MiB antes de lectura, copia parcial eliminada, logout tardío y próxima cuenta esperan limpieza | Suite final 228/228 PASS tras refactor |
| 2.3: visor privado de imágenes | `pdf.test.ts`, `StudyDetail.test.tsx`, `private-image-routes.test.tsx` | Bridge + componentes/rutas | PDF 3/3; Detail 3/3; Home 5/5 y Studies 15/15 | Imagen enviaba flujo PDF / botón ausente | 5/5 + 5/5 + 3/3 | PDF mantiene firma previa; JPEG/PNG exige capacidad exacta; MIME real llega desde Inicio, Estudios y Familia; desconocido no crea archivo | Suite final 228/228 PASS tras refactor |

Se ejecutó nuevamente la suite completa después de formatear y consolidar imports. Una prueba de eliminación se ajustó para esperar el final de la operación dentro de `act`, sin aumentar ningún timeout.

## Contrato y límites reales

El formulario envía los campos de la web y paciente propio o UUID de un familiar de la cuenta. Files acepta PDF/JPEG/PNG, hasta 10 adjuntos de 10 MiB. La suma local permite 50 MiB, pero el servidor limita **todo el multipart a 50 MiB**, incluidos sus campos y cabeceras: una selección que suma exactamente 50 MiB puede recibir 413. La UI explica cómo reducirla.

La cámara solicita autorización al usarla y ofrece Configuración cuando el sistema impide volver a pedir permiso. No abre galería, graba video ni guarda en Fotos. El código primario instalado de Expo 57 (`expo-image-picker/ios/ImageUtils.swift`) convierte la captura de cámara `UIImage` a JPEG; la importación verifica bytes, no renombra HEIC como JPEG.

El UUID de operación vive **solamente en memoria**, asociado al formulario y a la sesión. Un corte de red, timeout o cancelación puede haber llegado al servidor: la UI conserva formulario, archivos privados y clave, y ofrece verificar o reintentar la misma carga. Todo reintento con clave previa hace GET primero; un 404 permite repetir POST con **la misma clave**. Pending no genera una carga nueva. La respuesta debe incluir `operationId` igual a la clave; sólo `complete` con estudio confirmado invalida los historiales. Cerrar completamente la app no promete recuperar el borrador ni su clave. No hay cola offline.

Files/cámara se copian al caché privado `misaluteca-uploads` con nombre UUID, verificando magic y esperando el resultado de `File.copy`. `SalutecaPreview.protect` aplica `NSFileProtectionComplete` y confina la ruta nativa al directorio esperado. Se eliminan temporales de picker y copias parciales; al cerrar formulario o terminar sesión se limpia el directorio. La limpieza está serializada para que una cuenta nueva espere a la anterior. Un retorno de picker después de desmontar el formulario limpia su temporal y no importa una carga nueva.

El lector descarga PDF/JPEG/PNG con Bearer y límites existentes, valida MIME y magic antes de guardar en `misaluteca-pdfs`. `SalutecaPreview.preview` conserva PDFKit y utiliza UIImageView dentro de UIScrollView para JPEG/PNG, con zoom, cierre y VoiceOver. ImageIO rechaza dimensiones mayores de 8192 por lado o 24 millones de píxeles antes de decodificar la imagen. El visor no ofrece exportación, compartir ni escritura en Fotos. `close` y la limpieza existente siguen eliminando archivos temporales.

## Fuentes primarias consultadas

- [Expo ImagePicker SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/): permisos, cancelación, representación compatible y paquete `~57.0.18`.
- [Expo DocumentPicker SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/): `multiple`, tipos MIME y `copyToCacheDirectory`; paquete `~57.0.2`.
- [React Native networking](https://reactnative.dev/docs/network): XMLHttpRequest y transporte de red.
- Fuentes primarias instaladas de Expo FileSystem `~57.0.7`, ImagePicker y config plugin: métodos async `copy/create/delete`, conversión JPEG de cámara y opciones `photosPermission:false` / `microphonePermission:false`.

## Compilación macOS y candidato IPA verificados

Workflow [35311866655](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35311866655), primer intento **SUCCESS**, commit exacto `0987400010cb04eecd7a7730a662da97b1377947`. El runner ejecutó **228/228 tests móviles en 34 suites**, Python **21/21 sin skips**, Doctor **21/21**, TypeScript y lint sin errores nuevos. `xcodebuild` compiló realmente `SalutecaPreviewModule.swift`, `ImagePickerModule.swift` y `DocumentPickerModule.swift` para arm64 y terminó `BUILD SUCCEEDED`.

- Artifact IPA: **10533976512**; diagnósticos: **10533617083**.
- IPA: **12.937.199 bytes**.
- SHA-256: `895f256f5375c9364d94dbcbd583b85d4cacdb06729a83f8b07839beb47f0d18`.
- Bundle y esquema: `com.matyalts.misaluteca`; plataforma `iphoneos`, Mach-O ARM64 de dispositivo, mínimo iOS **16.4**.
- Candidato sin firma, sin `_CodeSignature` ni perfil provisionado; requiere firma local para instalar.
- Hermes `main.jsbundle`: **2.820.638 bytes**; origen incluido `https://saluteca.matyalts.me`.
- Info.plist compilado: texto español para cámara, sin permisos de micrófono ni lectura/escritura en Fotos.
- Binario incluye el bridge privado y las clases de imagen/cámara/Files; el bundle contiene las rutas y controles de carga/reintento/conciliación.
- Catálogo AppIcon idéntico en píxeles y metadatos/digests del icono compilado idénticos respecto del IPA anterior de Familia (`507c33d`, run `35306211706`).

La revisi?n independiente del candidato emiti? **PASS**, verificando nuevamente estructura, SHA, permisos, c?digo nativo compilado y icono conservado. Backend CI `35311865310` para el mismo commit tambi?n termin? **SUCCESS**, con **121/121 tests sin skips y 7/7 pruebas Docker reales**.

Se descargaron los IDs exactos del run exitoso y se ejecutó nuevamente `verify_ipa.py` sobre ese IPA. Auditoría y archivos locales están en el directorio ignorado `mobile/build/upload-35311866655/`; el log completo está en `mobile/build/upload-35311866655-ci.log`.

## Validación física pendiente

Pendiente prueba física con backend TEST migrado y supervisado: cámara/Files, PDF/JPEG/PNG propios y familiares, campos opcionales, denegación de permiso y Configuración, límites/cuota, progreso/cancelación/corte de red/reintento sin duplicados, visor privado y logout. No se declara aceptación física hasta que el usuario la confirme. No se ejecutó SQL ni se desplegó en EasyPanel.
