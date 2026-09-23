## Purpose

Consultar estudios personales y abrir sus PDFs autorizados desde iOS manteniendo aislamiento entre usuarios y errores distinguibles de resultados vacíos.

## ADDED Requirements

### Requirement: Listado propio paginado
La API SHALL devolver exclusivamente estudios del usuario autenticado sin familiar asociado, paginados con orden estable y continuación explícita; el cliente SHALL distinguir carga, lista vacía, error y siguiente página. La identidad SHALL derivarse de la sesión validada y no de un userId suministrado por el cliente.

#### Scenario: Primera página y continuación
- **WHEN** existen más estudios propios que el tamaño de página
- **THEN** se muestra la primera página y al continuar se agregan resultados ordenados sin duplicados.

#### Scenario: Usuario sin estudios propios
- **WHEN** no existen estudios propios para el usuario
- **THEN** se muestra estado vacío sin exponer estudios de familiares u otros usuarios.

#### Scenario: Fallo de backend o red
- **WHEN** falla la consulta
- **THEN** se informa error con reintento y no se transforma el fallo en lista vacía.

#### Scenario: Petición sin autorización
- **WHEN** falta una sesión válida
- **THEN** se responde 401 sin devolver estudios.

### Requirement: Detalle y referencias de archivos privadas
El detalle SHALL devolver metadatos legibles y `files[]` con identificadores de archivo estables, nombre, MIME y tamaño, sin rutas de almacenamiento. SHALL aceptar únicamente estudios propios del usuario; un identificador ajeno o inexistente SHALL dar una respuesta indistinguible 404.

#### Scenario: Estudio multiarchivo o legacy
- **WHEN** se abre un estudio propio con archivos nuevos o un archivo legacy
- **THEN** se muestran metadatos y referencias válidas de sus archivos sin revelar fileKey.

#### Scenario: Estudio ajeno o inexistente
- **WHEN** se solicita un estudio fuera del conjunto propio autorizado o inexistente
- **THEN** se devuelve 404 sin metadatos del estudio.

### Requirement: PDF autorizado y temporal
La API SHALL comprobar sesión y relación usuario-estudio-archivo en cada descarga. El cliente SHALL descargar PDF a almacenamiento temporal privado, abrirlo con visor del sistema y limpiar archivos administrados al cerrar el visor, al cerrar sesión y al iniciar nuevamente. SHALL presentar errores y archivos no PDF como no disponibles para esta apertura sin sustituir el archivo solicitado por otro.

#### Scenario: PDF permitido
- **WHEN** se selecciona un PDF del detalle autorizado
- **THEN** se descarga con autorización y se abre localmente sin colocar tokens en URLs.

#### Scenario: Archivo ajeno o inválido
- **WHEN** se solicita un archivo inexistente o que no pertenece al estudio autorizado
- **THEN** se devuelve 404 sin recurrir silenciosamente a otro archivo legacy.

#### Scenario: Descarga interrumpida o formato no soportado
- **WHEN** falla la descarga o el archivo no es PDF
- **THEN** se informa el resultado adecuado sin abrir un archivo incompleto y se limpian restos temporales.

#### Scenario: Visor cerrado o aplicación reiniciada
- **WHEN** se cierra el visor o vuelve a iniciarse la aplicación
- **THEN** se eliminan PDFs temporales administrados que ya no están en uso y no se muestran documentos offline persistentes.
