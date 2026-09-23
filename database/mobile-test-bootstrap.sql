-- ONLY fresh dedicated TEST database. No production import, no medical data.
-- CREATE without IF NOT EXISTS intentionally refuses existing business tables.
-- Supports Google identity + mobile read vertical, not full web feature parity.
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  given_name VARCHAR(255) NULL,
  family_name VARCHAR(255) NULL,
  image TEXT NULL,
  locale VARCHAR(20) NULL,
  updated_at VARCHAR(20) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE estudios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(100) NOT NULL UNIQUE,
  id_usuario INT NOT NULL,
  email_usuario VARCHAR(255) NOT NULL,
  id_familiar INT NULL,
  titulo VARCHAR(255) NULL,
  fecha VARCHAR(20) NOT NULL,
  institucion VARCHAR(255) NULL,
  medico VARCHAR(255) NULL,
  conclusion TEXT NULL,
  descripcion TEXT NULL,
  created_at VARCHAR(20) NULL,
  updated_at VARCHAR(20) NULL,
  file_key VARCHAR(500) NULL,
  file_name VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  file_size BIGINT NULL,
  INDEX idx_mobile_owner (id_usuario,id_familiar,id),
  FOREIGN KEY (id_usuario) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE estudios_archivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_estudio INT NOT NULL,
  file_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at VARCHAR(20) NULL,
  FOREIGN KEY (id_estudio) REFERENCES estudios(id) ON DELETE CASCADE,
  INDEX idx_estudio (id_estudio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
