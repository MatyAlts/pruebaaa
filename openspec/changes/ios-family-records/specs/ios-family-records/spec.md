## Purpose

La web organiza familiares y sus carpetas, pero la API móvil actual excluye estudios familiares. La tab Familia requiere aislamiento real y formularios funcionales, no datos simulados.

## ADDED Requirements

### Requirement: Carpetas familiares aisladas

El sistema SHALL permitir gestionar y consultar solo familiares y estudios bajo la cuenta canónica, con nombre validado, paciente visible y filtros completos.

#### Scenario: Familia propia
- **WHEN** se añade/renombra y abre familiar propio
- **THEN** se guardan datos reales y se consultan sus estudios/resumen paginados con paciente explícito.

#### Scenario: Familiar ajeno o nombre inválido
- **WHEN** se pide uuid de otra cuenta o nombre vacío/>40
- **THEN** se rechaza404 o400 sin leer/modificar datos ni afectar resumen de otra cuenta.

### Requirement: Eliminación familiar explícita y recuperable

El sistema SHALL requerir confirmación destructiva e invalidar acceso a familiar/estudios/enlaces tras commit, con limpieza de archivos controlada e idempotente.

#### Scenario: Confirmar cascada
- **WHEN** se escribe misaluteca y el familiar pertenece a la cuenta
- **THEN** se aplica transacción autorizada y se indica estado real de cleanup, actualizando lista/estadísticas sin acceso a filas borradas.

#### Scenario: Cancelar o fallar limpieza
- **WHEN** se cancela, falla SQL o unlink no termina
- **THEN** cancelar no modifica; rollback no anuncia éxito; cleanup pendiente reintenta sin borrar archivos ajenos ni afirmar borrado físico completo.
