## Purpose

La lectura propia funciona, pero faltan Inicio, búsqueda y filtros equivalentes a web. Filtrar una página local o contar sus filas daría resultados y cifras incorrectos.

## ADDED Requirements

### Requirement: Inicio y búsqueda completos propios

El sistema SHALL mostrar resumen y recientes propios del historial completo y aplicar filtros a la consulta paginada servidor, sin incluir familiares hasta su change.

#### Scenario: Más de una página
- **WHEN** hay estudios relevantes fuera de la primera página y se aplica búsqueda/mes/médico/institución
- **THEN** los resultados y totales corresponden al conjunto autorizado completo.

#### Scenario: Otra cuenta o red fallida
- **WHEN** se consulta con otro usuario o falla la conexión
- **THEN** no se revela información ajena y se muestra error/reintento en vez de cero o lista vacía ficticia.

### Requirement: Orden y compatibilidad de paginación

El sistema SHALL preservar v1 anterior por defecto y ofrecer orden explícito por fecha de estudio con cursor estable entre iguales y fechas inválidas.

#### Scenario: Fechas repetidas y legacy
- **WHEN** se pagina orden explícito con fechas DD-MM-YYYY iguales y algunas inválidas
- **THEN** se ordenan fechas válidas descendentes, inválidas al final y id para desempate, sin duplicados/omisiones.

#### Scenario: Cliente anterior o cursor malformado
- **WHEN** no se solicita nuevo sort o el cursor no corresponde a filtros
- **THEN** el contrato anterior sigue idDESC o se rechaza400, respectivamente.

### Requirement: Lectura nativa final

La app SHALL ofrecer lista y detalle propios con metadata/adjuntos reales, PDF existente y estados accesibles sin prueba ni acciones ficticias.

#### Scenario: Abrir documento
- **WHEN** se selecciona estudio y un PDF autorizado
- **THEN** se abre detalle/PDF nativo y se vuelve a posición/filtros anteriores.

#### Scenario: Respuesta tardía
- **WHEN** cambian filtros o se cierra sesión antes de responder una consulta
- **THEN** la respuesta anterior no sustituye filtros actuales ni vuelve a mostrar información privada.
