-- 1. Create the new table for multiple files
CREATE TABLE IF NOT EXISTS estudios_archivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_estudio INT NOT NULL,
  file_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_estudio) REFERENCES estudios(id) ON DELETE CASCADE,
  INDEX idx_estudio (id_estudio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Migrate existing files from estudios to estudios_archivos
-- Only migrate if file_key is not null/empty and the record doesn't already exist in estudios_archivos
INSERT INTO estudios_archivos (id_estudio, file_key, file_name, mime_type, file_size, created_at)
SELECT id, file_key, file_name, mime_type, file_size, created_at
FROM estudios
WHERE file_key IS NOT NULL AND file_key != '' 
  AND NOT EXISTS (
    SELECT 1 FROM estudios_archivos WHERE estudios_archivos.id_estudio = estudios.id
  );

-- 3. Drop columns from estudios (Uncomment and run manually after verifying the migration was successful!)
-- ALTER TABLE estudios
-- DROP COLUMN file_key,
-- DROP COLUMN file_name,
-- DROP COLUMN mime_type,
-- DROP COLUMN file_size;
