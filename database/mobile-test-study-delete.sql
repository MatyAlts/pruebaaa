-- Manual TEST migration. Existing tables are refused; no business data is changed.
CREATE TABLE mobile_study_deletions (
 operation_id CHAR(36) NOT NULL, id_usuario INT NOT NULL, study_id INT NOT NULL,
 status VARCHAR(12) NOT NULL, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL,
 PRIMARY KEY(operation_id), UNIQUE KEY idx_delete_owner(id_usuario,operation_id),
 FOREIGN KEY(id_usuario) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE mobile_study_delete_files (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,operation_id CHAR(36) NOT NULL,file_key VARCHAR(500) NOT NULL,
 status VARCHAR(10) NOT NULL DEFAULT 'pending',attempts INT NOT NULL DEFAULT 0,
 next_attempt BIGINT NOT NULL DEFAULT 0,lease_until BIGINT NOT NULL DEFAULT 0,lease_token CHAR(36) NULL,
 UNIQUE KEY idx_delete_file(operation_id,file_key), KEY idx_delete_claim(status,next_attempt,lease_until),
 FOREIGN KEY(operation_id) REFERENCES mobile_study_deletions(operation_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
