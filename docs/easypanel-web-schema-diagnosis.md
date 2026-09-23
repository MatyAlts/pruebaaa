# Diagnóstico de carga web en EasyPanel

Fecha: 18-09-2026. Análisis local; no se conectó ni modificó la VPS o su base.

Actualización de estado: el usuario confirmó posteriormente que `portfolio` es TEST y procede del bootstrap. Familia tiene una migración separada preparada en `ios-family-records`; su aplicación en la VPS corresponde al responsable. La reparación de cuotas y campos de 400 caracteres continúa pospuesta. El ajuste puntual de rutas descrito abajo sí se implementó tras el nuevo error de carga `EACCES mkdir /app/app`.

El log confirma `ER_NO_SUCH_TABLE`: la conexión selecciona `portfolio` y no encuentra `familiares`. No demuestra que esa sea la base TEST prevista ni que se haya ejecutado el bootstrap de este repositorio. El `SIGTERM` anterior indica terminación del proceso; su motivo necesita los eventos del servicio EasyPanel. El aviso de npm y `DEP0169` no explican la tabla faltante.

La guía `docs/easypanel-ios-backend.md`, paso 2, delimita expresamente el bootstrap a identidad Google y lectura iOS. `database/mobile-test-bootstrap.sql` crea únicamente `users`, `estudios` y `estudios_archivos`. La pantalla web consulta familiares antes de cargar un estudio (`src/features/family/repositories/family.repository.ts`). Además, `app/api/upload-study/route.ts` consulta y actualiza `users.count_files` y `users.date_files`, ausentes en ese bootstrap. Crear solamente `familiares` no resuelve toda la carga web.

## Inspección para el responsable del entorno

En la consola privada MySQL de EasyPanel, ejecutar estas consultas de lectura sobre la conexión usada por App. Comparar `DB_NAME` del servicio App con la base seleccionada; no compartir passwords, tokens ni filas con datos personales.

```sql
SELECT DATABASE() AS base_actual, VERSION() AS mysql_version;

SELECT TABLE_NAME, ENGINE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users','estudios','estudios_archivos','familiares','links')
ORDER BY TABLE_NAME;

SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users','estudios','estudios_archivos','familiares','links')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
```

Confirmar también que esta base contiene exclusivamente datos de prueba y si se inicializó con `mobile-test-bootstrap.sql`. No volver a ejecutar ese bootstrap: rechaza tablas existentes deliberadamente.

## Corrección propuesta, pendiente de revisión y aprobación

Preparar una migración aditiva específica para la estructura inspeccionada y probarla primero en MySQL 8.4 desechable. Si coincide exactamente con el bootstrap TEST actual:

- Crear `familiares` con `id INT` autoincremental, `uuid` único, `id_usuario INT` compatible con `users.id`, `email_usuario`, `nombre`, `fecha_nacimiento VARCHAR(10) NULL` y `created_at`/`updated_at VARCHAR(20)`, más índice por propietario y foreign key a `users`. La política de borrado debe revisarse expresamente; no introducir cascadas por copiar un script histórico.
- Agregar únicamente si faltan `users.count_files INT NOT NULL DEFAULT 0` y `users.date_files VARCHAR(20) NULL`. No tocar las columnas Google ni las sesiones.
- Ampliar `estudios.titulo`, `institucion` y `medico` de `VARCHAR(255)` a `VARCHAR(400)`, conservando nulabilidad y contenido. `config/constants.ts` permite 400 caracteres en esos campos; el bootstrap actual permite menos. Verificar `fecha`, `conclusion`, `descripcion`, `created_at` y las columnas de archivos contra el INSERT real.
- Conservar `estudios_archivos` y las columnas legacy: la lectura iOS y web soportan ambas. No aplicar migraciones de borrado de columnas ni importar datos productivos.

No ejecutar directamente `create-familiares-table.sql`: carece de `uuid` y usa `DATE`, mientras el repositorio actual guarda y lee nacimiento como `DD-MM-YYYY`. `create-estudios-table.sql` tampoco describe el modelo actual completo. `migrate-familiares-to-id.sql` está destinado a una estructura antigua distinta y elimina columnas; no corresponde a una tabla inexistente. `migrate-multiple-files.sql` usa un timestamp de creación distinto al string actual: tampoco ejecutarlo a ciegas.

`links` se necesita para compartir, no para el POST de carga. Su ausencia no debe ocultarse ni solucionarse con un script incompleto; revisar los repositorios de sharing y su DDL en la entrega que habilite compartir. IA también requiere su propia revisión de cuotas y OpenRouter; esta corrección no declara paridad completa de todas las funciones web.

## Otro problema independiente: directorio de archivos

La guía configura `DIRECTORY_UPLOADS=/app/uploads`. La ruta web concatena `join(process.cwd(), baseUploadDir, userId)`; con cwd `/app` produce `/app/app/uploads/<id>`, fuera del volumen previsto. Se verificó localmente con `node:path.posix.join`, sin escribir archivos. Puede generar `EACCES` o persistencia incorrecta después de corregir el esquema.

Implementado un ajuste puntual mediante `src/lib/storage/upload-root.ts`: `resolve(DIRECTORY_UPLOADS || './uploads')` mantiene destinos absolutos y resuelve relativos desde cwd. Lo utilizan la ruta activa `app/api/upload-study/route.ts` y el guardado/borrado de `StudyService`. Se conservan claves por propietario, nombres de archivo, autenticación, SQL y cuotas; no se cambian permisos ni variables del entorno.

Pruebas focales **7/7 PASS** ejecutan la ruta web y el servicio con archivos ficticios sobre filesystem real, verificando destinos absolutos/relativos, bytes guardados y eliminación en el mismo volumen; el caso sin variable conserva `./uploads`. Sesión, SQL y validación de archivos son fixtures controlados: no certifican el esquema de la VPS ni una carga HTTP real desplegada. Ver `docs/web-upload-root-evidence.md`.

Mantener `DIRECTORY_UPLOADS=/app/uploads` en EasyPanel y el volumen persistente accesible a node (UID/GID 1000). Publicar la imagen corregida y comprobar una carga ficticia manual; este cambio no mueve archivos previamente escritos en el destino erróneo ni garantiza compatibilidad del bootstrap con toda la carga web.

## Validación antes de desplegar la corrección

Ejecutar primero los tests existentes y capturar baseline. Escribir y ejecutar RED para incompatibilidades del bootstrap con el uploader y para destinos absoluto/relativo; implementar el mínimo y ejecutar GREEN. Probar una base nueva y otra con usuario/estudio/archivo ficticios existentes, conservando sus filas y sesiones. Verificar reejecución controlada, cuotas, familiar propio frente a ajeno y límites de campos. Probar subida web HTTP de PDF ficticio, registro en `estudios_archivos`, persistencia en volumen y lectura del mismo documento por iOS. No sustituir errores de DB por listas familiares vacías.

El responsable realiza backup y aplica la migración revisada únicamente sobre la base TEST confirmada; los agentes no ejecutan SQL en la VPS. Si `portfolio` contiene datos de otra aplicación, detener ese plan y corregir primero la selección de base mediante un plan de entorno revisado.
