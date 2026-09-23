-- ============================================
-- Tabla: familiares
-- Descripción: Almacena los miembros de la familia del usuario
-- ============================================

-- Eliminar la tabla si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS familiares;

-- Crear tabla familiares
CREATE TABLE familiares (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del familiar',
  id_usuario INT NOT NULL COMMENT 'ID del usuario propietario (foreign key a users.id)',
  email_usuario VARCHAR(255) NOT NULL COMMENT 'Email del usuario propietario',
  nombre VARCHAR(255) NOT NULL COMMENT 'Nombre completo del familiar',
  fecha_nacimiento DATE NULL COMMENT 'Fecha de nacimiento del familiar (opcional)',
  created_at VARCHAR(20) NOT NULL COMMENT 'Fecha de creación en formato DD-MM-YYYY HH:mm',
  updated_at VARCHAR(20) NOT NULL COMMENT 'Fecha de última actualización en formato DD-MM-YYYY HH:mm',
  
  INDEX idx_id_usuario (id_usuario),
  INDEX idx_email_usuario (email_usuario),
  
  CONSTRAINT fk_familiares_usuario 
    FOREIGN KEY (id_usuario) 
    REFERENCES users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Notas de implementación:
-- ============================================
-- 1. id_usuario: Almacena el ID numérico del usuario (session.user.userId)
-- 2. email_usuario: Almacena el email del usuario (session.user.email) para consultas rápidas
-- 3. nombre: Campo obligatorio
-- 4. fecha_nacimiento: Campo opcional para calcular la edad
-- 5. created_at/updated_at: Usan formato DD-MM-YYYY HH:mm (moment.js)
-- 6. ON DELETE CASCADE: Si se elimina el usuario, se eliminan sus familiares
-- 7. ON UPDATE CASCADE: Si se actualiza el ID del usuario, se actualiza en familiares

-- ============================================
-- Ejemplos de consultas útiles:
-- ============================================

-- Ver todos los familiares de un usuario (por ID)
-- SELECT * FROM familiares WHERE id_usuario = 1;

-- Ver todos los familiares de un usuario (por email)
-- SELECT * FROM familiares WHERE email_usuario = 'usuario@example.com';

-- Contar familiares por usuario
-- SELECT id_usuario, email_usuario, COUNT(*) as total_familiares 
-- FROM familiares 
-- GROUP BY id_usuario, email_usuario;

-- Calcular edad de un familiar (si tiene fecha_nacimiento)
-- SELECT 
--   id, 
--   nombre, 
--   fecha_nacimiento,
--   TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) AS edad
-- FROM familiares 
-- WHERE fecha_nacimiento IS NOT NULL;
