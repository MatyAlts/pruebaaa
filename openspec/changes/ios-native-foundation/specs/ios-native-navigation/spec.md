## Purpose

La aplicación funcional mantiene una sola pantalla de prueba y no ofrece estructura iOS reconocible. Se necesita una navegación nativa y un sistema visual fiel a la web antes de migrar las demás pantallas.

## ADDED Requirements

### Requirement: Navegación funcional y protegida

La app SHALL mostrar solo destinos operativos y autorizados con navegación nativa, retirar texto de prueba y preservar logout/restauración existentes.

#### Scenario: Entrar y leer
- **WHEN** hay una sesión válida y solo lectura/perfil disponibles
- **THEN** se muestran Estudios y Cuenta reales; detalle/PDF abren desde stack; Inicio/Familia/carga no se anuncian.

#### Scenario: Cerrar o restaurar tarde
- **WHEN** se cierra sesión mientras responde una restauración o se intenta deep link privado
- **THEN** se presenta entrada pública y ningún resultado tardío vuelve a mostrar datos privados.

### Requirement: Identidad y compatibilidad nativas

La interfaz SHALL usar marca actual web, español y recursos locales; navegación SHALL adoptar Liquid Glass nativo en iOS 26 y conservar iOS 16.4 y accesibilidad.

#### Scenario: Dispositivo moderno
- **WHEN** se usa iOS 26 con navegación activa
- **THEN** se utiliza material de sistema en la barra y tarjetas sólidas; VoiceOver y áreas seguras conservan controles legibles.

#### Scenario: Fallback accesible
- **WHEN** se usa iOS anterior o ajustes de accesibilidad restrictivos
- **THEN** la barra mantiene apariencia nativa y funciones equivalentes, sin duplicar insets ni bloquear apertura local.

### Requirement: Disponibilidad verificable

El backend SHALL informar capacidades funcionales autenticadas y la app SHALL tratar ausencia de anuncio como no disponible para funciones nuevas.

#### Scenario: Backend antiguo
- **WHEN** capabilities responde404 y los endpoints actuales están operativos
- **THEN** la app conserva lectura/perfil/logout sin habilitar destinos futuros.

#### Scenario: Anuncio restringido
- **WHEN** capabilities indica que una función no existe o no está autorizada
- **THEN** esa función no se muestra aunque haya una variable local que la anuncie.

### Requirement: Origen y callbacks preservados

La app SHALL utilizar el origen HTTPS público configurado, fallar visiblemente ante configuración ausente/inválida y reservar callback Google a su intento PKCE vigente, con restauración única.

#### Scenario: Origen válido diferente
- **WHEN** se configura otro origen HTTPS válido y se completa login externo
- **THEN** las peticiones usan exactamente ese origen y callback se intercambia una sola vez sin montar rutas privadas accidentalmente.

#### Scenario: Configuración o callback sin intento
- **WHEN** falta el origen, es inválido o llega callback sin login vigente
- **THEN** se muestra estado seguro/configuración y no se usa otro backend por fallback, no se crea sesión y no se muestra contenido privado.
