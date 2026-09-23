-- ONLY dedicated TEST; run the guarded migration script after backup/preflight.
-- Existing business rows remain; quota/width alignment is conditional in script.
CREATE TABLE mobile_study_uploads (
 id_usuario INT NOT NULL,
 operation_id CHAR(36) NOT NULL,
 fingerprint CHAR(64) NOT NULL,
 status VARCHAR(10) NOT NULL DEFAULT 'pending',
 manifest MEDIUMTEXT NOT NULL,
 study_id INT NULL,
 lease_token CHAR(36) NULL,
 lease_until BIGINT NOT NULL DEFAULT 0,
 next_attempt BIGINT NOT NULL DEFAULT 0,
 attempts INT NOT NULL DEFAULT 0,
 error_code VARCHAR(40) NULL,
 retryable TINYINT NOT NULL DEFAULT 1,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 PRIMARY KEY(id_usuario,operation_id),
 INDEX idx_upload_claim(status,next_attempt,lease_until),
 CONSTRAINT fk_upload_owner FOREIGN KEY(id_usuario) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
