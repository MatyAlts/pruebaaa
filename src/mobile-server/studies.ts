import { open, realpath } from "node:fs/promises";
import { join, relative, isAbsolute } from "node:path";
import { lstat } from "node:fs/promises";
import { createHash } from "node:crypto";
export class ReadingError extends Error {
  status: number;
  code: string;
  constructor(status = 404, code = "NOT_FOUND") {
    super(code);
    this.status = status;
    this.code = code;
  }
}
export type OwnedStudy = {
  id: string;
  uuid: string;
  userId: string;
  familyMemberId?: string;
  patientName?: string;
  title?: string;
  date: string;
  institution?: string;
  medico: string;
  conclusion?: string;
  description?: string;
  createdAt: string;
  files: {
    id?: string;
    fileKey: string;
    fileName: string;
    mimeType: string;
    size: number;
  }[];
};
export interface StudyReadRepository {
  family?(userId: string, uuid: string): Promise<{ id: string }>;
  familyPatient?(
    userId: string,
    id: string,
  ): Promise<{ id: string; name: string } | null>;
  ids(
    userId: string,
    before: string | null,
    limit: number,
    filters?: StudyFilters,
  ): Promise<string[]>;
  study(id: string, userId: string): Promise<OwnedStudy | null>;
  summary?(
    userId: string,
    filters?: StudyFilters,
  ): Promise<{
    propiosTotal: number;
    familiaresTotal?: number;
    recentIds: string[];
    filterOptions: {
      medicos: string[];
      institutions: string[];
      years: number[];
    };
  }>;
  datePage?(
    userId: string,
    filters: StudyFilters,
    before: { id: string; date: string | null } | null,
    limit: number,
  ): Promise<{ id: string; date: string | null }[]>;
}
export type StudyFilters = {
  scope?: "self" | "all" | "family";
  familyId?: string;
  q?: string;
  medico?: string;
  institution?: string;
  month?: number;
  year?: number;
};
export type StudyQuery = {
  limit: string | null;
  cursor: string | null;
  q?: string | null;
  medico?: string | null;
  institution?: string | null;
  month?: string | null;
  year?: string | null;
  sort?: string | null;
  scope?: string | null;
  familyUuid?: string | null;
};
export class MobileStudies {
  private repository: StudyReadRepository;
  constructor(repository: StudyReadRepository) {
    this.repository = repository;
  }
  private dto(study: OwnedStudy) {
    return {
      id: study.id,
      uuid: study.uuid,
      patient: {
        kind: study.familyMemberId ? "family" : "self",
        id: study.familyMemberId ?? study.userId,
        name: study.patientName ?? "Mi historial",
      },
      title: study.title ?? null,
      date: study.date,
      institution: study.institution ?? null,
      medico: study.medico,
      conclusion: study.conclusion ?? null,
      description: study.description ?? null,
      files: study.files.map((f) => ({
        id: f.id ?? "legacy",
        name: f.fileName,
        mimeType: f.mimeType,
        size: f.size,
      })),
    };
  }
  async selection(
    userId: string,
    query: Pick<StudyQuery, "scope" | "familyUuid">,
  ) {
    const scope = query.scope ?? "self";
    if (
      !["self", "all", "family"].includes(scope) ||
      (!this.repository.family && scope !== "self") ||
      (scope !== "family" && query.familyUuid)
    )
      throw new ReadingError(400, "INVALID_FILTERS");
    if (scope === "family") {
      if (!query.familyUuid || !this.repository.family)
        throw new ReadingError(400, "INVALID_FILTERS");
      const family = await this.repository.family(userId, query.familyUuid);
      return { scope: "family" as const, familyId: family.id };
    }
    return { scope: scope as "self" | "all" };
  }
  async summary(
    userId: string,
    query: Pick<StudyQuery, "scope" | "familyUuid"> = {},
  ) {
    if (!this.repository.summary) throw new ReadingError(404);
    const filters = await this.selection(userId, query);
    const result = await this.repository.summary(userId, filters);
    return {
      scope: filters.scope,
      propiosTotal: result.propiosTotal,
      familiaresTotal: result.familiaresTotal ?? null,
      total:
        result.familiaresTotal == null
          ? null
          : result.propiosTotal + result.familiaresTotal,
      recientes: await Promise.all(
        result.recentIds.map((id) => this.detail(userId, id)),
      ),
      filterOptions: result.filterOptions,
    };
  }
  async list(userId: string, query: StudyQuery) {
    if (query.scope && query.scope !== "self" && query.sort == null)
      query = { ...query, sort: "study-date-desc" };
    const limit = query.limit === null ? 20 : Number(query.limit);
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50 ||
      (query.sort !== "study-date-desc" &&
        query.cursor !== null &&
        !/^[1-9]\d{0,15}$/.test(query.cursor))
    )
      throw new ReadingError(400, "INVALID_PAGINATION");
    const filters: StudyFilters = {};
    for (const key of ["q", "medico", "institution"] as const) {
      if (query[key] != null && query[key]!.length > (key === "q" ? 200 : 400))
        throw new ReadingError(400, "INVALID_FILTERS");
      const value = query[key]?.trim();
      if (value) {
        if (value.length > (key === "q" ? 200 : 400))
          throw new ReadingError(400, "INVALID_FILTERS");
        filters[key] = value;
      }
    }
    if (query.month != null) {
      if (!/^(?:[1-9]|1[0-2])$/.test(query.month))
        throw new ReadingError(400, "INVALID_FILTERS");
      filters.month = Number(query.month);
    }
    if (query.year != null) {
      if (!/^[1-9]\d{3}$/.test(query.year))
        throw new ReadingError(400, "INVALID_FILTERS");
      filters.year = Number(query.year);
    }
    const selection = await this.selection(userId, query);
    if (selection.scope !== "self") Object.assign(filters, selection);
    if (query.sort != null && query.sort !== "study-date-desc")
      throw new ReadingError(400, "INVALID_SORT");
    if (query.sort === "study-date-desc") {
      if (!this.repository.datePage) throw new ReadingError(404);
      const fingerprint = createHash("sha256")
        .update(JSON.stringify([userId, filters]))
        .digest("hex");
      let before: { id: string; date: string | null } | null = null;
      if (query.cursor !== null) {
        try {
          if (
            query.cursor.length > 512 ||
            !/^[A-Za-z0-9_-]+$/.test(query.cursor)
          )
            throw new Error();
          const value = JSON.parse(
            Buffer.from(query.cursor, "base64url").toString("utf8"),
          );
          if (
            value.v !== 1 ||
            value.f !== fingerprint ||
            typeof value.id !== "string" ||
            !/^[1-9]\d{0,15}$/.test(value.id) ||
            !(
              value.date === null ||
              (typeof value.date === "string" &&
                /^[1-9]\d{3}-\d{2}-\d{2}$/.test(value.date) &&
                new Date(value.date + "T00:00:00Z")
                  .toISOString()
                  .slice(0, 10) === value.date)
            )
          )
            throw new Error();
          before = { id: value.id, date: value.date };
        } catch {
          throw new ReadingError(400, "INVALID_PAGINATION");
        }
      }
      const page = await this.repository.datePage(
        userId,
        filters,
        before,
        limit + 1,
      );
      const selected = page.slice(0, limit);
      const last = selected.at(-1);
      return {
        items: await Promise.all(
          selected.map((item) => this.detail(userId, item.id)),
        ),
        nextCursor:
          page.length > limit && last
            ? Buffer.from(
                JSON.stringify({ v: 1, f: fingerprint, ...last }),
              ).toString("base64url")
            : null,
      };
    }
    const ids = await this.repository.ids(
      userId,
      query.cursor,
      limit + 1,
      filters,
    );
    const selected = ids.slice(0, limit);
    const items = await Promise.all(
      selected.map((id) => this.detail(userId, id)),
    );
    return { items, nextCursor: ids.length > limit ? selected.at(-1)! : null };
  }
  private async owned(userId: string, id: string) {
    if (!/^[1-9]\d{0,15}$/.test(id)) throw new ReadingError();
    const study = await this.repository.study(id, userId);
    if (!study || study.userId !== userId) throw new ReadingError();
    if (study.familyMemberId) {
      const patient = await this.repository.familyPatient?.(
        userId,
        study.familyMemberId,
      );
      if (!patient) throw new ReadingError();
      study.patientName = patient.name;
    }
    return study;
  }
  async detail(userId: string, id: string) {
    return this.dto(await this.owned(userId, id));
  }
  async file(userId: string, id: string, fileId: string, uploadRoot: string) {
    const study = await this.owned(userId, id);
    const file = study.files.find((f) => (f.id ?? "legacy") === fileId);
    if (!file) throw new ReadingError();
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.mimeType))
      throw new ReadingError(415, "UNSUPPORTED_FILE");
    if (
      (study.familyMemberId || file.mimeType !== "application/pdf") &&
      (!file.fileKey.startsWith(userId + "/") ||
        file.fileKey.includes("\\") ||
        file.fileKey.split("/").some((p) => !p || p === "." || p === ".."))
    )
      throw new ReadingError(400, "INVALID_FILE_PATH");
    let root: string, path: string;
    let segmentRoot = uploadRoot;
    if (study.familyMemberId || file.mimeType !== "application/pdf")
      for (const segment of file.fileKey.split("/")) {
        segmentRoot = join(segmentRoot, segment);
        try {
          if ((await lstat(segmentRoot)).isSymbolicLink())
            throw new ReadingError(400, "INVALID_FILE_PATH");
        } catch (error) {
          if (error instanceof ReadingError) throw error;
          throw new ReadingError();
        }
      }
    try {
      root = await realpath(
        study.familyMemberId || file.mimeType !== "application/pdf"
          ? join(uploadRoot, userId)
          : uploadRoot,
      );
      path = await realpath(join(uploadRoot, file.fileKey));
    } catch {
      throw new ReadingError();
    }
    const traversal = relative(root, path);
    if (!traversal || traversal.startsWith("..") || isAbsolute(traversal))
      throw new ReadingError(400, "INVALID_FILE_PATH");
    let handle;
    try {
      handle = await open(path, "r");
    } catch {
      throw new ReadingError();
    }
    let bytes: Buffer;
    try {
      const info = await handle.stat();
      if (!info.isFile()) throw new ReadingError();
      if (info.size > 10 * 1024 * 1024)
        throw new ReadingError(413, "FILE_TOO_LARGE");
      bytes = await readBoundedPdf(handle);
    } finally {
      await handle.close();
    }
    if (
      file.mimeType === "application/pdf" &&
      !bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))
    )
      throw new ReadingError(415, "UNSUPPORTED_FILE");
    if (file.mimeType !== "application/pdf") {
      const { validateAttachmentBytes } = await import("./upload-parser.ts");
      validateAttachmentBytes(
        bytes,
        file.mimeType,
        file.fileName.split(".").at(-1)?.toLowerCase() ?? "",
      );
    }
    return {
      bytes,
      mimeType: file.mimeType,
      name: file.fileName.replace(/[\r\n"\\/]/g, "_") || "estudio.pdf",
    };
  }
}

export async function readBoundedPdf(handle: {
  read(
    buffer: Buffer,
    offset: number,
    length: number,
    position: null,
  ): Promise<{ bytesRead: number }>;
}) {
  const limit = 10 * 1024 * 1024;
  const buffer = Buffer.alloc(limit + 1);
  let used = 0;
  while (used < buffer.length) {
    const result = await handle.read(buffer, used, buffer.length - used, null);
    if (!result.bytesRead) break;
    used += result.bytesRead;
  }
  if (used > limit) throw new ReadingError(413, "FILE_TOO_LARGE");
  return buffer.subarray(0, used);
}
