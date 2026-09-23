import { SessionError } from "./session";
export type PdfFiles = {
  save(bytes: Uint8Array, mime?: string): Promise<string>;
  remove(uri: string): Promise<void>;
  clear(): Promise<void>;
};
export type PdfViewer = {
  preview(uri: string): Promise<void>;
  close(): Promise<void>;
};
export class PdfCoordinator {
  private client: { download(path: string): Promise<Uint8Array>; downloadAttachment?(path: string, mime: string): Promise<Uint8Array> };
  private files: PdfFiles;
  private viewer: PdfViewer;
  private generation = 0;
  constructor(
    client: { download(path: string): Promise<Uint8Array>; downloadAttachment?(path: string, mime: string): Promise<Uint8Array> },
    files: PdfFiles,
    viewer: PdfViewer,
  ) {
    this.client = client;
    this.files = files;
    this.viewer = viewer;
  }
  async open(studyId: string, fileId: string, mime = "application/pdf") {
    if (!["application/pdf", "image/jpeg", "image/png"].includes(mime) || (mime !== "application/pdf" && !this.client.downloadAttachment)) throw new SessionError("UNSUPPORTED_FILE", "Este archivo todavía no se puede abrir.");
    const generation = this.generation;
    const path = `/studies/${encodeURIComponent(studyId)}/files/${encodeURIComponent(fileId)}`;
    const bytes = mime === "application/pdf" ? await this.client.download(path) : await this.client.downloadAttachment!(path, mime);
    if (generation !== this.generation)
      throw new SessionError("CANCELLED", "Sesión cerrada.");
    const uri = mime === "application/pdf" ? await this.files.save(bytes) : await this.files.save(bytes, mime);
    try {
      if (generation !== this.generation)
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      await this.viewer.preview(uri);
    } finally {
      await this.files.remove(uri);
    }
  }
  async cleanup() {
    this.generation++;
    await this.viewer.close();
    await this.files.clear();
  }
}
