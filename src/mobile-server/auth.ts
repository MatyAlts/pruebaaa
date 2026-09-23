import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export class AuthError extends Error {
  status: number;
  code: string;
  constructor(status = 401, code = "UNAUTHORIZED") {
    super(code);
    this.status = status;
    this.code = code;
  }
}
export type Identity = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};
export type LoginRequest = {
  id: string;
  challenge: string;
  state: string;
  redirect: string;
  expiresAt: number;
  csrfHash: string | null;
  codeHash: string | null;
  codeExpiresAt: number | null;
  userId: string | null;
  consumed: boolean;
};
export type MobileSession = {
  id: string;
  userId: string;
  accessHash: string;
  accessExpiresAt: number;
  expiresAt: number;
  revoked: boolean;
};
export type RefreshGeneration = {
  hash: string;
  sessionId: string;
  used: boolean;
};
export interface AuthTransaction {
  request(id: string): Promise<LoginRequest | null>;
  saveRequest(request: LoginRequest): Promise<void>;
  session(id: string): Promise<MobileSession | null>;
  access(hash: string): Promise<MobileSession | null>;
  saveSession(session: MobileSession): Promise<void>;
  refresh(hash: string): Promise<RefreshGeneration | null>;
  saveRefresh(refresh: RefreshGeneration): Promise<void>;
  user(id: string): Promise<Identity | null>;
  rate(key: string, now: number, maximum: number): Promise<boolean>;
  code?(hash: string): Promise<LoginRequest | null>;
}
export interface AuthStore {
  transaction<T>(operation: (tx: AuthTransaction) => Promise<T>): Promise<T>;
}
type Settings = {
  origin: string;
  redirect: string;
  allowExpoGo?: boolean;
  attemptMs?: number;
  codeMs?: number;
  accessMs?: number;
  sessionMs?: number;
};
export type TokenGrant = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionExpiresAt: string;
};
export const hashToken = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const random = () => randomBytes(32).toString("base64url");
const equal = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
export class MobileAuth {
  private store: AuthStore;
  private settings: Settings;
  private clock: () => number;
  private redirectAllowed(value: string) {
    if (value === this.settings.redirect) return true;
    if (!this.settings.allowExpoGo) return false;
    try {
      const parsed = new URL(value);
      return (
        parsed.protocol === "exp:" &&
        Boolean(parsed.hostname) &&
        parsed.pathname === "/--/auth/callback" &&
        !parsed.username &&
        !parsed.password &&
        !parsed.search &&
        !parsed.hash
      );
    } catch {
      return false;
    }
  }
  constructor(store: AuthStore, settings: Settings, clock = Date.now) {
    const origin = new URL(settings.origin);
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== "/"
    )
      throw new Error("MOBILE_ORIGIN must be an HTTPS origin");
    this.store = store;
    this.settings = {
      attemptMs: 300000,
      codeMs: 60000,
      accessMs: 900000,
      sessionMs: 604800000,
      ...settings,
      origin: origin.origin,
    };
    this.clock = clock;
  }
  private async throttle(action: string, ip: string) {
    const allowed = await this.store.transaction((tx) =>
      tx.rate(hashToken(action + ":" + ip), this.clock(), 10),
    );
    if (!allowed) throw new AuthError(429, "RATE_LIMITED");
  }
  async createRequest(
    input: { challenge: string; state: string; redirect: string },
    ip: string,
  ) {
    if (
      !/^[A-Za-z0-9_-]{43}$/.test(input.challenge) ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(input.state) ||
      !this.redirectAllowed(input.redirect)
    )
      throw new AuthError(400, "INVALID_REQUEST");
    await this.throttle("request", ip);
    return this.store.transaction(async (tx) => {
      const id = random();
      await tx.saveRequest({
        id,
        ...input,
        expiresAt: this.clock() + this.settings.attemptMs!,
        csrfHash: null,
        codeHash: null,
        codeExpiresAt: null,
        userId: null,
        consumed: false,
      });
      return {
        requestId: id,
        authorizationUrl: `${this.settings.origin}/mobile/authorize?requestId=${encodeURIComponent(id)}`,
      };
    });
  }
  async bindBrowser(id: string) {
    return this.store.transaction(async (tx) => {
      const request = await tx.request(id);
      if (
        !request ||
        request.expiresAt <= this.clock() ||
        request.consumed ||
        request.codeHash
      )
        throw new AuthError(400, "INVALID_REQUEST");
      const csrf = random();
      await tx.saveRequest({ ...request, csrfHash: hashToken(csrf) });
      return csrf;
    });
  }
  async approve(id: string, userId: string, form: string, cookie: string) {
    return this.store.transaction(async (tx) => {
      const request = await tx.request(id);
      if (
        !request ||
        request.expiresAt <= this.clock() ||
        request.codeHash ||
        request.consumed ||
        !form ||
        !equal(form, cookie) ||
        !request.csrfHash ||
        !equal(hashToken(form), request.csrfHash)
      )
        throw new AuthError(400, "INVALID_REQUEST");
      if (!(await tx.user(userId))) throw new AuthError();
      const code = random();
      await tx.saveRequest({
        ...request,
        userId,
        codeHash: hashToken(code),
        codeExpiresAt: this.clock() + this.settings.codeMs!,
      });
      const callback = new URL(request.redirect);
      callback.searchParams.set("code", code);
      callback.searchParams.set("state", request.state);
      return callback.toString();
    });
  }
  async exchange(
    input: { code: string; verifier: string; state: string; redirect: string },
    ip: string,
  ): Promise<TokenGrant> {
    if (
      !/^[A-Za-z0-9_-]{43}$/.test(input.code) ||
      !/^[A-Za-z0-9._~-]{43,128}$/.test(input.verifier)
    )
      throw new AuthError(400, "INVALID_GRANT");
    await this.throttle("token", ip);
    return this.store.transaction(async (tx) => {
      const request = await tx.code?.(hashToken(input.code));
      if (
        !request ||
        request.consumed ||
        !request.codeExpiresAt ||
        request.codeExpiresAt <= this.clock() ||
        !request.userId ||
        request.state !== input.state ||
        !this.redirectAllowed(input.redirect) ||
        request.redirect !== input.redirect ||
        request.challenge !==
          createHash("sha256").update(input.verifier).digest("base64url")
      )
        throw new AuthError(400, "INVALID_GRANT");
      if (!(await tx.user(request.userId)))
        throw new AuthError(400, "INVALID_GRANT");
      await tx.saveRequest({ ...request, consumed: true });
      const session: MobileSession = {
        id: random(),
        userId: request.userId,
        accessHash: "",
        accessExpiresAt: 0,
        expiresAt: this.clock() + this.settings.sessionMs!,
        revoked: false,
      };
      return this.issue(tx, session);
    });
  }
  private async issue(
    tx: AuthTransaction,
    session: MobileSession,
  ): Promise<TokenGrant> {
    const accessToken = random();
    const refreshToken = random();
    await tx.saveSession({
      ...session,
      accessHash: hashToken(accessToken),
      accessExpiresAt: this.clock() + this.settings.accessMs!,
    });
    await tx.saveRefresh({
      hash: hashToken(refreshToken),
      sessionId: session.id,
      used: false,
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.settings.accessMs! / 1000,
      sessionExpiresAt: new Date(session.expiresAt).toISOString(),
    };
  }
  async identity(accessToken: string) {
    return this.store.transaction(async (tx) => {
      const session = await tx.access(hashToken(accessToken));
      if (
        !session ||
        session.revoked ||
        session.expiresAt <= this.clock() ||
        session.accessExpiresAt <= this.clock()
      )
        throw new AuthError();
      const user = await tx.user(session.userId);
      if (!user) throw new AuthError();
      return user;
    });
  }
  async renew(refreshToken: string, ip: string): Promise<TokenGrant> {
    await this.throttle("refresh", ip);
    const result = await this.store.transaction(async (tx) => {
      const generation = await tx.refresh(hashToken(refreshToken));
      if (!generation) return null;
      const session = await tx.session(generation.sessionId);
      if (!session || session.revoked || session.expiresAt <= this.clock())
        return null;
      if (generation.used) {
        await tx.saveSession({ ...session, revoked: true });
        return null;
      }
      await tx.saveRefresh({ ...generation, used: true });
      return this.issue(tx, session);
    });
    // Throw after the transaction commits: replay revocation must not roll back.
    if (!result) throw new AuthError();
    return result;
  }
  async logout(accessToken?: string, refreshToken?: string) {
    await this.store.transaction(async (tx) => {
      let session = accessToken
        ? await tx.access(hashToken(accessToken))
        : null;
      if (!session && refreshToken) {
        const generation = await tx.refresh(hashToken(refreshToken));
        if (generation) session = await tx.session(generation.sessionId);
      }
      if (session) await tx.saveSession({ ...session, revoked: true });
    });
  }
}
