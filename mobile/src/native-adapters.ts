import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Directory, File, Paths } from "expo-file-system";
import { requireOptionalNativeModule } from "expo";
import { fetch as expoFetch } from "expo/fetch";
import { MobileClient, SessionError } from "./session";
import { PdfCoordinator, type PdfViewer } from "./pdf";
import { createProof } from "./proof";
import { configuredApiOrigin } from "./native-origin";
import { PrivateUploadFiles, uploadFileExtension } from "./upload-files";
import { createUploadStorage } from "./upload-native-storage";
const root = () => new Directory(Paths.cache, "misaluteca-pdfs");
const viewer = () => requireOptionalNativeModule<PdfViewer>("SalutecaPreview");
export function createNativeClient() {
  const uploadRoot = () => new Directory(Paths.cache, "misaluteca-uploads");
  const uploadFile = (file: File) => ({
    get size() {
      return file.size;
    },
    get exists() {
      return file.exists;
    },
    uri: file.uri,
    bytes: () => file.bytes(),
    copy: (destination: { uri: string }) =>
      file.copy(new File(destination.uri)),
    delete: () => file.delete(),
  });
  const uploadFiles = new PrivateUploadFiles(
    createUploadStorage(
      {
        source(uri) {
          if (!uri.startsWith(Paths.cache.uri))
            throw new SessionError(
              "UNSUPPORTED_FILE",
              "El archivo temporal no está disponible.",
            );
          return uploadFile(new File(uri));
        },
        async destination(extension) {
          const directory = uploadRoot();
          await directory.create({ intermediates: true, idempotent: true });
          return uploadFile(
            new File(directory, `${Crypto.randomUUID()}.${extension}`),
          );
        },
        async clear() {
          const directory = uploadRoot();
          if (directory.exists) await directory.delete();
        },
      },
      async (uri) => {
        const module = requireOptionalNativeModule<{
          protect(uri: string): Promise<void>;
        }>("SalutecaPreview");
        if (!module)
          throw new SessionError(
            "VIEWER_UNAVAILABLE",
            "La carga segura no está disponible en esta instalación.",
          );
        await module.protect(uri);
      },
    ),
  );
  const nativeViewer: PdfViewer = {
    preview: async (uri) => {
      const module = viewer();
      if (!module)
        throw new SessionError(
          "VIEWER_UNAVAILABLE",
          "El visor de documentos no está disponible en esta instalación.",
        );
      await module.preview(uri);
    },
    close: async () => {
      await viewer()?.close();
    },
  };
  const files = {
    save: async (bytes: Uint8Array, mime = "application/pdf") => {
      const directory = root();
      directory.create({ intermediates: true, idempotent: true });
      const file = new File(
        directory,
        `${Crypto.randomUUID()}.${uploadFileExtension(bytes, mime)}`,
      );
      file.create();
      try {
        file.write(bytes);
        return file.uri;
      } catch (error) {
        if (file.exists) file.delete();
        throw error;
      }
    },
    remove: async (uri: string) => {
      const file = new File(uri);
      if (file.exists) file.delete();
    },
    clear: async () => {
      const directory = root();
      if (directory.exists) directory.delete();
    },
  };
  let pdf: PdfCoordinator;
  const configuredOrigin = process.env.EXPO_PUBLIC_API_BASE_URL;
  const origin = configuredApiOrigin(configuredOrigin);
  const redirect = Linking.createURL("auth/callback");
  const client = new MobileClient(origin, {
    fetch: expoFetch as typeof fetch,
    storage: {
      get: () => SecureStore.getItemAsync("mobile-refresh"),
      set: (value) =>
        SecureStore.setItemAsync("mobile-refresh", value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
      remove: () => SecureStore.deleteItemAsync("mobile-refresh"),
    },
    browser: (url, redirect) => WebBrowser.openAuthSessionAsync(url, redirect),
    proof: () =>
      createProof(
        () => Crypto.getRandomBytesAsync(32),
        (verifier) =>
          Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            verifier,
            { encoding: Crypto.CryptoEncoding.BASE64 },
          ),
      ),
    cleanup: async () => {
      await pdf?.cleanup();
      await uploadFiles.clear();
    },
  }, redirect);
  pdf = new PdfCoordinator(client, files, nativeViewer);
  return { client, pdf, uploadFiles };
}
