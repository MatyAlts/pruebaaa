## 1. Preparación e implementación

- [x] 1.1 Ejecutar safety net móvil/sesión/scripts y registrar baseline; confirmar paquetes router/fonts compatibles SDK 57 con expo install/doctor, sin upgrade SDK ni alterar web.
- [x] 1.2 RED mínimo para configuredOrigin: dos orígenes HTTPS válidos, ausente e inválido; GREEN y triangulación usando apiOrigin sin fallback silencioso. Si baseline existente falla, detener y presentar excepción concreta antes aplicar.
- [x] 1.3 RED mínimo SessionProvider/routing para sesión válida y deep link privado, GREEN antes triangular logout/restore tardío/cliente único; registrar rerun. Cubrir restore único/singleflight en StrictMode y callback PKCE consumido solo por WebBrowser sin segundo exchange.
- [x] 1.4 RED HTTP capabilities autenticado y fallback404 cliente, GREEN y triangulación flags ausentes/falsos; no usar flags como authorization.
- [x] 1.5 Crear tokens/componentes de marca y routes Estudios/Cuenta reales; RNTL navegación, Dynamic Type/loading/error, quitando copy de prueba; ≥2 casos por comportamiento. Verificar contraste normal ≥ 4.5 y grande ≥ 3, verde solo con texto oscuro; color no único indicador.

## 2. Validación y evidencia

- [ ] 2.1 Validar doctor/types/lint/móvil, export Release, build macOS/IPA y comprobación física iOS 26/fallback + VoiceOver/reduced settings; marcar evidencia manual pendiente si no ejecutada.

Cada comportamiento ejecutable: safety net previo; un RED mínimo ejecutado, GREEN confirmado antes de otro caso, triangulación ≥2 casos, refactor con rerun y tabla de evidencia. Declaraciones de configuración se verifican con herramientas/build; ninguna tarea física se completa sin evidencia real.
