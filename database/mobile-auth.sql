-- Additive migration. Review/apply only on the approved isolated test backend.
-- user_id intentionally follows the existing users.id INT schema.
CREATE TABLE IF NOT EXISTS mobile_auth_requests (
  id VARCHAR(43) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  code_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin UNIQUE,
  expires_at BIGINT NOT NULL,
  payload JSON NOT NULL,
  INDEX mobile_request_expiry (expires_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS mobile_auth_sessions (
  id VARCHAR(43) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id INT NOT NULL,
  access_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  access_expires_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX mobile_session_expiry (expires_at),
  CONSTRAINT mobile_session_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS mobile_auth_refresh (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  session_id VARCHAR(43) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT mobile_refresh_session FOREIGN KEY (session_id) REFERENCES mobile_auth_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS mobile_auth_rates (
  rate_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  attempts INT NOT NULL,
  expires_at BIGINT NOT NULL,
  INDEX mobile_rate_expiry (expires_at)
) ENGINE=InnoDB;
-- Operational cleanup (retain refresh history until absolute family expiry):
-- DELETE FROM mobile_auth_requests WHERE expires_at < UNIX_TIMESTAMP(NOW(3)) * 1000;
-- DELETE FROM mobile_auth_sessions WHERE expires_at < UNIX_TIMESTAMP(NOW(3)) * 1000;
-- DELETE FROM mobile_auth_rates WHERE expires_at < UNIX_TIMESTAMP(NOW(3)) * 1000;
-- Rollback disables mobile endpoints/revokes sessions; never drop users/studies.
