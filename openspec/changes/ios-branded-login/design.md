## Context

Fuentes inspeccionadas: landing/components/LoginModal/LoginModal.tsx; landing/components/Navbar/Navbar.tsx; public/images/Logo_Saluteca_AzulNew.png; mobile/assets/brand.png; mobile/src/native-adapters.ts; session.ts.

La implementación actual y el reporte Google del usuario se distinguen de aceptación visual futura. Ver proposal.md y roadmap. Dependencias: ios-native-foundation.

## Goals / Non-Goals

**Goals:** experiencia nativa funcional con identidad web, contratos y estados verificables.

**Non-Goals:** portar Bootstrap/Server Actions a RN, modificar la web, datos simulados, subir mínimo iOS, cambiar protocolos Google o desplegar VPS durante este change sin autorización específica.

## Decisions

Solicitud posterior del usuario con capturas: se incluye también la presentación responsive del puente web «Conectar Mi Saluteca». Solo marca, CSS, jerarquía visual y controles accesibles: formularios, valores CSRF, escape HTML, validaciones, confirmación explícita, endpoints y protocolo Google/PKCE existentes permanecen intactos. No es un nuevo diseño de autenticación.

Route pública /login renderiza composición del modal web adaptada a pantalla con safe area: logo de Navbar, texto legal existente, botón Google con asset multicolor respetado y feedback inline. El modal no tiene título/hero ilustrado: no inventar diseño web de login que no existe. Inter local cargada antes primer frame con fallback local visible si error; no pantalla blanca. Acciones invocan MobileClient.login/restore/logout existentes; Google se abre exclusivamente con expo-web-browser.openAuthSessionAsync/ASWebAuthenticationSession y PKCE ya aprobado, nunca WebView OAuth, secreto Google o key IA nativos. Enlaces legales URL construida de backendHTTPSconfigurado con paths /terminos y /privacidad, sin token. Éxito navega Inicio si capacidad y pantalla disponibles o Estudios en backend antiguo; dobletap bloqueado mientras login/restoring; cancelar restaura CTA sin identidad parcial.

Dirección: archivador médico calmado; tokens actuales web y componentes nativos, lenguaje español y spacing4pt. Consultar las cuatro salidas de interface-design (Domain, Color world, Signature, Defaults) en docs/ios-pantallas-roadmap.md. No convertir todas las tarjetas en glass: documentos sobre papel/superficies sólidas. Adaptar sombras suaves/radios16pt y Inter a Dynamic Type/contraste, conservando semántica de campos.

## Risks / Trade-offs

Paridad visual no equivale copiar signIn cookies web → conservar browser bridge existente. Restaurar puede mostrar contenido privado momentáneo → ruta pública/protegida depende user canónico, no token local. Cambiar auth queda fuera: solo presentación LOW/MEDIUM; si implementación necesitara nuevos protocolos se pide review por separado.

## Migration Plan

Implementar únicamente tras solicitud apply. Baseline y RED mínimo/GREEN/triangulación antes de cada comportamiento; validaciones declarativas con doctor/types/build, sin tests tautológicos. Publicar UI/contrato de forma compatible, habilitar capabilities después de endpoints/pantallas reales; rollback a IPA/commit previo y backend compat preservada. Mantener pruebas y archivos de otros changes. Registrar build/macOS y aceptación física separadas, sin marcar task manual completada por mocks.
