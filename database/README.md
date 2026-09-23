# Scripts de Base de Datos

## Instrucciones

Estos scripts SQL deben ejecutarse en tu base de datos MySQL para crear las tablas necesarias.

### Tablas disponibles

1. **familiares** - Almacena los miembros del grupo familiar
2. **estudios** - Almacena los estudios médicos subidos

### Cómo ejecutar los scripts

#### Opción 1: MySQL CLI

```bash
mysql -u tu_usuario -p tu_base_de_datos < database/create-familiares-table.sql
mysql -u tu_usuario -p tu_base_de_datos < database/create-estudios-table.sql
```

#### Opción 2: MySQL Workbench

1. Abre MySQL Workbench
2. Conectate a tu base de datos
3. Abre el archivo SQL (File > Open SQL Script)
4. Ejecuta el script (Query > Execute)

#### Opción 3: phpMyAdmin

1. Accede a phpMyAdmin
2. Selecciona tu base de datos
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido del archivo SQL
5. Click en "Go"

### Orden de ejecución

1. `create-familiares-table.sql` (si no existe)
2. `migrate-familiares-to-id.sql` (si es necesario migrar)
3. `create-estudios-table.sql` ⚠️ **NUEVO - Ejecutar este script**

### Nota importante sobre uploads

Los archivos subidos se guardan en `/app/uploads`. En producción, esta ruta debe ser
un volumen persistente del servicio (por ejemplo, un volumen de EasyPanel montado
en `/app/uploads`); de lo contrario, se perderán al recrear el contenedor durante
un deploy.

La carpeta de datos está excluida del repositorio Git por seguridad.
