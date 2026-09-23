-- Stores only operational metadata. Never OCR text or clinical suggestions.
CREATE TABLE mobile_study_analyses (
 id_usuario INT NOT NULL,request_id CHAR(36) NOT NULL,quota_day VARCHAR(10) NOT NULL,
 status VARCHAR(12) NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,
 PRIMARY KEY(id_usuario,request_id),KEY idx_analysis_reservation(id_usuario,quota_day,status),
 FOREIGN KEY(id_usuario) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
