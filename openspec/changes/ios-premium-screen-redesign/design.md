## Context

Expo 57, React Native 0.86 y TypeScript ya utilizan Expo Router `expo-router/unstable-native-tabs`, SF Symbols en pestañas, react-native-svg y safe-area-context. Las cuatro rutas delegan a pantallas que conservan consultas, capacidades por identidad, generación contra respuestas tardías y detalles privados. `brand.tsx` usa Inter y colores anteriores; se ajustará la presentación a fuente del sistema para este rediseño. Motivación: proposal.md.

## Goals / Non-Goals

**Goals:** componentes reales con composición fiel, datos actuales, navegación nativa y texto adaptable, preservando contratos de carga, familia, lectura y logout.

**Non-Goals:** backend, autenticación, tablas, firma, OCR, ajustes de cuenta futuros, destinos ficticios, actualización del stack, artefactos del marco del teléfono o superficies convertidas en imágenes.

## Decisions

1. Extender tema y componentes actuales, sin nueva arquitectura ni dependencias pesadas. Paleta inicial: canvas #F5F8FD, tinta #10182C, secundario #657188, acento #007AFF, gradiente #3D8BFF–#2456C5 y menta discreta. Para gradiente usar SVG existente o herramienta ya instalada; formas decorativas no táctiles. Las tarjetas quedan sólidas; glass exclusivamente a cargo del sistema en NativeTabs.
2. Mantener NativeTabs y opciones comprobadas contra declaraciones instaladas. No sumar blur sobre UIKit ni duplicar insets. Ajustar tint y superficie si están soportados; respetar reducir transparencia mediante fallback claro. El sistema decide geometría exacta según dispositivo/OS; no reemplazar la barra por controles JS para imitar dimensiones del mockup.
3. `propiosTotal` y `familiaresTotal` son cantidades de estudios; `total` suma ambos. Los recientes provienen de la respuesta actual, cuyo backend devuelve hasta cinco por alcance. Nunca contar familiares ni filas recientes para el resumen. Tarjetas de Inicio adaptan a columna si ancho/texto lo exige; acciones navegan a destinos reales.
4. Selección de Estudios conserva `self|all|familyUUID`. Un familiar seleccionado no puede aparentar Mi historial activo: selector y texto Mostrando describen exactamente la consulta. La carpeta familiar usa su endpoint actual y no agrega selector global. Búsqueda y filtros mantienen parámetros existentes, limpieza explícita y paginación virtualizada.
5. Compartir StudyCard entre Inicio y Estudios: fecha/título/institución, profesional etiquetado cuando existe y paciente desde DTO separado. Nombre largo envuelve, sin concatenar datos ambiguos. Avatar conserva validación URL, fallback y protección ante callback de otra identidad.
6. El DTO actual de usuario no incluye proveedor; Cuenta no lo inventa ni modifica auth para obtenerlo. Omitir el renglón de proveedor si no puede verificarse con el contrato existente. No hay destino de edición de perfil implementado; no agregar su chevron. Mantener cierre de sesión real y mensajes actuales.
7. Sistema tipográfico nativo con fontWeight, escalado permitido y alturas mínimas; no fijar altura de contenedores de texto. Reutilizar preferencia reducir movimiento y añadir escucha de reducir transparencia si necesaria. SVG decorativo oculto de VoiceOver, botones ≥44pt con roles/estado, errores reintentables y acceso útil en vacíos.
8. La prueba física del usuario mostró relleno de botones incompleto y pantallas auxiliares con presentación anterior; las 247 pruebas y el build previo no validaron fidelidad visual. El SVG actual combina absoluteFill con width/height porcentuales, que la biblioteca convierte además en dimensiones Yoga y bbWidth/bbHeight; el padre depende de padding/minHeight. Utilizar geometría numérica del layout real, rectángulo que cubra el botón completo, identificador de gradiente por instancia y fondo azul sólido mientras no exista medida válida. Esta hipótesis de geometría se valida mediante contratos de layout ejecutables y nueva comparación física, sin afirmar que una prueba de props reproduce el renderer iOS.
9. En Estudios el título/subtítulo preceden a la acción de carga, cuya presentación es secundaria discreta. En carpeta familiar, reemplazar la pila de cuatro acciones previas al título por encabezado compacto con volver/cargar y opciones secundarias accesibles para editar/eliminar; mantener rutas y confirmación destructiva. Formularios de carga, alta y edición usan texto/superficies/controles premium y toolbar compacta, conservando campos, selección y estados de coordinación.
10. Cada modal tiene un solo responsable de safe areas: UploadScreen independiente utiliza su contenedor seguro y scroll con insets never; dentro de Familia el contenedor exterior ya es seguro y UploadScreen safeArea=false no repite padding superior/inferior. Añadir ajuste de teclado donde falte, comprobar último control alcanzable y mantener bloqueo/cancelación reales durante carga pendiente o desconocida.
11. La inspección de la biblioteca instalada confirmó que `RNSScrollViewFinder.findScrollViewInFirstDescendantChainFrom` recorre únicamente `subviews[0]`. NativeTabs utiliza ese finder mediante `RNSContainerItemSupport` si no existe un scroll registrado; esta app no registra marcadores. Por ello, un ScreenBackdrop anterior al ScrollView/FlatList corta la detección nativa del contenido. Fabric además ordena las ShadowViews por zIndex antes de insertarlas: cambiar sólo JSX y poner un sibling decorativo con zIndex negativo puede volver a colocarlo primero en UIKit. En las cuatro pestañas, conservar el scroll/lista como primer descendiente nativo y colocar la decoración dentro de su contenido/ListHeader, con capas locales detrás del texto y sin interceptar toques; el finder ya alcanza UIScrollView antes de esas capas. No sustituir esta corrección por un segundo SafeAreaView o padding manual que duplique UIKit. Probar el orden y preferencias existentes; seguir comprobando último ítem físicamente.

## Risks / Trade-offs

Última devolución física: un SafeAreaView dentro de React Native Modal puede quedar fuera del árbol nativo del proveedor Router. El consumidor Fabric busca Provider recorriendo nativeSuperview; agregar SafeAreaProvider en raíz del Modal fuera del scroll, seguido de un único SafeAreaView. No copiar initialWindowMetrics del árbol externo ni sumar padding manual. La carga familiar conserva safeArea=false.

Detalle y filtros deben usar componentes premium y fuente sistema, conservando consultas, selección y privacidad de adjuntos. El candado necesita contenedor de icono con tamaño/aspecto independiente del texto ampliado, sin impedir Dynamic Type en etiquetas.

Fecha: promover @expo/ui ya instalado 57.0.19 como dependencia directa de la misma versión y usar calendario nativo compatible; no actualizar semvers ni añadir selección timezone que cambie día DD-MM-YYYY. Verificar API instalada/compilación y fechas iniciales/límites/cancelación.

Gestos: conservar NativeTabs y añadir navegación horizontal mediante herramientas core disponibles, sin reemplazar barra. Exclusión real de controles/textinput/sliders, prioridad scroll vertical/modales y gesto del borde para back. El detalle actual presentado como Modal no ofrece back interactivo: usar destino en stack nativo existente para retorno del sistema, manteniendo listas/filtros/paciente/origen montados. No poner datos clínicos en params persistentes/logs; resolver detalle real con identidad actual. Pruebas de estructura no prueban el reconocimiento de UIKit: aceptación física pendiente.

- [Detalle visual de tab bar dependiente de UIKit] → priorizar comportamiento nativo y documentar diferencia con la referencia.
- [Texto ampliado rompe columnas] → disposición basada en ancho/fontScale, textos envolventes, ninguna altura fija para tarjetas.
- [Cambio de tema toca pantallas auxiliares] → ejecutar baseline relevante y conservar flows de carga/familia/detalles con pruebas existentes.
- [Windows no permite simulador iOS] → ejecutar tipado/lint/Jest/export disponibles; registrar comparación visual física como pendiente, sin afirmar validación de simulador.
- [Provider no existe en DTO] → omitir identificación no verificada; no introducir cambios de seguridad.
- [Pruebas de componente verdes no detectaron SVG/layout físico incorrecto] → registrar fallo observado, ampliar contratos de dimensiones/orden y mantener la aceptación física pendiente hasta nueva prueba del binario corregido.

## Migration Plan

Publicar exclusivamente cambios del cliente y generar IPA con workflow existente cuando autorizado. No necesita migración SQL ni nuevas variables. Para volver atrás, usar binario anterior sin alterar datos. Prueba física: cuatro pantallas, texto ampliado, VoiceOver, reducir transparencia, últimos ítems sobre barra, y operaciones existentes con datos ficticios de TEST.

### Retorno nativo general en pantallas auxiliares

Carga y carpeta/alta/edición familiar usan tarjetas del Stack existente (`/upload`, `/family/[uuid]`, `/family-form`). Reutilizan los componentes embebidos; no presentan simultáneamente un Modal de pantalla completa ni duplican header/back. Header nativo aplica el área superior y contenido aplica laterales/inferior. Los formularios conservan permisos, pacientes canónicos y negocio existente, aislados por usuario y UUID.

`usePreventRemove` protege operaciones ocupadas o desconocidas; un borrador requiere descarte explícito ligado a identidad y revisión actual. Una confirmación obsoleta no descarta nuevos cambios. Salir de IA enviada advierte que el proveedor puede continuar y consumir cuota, cancela revisión local y no guarda. Filtros/calendario/confirmaciones destructivas siguen hojas del sistema. NativeTabs y listas montadas conservan filtros/conteos mediante invalidación existente. Pruebas automáticas no validan interacción UIKit ni representación física.
