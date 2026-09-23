import Busboy from "busboy";
import { once } from "node:events";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, lstat, open, readFile, rm, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { validateUploadFields, UPLOAD_LIMITS } from "./upload-validation.ts";
import { ReadingError } from "./studies.ts";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
export type StagedFile = {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  hash: string;
  extension: string;
};
export async function privateDirectory(
  root: string,
  owner: string,
  ...parts: string[]
) {
  if (
    !/^[1-9]\d{0,15}$/.test(owner) ||
    parts.some(
      (p) => !p || !/^[a-zA-Z0-9_.-]+$/.test(p) || p === "." || p === "..",
    )
  )
    throw new ReadingError(400, "INVALID_FILE_PATH");
  let current = resolve(root);
  await mkdir(current, { recursive: true });
  if ((await lstat(current)).isSymbolicLink())
    throw new ReadingError(400, "INVALID_FILE_PATH");
  current = await realpath(current);
  for (const part of [owner, ...parts]) {
    current = join(current, part);
    try {
      await mkdir(current, { mode: 0o700 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new ReadingError(400, "INVALID_FILE_PATH");
  }
  return current;
}
export async function parseUpload(
  request: Request,
  root: string,
  owner: string,
  options: { timeoutMs?: number } = {},
) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > UPLOAD_LIMITS.envelopeBytes)
    throw new ReadingError(413, "REQUEST_TOO_LARGE");
  const directory = await privateDirectory(
    root,
    owner,
    ".mobile-staging",
    randomUUID(),
  );
  const fields: Record<string, string> = {},
    files: StagedFile[] = [];
  let total = 0,
    envelope = 0,
    failure: unknown;
  const jobs: Promise<void>[] = [];
  let parser: ReturnType<typeof Busboy>;
  try {
    parser = Busboy({
      preservePath: true,
      headers: { "content-type": request.headers.get("content-type") ?? "" },
      limits: {
        files: 10,
        fileSize: UPLOAD_LIMITS.fileBytes + 1,
        fields: 8,
        fieldSize: 44000,
        parts: 18,
        headerPairs: 100,
      },
    });
  } catch {
    await rm(directory, { recursive: true, force: true });
    throw new ReadingError(400, "INVALID_MULTIPART");
  }
  const setError = (error: unknown) => {
    failure ??= error;
  };
  parser.on("field", (name, value, info) => {
    if (
      Object.hasOwn(fields, name) ||
      info.valueTruncated ||
      info.nameTruncated
    )
      setError(new ReadingError(400, "INVALID_FIELDS"));
    fields[name] = value;
  });
  parser.on("file", (name, stream, info) => {
    const index = files.length,
      extension = info.filename.split(".").at(-1)?.toLowerCase() ?? "",
      file: StagedFile = {
        path: join(directory, String(index)),
        name: info.filename,
        mimeType: info.mimeType,
        size: 0,
        hash: "",
        extension,
      };
    files.push(file);
    if (
      name !== "files" ||
      !info.filename ||
      [...info.filename].length > 255 ||
      /[\\/\x00-\x1f]/.test(info.filename)
    )
      setError(new ReadingError(400, "INVALID_FILE_NAME"));
    stream.on("limit", () => setError(new ReadingError(413, "FILE_TOO_LARGE")));
    jobs.push(
      (async () => {
        let handle;
        const hash = createHash("sha256");
        try {
          handle = await open(file.path, "wx", 0o600);
          for await (const chunk of stream) {
            file.size += chunk.length;
            total += chunk.length;
            if (file.size > UPLOAD_LIMITS.fileBytes)
              setError(new ReadingError(413, "FILE_TOO_LARGE"));
            if (total > UPLOAD_LIMITS.totalBytes)
              setError(new ReadingError(413, "REQUEST_TOO_LARGE"));
            if (!failure) {
              hash.update(chunk);
              try {
                await handle.write(chunk);
              } catch (error) {
                setError(error);
              }
            }
          }
          file.hash = hash.digest("hex");
        } catch (error) {
          setError(error);
          stream.resume();
        } finally {
          await handle?.close();
        }
      })(),
    );
  });
  parser.on("filesLimit", () =>
    setError(new ReadingError(413, "TOO_MANY_FILES")),
  );
  parser.on("fieldsLimit", () =>
    setError(new ReadingError(400, "INVALID_FIELDS")),
  );
  parser.on("partsLimit", () =>
    setError(new ReadingError(400, "INVALID_FIELDS")),
  );
  const completion = new Promise<void>((res) => {
    parser.on("finish", res);
    parser.on("error", () => {
      setError(new ReadingError(400, "INVALID_MULTIPART"));
      res();
    });
  });
  const reader = request.body?.getReader();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ReadingError(408, "UPLOAD_TIMEOUT")),
      options.timeoutMs ?? 120000,
    );
  });
  try {
    if (!reader) throw new ReadingError(400, "INVALID_MULTIPART");
    while (true) {
      const item = await Promise.race([reader.read(), deadline]);
      if (item.done) break;
      envelope += item.value.byteLength;
      if (envelope > UPLOAD_LIMITS.envelopeBytes)
        throw new ReadingError(413, "REQUEST_TOO_LARGE");
      if (!parser.write(item.value))
        await Promise.race([once(parser, "drain"), deadline]);
    }
    parser.end();
    await completion;
    await Promise.all(jobs);
    if (failure) throw failure;
    if (!files.length) throw new ReadingError(400, "MISSING_FILES");
    const normalized = validateUploadFields(fields);
    for (const file of files) await validateStagedFile(file);
    return { directory, fields: normalized, files };
  } catch (error) {
    parser.destroy();
    await reader?.cancel().catch(() => {});
    await Promise.allSettled(jobs);
    await rm(directory, { recursive: true, force: true });
    throw error;
  } finally {
    clearTimeout(timer!);
    reader?.releaseLock();
  }
}
async function validateStagedFile(file: StagedFile) {
  const bytes = await readFile(file.path);
  return validateAttachmentBytes(bytes, file.mimeType, file.extension);
}
export function validateAttachmentBytes(
  bytes: Buffer,
  mimeType: string,
  extension: string,
) {
  const file = { mimeType, extension };
  if (!bytes.length) throw new ReadingError(415, "UNSUPPORTED_FILE");
  if (
    file.mimeType === "application/pdf" &&
    file.extension === "pdf" &&
    bytes.subarray(0, 5).equals(Buffer.from("%PDF-")) &&
    /%%EOF\s*$/.test(bytes.subarray(-2048).toString())
  )
    return;
  try {
    let width = 0,
      height = 0;
    if (
      file.mimeType === "image/png" &&
      file.extension === "png" &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.length >= 33
    ) {
      width = bytes.readUInt32BE(16);
      height = bytes.readUInt32BE(20);
      imageBounds(width, height);
      const decoded = PNG.sync.read(bytes, { checkCRC: true });
      if (decoded.width !== width || decoded.height !== height)
        throw new Error();
      return;
    }
    if (
      file.mimeType === "image/jpeg" &&
      ["jpg", "jpeg"].includes(file.extension) &&
      bytes.readUInt16BE(0) === 0xffd8 &&
      bytes.readUInt16BE(bytes.length - 2) === 0xffd9
    ) {
      let pos = 2;
      while (pos + 4 < bytes.length) {
        if (bytes[pos] !== 255) throw new Error();
        while (bytes[pos] === 255) pos++;
        const marker = bytes[pos++];
        if (marker === 0xda) break;
        const length = bytes.readUInt16BE(pos);
        if (length < 2 || pos + length > bytes.length) throw new Error();
        if ([0xc0, 0xc1, 0xc2].includes(marker)) {
          height = bytes.readUInt16BE(pos + 3);
          width = bytes.readUInt16BE(pos + 5);
          break;
        }
        pos += length;
      }
      imageBounds(width, height);
      jpeg.decode(bytes, {
        tolerantDecoding: false,
        maxResolutionInMP: 24,
        maxMemoryUsageInMB: 256,
      });
      return;
    }
  } catch {}
  throw new ReadingError(415, "UNSUPPORTED_FILE");
}
function imageBounds(width: number, height: number) {
  if (
    !width ||
    !height ||
    width > UPLOAD_LIMITS.maxImageEdge ||
    height > UPLOAD_LIMITS.maxImageEdge ||
    width * height > UPLOAD_LIMITS.maxImagePixels
  )
    throw new ReadingError(415, "UNSUPPORTED_FILE");
}
