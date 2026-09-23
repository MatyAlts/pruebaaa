## Context

Fuentes inspeccionadas: mobile/App.tsx, mobile/index.ts, mobile/src/session.ts, StudiesScreen.tsx; components/layout/Sidebar.tsx; app/styles/variables.css; .interface-design/system.md (paleta obsoleta).

La implementación actual y el reporte Google del usuario se distinguen de aceptación visual futura. Ver proposal.md y roadmap. Dependencias: connect-ios-studies implementado localmente; no depende de endpoints de familia/escritura.

## Goals / Non-Goals

**Goals:** experiencia nativa funcional con identidad web, contratos y estados verificables.

**Non-Goals:** portar Bootstrap/Server Actions a RN, modificar la web, datos simulados, subir mínimo iOS, cambiar protocolos Google o desplegar VPS durante este change sin autorización específica.

## Decisions

Expo Router entrada expo-router/entry y app/_layout con SessionProvider que instancia MobileClient una sola vez. NativeTabs import expo-router/unstable-native-tabs para SDK 57; use ThemeProvider y stacks nativos, rutas auth fuera de tabs y paths protegidos. Estudios usa GET/PDF existentes; Cuenta muestra identidad canónica y logout real. Inicio/Familia se registran visualmente solo tras capacidad autenticada servidor y pantalla lista. Nuevo GET /api/mobile/v1/capabilities devuelve únicamente funciones efectivamente implementadas, versión contrato y alcance usuario; no env de promesas, no datos privados. Si backend antiguo responde404, usar conjunto conocido actual studies-read/profile/logout; otros flags false. Un flag no sustituye ownership/autorización. No añadir glass-effect para la barra. Referencias del roadmap; mínimo16.4 y SDK 57 permanecen.

Mantener MobileClient por encima del navigator, restore único/singleflight aun con StrictMode y tabs remount; estado unknown impide entrar a rutas privadas hasta identidad resuelta. Reservar com.matyalts.misaluteca://auth/callback para WebBrowser/PKCE activo: Router no hace segundo exchange ni monta ruta clínica; callbacks sin intento vigente vuelven a entrada neutral. No modificar protocolo aprobado. El código actual configuredOrigin ignora dominios distintos de saluteca.matyalts.me y cae silenciosamente a ese host: tarea planificada corrige consumo de EXPO_PUBLIC_API_BASE_URL con apiOrigin existente, acepta cualquier origen HTTPS válido configurado y muestra CONFIG/login deshabilitado si falta o es inválido; no arreglarlo en esta exploración.

Colores deben satisfacer texto normal ≥ 4.5:1 y grande ≥ 3:1. Verde#7ABB85 es acento/superficie con tinta#0F172A: blanco/verde no sirve para texto. Material de barra e iconos requieren comprobación manual con accesibilidad; no declarar cumplimiento por hex estático.

Dirección: archivador médico calmado; tokens actuales web y componentes nativos, lenguaje español y spacing4pt. Consultar las cuatro salidas de interface-design (Domain, Color world, Signature, Defaults) en docs/ios-pantallas-roadmap.md. No convertir todas las tarjetas en glass: documentos sobre papel/superficies sólidas. Adaptar sombras suaves/radios16pt y Inter a Dynamic Type/contraste, conservando semántica de campos.

## Risks / Trade-offs

Migración router puede rehidratar después logout o multiplicar clients → safety net de generación/restore y navegación protegida. Contraste de viejo system.md no coincide CSS actual → tokens CSS reales prevalecen sin editar web. Tabs nativas no se verifican por mocks → build macOS y prueba física iOS 26/fallback pendientes hasta evidencia.

## Migration Plan

Implementar únicamente tras solicitud apply. Baseline y RED mínimo/GREEN/triangulación antes de cada comportamiento; validaciones declarativas con doctor/types/build, sin tests tautológicos. Publicar UI/contrato de forma compatible, habilitar capabilities después de endpoints/pantallas reales; rollback a IPA/commit previo y backend compat preservada. Mantener pruebas y archivos de otros changes. Registrar build/macOS y aceptación física separadas, sin marcar task manual completada por mocks.
