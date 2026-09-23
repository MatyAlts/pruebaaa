-- Additive TEST migration only. Run family-schema preflight first; never run historical family migrations.
CREATE TABLE familiares (
 id INT AUTO_INCREMENT PRIMARY KEY,
 uuid CHAR(36) NOT NULL UNIQUE,
 id_usuario INT NOT NULL,
 email_usuario VARCHAR(255) NOT NULL,
 nombre VARCHAR(255) NOT NULL,
 fecha_nacimiento VARCHAR(10) NULL,
 created_at VARCHAR(20) NOT NULL,
 updated_at VARCHAR(20) NOT NULL,
 INDEX idx_family_owner(id_usuario,id),
 FOREIGN KEY(id_usuario) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE mobile_cleanup_operations (
 operation_id CHAR(36) PRIMARY KEY,
 id_usuario INT NOT NULL,
 status VARCHAR(10) NOT NULL DEFAULT 'pending',
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE mobile_cleanup_files (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 operation_id CHAR(36) NOT NULL,
 file_key VARCHAR(500) NOT NULL,
 status VARCHAR(10) NOT NULL DEFAULT 'pending',
 attempts INT NOT NULL DEFAULT 0,
 next_attempt BIGINT NOT NULL DEFAULT 0,
 lease_until BIGINT NOT NULL DEFAULT 0,
 lease_token CHAR(36) NULL,
 UNIQUE KEY idx_operation_file(operation_id,file_key),
 INDEX idx_cleanup_claim(status,next_attempt,lease_until),
 FOREIGN KEY(operation_id) REFERENCES mobile_cleanup_operations(operation_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
