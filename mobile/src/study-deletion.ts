import { SessionError } from "./session";

export type StudyMutationClient = {
  get<T>(path: string): Promise<T>;
  write<T>(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown): Promise<T>;
};
export type DeletionResult = { operationId: string; status: "committed" | "complete" };

export class StudyDeletion {
  key: string | null = null;
  status: DeletionResult["status"] | "unknown" | "failed" | null = null;
  private active = true;
  private running = false;
  private refreshed = false;

  constructor(
    private client: StudyMutationClient,
    private studyId: string,
    private uuid: () => string,
    private changed: () => void,
  ) {}

  get locked() { return this.running || this.status === "unknown"; }

  private accept(result: DeletionResult) {
    if (!this.active) return;
    if (result.operationId !== this.key || !["committed", "complete"].includes(result.status)) {
      throw new Error("No pudimos confirmar la eliminación. Verificá su estado.");
    }
    this.status = result.status;
    if (!this.refreshed) {
      this.refreshed = true;
      this.changed();
    }
  }

  async confirm() {
    if (!this.active || this.running || this.key) return;
    this.key = this.uuid();
    this.status = "unknown";
    this.running = true;
    try {
      this.accept(await this.client.write<DeletionResult>(
        `/studies/${encodeURIComponent(this.studyId)}`, "DELETE",
        { confirmation: "misaluteca", idempotencyKey: this.key },
      ));
    } catch (reason) {
      if (this.active && reason instanceof SessionError && ["400", "403", "404", "409", "422"].includes(reason.code)) this.status = "failed";
      throw reason;
    } finally { this.running = false; }
  }

  async reconcile() {
    if (!this.active || this.running || !this.key) return;
    this.running = true;
    try {
      this.accept(await this.client.get<DeletionResult>(`/study-deletions/${encodeURIComponent(this.key)}`));
    } finally { this.running = false; }
  }

  cleanup() { this.active = false; }
}
