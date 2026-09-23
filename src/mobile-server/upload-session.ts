import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { createHash } from "node:crypto";
import { AuthError } from "./auth.ts";
export async function assertUploadSession(
  connection: PoolConnection,
  token: string,
  owner: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT user_id,revoked,access_expires_at,expires_at FROM mobile_auth_sessions WHERE access_hash=? FOR UPDATE",
    [createHash("sha256").update(token).digest("hex")],
  );
  const session = rows[0];
  if (
    !session ||
    String(session.user_id) !== owner ||
    session.revoked ||
    session.access_expires_at <= Date.now() ||
    session.expires_at <= Date.now()
  )
    throw new AuthError();
}
