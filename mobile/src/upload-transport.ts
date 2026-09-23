import { SessionError, type UploadTransport } from "./session";
export function xhrUpload(
  request: Parameters<UploadTransport>[0],
  create: () => XMLHttpRequest = () => new XMLHttpRequest(),
): ReturnType<UploadTransport> {
  return new Promise((resolve, reject) => {
    const xhr = create();
    let settled = false;
    const cleanup = () => {
      settled = true;
      request.signal.removeEventListener("abort", abort);
    };
    const ambiguous = () => {
      if (settled) return;
      cleanup();
      reject(
        new SessionError(
          "AMBIGUOUS",
          "La conexión fue interrumpida. Verificá el estado de la carga antes de volver a intentar.",
        ),
      );
    };
    const abort = () => {
      if (!settled) {
        ambiguous();
        xhr.abort();
      }
    };
    xhr.open("POST", request.url);
    xhr.setRequestHeader("Authorization", `Bearer ${request.token}`);
    xhr.setRequestHeader("Idempotency-Key", request.key);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0)
        request.progress(Math.min(1, event.loaded / event.total));
    };
    xhr.onload = () => {
      if (settled) return;
      try {
        if (
          xhr.responseURL &&
          new URL(xhr.responseURL).origin !== new URL(request.url).origin
        ) {
          ambiguous();
          return;
        }
        const value = JSON.parse(xhr.responseText);
        cleanup();
        resolve({ status: xhr.status, value });
      } catch {
        ambiguous();
      }
    };
    xhr.onerror = ambiguous;
    xhr.ontimeout = ambiguous;
    xhr.onabort = ambiguous;
    xhr.timeout = 120000;
    request.signal.addEventListener("abort", abort);
    if (request.signal.aborted) {
      abort();
      return;
    }
    xhr.send(request.body);
  });
}
