# Rediseño nativo de las cuatro pantallas iOS

El cambio `ios-premium-screen-redesign` adapta Inicio, Estudios, Familia y Cuenta a las cuatro referencias proporcionadas. La interfaz está compuesta por controles reales de React Native; no incluye el marco del teléfono, Dynamic Island, hora, batería ni indicador de inicio de los mockups.

## Cómo probar

Nueva devolución física de cinco pantallas: detalle/filtros aún requieren unificar presentación, el modal familiar sigue mostrando solapamiento superior y se solicita calendario nativo y gestos entre pestañas/retorno. Las tareas 6.1–6.6 registran estas correcciones; no hay nuevas comprobaciones aprobadas ni nuevo binario registrado para ellas todavía. La tarea 3.3 continúa pendiente.

La corrección modal debe colocar SafeAreaProvider dentro de la raíz nativa de Modal y un único SafeAreaView fuera del scroll. La referencia a sólo un SafeAreaView en la etapa previa resultó insuficiente para esa jerarquía nativa. Verificar también candado sin deformación, confirmación/cancelación de fecha sin cambiar día y gestos que no interfieran con campos/selección/scroll vertical ni modales. El retorno interactivo desde detalle requiere stack nativo; la lista de origen debe conservar búsqueda, filtros y paciente.

El calendario reutilizará @expo/ui instalado 57.0.19, promoviendo esa misma versión sin actualización masiva. Eliminación individual e IA tienen diseños separados pendientes de aprobación y no se consideran incluidas por esta corrección de UI.

1. Utilizar el backend TEST que ya permite iniciar sesión y leer/cargar estudios. Este rediseño no requiere nuevas variables, SQL ni cambios en EasyPanel.
2. Descargar el [IPA corregido y auditado](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35362128804/artifacts/10554458788), generado después de los problemas visuales de la primera prueba. Instalar mediante Impactor conservando `com.matyalts.misaluteca`. La evidencia exacta del nuevo binario está al final de esta guía; su fidelidad visual todavía requiere comprobarse en el iPhone.
3. Iniciar sesión con una cuenta TEST y utilizar documentos ficticios para las comprobaciones. Las pestañas y acciones conservan las capacidades reales del backend; si faltan Familia o Cargar estudio, revisar las capacidades del despliegue existente.
4. Recorrer la lista siguiente en el iPhone. Compartir capturas solamente con información ficticia o datos personales ocultos.

Para desarrollo local desde la raíz del repo:

```powershell
npm.cmd run start --workspace=misaluteca-ios
```

La compilación Release del workflow existente incorpora JavaScript y recursos; no necesita Metro. Este documento no afirma haber ejecutado un simulador iOS en Windows.

## Comprobación por pantalla

| Pantalla | Comprobar |
| --- | --- |
| Inicio | Saludo/avatar de sesión, botón Cargar estudio que abre el flujo real, conteos completos del servidor, tarjetas adaptables, recientes con detalle y Ver todos con destino real. |
| Estudios | Mi historial/Todos los pacientes y selector familiar sin estados contradictorios; Mostrando y resultados correspondientes al alcance; búsqueda aplicada, limpieza, hoja de filtros, paginación y apertura de detalle/adjuntos. |
| Familia | Cantidad real de personas, conteos de estudios independientes, Agregar familiar habilitado, alta con nombre válido, apertura de carpeta, carga para ese familiar y operaciones existentes con sus confirmaciones. |
| Cuenta | Avatar/fallback, nombre y correo actuales, ausencia de destinos ficticios y logout real con limpieza de estado y vuelta al acceso público. |

El resumen de Inicio usa `propiosTotal` para estudios propios, `familiaresTotal` para estudios de familiares y `total` para la suma. La cantidad de familiares se muestra en Familia. Los recientes se toman de la respuesta del servidor; no se utilizan para calcular el resumen.

## Comprobación visual y de accesibilidad pendiente en iOS

- Comparar las cuatro pantallas con las referencias: márgenes de aproximadamente 20 puntos, títulos de sistema de 34 puntos, radios de tarjeta de 24 puntos, jerarquía y acentos azul/menta.
- Probar ancho pequeño y tamaños de texto grandes, incluidos tamaños de accesibilidad. Los textos largos deben envolver; la fila de resumen debe adaptarse sin cortar cantidades ni nombres.
- Activar VoiceOver: botones y campos identificables, paciente distinguible en cada documento, decoración e iconos no anunciados como contenido separado.
- Activar y desactivar Reducir movimiento y Reducir transparencia mientras la app está abierta; la navegación y hojas deben seguir siendo legibles.
- Desplazar cada lista hasta el final y comprobar que el último elemento pueda quedar por encima de la barra nativa. Revisar tanto pestañas como carpeta familiar modal y teclado abierto.
- Probar carga desde Cámara/Archivos, filtros, alta familiar y logout; volver entre pestañas y confirmar que no se pierde la selección ni se duplican envíos.
- Probar carga inicial, historial vacío, error de red y reintento. Las cantidades no deben reemplazarse por ceros simulados cuando falla la consulta.

## Diferencias deliberadas respecto de las referencias

- UIKit mantiene la geometría, glass y comportamiento exactos de la barra nativa según el sistema/dispositivo; no se sustituye por una fila de botones ni se superpone blur adicional.
- Una selección familiar no activa visualmente Mi historial. El nombre/alcance mostrado corresponde a los datos consultados.
- El contrato actual de sesión no informa el proveedor. No se afirma Google en la tarjeta de Cuenta sin un dato verificable; el inicio de sesión existente sigue funcionando.
- No existe un destino implementado para editar perfil; la tarjeta no muestra un chevron de edición sin acción.
- Personas, documentos, fechas, nombres y fotos provienen de las respuestas reales; no se copian los valores de los mockups.

## Verificación ejecutada

El ejecutor registró un baseline de **228 pruebas móviles pasando** y una corrida focal inicial de **37 pruebas pasando**. Estos valores identifican el punto de partida y la primera etapa; no representan por sí solos la verificación final del rediseño completo.

El ejecutor confirmó estos controles finales sobre el código del rediseño:

| Control | Resultado |
| --- | --- |
| `npm.cmd run typecheck --workspace=misaluteca-ios` | PASS. |
| `npm.cmd run lint --workspace=misaluteca-ios` | PASS: cero errores, dos advertencias preexistentes de `require()` en el test de pestañas. |
| Export iOS/Hermes | PASS: 1329 módulos, bundle de aproximadamente 2,8 MB, `entry-84738cfcd684ae51abfd260d446924b2.hbc`. |
| `npm.cmd test --workspace=misaluteca-ios` | PASS: 39 suites, 247 pruebas; cero fallas ni omitidas. |
| OpenSpec estricto | PASS para los artefactos del change. |
| `git diff --check` | PASS. |

La comparación visual en iPhone/simulador sigue pendiente; compilar o exportar no la reemplaza. La primera entrega fue el código verificado localmente; los workflows posteriores y sus resultados se documentan al final de esta guía. La prueba en el dispositivo necesita un binario que incorpore estos cambios. Expo Go no sustituye ese binario para los módulos nativos privados de esta app.

### TDD Cycle Evidence

La cronología fue reportada por los ejecutores tras inspeccionar sus resultados de ejecución; la revisión independiente de este documento fue de código y contratos, no una segunda ejecución de pruebas.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 | `mobile/__tests__/premium-redesign.test.tsx` | Componente | 228/228 antes de cambios | Import de PremiumUI inexistente ejecutado antes de producción | Corrida focal inicial 37/37; final 247/247 | Acción activa/deshabilitada y fuente del sistema escalable | Controles secundarios incorporados y pruebas verdes |
| 1.2 | `mobile/__tests__/premium-home.test.tsx`, `premium-layout.test.ts` | Componente y unidad | 228/228 | Ver todos, acciones del resumen y hints faltantes; helper responsive inexistente | Corrida focal de rutas/Inicio/selector 15/15; helper 2/2; final 247/247 | Destino presente/ausente, cantidades propias/familiares y ancho normal/pequeño/texto ampliado | Extracción de SummarySurface y helper seguida por GREEN |
| 2.1 | `mobile/__tests__/premium-redesign.test.tsx`, `StudiesScreen.test.tsx` | Componente | 228/228 | Selector compacto y reintento de pacientes inexistentes ejecutados antes de cambios | Comportamientos premium finales 7/7; final 247/247 | Alcance propio/global/familiar, búsqueda/limpieza y fallo/reintento conservando alcance | Presentación secundaria y hoja compacta seguidas por GREEN |
| 2.2 | `mobile/__tests__/FamilyScreen.test.tsx` | Componente | 16/16 familiares existentes | Dos pruebas de rediseño fallaron antes de producción | 18/18 | Información/conteo reales y estado vacío sin personas inventadas; operaciones anteriores conservadas | Ajuste de tokens seguido por corrida combinada 31/31 |
| 2.3 | `mobile/__tests__/account-redesign.test.tsx` | Componente | Avatar 11/11 y rutas 3/3 | Dos pruebas de proveedor ausente/logout ocupado fallaron antes de producción | 2/2 nuevas; corrida combinada 31/31 | Identidad actual/proveedor no inventado y bloqueo de logout durante progreso | Ajuste de tokens seguido por 31/31 |
| 2.4 | `mobile/__tests__/premium-accessibility.test.tsx`, `tabs-layout.test.tsx` | Hook y navegación | 228/228 | Lectura inicial/hook inexistente y evento frente a lectura inicial tardía | Accesibilidad/pestañas 9/9; final 247/247 | Preferencia inicial, cambio posterior y evento más nuevo gana a respuesta tardía | Guard de evento y limpieza seguido por GREEN |

Las pruebas de estilos/props verifican contratos de tipografía y disposición; no demuestran por sí solas el resultado visual renderizado en UIKit. La tarea física 3.3 permanece abierta.

## Archivos y dependencias

- `mobile/src/premium-theme.ts` y `PremiumUI.tsx`: tokens, texto nativo escalable, acciones, iconos y fondo decorativo; los degradados utilizan `react-native-svg` ya instalado.
- `mobile/src/HomeScreen.tsx`, `StudiesScreen.tsx`, `FamilyScreen.tsx` y `mobile/app/(tabs)/account.tsx`: composición de las cuatro pantallas conservando sus operaciones.
- `mobile/src/ClinicalUI.tsx`: tarjeta de documento compartida, con profesional y paciente diferenciados.
- `mobile/src/GoogleAvatar.tsx`: tamaño/forma configurables, preservando validación URL y fallback de identidad.
- `mobile/app/(tabs)/_layout.tsx` y `mobile/src/use-reduced-transparency.ts`: configuración compatible de la barra nativa y cambios de preferencia del sistema protegidos frente a respuestas iniciales tardías.
- `mobile/src/UploadEntry.tsx`: presentación del acceso a la carga existente; su coordinación, permisos y servicios permanecen vigentes.

No se añadieron dependencias ni se modificaron el tema de marca del login, la sesión, el backend, las variables de despliegue o el esquema de datos.

## Alineación puntual de parches para generar el IPA

El primer workflow de publicación, [35357616117](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35357616117), comprobó el commit `0549b55768f649516a9978be170450ad52d3023d`: tipado y lint pasaron, Jest aprobó 247/247 y Python aprobó 21/21. Se detuvo antes de compilar porque la comprobación online de Expo empezó a recomendar versiones de parche posteriores. No produjo un IPA.

Con autorización explícita del usuario se alinearon solamente estos cinco paquetes, conservando Expo SDK 57, React `19.2.3`, React Native `0.86.3`, las demás dependencias declaradas y los controles online del workflow:

| Paquete | Versión anterior | Versión actual |
| --- | --- | --- |
| `expo` | `57.0.23` | `57.0.24` |
| `expo-asset` | `~57.0.17` | `~57.0.18` |
| `expo-constants` | `~57.0.18` | `~57.0.19` |
| `expo-image-picker` | `~57.0.18` | `~57.0.19` |
| `expo-router` | `~57.0.21` | `~57.0.22` |

El lock raíz actualiza además sus tres transitivos necesarios: `@expo/cli` de `57.0.25` a `57.0.26`, `@expo/metro-runtime` de `57.0.15` a `57.0.16` y `@expo/ui` de `57.0.18` a `57.0.19`. No agrega paquetes ni cambia versiones ajenas a esa cadena.

Verificación local después de la alineación:

- `expo install --check` online: PASS, `Dependencies are up to date`; no se activó modo offline ni se excluyeron paquetes.
- Expo Doctor: 21/21 comprobaciones aprobadas.
- TypeScript: PASS; lint: cero errores y las dos advertencias preexistentes.
- Jest: 39 suites, 247/247 pruebas, sin fallos ni omitidas.
- Export iOS/Hermes: PASS, 1329 módulos y aproximadamente 2,8 MB. El nombre del bundle continúa siendo `entry-84738cfcd684ae51abfd260d446924b2.hbc`.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Excepción autorizada de parches | Gate existente `expo install --check` y suite móvil | Compatibilidad y regresión | CI macOS: Jest 247/247, Python 21/21, tipado/lint aprobados | Gate online falló en run 35357616117 antes de actualizar versiones | Gate online y Doctor 21/21 aprobados; Jest 247/247 | Versiones instaladas verificadas y regresión de los flujos existentes | No cambió el código de las pantallas ni se debilitó el workflow |

Estos resultados locales se complementan con el build nativo y la auditoría del artefacto registrados a continuación; la aceptación física permanece pendiente.

## IPA Release verificado

El workflow [35358534925](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35358534925) terminó con **SUCCESS** sobre el commit exacto `4b569165c3221f6d39a9721be15a529b8a2abf92`, que incluye el rediseño y la alineación de parches autorizada. El intento anterior `35357616117` no produjo IPA por el gate online de versiones; este segundo run conserva ese gate y lo aprobó.

| Evidencia del run macOS | Resultado |
| --- | --- |
| Jest móvil | 39 suites, 247/247 pruebas aprobadas. |
| Scripts Python | 21/21 pruebas aprobadas. |
| Comprobación online de Expo y Doctor | PASS; Doctor 21/21. |
| Tipado y lint móvil | PASS; cero errores de lint y dos advertencias preexistentes. |
| Compilación Release para iphoneos | Log real con `BUILD SUCCEEDED`; empaquetado del IPA aprobado. |

Artefacto descargable: [10554357728](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35358534925/artifacts/10554357728). El `.ipa` auditado tiene **12.973.391 bytes** y SHA-256:

```text
ea93617a81da94ceaa34d052866d14c5d570e2263373ba03cb5354e7af904260
```

La auditoría del archivo exacto confirmó ejecutable ARM64, JavaScript Hermes incluido de **2.835.029 bytes**, Expo `57.0.24` y React Native `0.86.3`, identificador `com.matyalts.misaluteca` y origen `https://saluteca.matyalts.me` conservados. Confirmó asimismo IPA sin firma, módulos privados de lectura y selección Cámara/Archivos compilados e icono preservado. La instalación/firma mediante Impactor sigue el procedimiento de prueba existente.

Estas verificaciones comprueban el binario y su empaquetado; no afirman ejecución en simulador ni comparación visual en el iPhone. La tarea **3.3 permanece pendiente** hasta probar las cuatro pantallas, operaciones y preferencias de accesibilidad en iOS.

## Problemas observados en la prueba física posterior

El usuario probó el IPA anterior y compartió seis capturas que mostraron problemas de presentación: gradiente que no cubre correctamente toda la superficie de los botones, acciones antes del encabezado, formulario de carga con estilos anteriores, formularios de alta/edición familiar pendientes de unificar y carpeta familiar con demasiadas acciones apiladas. Esta evidencia **no aprueba la fidelidad visual**; la tarea 3.3 permanece pendiente de una nueva prueba del binario corregido.

El código previo del botón combinaba SVG absoluto con dimensiones porcentuales, rectángulo porcentual y contenedor de altura dependiente de su contenido. La inspección identifica esa mezcla de geometrías como mecanismo probable; no hubo instrumentación del renderer de iOS que demuestre cada paso del fallo. La corrección debe definir cobertura a partir de dimensiones reales y conservar un fondo azul legible antes de medir, sin convertir el botón en una imagen.

La ampliación del mismo change incluye cobertura completa del gradiente al iniciar/cambiar tamaño, título antes de acciones en Estudios, acceso discreto a carga, formularios auxiliares premium y carpeta familiar con controles compactos. En modales, un único contenedor aplica safe areas: la carga independiente las gestiona y la carga dentro de Familia utiliza las del contenedor exterior. Se conservan coordinador, campos, paciente seleccionado, permisos, reconciliación y confirmaciones destructivas.

Los resultados anteriores de 247 pruebas y el IPA auditado permanecen como evidencia histórica de regresión/empaquetado; no se reinterpretan como prueba visual de esas correcciones. Los nuevos resultados ejecutados y un nuevo IPA se registrarán al existir.

La revisión del código de `react-native-screens` instalado confirmó además un problema de detección de contenido: su finder de scroll recorre únicamente el primer descendiente de cada vista. Una decoración anterior a la lista interrumpe esa cadena. La corrección mantiene ScrollView/FlatList primero en las cuatro pestañas y sitúa la decoración dentro del contenido o ListHeader, con capas locales detrás del texto. Esto evita también que el orden por zIndex de Fabric vuelva a colocar un hermano decorativo antes del scroll. Se conserva el ajuste automático de UIKit sin un segundo cálculo de áreas seguras. La comprobación del último elemento en el dispositivo sigue pendiente.

## Verificación local de las correcciones

El executor ejecutó la suite completa después de las correcciones de geometría y orden del scroll: **42 suites, 262/262 pruebas aprobadas**, sin fallos ni omitidas, frente al baseline de 247. TypeScript aprobado; lint con cero errores y las dos advertencias `require` preexistentes de los tests de pestañas. Export iOS/Hermes aprobado con 1329 módulos y aproximadamente 2,8 MB. Los scripts Python mantuvieron su baseline Windows: 21 descubiertos, 20 aprobados y uno omitido por symlinks. OpenSpec estricto y `git diff --check` aprobados. No se añadieron dependencias.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4.1 Geometría y encabezado | `premium-native-geometry.test.tsx` | Componente/layout | Suite existente 247/247 | Medidas reales y posición del avatar fallaron antes del cambio | 4/4; suite completa 262/262 | Relayout 353×58 a 280×104, medida inválida y dos instancias con IDs independientes | Geometría compartida e indentación sin modificar comportamiento |
| 4.1 Scroll nativo primero | `premium-scroll-discovery.test.tsx` | Componente/estructura | Regresión existente de pestañas, Familia y logout | Cuatro raíces encontraban decoración antes de scroll/lista | 4/4; conjunto focalizado 33/33 | Inicio/Cuenta con ScrollView y Estudios/Familia con FlatList | Decoración dentro del contenido/ListHeader; orden de UIKit preservado |
| 4.2–4.3 Estudios y carga | `premium-upload-layout.test.tsx` y suites de carga existentes | Componente/flujo | Flujos de carga existentes aprobados | Presentación premium, orden de encabezado y acceso compacto fallaron | 4/4; suite completa 262/262 | Carga independiente/anidada, selección real y acceso secundario | Componentes premium compartidos; coordinador y permisos conservados |
| 4.4 Familia | `FamilyScreen.test.tsx` y suites familiares existentes | Componente/flujo | Familia, rutas y operaciones existentes aprobadas | Dos nuevos escenarios fallaron antes de adaptar formularios/toolbar | Cuatro suites focalizadas, 26 aprobadas | Alta/edición y carpeta compacta; estado readonly cubierto | Estilos compartidos y acciones secundarias conservando confirmaciones |
| 4.5 Regresión y entrega | Suite móvil, scripts y gates existentes | Regresión/compatibilidad | Baseline móvil 247/247 y Python Windows conservado | Fallos focalizados anteriores documentados | 262/262, tipado/lint/export aprobados | Cuatro pestañas y flujos auxiliares incluidos en regresión | Guía actualizada; aceptación física sin marcar |

Para probar estas correcciones utilizá el **IPA corregido** registrado a continuación; el enlace histórico anterior no contiene estos ajustes. En el nuevo binario comprobá cobertura azul completa desde la primera aparición y con texto ampliado, título antes de acciones, alta/edición/carga con teclado y safe areas, carpeta familiar compacta y último elemento desplazable por encima de la barra. No se ejecutó simulador iOS en este entorno. La tarea 3.3 continúa pendiente de esa nueva prueba física.

## IPA corregido generado y auditado

El workflow [35362128804](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35362128804) terminó con **SUCCESS** sobre el commit `f0b0f6966586b7ba3e9a5d87a8fd8437f1282c12`, que incorpora las correcciones anteriores. Descarga: [artefacto 10554458788](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35362128804/artifacts/10554458788).

El run real macOS aprobó **42 suites y 262/262 pruebas móviles**, **21/21 pruebas Python**, gates online de Expo y Doctor **21/21**, tipado y lint sin errores (dos advertencias previas), y compilación nativa Release con `BUILD SUCCEEDED`. El skip de symlinks documentado para Windows no ocurrió en macOS.

El IPA descargado y auditado tiene **12.975.185 bytes** y SHA-256:

```text
0bf026bf03f458e88a89c075e4ed8445e2034941bfb1b30f3b03f1d9c726c8e5
```

La auditoría confirmó ejecutable ARM64 para iphoneos, IPA sin firma, bundle Hermes incluido de **2.838.323 bytes**, identificador `com.matyalts.misaluteca`, origen `https://saluteca.matyalts.me` e iOS mínimo `16.4` conservados. Se verificó la incorporación de las correcciones de geometría/encabezados en el bundle y la presencia de módulos nativos de vista privada, cámara y Archivos. El empaquetado aprobado no equivale a aceptación visual: **3.3 permanece pendiente** de probar este binario en iPhone.

## Modales, calendario, detalle y nuevas acciones

La nueva devolución física mostró estilos anteriores en detalle/filtros, Cancelar bajo la barra de estado y un candado deformado. Se corrigieron esas superficies con fuente del sistema y un `SafeAreaProvider` propio dentro de cada ventana modal, alrededor de un solo `SafeAreaView`. La carga dentro de Familia sigue utilizando el contenedor exterior. El icono fija dimensiones cuadradas y conserva su aspecto SVG.

La fecha abre un calendario nativo de `@expo/ui/community/datetime-picker`. Se promovió `@expo/ui ~57.0.19`, ya instalado transitivamente, a dependencia directa: **no cambió ninguna versión de paquete**; el lock refleja esa declaración y cambios de ubicación/deduplicación. Confirmar convierte componentes locales a DD-MM-YYYY, sin conversión UTC; Cancelar conserva el borrador y un formulario bloqueado impide confirmar incluso si el calendario ya estaba abierto.

Inicio y Estudios abren `/study/[id]` en el stack nativo existente, con encabezado y gesto de retorno. Los parámetros sólo contienen el identificador. Se conservan listas, paciente, búsqueda y filtros al volver. El detalle reutiliza la protección de sesión existente y etiqueta su contenido por usuario e identificador de ruta para no mostrar datos anteriores durante cambios o respuestas tardías.

El gesto horizontal entre pestañas usa `PanResponder` y `router.navigate`, conservando `NativeTabs`. Excluye movimientos verticales/ambiguos, bordes, multitouch, campos enfocados, controles reales y modales. Selecciona la pestaña nativa adyacente; **no implementa una transición interactiva de UIKit entre pestañas**. En esa primera entrega, Familia y carga seguían siendo modales. La ampliación posterior descrita abajo incorpora sus tarjetas nativas con retorno del sistema.

El detalle nativo y el lector familiar incluyen eliminación sólo con `studiesDelete`. La confirmación destructiva usa una clave estable; una respuesta ambigua ofrece reconciliación GET y bloquea la salida, sin repetir DELETE. El commit lógico refresca listas/resumen y contadores familiares una sola vez; la limpieza física puede continuar en el backend. Rechazos definitivos 403/404 permiten volver. La capability requiere el esquema y supervisor descritos por la guía de despliegue de estas nuevas capacidades.

La carga permite extracción local del adjunto mediante el puente nativo, revisión del texto y consentimiento explícito antes de enviarlo al backend/OpenRouter. `studiesAnalyze` habilita el análisis remoto. Las sugerencias se revisan campo por campo y sólo se aplican al borrador; paciente/adjuntos no cambian y Guardar sigue siendo una acción separada. Los campos editados requieren confirmación específica ligada a su versión, invalidada por una nueva edición. Una respuesta pagada perdida sólo consulta estado: las sugerencias no persistidas no pueden recuperarse ni se repite la llamada automáticamente. No se hicieron llamadas pagas durante esta implementación.

### Verificación móvil final local

Baseline inicial de esta ampliación: **42 suites, 262/262**. Resultado final después de los guards y la integración: **56 suites, 344/344**, sin fallos ni omitidas. TypeScript aprobado; lint cero errores y dos advertencias `require` preexistentes. Export iOS/Hermes aprobado: **1422 módulos**, aproximadamente 3,1 MB. Gate online de Expo aprobado y Doctor **21/21**. Python: 21 descubiertos, 20 aprobados y un skip de symlinks en Windows. Estos resultados no comprueban representación visual ni calidad del OCR en un iPhone; la compilación y fixtures macOS se registran por separado al ejecutarse.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6.1–6.2 Modales/candado/detalle/filtros | `FamilyScreen.test.tsx`, `premium-modal-surfaces.test.tsx` | Componentes/acciones | 262/262 | Provider modal ausente y geometría SVG fallaron | Familia 28 focalizados; superficies 4 | Alta/edición, PDF real, filtros normalizados, iconos 24/32 | Tokens/fuente sistema y único responsable de insets |
| 6.3 Calendario | `calendar-input.test.tsx`, suites de carga | Componentes/fecha civil | Carga existente aprobada | Módulo inicial ausente; interacción antigua y bloqueo sobrevenido fallaron | Calendario 6; integración de carga conservada | Año bisiesto, fin de año, Cancelar, bloqueo antes/después de abrir | Adapter nativo y helper de interacción; no se debilitó el ledger |
| 6.4 Gestos y controles | `tab-swipe.test.tsx`, `tabs-layout.test.tsx`, `patient-gesture.test.tsx` | Controlador/UI | Pestañas existentes aprobadas | Módulo/Provider ausentes; cinco controles/modal y Ver todos fallaron | Gestos+pestañas 26; controles 6 | Ejes, bordes, capacidades, cancelación, foco y modal | Hooks compartidos; primer scroll nativo preservado |
| 6.5 Detalle en stack | `native-study-navigation.test.tsx`, `native-detail-route.test.tsx`, `private-image-routes.test.tsx` | Rutas/lectura real | Lectores y MIME existentes aprobados | Callback inicial ausente; guard de sesión/ruta y destino de login fallaron | Navegación 2; ruta 8; imágenes 3 | Logout/user change mismo cliente, respuesta tardía, ID distinto, retry y MIME | Lectura propia en card; contexto privado existente reutilizado |
| DELETE móvil 2.1 | `study-deletion.test.ts`, `StudyDeleteAction.test.tsx`, `family-study-deletion.test.tsx` | Coordinador/UI | Regresión anterior aprobada | Módulos/acción ausentes; refusals definitivos atrapaban back | Coordinador 5; confirmación 2; familia 2 | Cancelar sin escritura, misma clave, red ambigua, cleanup, 403/404, refresco | write/get existentes y guard nativo; ningún cambio de auth |
| IA formulario 2.2 | `ai-suggestions.test.ts`, `AiAssist.test.tsx`, `upload-ai-integration.test.tsx` | Validación/UI/borrador | Carga manual existente aprobada | Módulos/acción ausentes; edición durante análisis y segunda edición fallaron | Validación 6; asistencia 7; integración 2 | Fecha/límites, consentimiento, cancel/document change, capability ausente, respuesta perdida y versión dirty | Aplicación atómica al borrador y controles compartidos, sin autosave |
| 6.6 Regresión | Suite completa y gates existentes | Regresión/empaquetado | 262/262 | Fallos focalizados anteriores registrados | 344/344; types/lint/export PASS | Flujos manuales y nuevas acciones cubiertos | Guía actualizada; aceptación física pendiente |

Para la siguiente prueba utilizá el **nuevo IPA integrado cuando se genere**: los enlaces anteriores son históricos y no contienen calendario, nuevas acciones ni estas últimas correcciones. Probá primero con documentos ficticios: safe areas de alta/edición/filtros, calendario Confirmar/Cancelar, retorno del detalle con filtros conservados, swipes desde fondo y desde controles, candado cuadrado y texto ampliado. Luego comprobá DELETE propio y reconciliación, extracción local/revisión y aplicación sin Guardar. Una prueba real que llame al proveedor requiere autorización posterior específica. No hubo simulador iOS en Windows. **3.3, eliminación física en iPhone y aceptación OCR/IA en iPhone permanecen pendientes.**

## Retorno nativo general: carga y carpetas familiares

Las acciones reales abren `/upload`, `/family/[uuid]` y `/family-form` como tarjetas del Stack existente. Cada tarjeta utiliza el gesto horizontal nativo de retorno y reutiliza el flujo de carga o formulario familiar embebido, sin otro Modal de pantalla completa, control Volver ni safe area superior duplicados. Filtros, calendario y confirmaciones destructivas siguen hojas del sistema.

Operaciones ocupadas o de resultado incierto impiden salir hasta verificar su resultado. Los borradores requieren confirmación de descarte ligada a la identidad, ruta y revisión; aceptar una alerta antigua no descarta cambios posteriores. Salir durante IA enviada avisa que el proveedor puede continuar y consumir cuota, cancela la revisión local y no guarda el estudio. El paciente familiar se obtiene desde el DTO canónico `familyMember`; los cambios de sesión/UUID desmontan el borrador anterior. La invalidación existente actualiza tarjetas y conteos conservando filtros de las listas montadas.

Resultado final local: **61 suites, 376/376 PASS**, TypeScript PASS, lint cero errores y las dos advertencias previas. Export iOS/Hermes PASS: **1427 módulos**, aproximadamente 3,1 MB. Sin dependencias ni cambios de versiones adicionales. Baseline afectado de esta ampliación: **9 suites, 65/65**.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 6.5 Guardia de retorno | `flow-navigation.test.tsx` | Hook/acciones | 65/65 | Módulo ausente; descarte obsoleto y IA sin borrador fallaron | 9/9 | Ocupado, limpio, descarte, logout, identidad/revisión y cuota | Formato legible, focal 9/9 |
| 6.5 Carga embebida | `UploadEntry.test.tsx`, `UploadScreen.test.tsx` | Componentes reales | 65/65 | Opener ignorado, Volver duplicado y reporter ausente: 3 fallos | 27/27 | Edición, clave incierta, entrada antigua compatible | Flujo reutilizado y payload con revisión |
| 6.5 Rutas auxiliares | `native-upload-route.test.tsx`, `native-family-flow-route.test.tsx`, `aux-stack-presentation.test.tsx` | Rutas/navegación | 65/65 | Rutas inexistentes; Stack sin tarjetas; DTO incorrecto fallaron | 8/8 | Carga propia/familiar, alta/edición, logout, detalle y params | Formularios compartidos, native header |
| 6.5 Familia embebida | `family-native-flow.test.tsx`, `FamilyScreen.test.tsx` | Componentes/CRUD | 28 focalizados | Flujo ignorado, revision/busy/cleanup y consentimiento viejo fallaron | 33/33 | 10 nuevos casos y 23 anteriores | Provider de hoja; revision sin perder cleanup |
| 6.5 Salida IA | `AiAssist.test.tsx` | Componentes/consentimiento | 7 anteriores | Reporter pendiente ausente: 2 fallos | 9/9 | POST pendiente, respuesta perdida y respuesta completada | RequestId en revisión de confirmación |
| 6.6 Regresión final | Suite completa/types/lint/export | Regresión | 344 anteriores | Fallos focalizados anteriores ejecutados | 376/376 | MIME privado, filtros/paciente y conteos conservados | Guía y change actualizados |

Para probar el IPA entregado: abrir carga desde Inicio/Estudios; regresar desde borde izquierdo con borrador limpio y modificado; cancelar/aceptar descarte; verificar bloqueo durante carga o resultado incierto. Abrir carpeta familiar, alta y edición y repetir regreso, incluidas acciones anidadas carga/detalle. Confirmar que paciente, filtros y conteos siguen correctos. Durante IA enviada, revisar advertencia de cuota antes de salir. La aceptación física 3.3 sigue pendiente: Windows no ejecuta UIKit ni verifica gesto interactivo/calendario/cámara visualmente; compilar y exportar no equivalen a validación visual.

## Compilación real de la entrega completa

El run [35371515495](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35371515495), fuente exacta `9f881b6dc02d3c00aff44851631a9e233503172c`, terminó **SUCCESS** el 18 de septiembre de 2026 a las 17:13:40 UTC. Logs: **61 suites, 376/376 PASS**, Python **21/21 PASS** sin skips en macOS y Expo Doctor **21/21**. Tipado, lint y compatibilidad online aprobaron el paso de validación; prebuild, CocoaPods y Release para dispositivo finalizaron correctamente, con **BUILD SUCCEEDED** a las 17:13:05 UTC. Incluye compilación real del puente Swift/Vision/PDFKit, además de los diez fixtures sintéticos de OCR verificados previamente en macOS.

Empaquetado, comprobación del candidato y publicación del IPA/manifest también aprobaron. Descarga: [IPA completo, artefacto 10559465764](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35371515495/artifacts/10559465764). Auditoría independiente aprobada: fuente exacta `9f881b6dc02d3c00aff44851631a9e233503172c`, IPA **13.077.583 bytes**, SHA256 `c3b2b1ce5a3825c51104e193222c3d03a72abcac39196795d6d49064d0c13349`, ARM64 sin firma, bundle `com.matyalts.misaluteca`, mínimo iOS 16.4 y origen `https://saluteca.matyalts.me`. Hermes incluido (**3.075.884 bytes**), cámara/Files y marcadores nativos Vision `VNRecognizeTextRequest`/DatePicker comprobados. Logs confirman SwiftCompile ARM64 del motor OCR y wrapper. Compilar y auditar el paquete no equivale a aceptar físicamente UI, cámara, calendario, OCR o gestos.

Backend: run [35370137665](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35370137665), fuente `fedd0dd`, **148/148 PASS**, cero fallos y cero skips con MySQL 8 desechable, imagen Docker real y smoke del supervisor con HTTP 401 canónico en puerto 3000. No hubo SQL en VPS ni llamadas pagas de IA. AI 3.1 comprobada; AI 1.2 y DELETE 1.2/1.3 conservan sus pendientes por las desviaciones iniciales del orden TDD documentadas. Todas las aceptaciones físicas siguen pendientes.

Instalar el IPA con el procedimiento de firma usado anteriormente. Para habilitar borrado e IA en el backend de prueba, seguir [guía EasyPanel de borrado y análisis](easypanel-ios-delete-analysis.md): variables, migración manual y supervisor deben estar configurados antes de que el servidor anuncie esas capabilities. Publicar el código no ejecuta SQL ni configura la VPS. Carga manual y lectura conservan su disponibilidad aunque las capacidades nuevas no estén listas.
