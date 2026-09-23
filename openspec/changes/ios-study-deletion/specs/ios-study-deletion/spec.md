## Purpose

Eliminar un estudio individual propio desde iOS con confirmación y limpieza verificable de todos los adjuntos, sin modificar autenticación existente.

## ADDED Requirements

### Requirement: Eliminación propia confirmada
El sistema SHALL verificar propietario y sesión no revocada antes de confirmar el borrado transaccional.

#### Scenario: Confirmación válida
- **WHEN** el dueño confirma eliminar su estudio
- **THEN** desaparecen estudio, adjuntos y links en el commit y se refrescan conteos sin reembolsar cuota de carga diaria

#### Scenario: Ajeno o revocado
- **WHEN** el estudio no pertenece al solicitante o la sesión fue revocada
- **THEN** no se modifican datos ni archivos y no se revela información ajena

### Requirement: Reconciliación y limpieza completa
El sistema SHALL conservar una operación idempotente propia y outbox para todos los archivos, sin aceptar rutas de cliente.

#### Scenario: Respuesta perdida
- **WHEN** el cliente reintenta con la misma clave y estudio tras respuesta ambigua
- **THEN** obtiene la misma operación sin efectos duplicados

#### Scenario: Error físico
- **WHEN** unlink falla después del commit
- **THEN** el estado permanece pendiente y el worker reintenta de forma confinada sin perder referencias

#### Scenario: Cancelación
- **WHEN** el usuario cancela la confirmación
- **THEN** no se envía una escritura ni se alteran resultados
