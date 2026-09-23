export type User = {
  id: string;
  name: string | null;
  email?: string;
  image?: string | null;
};
export type SessionState = {
  user: User | null;
  busy: boolean;
  message: string | null;
};
export class SessionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
export type ClientAdapters = {
  fetch: typeof fetch;
  storage: {
    get(): Promise<string | null>;
    set(value: string): Promise<void>;
    remove(): Promise<void>;
  };
  browser(
    url: string,
    redirect: string,
  ): Promise<{ type: string; url?: string }>;
  proof(): Promise<{ state: string; verifier: string; challenge: string }>;
  cleanup(): Promise<void>;
};
export function apiOrigin(value: string) {
  const parsed = new URL(value);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  )
    throw new SessionError(
      "CONFIG",
      "El servicio de Mi Saluteca no está configurado.",
    );
  return parsed.origin;
}
export const MOBILE_REDIRECT = "com.matyalts.misaluteca://auth/callback";
export function validMobileRedirect(value: string) {
  const parsed = new URL(value);
  return (
    (parsed.href === MOBILE_REDIRECT ||
      (parsed.protocol === "exp:" &&
        Boolean(parsed.hostname) &&
        parsed.pathname === "/--/auth/callback")) &&
    !parsed.username &&
    !parsed.password &&
    !parsed.search &&
    !parsed.hash
  );
}
type Grant = { accessToken: string; refreshToken: string };
export type UploadTransport = (request: { url: string; token: string; key: string; body: FormData; signal: AbortSignal; progress: (fraction: number) => void }) => Promise<{ status: number; value: unknown }>;
export class MobileClient {
  state: SessionState = { user: null, busy: false, message: null };
  private origin: string;
  private adapters: ClientAdapters;
  private access: string | null = null;
  private generation = 0;
  private renewal: Promise<void> | null = null;
  private restoring: Promise<void> | null = null;
  private closing = false;
  private storageMutations: Promise<void> = Promise.resolve();
  private listeners = new Set<() => void>();
  private redirect: string;
  constructor(origin: string, adapters: ClientAdapters, redirect = MOBILE_REDIRECT) {
    this.origin = apiOrigin(origin);
    if (!validMobileRedirect(redirect))
      throw new SessionError("CONFIG", "Redirect de Mi Saluteca inválido.");
    this.redirect = redirect;
    this.adapters = adapters;
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private update(change: Partial<SessionState>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach((listener) => listener());
  }
  private async response(
    path: string,
    method = "GET",
    body?: unknown,
    token?: string | null,
  ) {
    let result: Response;
    try {
      result = await this.adapters.fetch(
        `${this.origin}/api/mobile/v1${path}`,
        {
          method,
          credentials: "omit",
          redirect: "error",
          headers: {
            ...(body !== undefined
              ? { "Content-Type": "application/json" }
              : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        },
      );
    } catch {
      throw new SessionError(
        "NETWORK",
        "No hay conexión con Mi Saluteca. Volvé a intentar.",
      );
    }
    if (result.url && new URL(result.url).origin !== this.origin)
      throw new SessionError(
        "NETWORK",
        "El servidor respondió desde un origen no permitido.",
      );
    if (!result.ok) {
      let message = "No se pudo completar la operación.";
      try {
        const parsed = await result.json();
        if (typeof parsed.error?.message === "string")
          message = parsed.error.message;
      } catch {}
      throw new SessionError(
        result.status === 401 ? "UNAUTHORIZED" : String(result.status),
        message,
      );
    }
    return result;
  }
  private async saveGrant(grant: Grant, generation: number) {
    if (this.generation !== generation)
      throw new SessionError("CANCELLED", "Sesión cerrada.");
    if (
      typeof grant.accessToken !== "string" ||
      typeof grant.refreshToken !== "string"
    )
      throw new SessionError(
        "INVALID_RESPONSE",
        "Respuesta inválida del servidor.",
      );
    await this.mutateStorage(async () => {
      if (this.generation !== generation)
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      await this.adapters.storage.set(grant.refreshToken);
      if (this.generation !== generation) {
        await this.adapters.storage.remove();
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      }
    });
    if (this.generation !== generation) {
      throw new SessionError("CANCELLED", "Sesión cerrada.");
    }
    this.access = grant.accessToken;
  }
  private mutateStorage(operation: () => Promise<void>) {
    const pending = this.storageMutations.then(operation);
    this.storageMutations = pending.catch(() => {});
    return pending;
  }
  private async clear() {
    this.generation++;
    this.access = null;
    this.update({ user: null, busy: false });
    await this.mutateStorage(() => this.adapters.storage.remove());
    await this.adapters.cleanup();
  }
  async login() {
    if (this.closing) return;
    const generation = this.generation;
    this.update({ busy: true, message: null });
    try {
      const proof = await this.adapters.proof();
      const attempt = await (
        await this.response("/auth/requests", "POST", {
          challenge: proof.challenge,
          state: proof.state,
          redirect: this.redirect,
        })
      ).json();
      if (new URL(attempt.authorizationUrl).origin !== this.origin)
        throw new SessionError(
          "INVALID_RESPONSE",
          "Origen de autorización inválido.",
        );
      const result = await this.adapters.browser(
        attempt.authorizationUrl,
        this.redirect,
      );
      if (result.type !== "success" || !result.url) {
        if (generation === this.generation) this.update({ busy: false });
        return;
      }
      const callback = new URL(result.url);
      if (
        callback.protocol !== new URL(this.redirect).protocol ||
        callback.host !== new URL(this.redirect).host ||
        !!callback.username ||
        !!callback.password ||
        !!callback.hash ||
        callback.pathname !== new URL(this.redirect).pathname ||
        callback.searchParams.get("state") !== proof.state ||
        !callback.searchParams.get("code")
      )
        throw new SessionError(
          "INVALID_CALLBACK",
          "No se pudo confirmar el inicio de sesión.",
        );
      const grant = await (
        await this.response("/auth/token", "POST", {
          code: callback.searchParams.get("code"),
          state: proof.state,
          verifier: proof.verifier,
          redirect: this.redirect,
        })
      ).json();
      await this.saveGrant(grant, generation);
      const identity = await this.get<{ user: User }>("/me");
      if (generation !== this.generation)
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      this.update({ user: identity.user, busy: false });
    } catch (error) {
      if (generation !== this.generation) return;
      await this.clear();
      this.update({
        message:
          error instanceof Error ? error.message : "No se pudo iniciar sesión.",
      });
    }
  }
  private async renew() {
    if (this.renewal) return this.renewal;
    const generation = this.generation;
    this.renewal = (async () => {
      const token = await this.adapters.storage.get();
      if (!token)
        throw new SessionError("UNAUTHORIZED", "Iniciá sesión nuevamente.");
      try {
        const grant = await (
          await this.response("/auth/refresh", "POST", { refreshToken: token })
        ).json();
        await this.saveGrant(grant, generation);
      } catch (error) {
        if (
          generation === this.generation &&
          error instanceof SessionError &&
          (error.code === "UNAUTHORIZED" || error.code === "NETWORK")
        )
          await this.clear();
        throw error;
      }
    })();
    try {
      await this.renewal;
    } finally {
      this.renewal = null;
    }
  }
  async restore() {
    if (this.closing) return;
    if (this.restoring) return this.restoring;
    const generation = this.generation;
    this.restoring = (async () => {
      this.update({ busy: true });
      try {
        await this.adapters.cleanup();
        const stored = await this.adapters.storage.get();
        if (generation !== this.generation) return;
        if (!stored) {
          this.update({ busy: false });
          return;
        }
        await this.renew();
        if (generation !== this.generation) return;
        const result = await this.get<{ user: User }>("/me");
        if (generation !== this.generation) return;
        this.update({ user: result.user, busy: false });
      } catch (error) {
        if (generation === this.generation)
          this.update({
            busy: false,
            message:
              error instanceof Error
                ? error.message
                : "No se pudo recuperar la sesión.",
          });
      }
    })();
    try {
      await this.restoring;
    } finally {
      this.restoring = null;
    }
  }
  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, "GET");
  }
  async upload<T>(key: string, body: () => FormData, transport: UploadTransport, signal: AbortSignal, progress: (fraction: number) => void): Promise<T> {
    const generation = this.generation;
    const guard = () => {
      if (this.closing || generation !== this.generation || signal.aborted) throw new SessionError("CANCELLED", "La carga fue interrumpida. Verificá su estado antes de volver a intentar.");
    };
    guard();
    if (!this.access) await this.renew();
    const send = async () => {
      guard();
      return transport({ url: `${this.origin}/api/mobile/v1/studies`, token: this.access!, key, body: body(), signal, progress: (fraction) => { if (generation === this.generation && !signal.aborted) progress(fraction); } });
    };
    const used = this.access;
    let result = await send();
    guard();
    if (result.status === 401) {
      if (this.access === used) await this.renew();
      result = await send();
      guard();
    }
    if (result.status < 200 || result.status >= 300) {
      const value = result.value as { error?: { message?: string } };
      throw new SessionError(result.status === 401 ? "UNAUTHORIZED" : String(result.status), value?.error?.message || "No se pudo completar la carga.");
    }
    return result.value as T;
  }
  async write<T>(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown): Promise<T> {
    return this.request<T>(path, method, body);
  }
  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    if (this.closing) throw new SessionError("CANCELLED", "Sesión cerrada.");
    const generation = this.generation;
    const used = this.access;
    if (!used) await this.renew();
    let response: Response;
    try {
      response = await this.response(path, method, body, this.access);
    } catch (error) {
      if (!(error instanceof SessionError) || error.code !== "UNAUTHORIZED")
        throw error;
      if (generation !== this.generation)
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      if (this.access === used) await this.renew();
      response = await this.response(path, method, body, this.access);
    }
    const value = await response.json();
    if (generation !== this.generation)
      throw new SessionError("CANCELLED", "Sesión cerrada.");
    return value as T;
  }
  download(path: string) { return this.downloadAttachment(path, "application/pdf"); }
  async downloadAttachment(path: string, mime: string) {
    if (!["application/pdf", "image/jpeg", "image/png"].includes(mime)) throw new SessionError("UNSUPPORTED_FILE", "Formato no disponible.");
    if (this.closing) throw new SessionError("CANCELLED", "Sesión cerrada.");
    const generation = this.generation;
    const used = this.access;
    let response: Response;
    try {
      response = await this.response(path, "GET", undefined, this.access);
    } catch (error) {
      if (!(error instanceof SessionError) || error.code !== "UNAUTHORIZED")
        throw error;
      if (this.access === used) await this.renew();
      response = await this.response(path, "GET", undefined, this.access);
    }
    if (
      response.headers.get("content-type")?.split(";")[0] !== mime
    )
      throw new SessionError(
        "UNSUPPORTED_FILE",
        "Este archivo todavía no se puede abrir.",
      );
    if (Number(response.headers.get("content-length")) > 10 * 1024 * 1024)
      throw new SessionError("FILE_TOO_LARGE", "El archivo supera 10 MB.");
    const reader = response.body?.getReader();
    if (!reader)
      throw new SessionError("NETWORK", "No se pudo leer el documento.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (generation !== this.generation)
          throw new SessionError("CANCELLED", "Sesión cerrada.");
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 10 * 1024 * 1024)
          throw new SessionError("FILE_TOO_LARGE", "El archivo supera 10 MB.");
        chunks.push(chunk.value);
      }
    } catch (error) {
      await reader.cancel();
      throw error;
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    if (
      bytes.byteLength > 10 * 1024 * 1024 ||
      !(mime === "application/pdf" ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-" : mime === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : [137,80,78,71,13,10,26,10].every((byte, i) => bytes[i] === byte))
    )
      throw new SessionError(
        "UNSUPPORTED_FILE",
        "El archivo no es un PDF válido.",
      );
    if (generation !== this.generation)
      throw new SessionError("CANCELLED", "Sesión cerrada.");
    return bytes;
  }
  async logout() {
    if (this.closing) return { remoteConfirmed: false };
    this.closing = true;
    const access = this.access;
    this.generation++;
    this.access = null;
    this.update({ user: null, busy: true });
    const refreshToken = await this.adapters.storage.get();
    await this.mutateStorage(() => this.adapters.storage.remove());
    await this.adapters.cleanup();
    let remoteConfirmed = false;
    try {
      await this.response("/auth/logout", "POST", { refreshToken }, access);
      remoteConfirmed = true;
    } catch {
    } finally {
      this.closing = false;
      this.update({
        busy: false,
        message: remoteConfirmed
          ? null
          : "Sesión cerrada en este dispositivo. No se pudo confirmar la revocación en el servidor.",
      });
    }
    return { remoteConfirmed };
  }
}
