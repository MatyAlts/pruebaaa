-- ============================================
-- Tabla: links
-- Descripción: Almacena los links compartidos generados por los usuarios
-- ============================================

-- Eliminar la tabla si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS links;

-- Crear tabla links
CREATE TABLE links (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del link',
  id_usuario INT NOT NULL COMMENT 'ID del usuario propietario (foreign key a users.id)',
  id_estudio INT NOT NULL COMMENT 'ID del estudio compartido (foreign key a estudios.id)',
  nombre_medico VARCHAR(255) DEFAULT '' COMMENT 'Nombre del médico (opcional)',
  uuid VARCHAR(500) NOT NULL UNIQUE COMMENT 'UUID único generado (uuid + timestamp con guiones)',
  created_at VARCHAR(20) NOT NULL COMMENT 'Fecha de creación en formato DD-MM-YYYY HH:mm',
  fecha_abierto VARCHAR(20) DEFAULT '' COMMENT 'Fecha del primer acceso al link (vacío si no se ha abierto)',
  
  INDEX idx_id_usuario (id_usuario),
  INDEX idx_id_estudio (id_estudio),
  INDEX idx_uuid (uuid),
  
  CONSTRAINT fk_links_usuario 
    FOREIGN KEY (id_usuario) 
    REFERENCES users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT fk_links_estudio 
    FOREIGN KEY (id_estudio) 
    REFERENCES estudios(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Notas de implementación:
-- ============================================
-- 1. id: ID autoincremental
-- 2. id_usuario: Almacena el ID numérico del usuario (session.user.userId)
-- 3. id_estudio: Almacena el ID del estudio que se está compartiendo
-- 4. nombre_medico: Campo opcional para el nombre del médico
-- 5. uuid: Campo único generado con uuid + timestamp con guiones
-- 6. created_at: Fecha de creación usando dateNowWithMinutes()
-- 7. fecha_abierto: Vacío por defecto, se llena cuando el link se abre por primera vez
-- 8. ON DELETE CASCADE: Si se elimina el usuario o el estudio, se eliminan sus links
-- 9. ON UPDATE CASCADE: Si se actualiza el ID del usuario o estudio, se actualiza en links

-- ============================================
-- Ejemplos de consultas útiles:
-- ============================================

-- Ver todos los links de un usuario
-- SELECT * FROM links WHERE id_usuario = 1;

-- Buscar un link por UUID
-- SELECT * FROM links WHERE uuid = 'uuid-generado';

-- Ver links no abiertos
-- SELECT * FROM links WHERE fecha_abierto = '';

-- Contar links por usuario
-- SELECT id_usuario, COUNT(*) as total_links 
-- FROM links 
-- GROUP BY id_usuario;
