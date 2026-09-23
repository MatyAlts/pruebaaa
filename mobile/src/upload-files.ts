import type { UploadFile } from "./upload-draft";
import { SessionError } from "./session";
export function uploadFileExtension(bytes: Uint8Array, mime: string) {
  if (
    mime === "application/pdf" &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  )
    return "pdf";
  if (
    mime === "image/jpeg" &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "jpg";
  if (
    mime === "image/png" &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
  )
    return "png";
  throw new SessionError(
    "UNSUPPORTED_FILE",
    "Elegí un archivo PDF, JPEG o PNG válido. La cámara convierte la foto a JPEG; otros formatos no se pueden adjuntar.",
  );
}
export type UploadStorage = {
  read(uri: string): Promise<Uint8Array>;
  copy(uri: string, extension: string): Promise<string>;
  protect(uri: string): Promise<void>;
  remove(uri: string): Promise<void>;
  clear(): Promise<void>;
};
export class PrivateUploadFiles {
  private generation = 0;
  private clearing: Promise<void> | null = null;
  constructor(private storage: UploadStorage) {}
  async import(file: UploadFile): Promise<UploadFile> {
    const generation = this.generation;
    let uri: string | null = null;
    try {
      if (this.clearing) await this.clearing;
      if (generation !== this.generation)
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      const bytes = await this.storage.read(file.uri);
      const extension = uploadFileExtension(bytes, file.mimeType);
      uri = await this.storage.copy(file.uri, extension);
      if (generation !== this.generation)
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      await this.storage.protect(uri);
      if (generation !== this.generation)
        throw new SessionError("CANCELLED", "Sesión cerrada.");
      return { ...file, uri, size: bytes.length };
    } catch (error) {
      if (uri) await this.storage.remove(uri);
      throw error;
    } finally {
      await this.storage.remove(file.uri);
    }
  }
  remove(uri: string) {
    return this.storage.remove(uri);
  }
  async clear() {
    this.generation++;
    const pending = (this.clearing || Promise.resolve()).then(() =>
      this.storage.clear(),
    );
    this.clearing = pending;
    try {
      await pending;
    } finally {
      if (this.clearing === pending) this.clearing = null;
    }
  }
}
