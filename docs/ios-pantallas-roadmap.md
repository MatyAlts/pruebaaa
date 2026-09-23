# Pantallas Mi Saluteca para iOS

Estado actualizado: el usuario confirmó funcionamiento en iPhone y aportó capturas de Google en `saluteca.matyalts.me`, Estudios y Cuenta con tabs nativas. No se infieren SHA del IPA instalado, pruebas entre cuentas, vencimientos ni limpieza offline. Las capturas también revelaron títulos superpuestos con la barra de estado: esa presentación no se considera aceptada como pantalla final.

`ios-native-foundation` ya tiene navegación y marca implementadas, con Doctor 21/21 tras `adopt-npm-workspaces`; conserva pendiente la aceptación física específica de accesibilidad/fallback. `ios-branded-login` e `ios-home-study-reading` están **en implementación**: login definitivo, consentimiento web de la misma marca y lectura/resumen/filtros propios con contratos servidor reales. La nueva UI todavía requiere build IPA y revisión en dispositivo; no confundir las capturas anteriores con aceptación de esta versión. Los cinco changes de Familia, gestión, compartir, Cuenta completa y OCR siguen como propuestas sin implementar. Ver checklists OpenSpec y documentos de evidencia para el estado vigente.

## Identidad y dirección

Persona: alguien que busca un estudio antes de una consulta o organiza documentos propios y de su familia. Debe encontrar, leer, cargar y compartir el documento correcto con claridad sobre quién es el paciente. Sensación: calma de un archivador médico ordenado, confianza y cercanía familiar; no panel de métricas genérico.

**Domain:** historial, carpeta de estudios, paciente, grupo familiar, institución, médico, fecha del estudio, adjuntos y acceso temporal.

**Color world:** azul de las carpetas Mi Saluteca `#2F416A`, azul claro de etiquetas `#43599E`, verde de marca `#7ABB85`, blanco del papel `#FFFFFF`, gris de la mesa/documentación `#F8FAFC`, azul tinta `#0F172A`, violeta familiar `#7B1FA2`. Fuentes reales: `app/styles/variables.css`, `landing/landing-style.css`, logos en `public/images/`. Colores semánticos/categorías existentes se conservan para su significado, sin inventar clasificación médica por IA.

**Signature:** fila de carpeta clínica centrada en título, fecha, institución, médico, paciente y adjuntos, con marca Mi Saluteca; aparece en recientes, Estudios, detalle, estudios del familiar y resumen previo a compartir.

**Defaults y reemplazos:** sidebar web persistente → tabs iOS contextuales y stack de detalle; tablero genérico con cifras de primera página → resumen autorizado del historial completo y recientes reales; glass decorativo en cada tarjeta → material de sistema únicamente en navegación, lectura sobre superficies sólidas; login email/password genérico → diseño del acceso Google existente y enlaces legales.

La tipografía web es Inter 400/500/600/700 (`app/layout.tsx`); spacing base 4, radios 8/12/16/20 y sombras suaves salen del CSS actual. Proponer carga local de Inter mediante paquetes compatibles SDK 57 durante apply, con fuente presente antes de primer frame y Dynamic Type. SF Symbols para controles de sistema y marca original para identidad. Textos y controles en español; fechas conforme `config/date.ts`/formatters, no reinterpretación UTC que cambie día.

Conflicto documentado: `.interface-design/system.md` prescribe `#016390`, mientras el código actual utiliza `#2F416A`. Se adopta la apariencia **actual de la web solicitada** sin modificar ese documento ni Bootstrap web. Reglas web de conservar sidebar/Bootstrap no aplican a nuevas pantallas nativas autorizadas por el usuario.

## Mapa web → iOS

| Web / fuente exacta | Interacciones actuales | Pantalla iOS propuesta / change | Backend móvil |
|---|---|---|---|
| `landing/components/LoginModal/LoginModal.tsx`, `landing/components/Navbar/Navbar.tsx` | Acceder Google, loading, términos y privacidad; no formulario contraseña ni login independiente con diseño completo | Login fullscreen con logo y composición original adaptada, CTA Google y textos/enlaces legales / ios-branded-login | Reutiliza MobileClient y navegador externo PKCE; no WebView OAuth |
| `components/layout/Sidebar.tsx`, `Topbar.tsx`, `AppShell.tsx` | Inicio, Estudios, Grupo Familiar, Configuración y logout | Tabs finales Inicio/Estudios/Familia/Cuenta, stacks/sheets y logout real / ios-native-foundation | Mostrar solo destinos operativos; inicial Estudios y Cuenta perfil+logout |
| `app/app/page.tsx`, `user-dashboard/home/HomeDashboard/HomeDashboard.tsx`, `HomeKPIs`, `HomeRecentStudies` | Total/propios/familiares, recientes y acceso al documento; subir | Inicio autorizado con resumen real y recientes / ios-home-study-reading | Nuevo GET summary; familia y subir aparecen cuando sus capacidades existen |
| `user-dashboard/study/StudiesPageClient.tsx` | Búsqueda título/descripción, médico, institución, paciente, mes/año, fecha descendente, limpiar filtros, subir, ver/editar/compartir | Lista nativa, búsqueda y sheet filtros, refresh/paginación / ios-home-study-reading; acciones write/share en sus changes | Nuevos filtros y sort explícitos servidor; no filtrar solo página cargada |
| `StudyDetailClient.tsx`, `components/modals/ViewStudyModal.tsx` | Metadata, paciente, descripción/conclusión, elegir archivo, PDF/imagen, descargar uno/todos y compartir | Stack detalle y selector adjuntos; PDFKit existente; imágenes/otros formatos y exportar controlado / lectura + ios-study-management | GET actual solo PDF propio; ampliar MIME y exportación con diseño revisado |
| `UploadStudyModal.tsx`, `app/api/upload-study/route.ts` | Seleccionar varios PDF/JPG/PNG/DOCX, campos opcionales, paciente, progreso, validar10 MB/archivo, upload; botón OCR/IA opcional | Document picker, formulario native, progreso/errores, confirmación / ios-study-management | Nuevo POST Bearer multipart, límites/ownership/cuota; ruta web con cookies no se reutiliza desde RN |
| `EditStudyModal.tsx`, `update-study.ts`, `delete-study.ts` | Editar título/fecha/institución/médico/observaciones/notas/paciente, confirmar borrado | Sheet edición y diálogo destructivo / ios-study-management | Nuevos PATCH/DELETE autorizados; sin aplicar callbacks TODO como comportamiento final |
| `user-dashboard/family/FamilyDashboard`, `FamilyMemberCard`, `FamilyMemberDetail.tsx`, `FamilyMemberActions.tsx`, `AddFamilyMemberModal.tsx` | Lista, añadir/renombrar nombre≤40, carpeta de estudios y filtros; borrar familiar con estudios tras escribir misaluteca | Tab Familia, detalle, formularios y borrado explícito / ios-family-records | Familias/GET estudios/POST/PATCH/DELETE nuevos; propietario canónico, familiares de otra cuenta404 |
| `ShareModal.tsx`, `SharedLinksModal.tsx`, `app/s/[token]/actions.ts` | Destinatario médico/vínculo, generar/copiar/WhatsApp URL, listar/revocar; lector web público expira24 h después primera apertura | Sheet compartir URL y lista de enlaces en Cuenta; share sheet sistema / ios-study-sharing | Nuevos endpoints Bearer de enlaces, lector web sigue compatible. No compartir PDF binario como sustituto del enlace temporal |
| `user-dashboard/settings/SettingsPageClient.tsx`, `DeleteAccountModal.tsx`, `delete-account.ts` | Perfil Google readonly, OAuth activo, enlaces, acerca de; borrar cuenta/datos tras escribir misaluteca | Cuenta completa con privacidad/legal/acerca de, enlaces y eliminación / ios-account-settings | GET me existente; eliminación nueva revoca familias token y datos antes de limpieza controlada |
| `lib/ocr-utils.ts`, `UploadStudyModal.tsx`, ambos servicios IA OpenRouter | Elegir adjunto, extraer OCR PDF/imagen/DOCX, autocompletar campos, revisión humana antes guardar | Asistencia opcional de formulario / ios-ocr-assistance | OCR local nuevo y POST analyze autorizado, quota server; key OpenRouter solo backend |

Admin (`app/adm`, `admin-dashboard`) y landing informativa completa no son pantallas de la app personal de usuario. Términos/privacidad sí se abren desde login/Cuenta. Paridad es funcional y de identidad; no portar DOM, Bootstrap ni Server Actions a RN, ni repetir defectos/TODO web.

## Secuencia y dependencias

1. **ios-native-foundation**: sistema visual, Expo Router SDK 57, protección de rutas usando sesión existente y tabs nativas reales. Corrige durante implementación el origen fijo de `mobile/src/native-adapters.ts`: respetar otro origen HTTPS configurado y mostrar configuración ausente/inválida sin reemplazarla silenciosamente por otro backend. Sin Home/Familia vacíos ni subir como quinta tab.
2. **ios-branded-login**: depende1; login Mi Saluteca, mismos términos/Google y estados restore/cancel/error. No cambia auth ni requiere otra aprobación por presentación.
3. **ios-home-study-reading**: depende1–2 y API actual; GET summary/filtros/sort nuevos, Inicio y Estudios completos propios. Este primer hito entrega un IPA con experiencia cuidada y funcional usando datos reales autorizados.
4. **ios-family-records**: depende3; diseño autorización/datos y DDL TEST adicional revisados antes apply. Introduce tab Familia y extiende selector/resumen/lectura a familiares propios; elimina cascada solo con confirmación.
5. **ios-study-management**: depende3–4; carga/edición/borrado/exportación y varios formatos con APIs reales. Revisión de inyección de archivos/datos antes apply; no activar CTAs por variable env optimista.
6. **ios-study-sharing**: depende3–4 (5 para nuevas cargas); diseño de enlaces temporales y revocación CRITICAL aprobado antes apply. URLs servidor/control de ownership, sin token Bearer en URL/clipboard.
7. **ios-account-settings**: depende1–2 y6 para gestión de enlaces; borrado datos y revocación CRITICAL requieren aprobación del diseño concreto. Perfil y logout ya funcionales desde1.
8. **ios-ocr-assistance**: depende5 + OpenRouter ya implementado; OCR/IA es opt-in y nunca requisito para carga manual. Diseño privacidad/envío/quota aprobado antes apply; permisos nativos/cancel/limpieza comprobados físicamente.

No son phase gates OPSX: cada change sigue editable/aplicable de forma fluida cuando sus dependencias funcionales están disponibles. El bootstrap TEST actual solo soporta lectura/Google; no suponer tablas familiares/links/cuotas de web completas. Los changes futuros incluyen revisiones DDL específicas y pruebas MySQL aisladas; ninguna migración ni deploy queda autorizada por estos planes.

La exportación futura de archivos requiere una decisión explícita y revisión del contrato actual de `mobile-study-reading`, cuyo visor PDFKit no ofrece exportación. No sustituye silenciosamente esa protección: las copias guardadas fuera de la app no pueden revocarse ni limpiarse desde ella. El acceso temporal mediante enlaces sigue siendo una función separada.

## Liquid Glass y compatibilidad

La barra final usa **NativeTabs de Expo Router** respaldada por UITabBar nativa: Liquid Glass de sistema en iOS 26 y apariencia nativa compatible en iOS 16.4–25; no elevar mínimo iOS ni simular glass con blur manual. En SDK 57 corresponde `expo-router/unstable-native-tabs`, no el import estable de SDK 58. Instalar versiones compatibles con `npx expo install` en apply y registrar lock/doctor/autolinking/build real, sin upgrade Expo ahora.

Mantener material adaptable al contenido detrás, configuración de tema para evitar flashes y safe areas automáticas sin doble inset. No forzar backgroundColor/blurEffect/shadowColor que solo sirven para iOS 18 y anteriores. Cards/formularios/metadata sólidos para legibilidad; transparencia reducida, contraste aumentado y movimiento reducido respetados por controles de sistema. `expo-glass-effect` es opción documentada para un toolbar futuro, **no dependencia necesaria** del primer hito.

Fuentes primarias: [Expo native tabs, diferencias SDK](https://docs.expo.dev/router/advanced/native-tabs/), [Expo57 glass-effect](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/), [Apple materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Apple adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass), [Vision OCR](https://developer.apple.com/documentation/vision/vnrecognizetextrequest).

## Criterios de implementación posteriores

Cada comportamiento nuevo debe tener safety net ejecutado, un RED mínimo, GREEN ejecutado antes del siguiente caso, triangulación ≥ 2 casos y refactor con rerun; evitar pruebas tautológicas de tokens/YAML. Componentes con RNTL; reglas/DTO tests unitarios; HTTP real+MySQL dedicado para permisos/escrituras; build macOS para nativo; controles y accesibilidad con evidencia en iPhone. Baseline web ESLint: 23 errores y 48 advertencias no se arregla incidentalmente. No afirmar Liquid Glass/accesibilidad/OCR física por mocks.

Medir VoiceOver, targets ≥ 44 pt, Dynamic Type grande sin truncar información necesaria, scroll/teclado y safe areas, reduceTransparency/increaseContrast/reduceMotion, iOS 26 y fallback, cancelar picker/Google/sheets sin borrar datos, logout sin rehidratación tardía, ownership entre dos cuentas. Sin datos médicos persistidos ni logs OCR/tokens. Feature availability se obtiene de API backend autenticada y compatibilidad real, falla cerrado sin anunciar CTAs inexistentes.
