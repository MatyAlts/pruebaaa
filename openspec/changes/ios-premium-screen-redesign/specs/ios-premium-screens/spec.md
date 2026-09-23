## Purpose

Presentar las cuatro pantallas nativas de negocio de Mi Saluteca con el lenguaje visual de las referencias, datos reales y operaciones existentes accesibles y coherentes.

## ADDED Requirements

### Requirement: Lenguaje visual compartido y adaptable
Las pantallas SHALL utilizar fondo frío con decoración superior tenue, tarjetas blancas redondeadas, tipografía del sistema escalable, jerarquía tinta/azul y acciones de degradado azul. La decoración SHALL no interceptar interacciones ni anunciarse como contenido.

#### Scenario: Apertura de las cuatro pantallas
- **WHEN** el usuario navega por Inicio, Estudios, Familia y Cuenta disponibles
- **THEN** reconoce la composición de las referencias mediante componentes interactivos sin marco, barra de estado ni indicador de inicio artificiales.

#### Scenario: Texto ampliado y ancho reducido
- **WHEN** el usuario aumenta el tamaño de texto o utiliza un ancho reducido
- **THEN** los textos importantes permanecen legibles, las tarjetas de resumen adaptan su disposición y los controles mantienen áreas táctiles mínimas de 44 puntos.

#### Scenario: Botón primario con geometría real
- **WHEN** un botón primario se presenta inicialmente o cambia de ancho/alto por tamaño de pantalla o texto
- **THEN** su fondo azul cubre toda la superficie redondeada, sin fragmentos, diagonales vacías ni desbordamientos, y el texto/icono permanecen legibles y táctiles.

### Requirement: Inicio conectado a historial real
Inicio SHALL mostrar saludo y avatar de la sesión actual, acción Cargar estudio cuando esté habilitada, resumen real de estudios propios/familiares y recientes con acceso a detalle y Ver todos.

#### Scenario: Resumen y recientes diferentes
- **WHEN** el backend devuelve cantidades superiores a los recientes visibles
- **THEN** el resumen utiliza propiosTotal, familiaresTotal y total del servidor, sin contar personas ni filas recientes, y las tarjetas abren los detalles reales.

#### Scenario: Fallo o historial vacío
- **WHEN** la consulta falla o devuelve cero recientes
- **THEN** presenta un error reintentable o estado vacío útil respectivamente, sin inventar conteos ni documentos.

### Requirement: Estudios con alcance consistente
Estudios SHALL conservar búsqueda, filtros soportados, paginación y detalles, con controles secundarios compactos para alcance/paciente y acceso claro a la carga habilitada. El alcance seleccionado, nombre de paciente, texto Mostrando y resultados SHALL representar la misma consulta.

#### Scenario: Selección de familiar
- **WHEN** el usuario elige un familiar real
- **THEN** se consultan sus estudios y se identifica su historial sin mostrar Mi historial como selección propia activa.

#### Scenario: Buscar y limpiar
- **WHEN** se aplica una búsqueda o filtros y luego se limpia
- **THEN** los resultados corresponden a los parámetros vigentes, se puede limpiar texto y se preserva el paciente seleccionado.

#### Scenario: Encabezado y acción discreta
- **WHEN** se abre Estudios o la carpeta de un familiar
- **THEN** el título y su contexto se reconocen antes de las acciones; Cargar estudio permanece disponible y los controles auxiliares no forman una pila de botones primarios por encima del título.

### Requirement: Carpeta familiar funcional
Familia SHALL presentar encabezado, Agregar familiar habilitado, tarjeta informativa y lista con cantidad real, nombres, conteos de estudios y acceso a carpeta, conservando operaciones y confirmaciones existentes.

#### Scenario: Alta y apertura
- **WHEN** se agrega un familiar válido y se abre su tarjeta
- **THEN** se actualiza la lista y se abre su carpeta real sin inventar parentescos ni datos personales adicionales.

#### Scenario: Lista vacía o error
- **WHEN** no existen familiares o falla su consulta
- **THEN** se presenta una acción de alta cuando permitida o reintento cuando falla, sin simular resultados.

### Requirement: Flujos auxiliares con presentación premium segura
Los flujos existentes de carga de estudios, alta y edición familiar SHALL compartir el lenguaje premium, encabezado compacto y campos accesibles, conservando operaciones, validaciones y prevención de duplicados. Las carpetas familiares SHALL ofrecer editar/eliminar mediante acciones secundarias compactas y mantener confirmaciones destructivas existentes. Cada presentación SHALL aplicar áreas seguras una sola vez y permitir alcanzar campos/acciones con teclado y texto ampliado.

#### Scenario: Carga independiente y dentro de Familia
- **WHEN** se abre Cargar estudio desde una pestaña o una carpeta familiar
- **THEN** presenta el mismo lenguaje visual sin insets duplicados, conserva el paciente correspondiente y permite recorrer los campos y adjuntos reales sin perder estados de progreso o reconciliación.

#### Scenario: Alta y edición con teclado
- **WHEN** el usuario abre alta o edición familiar y escribe un nombre válido
- **THEN** el formulario presenta controles premium accesibles, Guardar/Cancelar alcanzables con el teclado, y ejecuta la operación existente sin envíos duplicados.

#### Scenario: Acciones compactas de carpeta
- **WHEN** el usuario abre una carpeta familiar con permisos de escritura y eliminación
- **THEN** puede cargar, editar o eliminar desde controles compactos diferenciados, y eliminar conserva la confirmación irreversible antes de enviar la operación.

### Requirement: Cuenta con identidad verificable
Cuenta SHALL mostrar avatar/fallback, nombre y correo de la sesión actual y tarjeta de Sesión con cierre real. El proveedor SHALL mostrarse solamente cuando esté verificado por datos existentes y una acción de edición SHALL existir solamente si tiene destino funcional.

#### Scenario: Identidad actual sin proveedor registrado
- **WHEN** la sesión contiene identidad pero no proveedor verificable
- **THEN** muestra sus datos reales sin afirmar un proveedor ni agregar edición ficticia.

#### Scenario: Cierre de sesión
- **WHEN** se activa Cerrar sesión
- **THEN** conserva la limpieza y navegación pública existentes, bloquea acciones duplicadas durante el progreso y presenta errores reales.

### Requirement: Navegación nativa y accesibilidad
La app SHALL preservar pestañas y navegación nativas disponibles por capacidades, gestos, estados y áreas seguras; cada último elemento SHALL poder desplazarse completamente por encima de la barra inferior. Los efectos SHALL respetar reducir movimiento/transparencia y usar fallback legible cuando corresponda.

#### Scenario: Lectura con VoiceOver y desplazamiento
- **WHEN** el usuario explora controles y tarjetas con VoiceOver o llega al final de una lista
- **THEN** distingue paciente y acción con roles/estados correctos y puede alcanzar el último elemento sin quedar oculto tras la barra.

#### Scenario: Preferencias de accesibilidad
- **WHEN** el usuario reduce movimiento o transparencia
- **THEN** la interfaz evita animaciones no esenciales y mantiene superficies legibles sin duplicar efectos sobre la barra del sistema.

### Requirement: Flujos auxiliares y gestos coherentes
La app SHALL presentar detalle/filtros/calendario y modales familiares con lenguaje premium, áreas seguras nativas propias y navegación que preserve estado real.

#### Scenario: Modal familiar y texto ampliado
- **WHEN** se abre alta/edición/carga familiar con texto ampliado
- **THEN** el proveedor de safe areas pertenece a la raíz nativa modal, la cabecera no invade estado y el candado mantiene su aspecto sin recortar etiquetas

#### Scenario: Calendario de fecha
- **WHEN** se confirma o cancela una fecha en calendario nativo
- **THEN** se conserva el día calendario DD-MM-YYYY o el valor anterior respectivamente, sin modificar los demás campos

#### Scenario: Deslizar pestañas o regresar
- **WHEN** un gesto horizontal elegible cambia pestaña o el usuario vuelve desde detalle por gesto nativo
- **THEN** se mantienen filtros/paciente/lista de origen y los controles, scroll vertical y modales conservan prioridad sin capturar el gesto indebidamente
