import type {
  AuthStore,
  AuthTransaction,
  Identity,
  LoginRequest,
  MobileSession,
  RefreshGeneration,
} from "./auth.ts";

interface SqlConnection {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
  execute(sql: string, params?: unknown[]): Promise<unknown>;
}
interface SqlPool {
  getConnection(): Promise<SqlConnection>;
}
type Row = Record<string, unknown>;
export class MysqlAuthStore implements AuthStore {
  private pool: SqlPool;
  constructor(pool: SqlPool) {
    this.pool = pool;
  }
  async transaction<T>(
    operation: (tx: AuthTransaction) => Promise<T>,
  ): Promise<T> {
    const connection = await this.pool.getConnection();
    const rows = async (sql: string, params: unknown[]) =>
      ((await connection.execute(sql, params)) as [Row[], unknown])[0];
    const sessionFrom = (r: Row | undefined): MobileSession | null =>
      r
        ? {
            id: String(r.id),
            userId: String(r.user_id),
            accessHash: String(r.access_hash),
            accessExpiresAt: Number(r.access_expires_at),
            expiresAt: Number(r.expires_at),
            revoked: Boolean(r.revoked),
          }
        : null;
    const requestFrom = (r: Row | undefined): LoginRequest | null =>
      r
        ? JSON.parse(
            typeof r.payload === "string"
              ? r.payload
              : JSON.stringify(r.payload),
          )
        : null;
    const tx: AuthTransaction = {
      request: async (id) =>
        requestFrom(
          (
            await rows(
              "SELECT payload FROM mobile_auth_requests WHERE id = ? FOR UPDATE",
              [id],
            )
          )[0],
        ),
      code: async (hash) =>
        requestFrom(
          (
            await rows(
              "SELECT payload FROM mobile_auth_requests WHERE code_hash = ? FOR UPDATE",
              [hash],
            )
          )[0],
        ),
      saveRequest: async (r) => {
        await connection.execute(
          "INSERT INTO mobile_auth_requests (id, code_hash, expires_at, payload) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash), expires_at = VALUES(expires_at), payload = VALUES(payload)",
          [r.id, r.codeHash, r.expiresAt, JSON.stringify(r)],
        );
      },
      session: async (id) =>
        sessionFrom(
          (
            await rows(
              "SELECT user_id, id, access_hash, access_expires_at, expires_at, revoked FROM mobile_auth_sessions WHERE id = ? FOR UPDATE",
              [id],
            )
          )[0],
        ),
      access: async (hash) =>
        sessionFrom(
          (
            await rows(
              "SELECT user_id, id, access_hash, access_expires_at, expires_at, revoked FROM mobile_auth_sessions WHERE access_hash = ? FOR UPDATE",
              [hash],
            )
          )[0],
        ),
      saveSession: async (s) => {
        await connection.execute(
          "INSERT INTO mobile_auth_sessions (id, user_id, access_hash, access_expires_at, expires_at, revoked) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_hash = VALUES(access_hash), access_expires_at = VALUES(access_expires_at), revoked = VALUES(revoked)",
          [
            s.id,
            s.userId,
            s.accessHash,
            s.accessExpiresAt,
            s.expiresAt,
            s.revoked,
          ],
        );
      },
      refresh: async (hash) => {
        const r = (
          await rows(
            "SELECT token_hash, session_id, used FROM mobile_auth_refresh WHERE token_hash = ? FOR UPDATE",
            [hash],
          )
        )[0];
        return r
          ? {
              hash: String(r.token_hash),
              sessionId: String(r.session_id),
              used: Boolean(r.used),
            }
          : null;
      },
      saveRefresh: async (r: RefreshGeneration) => {
        await connection.execute(
          "INSERT INTO mobile_auth_refresh (token_hash, session_id, used) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE used = VALUES(used)",
          [r.hash, r.sessionId, r.used],
        );
      },
      user: async (id) => {
        const r = (
          await rows("SELECT id, name, email, image FROM users WHERE id = ?", [
            id,
          ])
        )[0];
        return r
          ? ({
              id: String(r.id),
              name: r.name === null ? null : String(r.name),
              email: String(r.email),
              image: r.image === null ? null : String(r.image),
            } satisfies Identity)
          : null;
      },
      rate: async (key, now, maximum) => {
        await connection.execute(
          "INSERT IGNORE INTO mobile_auth_rates (rate_key, attempts, expires_at) VALUES (?, 0, ?)",
          [key, now + 60000],
        );
        const r = (
          await rows(
            "SELECT attempts, expires_at FROM mobile_auth_rates WHERE rate_key = ? FOR UPDATE",
            [key],
          )
        )[0];
        const expired = Number(r.expires_at) <= now;
        const attempts = expired ? 1 : Number(r.attempts) + 1;
        await connection.execute(
          "UPDATE mobile_auth_rates SET attempts = ?, expires_at = ? WHERE rate_key = ?",
          [attempts, expired ? now + 60000 : Number(r.expires_at), key],
        );
        return attempts <= maximum;
      },
    };
    try {
      await connection.beginTransaction();
      const result = await operation(tx);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
