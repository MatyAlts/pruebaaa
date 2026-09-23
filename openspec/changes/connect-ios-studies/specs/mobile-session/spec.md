## Purpose

Permitir que el cliente iOS acceda como el mismo usuario de MiSaluteca web con una sesión móvil segura, renovable y revocable sin transportar cookies web.

## ADDED Requirements

### Requirement: Identidad mediante autorización externa
El sistema SHALL autorizar el acceso móvil mediante Google en navegador del sistema, asociarlo al mismo usuario MySQL validado por la sesión web y entregar únicamente un código corto de un uso vinculado al intento, redirect permitido y prueba PKCE. SHALL rechazar retornos ajenos al intento y nunca incluir tokens duraderos en redirects.

#### Scenario: Autorización válida
- **WHEN** el usuario confirma Google y el cliente presenta el código válido con la prueba correspondiente
- **THEN** se establece la sesión móvil para el mismo usuario de la web.

#### Scenario: Retorno inválido o interceptado
- **WHEN** no coincide state, redirect o prueba PKCE
- **THEN** no se establece sesión ni se entregan datos privados.

#### Scenario: Código vencido o reutilizado
- **WHEN** se intercambia un código vencido o ya consumido
- **THEN** el servidor rechaza el intento sin emitir credenciales.

#### Scenario: Cancelación
- **WHEN** el usuario cancela el navegador de autorización
- **THEN** permanece en login con opción de volver a intentar sin sesión parcial.

### Requirement: Sesión móvil limitada y renovable
El cliente SHALL guardar la credencial renovable únicamente en almacenamiento seguro del sistema y enviar credenciales de acceso por cabecera de autorización sobre HTTPS. El servidor SHALL controlar expiración y revocación, rotar la credencial de renovación y rechazar su reutilización. Un fallo de red SHALL distinguirse de una sesión inválida.

#### Scenario: Acceso vencido con renovación válida
- **WHEN** vence la credencial de acceso y la sesión renovable sigue válida
- **THEN** se renueva una vez y se reintenta la petición original sin duplicar operaciones.

#### Scenario: Renovación vencida o revocada
- **WHEN** la credencial renovable está vencida, revocada o reutilizada
- **THEN** se rechaza la renovación y se vuelve a login limpiando información privada local.

#### Scenario: Sin red durante renovación
- **WHEN** no puede alcanzarse el servidor al renovar
- **THEN** se informa falta de conectividad sin declararla falsamente una autenticación válida o revocada.

### Requirement: Logout local y revocación verificables
El cierre de sesión SHALL borrar credenciales, información de estudios en memoria y PDFs temporales administrados por la app. Si el servidor es accesible SHALL revocar la sesión móvil y rechazar su acceso posterior; si no lo es SHALL informar que la revocación remota no se confirmó. El logout móvil SHALL preservar la sesión web independiente.

#### Scenario: Logout conectado
- **WHEN** se cierra sesión con conectividad
- **THEN** desaparecen los datos privados locales y los tokens de esa sesión ya no permiten acceder a API; la web mantiene su sesión.

#### Scenario: Logout sin red
- **WHEN** se cierra sesión sin conectividad
- **THEN** se limpia localmente y se informa revocación remota no confirmada, sin afirmar que el servidor ya revocó tokens.

#### Scenario: Respuesta privada tardía
- **WHEN** finaliza una descarga o consulta iniciada antes del logout
- **THEN** no se reincorpora información ni archivo privado a la sesión cerrada.
