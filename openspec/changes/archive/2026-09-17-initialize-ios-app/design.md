## Context

Ver `proposal.md` para motivación. El repositorio contiene Next.js 16.1.1 y React 19.2.3; no contiene aplicación móvil ni runner de tests configurado. El `tsconfig.json` web incluye recursivamente archivos TypeScript y ESLint usa configuración Next global: añadir `mobile/` sin aislamiento introduciría código nativo en las verificaciones web. `.gitignore` solo excluye `node_modules` de la raíz. La documentación de exploración antecede a la inicialización actual de OpenSpec y no constituye evidencia de build.

## Goals / Non-Goals

**Goals:** aislar instalación y verificaciones móviles; hacer reproducible la generación nativa; obtener evidencia de un producto Release autónomo para dispositivo y poder diagnosticar instalación local.

**Non-Goals:** compartir paquetes prematuramente, configurar monorepo/workspaces, introducir EAS cloud, modificar backend, añadir SDKs médicos o capacidades que requieran perfiles especiales. La prueba offline corresponde exclusivamente a la pantalla local de este change.

## Decisions

1. **Proyecto Expo TypeScript independiente en `mobile/`.** Usar una plantilla mínima compatible, entrada explícita y componentes nativos con safe area; no incorporar navegación para una sola pantalla. Dependencias y lockfile propios evitan acoplar React nativo al React web. Alternativa descartada: convertir toda la raíz en monorepo, cuyo costo no valida el circuito iOS. Generar `mobile/ios/` con `expo prebuild` en macOS; configuración/plugins serán la fuente mantenida, sin versionar productos nativos generados.

2. **Baseline estable verificada antes de scaffold.** La [tabla oficial de Expo](https://docs.expo.dev/versions/latest/) consultada el 17/09/2026 lista SDK 57 → RN 0.86, React 19.2.3, Node mínimo 22.13.x, iOS 16.4+ y Xcode 26.4+; SDK 56 → RN 0.85 con mismo React/iOS/Xcode y Node 20.19.x; SDK 55 → RN 0.83, React 19.2.0, iOS 15.1+ y Xcode 26.2+. Esa tabla no demuestra por sí sola que los paquetes sean estables en npm. La implementación verificará dist-tags publicados y plantilla estable, cruzará Xcode realmente instalado en una imagen macOS disponible y registrará versiones exactas en lockfile y documentación. Preferencia: SDK estable más reciente con toolchain documentada disponible; bajar a otro SDK estable de la tabla si falta compatibilidad y dejar evidencia. No usar canary/beta ni `macos-latest` sin controlar Xcode. Alternativa descartada: mezclar versiones RN/React elegidas desde la web. Este checkpoint no cambia alcance ni specs.

3. **Identidad provisional sin registro Apple.** Nombre Mi Saluteca y bundle identifier inicial `com.matyalts.misaluteca`, configurable antes del prebuild y documentado como provisional. No declarar un Development Team. Impactor podría modificar el identificador al firmar: registrar el identificador finalmente instalado. Icono/splash y branding serán recursos locales simples basados en la identidad existente, sin dependencia remota.

4. **Build directa Xcode sin firma.** Workflow `workflow_dispatch`: checkout, Node controlado, `npm ci` desde `mobile/`, verificaciones, prebuild iOS, CocoaPods y `xcodebuild` sobre workspace/scheme generado, `Release`, SDK `iphoneos`, destino genérico iOS y firma desactivada (`CODE_SIGNING_ALLOWED=NO`, `CODE_SIGNING_REQUIRED=NO`). Usar salida de build conocida en el workspace. No `-exportArchive` App Store, keychain, provisioning ni Apple ID. La fase estándar generada por Expo/RN debe producir el bundle y assets Release; no establecer variables que omitan bundling. Alternativa descartada: EAS local por autenticación adicional y circuito de firma innecesario para este spike.

5. **Empaquetado comprobado, sin framework de scripts complejo.** Script pequeño copia una única `.app` a `Payload/` y crea ZIP con extensión `.ipa`, preservando estructura y permisos necesarios. Comprobador inspecciona ZIP, `Info.plist`, `CFBundleExecutable`, plataforma `iphoneos`/`iPhoneOS`, ejecutable ARM64 compatible y bundle de entrada presente/no vacío. ARM64 por sí solo no diferencia simulador Apple Silicon; aceptar bytecode Hermes cuando corresponda, sin exigir JavaScript textual. Probar fixtures representativos y rechazos relevantes. Publicar solamente tras éxito del comprobador, con manifest de commit, SDK/Xcode/Node y logs diagnósticos sin credenciales. El chequeo estructural no demuestra instalación ni firma válida.

6. **TDD y validación por capa.** Instalar runner móvil compatible (`jest-expo` y herramientas React Native Testing Library compatibles con baseline) antes de escribir comportamiento de pantalla; scripts pueden usar runner estándar de su lenguaje. Tests de render prueban nombre/mensaje y re-render sin estado externo, no snapshots vacíos ni existencia de archivos. Tests de scripts prueban empaquetado/validación y errores. Capturar baseline existente para archivos modificados; ante fallas preexistentes detener cambios afectados y reportar, sin arreglarlas dentro de este change. Registrar RED ejecutado, GREEN, triangulación y refactor por comportamiento. Scaffold generado, YAML, ignores y configuración declarativa se verifican mediante schema, Expo doctor/install check, lint, typecheck y build: TDD de comportamiento no aplica y esta excepción razonada se debe documentar, sin crear tests tautológicos. Windows permite checks JS y export de recursos, pero no demuestra compilación nativa iOS.

7. **Aceptación física explícita.** Documentar descargar IPA, usar Impactor local con cuenta gratuita, activar Developer Mode/confiar en desarrollador cuando iOS lo requiera y abrir sin Metro ni red. Según [Apple](https://developer.apple.com/help/account/basics/about-your-developer-account), perfiles Personal Team vencen a los siete días y existen límites de registro/capacidades; consultar instrucciones actuales de [Impactor](https://github.com/claration/Impactor). El usuario opera credenciales localmente. Guardar evidencia con commit, run URL, modelo/iOS, identificador instalado, resultado y limitaciones, sin Apple ID ni UDID. La tarea física permanece pendiente hasta esa evidencia, aunque implementación y CI estén listas.

## Risks / Trade-offs

- [Imagen macOS mutable o Xcode incompatible] → revisar [inventario oficial de runners](https://github.com/actions/runner-images/tree/main/images/macos), seleccionar versión disponible explícitamente y registrar imagen/Xcode efectivos; fallar con diagnóstico de preflight.
- [App Release sin bundle o con dependencia de Metro] → comprobación del bundle y prueba física desconectada; no confundir export JS con build nativa.
- [IPA sin firma no instalable directamente] → procedimiento Impactor y aceptación manual separada. No prometer firma gratuita de capacidades futuras.
- [Impactor cambia bundle ID o presenta incompatibilidad] → documentar resultado y error; evaluar ajuste acotado del circuito antes de desarrollar negocio.
- [Costo/minutos Actions en repo privado] → workflow manual, límites de tiempo y retención acotada; revisar disponibilidad del repositorio antes de correrlo.
- [Verificaciones web empiezan a cargar módulos nativos] → exclusión `mobile/**` de TS/ESLint web y validación baseline/postcambio; incluir dependencias, build y coverage móviles en ignores.
- [iPhone con iOS inferior al SDK seleccionado] → documentar mínimo soportado en el checkpoint y verificar dispositivo antes de instalación.

## Migration Plan

Añadir móvil, aislamiento y workflow en el clon iOS sin migrar datos. Validar checks locales, después ejecutar Actions cuando el workflow esté en GitHub y finalmente registrar instalación personal. Cada task se completa solo con su evidencia; la falta de iPhone deja la tarea manual pendiente sin bloquear artificialmente ajustes de artifacts. Rollback: revertir archivos móviles/workflow y exclusiones agregadas a la web; no requiere rollback de base de datos, servidor ni configuración global.

## Open Questions

- Modelo/versión iOS del dispositivo que usará el usuario para registrar aceptación física.
- Identificador que conservará Impactor después de firmar localmente y compatibilidad concreta del sideloader con la build generada.
