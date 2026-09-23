## Purpose

Carga y edición web dependen de cookies/Server Actions y el lector móvil solo recibe PDF. Se necesitan formularios y adjuntos iOS funcionales con backend Bearer seguro.

## ADDED Requirements

### Requirement: Crear y editar estudios reales

El sistema SHALL aceptar adjuntos permitidos y metadata/paciente validado, guardar cambios con autorización canónica y aplicar cuota server existente.

#### Scenario: Carga o edición válida
- **WHEN** se seleccionan archivos permitidos y paciente propio con metadata válida
- **THEN** se guarda operación real única, se actualizan Inicio/Estudios/familia y se informa progreso/resultado.

#### Scenario: Límite o paciente ajeno
- **WHEN** un archivo excede10 MB, estructura/tipo es inválido, cuota agotada o paciente no pertenece a la cuenta
- **THEN** se rechaza sin estudio parcial ni archivo accesible; controles explican fallo sin éxito ficticio.

### Requirement: Operaciones destructivas y red ambiguas

El sistema SHALL requerir confirmación de borrado y evitar duplicados/éxitos falsos ante cancelación, retry o rollback.

#### Scenario: Reintentar misma carga
- **WHEN** la red falla después de commit y se reintenta con mismo idempotency key/payload
- **THEN** se devuelve la operación existente y no se duplica estudio ni contador.

#### Scenario: Cancelar o borrar ajeno
- **WHEN** se cancela picker/upload o se intenta borrar estudio de otra cuenta
- **THEN** cancelar no modifica documentos existentes y el intento ajeno recibe404 sin cleanup de archivos ajenos.

### Requirement: Ver y exportar adjuntos con control explícito

La app SHALL permitir selección/lectura de formatos aceptados y exportación de uno/todos únicamente con consentimiento informado; lectura PDF por defecto SHALL seguir sin exportación.

#### Scenario: Solo leer
- **WHEN** se abre PDF o imagen autorizada sin elegir Exportar
- **THEN** el visor no inicia compartir externo y al cerrar se limpia caché privada.

#### Scenario: Exportación voluntaria
- **WHEN** se confirma Exportar archivo(s) tras aviso de copia externa
- **THEN** se abre sheet nativa con adjuntos reales; se aclara que copias externas no se revocan y cleanup solo alcanza caché app.
