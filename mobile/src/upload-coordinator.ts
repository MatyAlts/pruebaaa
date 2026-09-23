import { SessionError, type UploadTransport } from "./session";
import { validateUploadDraft, type UploadDraft } from "./upload-draft";
import { xhrUpload } from "./upload-transport";
export type UploadStatus = {
  operationId: string;
  status: "pending" | "complete" | "failed";
  studyId?: string;
  errorCode?: string;
  retryable?: boolean;
};
type Client = {
  upload<T>(
    key: string,
    body: () => FormData,
    transport: UploadTransport,
    signal: AbortSignal,
    progress: (value: number) => void,
  ): Promise<T>;
  get<T>(path: string): Promise<T>;
};
export function uploadBody(draft: UploadDraft) {
  const body = new FormData();
  for (const field of [
    "date",
    "title",
    "institution",
    "medico",
    "conclusion",
    "description",
    "patient",
  ] as const)
    body.append(field, draft[field].trim());
  if (draft.patient === "family") body.append("familyUuid", draft.familyUuid!);
  draft.files.forEach((file) =>
    body.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob),
  );
  return body;
}
export class UploadCoordinator {
  key: string | null = null;
  private controller: AbortController | null = null;
  private generation = 0;
  private fingerprint: string | null = null;
  private committed = false;
  private pending: Promise<UploadStatus> | null = null;
  private status: UploadStatus | null = null;
  constructor(
    private client: Client,
    private uuid: () => string,
    private progress: (value: number) => void,
    private changed: () => void,
    private transport: UploadTransport = xhrUpload,
  ) {}
  submit(draft: UploadDraft): Promise<UploadStatus> {
    if (this.pending) return this.pending;
    const promise = this.send(draft);
    this.pending = promise;
    void promise
      .finally(() => {
        if (this.pending === promise) this.pending = null;
      })
      .catch(() => {});
    return promise;
  }
  private async send(draft: UploadDraft): Promise<UploadStatus> {
    if (Object.keys(validateUploadDraft(draft)).length)
      throw new SessionError(
        "VALIDATION",
        "Revisá los campos y archivos de la carga.",
      );
    const fingerprint = JSON.stringify(draft);
    if (this.fingerprint && this.fingerprint !== fingerprint)
      throw new SessionError(
        "DRAFT_LOCKED",
        "Verificá el resultado de la carga anterior antes de modificarla.",
      );
    this.fingerprint = fingerprint;
    const generation = this.generation;
    const existing = Boolean(this.key);
    this.key ??= this.uuid();
    this.controller = new AbortController();
    if (existing) {
      try {
        const known = await this.reconcile();
        if (known.status !== "failed" || known.retryable !== true) return known;
      } catch (error) {
        if (!(error instanceof SessionError) || error.code !== "404")
          throw error;
      }
      this.guard(generation);
    }
    let result: UploadStatus;
    try {
      result = await this.client.upload<UploadStatus>(
        this.key,
        () => uploadBody(draft),
        this.transport,
        this.controller.signal,
        this.progress,
      );
    } catch (error) {
      this.guard(generation);
      if (
        !(error instanceof SessionError) ||
        !["AMBIGUOUS", "CANCELLED"].includes(error.code)
      ) {
        if (
          !existing &&
          error instanceof SessionError &&
          ["400", "413", "415", "429", "503"].includes(error.code)
        ) {
          this.key = null;
          this.fingerprint = null;
        }
        throw error;
      }
      result = await this.client.get<UploadStatus>(
        `/study-uploads/${this.key}`,
      );
    }
    this.guard(generation);
    return this.accept(result);
  }
  async reconcile(): Promise<UploadStatus> {
    if (!this.key)
      throw new SessionError(
        "NO_OPERATION",
        "No hay una carga para verificar.",
      );
    const generation = this.generation;
    const result = await this.client.get<UploadStatus>(
      `/study-uploads/${this.key}`,
    );
    this.guard(generation);
    return this.accept(result);
  }
  cancel() {
    this.controller?.abort();
  }
  reset() {
    if (
      this.key &&
      this.status?.status !== "failed" &&
      this.status?.status !== "complete"
    )
      throw new SessionError(
        "DRAFT_LOCKED",
        "Verificá el resultado antes de comenzar otra carga.",
      );
    this.cleanup();
  }
  cleanup() {
    this.generation++;
    this.cancel();
    this.key = null;
    this.fingerprint = null;
    this.committed = false;
    this.status = null;
  }
  private guard(generation: number) {
    if (generation !== this.generation)
      throw new SessionError("CANCELLED", "Sesión cerrada.");
  }
  private accept(result: UploadStatus) {
    if (
      !result ||
      typeof result.operationId !== "string" ||
      result.operationId !== this.key ||
      !["pending", "complete", "failed"].includes(result.status) ||
      (result.status === "complete" &&
        (typeof result.studyId !== "string" || !result.studyId))
    )
      throw new SessionError(
        "AMBIGUOUS",
        "No se pudo confirmar el resultado. Verificá el estado de la carga.",
      );
    this.status = result;
    if (result.status === "complete" && !this.committed) {
      this.committed = true;
      this.changed();
    }
    return result;
  }
}
