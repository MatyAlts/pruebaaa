-- ============================================
-- Migración: Cambiar familiares.id_usuario de email a ID numérico
-- Descripción: Modifica la tabla familiares para usar users.id en lugar de users.email
-- ============================================

-- IMPORTANTE: Ejecutar estos comandos en orden

-- Paso 1: Eliminar la foreign key existente
ALTER TABLE familiares 
DROP FOREIGN KEY fk_familiares_usuario;

-- Paso 2: Crear columnas temporales para el nuevo ID y el email
ALTER TABLE familiares 
ADD COLUMN id_usuario_nuevo INT NULL AFTER id_usuario,
ADD COLUMN email_usuario VARCHAR(255) NULL AFTER id_usuario_nuevo;

-- Paso 3: Migrar los datos existentes (mapear emails a IDs y copiar emails)
UPDATE familiares f
INNER JOIN users u ON f.id_usuario = u.email
SET f.id_usuario_nuevo = u.id,
    f.email_usuario = u.email;

-- Paso 4: Eliminar la columna antigua
ALTER TABLE familiares 
DROP COLUMN id_usuario;

-- Paso 5: Renombrar la columna nueva y hacer NOT NULL el email
ALTER TABLE familiares 
CHANGE COLUMN id_usuario_nuevo id_usuario INT NOT NULL 
COMMENT 'ID del usuario propietario (foreign key a users.id)',
MODIFY COLUMN email_usuario VARCHAR(255) NOT NULL 
COMMENT 'Email del usuario propietario';

-- Paso 6: Agregar índices
ALTER TABLE familiares 
ADD INDEX idx_id_usuario (id_usuario),
ADD INDEX idx_email_usuario (email_usuario);

-- Paso 7: Crear la nueva foreign key
ALTER TABLE familiares 
ADD CONSTRAINT fk_familiares_usuario 
  FOREIGN KEY (id_usuario) 
  REFERENCES users(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- ============================================
-- Verificación
-- ============================================
-- Ver la estructura actualizada:
-- DESCRIBE familiares;

-- Ver las foreign keys:
-- SELECT 
--   CONSTRAINT_NAME,
--   TABLE_NAME,
--   COLUMN_NAME,
--   REFERENCED_TABLE_NAME,
--   REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_NAME = 'familiares' 
--   AND CONSTRAINT_NAME = 'fk_familiares_usuario';
