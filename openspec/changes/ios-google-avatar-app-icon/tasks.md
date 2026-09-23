## 1. Avatar Google

- [x] 1.1 Registrar baseline focalizado de Cuenta y sesión; aplicar TDD a selección de URL con casos HTTPS Google válido, ausente, longitud excesiva, userinfo, HTTP, puertos ajenos y hosts que imitan el sufijo. Ejecutar RED antes de implementación mínima, GREEN antes de añadir el siguiente caso y triangulación; registrar evidencia.
- [x] 1.2 Aplicar TDD RNTL al avatar integrado en Cuenta: carga y foto exitosa, respaldo ante ausencia/error/offline, cambio de usuario y resolución tardía de una imagen anterior. Verificar que la solicitud nativa no recibe secretos de la sesión, usando un adaptador o inspección real focalizada cuando la abstracción de imagen no exponga las cabeceras en RNTL. Mantener nombre accesible, espacio fijo y cierre de sesión disponible; repetir pruebas tras refactor.

## 2. Icono de marca

- [x] 2.1 Convertir el frame original del favicon 238×229 mediante comando reproducible a PNG RGB 1024×1024, con resampling de calidad, márgenes, proporción y fondo blanco. Registrar origen, limitación de detalle raster y revisión visual de fidelidad y legibilidad a tamaño real de icono, antes de conectar el recurso a Expo. Verificar dimensiones y opacidad reales con herramienta de imagen; si la calidad fuera insuficiente, evaluar fuente mayor o vectorización fiel como mejora opcional, sin rediseño. No agregar tests tautológicos de strings de configuración ni pruebas del dibujo que repitan su código.
- [x] 2.2 Integrar el recurso en la configuración Expo y verificar en prebuild macOS el catálogo iOS generado; ejecutar build IPA con identificador predeterminado intacto e inspeccionar metadatos y catálogo compilado del artefacto real, registrando commit y resultado. Si se introduce lógica nueva de generación/validación, probar entradas válidas e inválidas con RED/GREEN/triangulación, además del build real.

## 3. Validación y aceptación

- [x] 3.1 Ejecutar suites móviles afectadas, TypeScript, lint focalizado, Expo Doctor y export; registrar tabla TDD por comportamiento, refactor y limitaciones. No corregir fallas web previas ni declarar pruebas no ejecutadas.
- [ ] 3.2 Firmar/instalar candidato con Impactor y comprobar foto de la cuenta Google real, respaldo sin conectividad, cambio de cuenta y nuevo icono en pantalla de inicio/ficha del sistema. Registrar evidencia anonimizada, sin URLs ni fotos personales en Git; mantener esta tarea pendiente hasta confirmación física.
