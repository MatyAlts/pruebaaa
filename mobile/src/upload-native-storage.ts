import { SessionError } from "./session";
import type { UploadStorage } from "./upload-files";
type NativeFile = {
  size: number;
  uri: string;
  exists: boolean;
  bytes(): Promise<Uint8Array>;
  copy(destination: NativeFile): Promise<void>;
  delete(): void | Promise<void>;
};
type Factory = {
  source(uri: string): NativeFile;
  destination(extension: string): Promise<NativeFile>;
  clear(): Promise<void>;
};
export function createUploadStorage(
  factory: Factory,
  protect: (uri: string) => Promise<void>,
): UploadStorage {
  return {
    async read(uri) {
      const file = factory.source(uri);
      if (file.size > 10485760)
        throw new SessionError("FILE_TOO_LARGE", "El archivo supera 10 MiB.");
      return file.bytes();
    },
    async copy(uri, extension) {
      const target = await factory.destination(extension);
      try {
        await factory.source(uri).copy(target);
        return target.uri;
      } catch (error) {
        if (target.exists) await target.delete();
        throw error;
      }
    },
    protect,
    async remove(uri) {
      const file = factory.source(uri);
      if (file.exists) await file.delete();
    },
    clear: () => factory.clear(),
  };
}
