## Purpose

Asistir opcionalmente los campos del formulario de carga iOS actual con extracción local limitada y sugerencias OpenRouter revisadas por el usuario.

## ADDED Requirements

### Requirement: Extracción local y carga independiente
La app SHALL procesar únicamente PDF/JPEG/PNG del adjunto actual dentro de límites, de forma cancelable y sin enviarlo al proveedor.

#### Scenario: Adjunto permitido
- **WHEN** se solicita extraer texto de PDF/JPEG/PNG≤10MB dentro20páginas/2048/20000
- **THEN** se muestra texto revisable y no se guarda ni analiza automáticamente

#### Scenario: Cancelación o archivo inválido
- **WHEN** se cancela o el archivo está vacío/cifrado/inválido/excede límites
- **THEN** se liberan recursos temporales, se informa el motivo y carga manual/borrador permanecen disponibles

### Requirement: Consentimiento y cuota auténtica
El sistema SHALL analizar sólo texto consentido con Bearer existente, clave backend y cuota diaria compartida web/móvil.

#### Scenario: Solicitud consentida
- **WHEN** se confirma envío y hay configuración/cuota válidas
- **THEN** se reserva capacidad y una sola llamada OpenRouter devuelve sugerencias validadas con modelo actual

#### Scenario: Configuración o cuota ausentes
- **WHEN** falta esquema/clave/límite o se agotó capacidad diaria
- **THEN** no se llama al proveedor ni se bloquea carga manual

#### Scenario: Respuesta ambigua
- **WHEN** se pierde respuesta para requestId ya enviado
- **THEN** el estado propio se consulta sin repetir llamada y, sin resultado recuperable, se ofrece continuar manualmente sin retry pago silencioso

### Requirement: Aplicación revisada y aislada
La app SHALL aplicar sólo sugerencias aceptadas sin guardar automáticamente ni sobrescribir cambios posteriores.

#### Scenario: Aceptar campos
- **WHEN** el usuario acepta sugerencias válidas de campos sin cambios posteriores
- **THEN** actualiza sólo esos campos respetando límites y fecha calendario

#### Scenario: Campo editado o sesión obsoleta
- **WHEN** cambió un campo/borrador/adjunto o se cerró sesión después de iniciar
- **THEN** no se sobrescribe ese campo ni se rehidrata información de sesión anterior
