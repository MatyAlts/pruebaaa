-- ============================================
-- Actualización de tabla: links
-- Descripción: Agregar campo id_estudio
-- ============================================

-- Agregar la columna id_estudio a la tabla links
ALTER TABLE links
ADD COLUMN id_estudio INT NOT NULL COMMENT 'ID del estudio compartido (foreign key a estudios.id)' AFTER id_usuario;

-- Crear índice para mejorar las búsquedas por id_estudio
CREATE INDEX idx_id_estudio ON links(id_estudio);

-- Agregar foreign key constraint
ALTER TABLE links
ADD CONSTRAINT fk_links_estudio 
  FOREIGN KEY (id_estudio) 
  REFERENCES estudios(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- ============================================
-- Verificar cambios:
-- ============================================
-- DESCRIBE links;
