# Evidencia de ios-native-foundation

## Validación automatizada

La migración de workspaces resolvió el bloqueo previo de Doctor 20/21. El run macOS [35297567940](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35297567940), commit `d407d093f4a5b15ca6b2be4108a20b635b490840`, completó instalación raíz, checks móviles, 51/51 pruebas y Doctor 21/21. También completó prebuild, pods, compilación Release iphoneos y publicación de IPA/manifest/diagnósticos. No se actualizó Expo: manifest SDK 57.0.23, mínimo iOS 16.4. El registro previo de safety net y ciclo de migración está en `docs/npm-workspaces-evidence.md`.

IPA inspeccionado: 12.212.646 bytes, SHA256 `37494f728d0157adb58786dfb3775bdbb19c804fbfc0e2b0d9fc58e4545eb401`. Artifact sin firma: contiene ejecutable y bundle JS, sin `_CodeSignature` ni perfil de aprovisionamiento. Se conserva `com.matyalts.misaluteca` en la configuración del proyecto.

## Confirmación en dispositivo y defectos observados

El usuario informó «sí funcionó» y aportó cuatro capturas de iPhone. Muestran la pantalla inicial con Google, el navegador de autorización en `saluteca.matyalts.me`, la pantalla de estudios vacía y la cuenta autenticada. Las tabs Estudios/Cuenta tienen el material nativo visible. No se transcriben nombre ni correo de las capturas.

Las capturas revelan un defecto de layout pendiente: los títulos de Estudios y Cuenta invaden el área superior de la barra de estado. La confirmación funcional no equivale a aceptar esa presentación como pantalla de producción. El usuario solicita avanzar con las pantallas definitivas y el login con diseño de la web.

La tarea 1.1 queda completa tras Doctor verde. La tarea 2.1 sigue abierta: faltan evidencia específica de fallback anterior a iOS 26, VoiceOver, Dynamic Type y ajustes de transparencia, contraste y movimiento, además de corregir/verificar el solapamiento superior. No se vincula inequívocamente el IPA de este run con la instalación mostrada y no se archiva el change.
