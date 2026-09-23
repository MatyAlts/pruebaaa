import { randomUUID } from "node:crypto";
import { AuthError, type MobileAuth } from "./auth.ts";
import { ReadingError, type MobileStudies } from "./studies.ts";
import type { MysqlFamily } from "./mysql-family.ts";
import type { MysqlStudyUpload } from "./mysql-study-upload.ts";
import { UPLOAD_LIMITS } from "./upload-validation.ts";
import type { assertUploadSession } from "./upload-session.ts";
import type { MysqlStudyDeletion } from './mysql-study-deletion.ts';
import type { MysqlStudyAnalysis } from './mysql-study-analysis.ts';
export type MobileDependencies = {
    auth: Pick<MobileAuth, "identity" | "createRequest" | "exchange" | "renew" | "logout">;
    studies: Pick<MobileStudies, "list" | "detail" | "file"> & Partial<Pick<MobileStudies, "summary">>;
    uploadRoot: string;
    trustedProxy?: boolean;
    family?: MysqlFamily;
    familyDeleteReady?: boolean;
    upload?: MysqlStudyUpload;
    uploadReady?: boolean;
    uploadSession?: typeof assertUploadSession;
    studyDeletion?: MysqlStudyDeletion;
    studyDeleteReady?: boolean;
    analysis?: MysqlStudyAnalysis;
};
const bearer = (request: Request) => {
    const match = /^Bearer ([A-Za-z0-9_-]+)$/.exec(request.headers.get("authorization") ?? "");
    return match?.[1];
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function body(request: Request, maximum = 4096) {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
        throw new AuthError(400, "INVALID_REQUEST");
    const text = await boundedText(request, maximum);
    try {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            throw new Error();
        return parsed as Record<string, unknown>;
    }
    catch {
        throw new AuthError(400, "INVALID_REQUEST");
    }
}
const field = (input: Record<string, unknown>, key: string) => {
    const value = input[key];
    if (typeof value !== "string" || value.length > 2048)
        throw new AuthError(400, "INVALID_REQUEST");
    return value;
};
export async function boundedText(request: Request, maximum = 4096) {
    const declared = Number(request.headers.get("content-length"));
    if (declared > maximum)
        throw new AuthError(413, "REQUEST_TOO_LARGE");
    if (!request.body)
        return "";
    const reader = request.body.getReader();
    let total = 0;
    const chunks: Uint8Array[] = [];
    try {
        while (true) {
            const result = await reader.read();
            if (result.done)
                break;
            total += result.value.byteLength;
            if (total > maximum) {
                await reader.cancel();
                throw new AuthError(413, "REQUEST_TOO_LARGE");
            }
            chunks.push(result.value);
        }
        return Buffer.concat(chunks).toString("utf8");
    }
    finally {
        reader.releaseLock();
    }
}
export async function mobileHttp(request: Request, dependencies: MobileDependencies): Promise<Response> {
    const requestId = randomUUID();
    const path = new URL(request.url).pathname.replace(/^\/api\/mobile\/v1\/?/, "");
    const url = new URL(request.url);
    try {
        if (path.startsWith("auth/")) {
            if (request.method !== "POST")
                return json({
                    error: {
                        code: "METHOD_NOT_ALLOWED",
                        message: "Método no permitido.",
                    },
                    requestId,
                }, 405);
            const input = await body(request);
            const ip = dependencies.trustedProxy
                ? (request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
                    "unidentified")
                : "unidentified";
            if (path === "auth/requests")
                return json(await dependencies.auth.createRequest({
                    challenge: field(input, "challenge"),
                    state: field(input, "state"),
                    redirect: field(input, "redirect"),
                }, ip));
            if (path === "auth/token")
                return json(await dependencies.auth.exchange({
                    code: field(input, "code"),
                    verifier: field(input, "verifier"),
                    state: field(input, "state"),
                    redirect: field(input, "redirect"),
                }, ip));
            if (path === "auth/refresh")
                return json(await dependencies.auth.renew(field(input, "refreshToken"), ip));
            if (path === "auth/logout") {
                await dependencies.auth.logout(bearer(request), typeof input.refreshToken === "string"
                    ? input.refreshToken
                    : undefined);
                return new Response(null, {
                    status: 204,
                    headers: { "Cache-Control": "no-store" },
                });
            }
            return json({ error: { code: "NOT_FOUND", message: "No encontrado." }, requestId }, 404);
        }
        const familyPath = path === "family-members" ||
            path.startsWith("family-members/") ||
            path.startsWith("operations/");
        if (request.method !== "GET" &&
            !familyPath &&
            !(path === "studies" && request.method === "POST")
            && !(path === 'studies/analyze' && request.method === 'POST')
            && !(/^studies\/[1-9]\d*$/.test(path) && request.method === 'DELETE'))
            return json({
                error: {
                    code: "METHOD_NOT_ALLOWED",
                    message: "Método no permitido.",
                },
                requestId,
            }, 405);
        const token = bearer(request);
        if (!token)
            throw new AuthError();
        const user = await dependencies.auth.identity(token);
        const session = async (connection: Parameters<typeof assertUploadSession>[0]) => {
            if (dependencies.uploadSession)
                await dependencies.uploadSession(connection, token, user.id);
            else
                await dependencies.auth.identity(token);
        };
        const deleteReady = dependencies.studyDeleteReady === true && dependencies.studyDeletion ? await dependencies.studyDeletion.ready() : false;
        const analyzeReady = dependencies.analysis ? await dependencies.analysis.ready() : false;
        if (path === 'studies/analyze' && request.method === 'POST') {
            if (!analyzeReady || !dependencies.analysis)
                throw new ReadingError(503, 'ANALYSIS_UNAVAILABLE');
            return json(await dependencies.analysis.submit(user.id, await body(request, 80 * 1024), session));
        }
        const analysisStatus = /^study-analyses\/([^/]+)$/.exec(path);
        if (analysisStatus) {
            if (!dependencies.analysis)
                throw new ReadingError();
            return json(await dependencies.analysis.status(user.id, analysisStatus[1]));
        }
        const deletionStatus = /^study-deletions\/([^/]+)$/.exec(path);
        if (deletionStatus) {
            if (!dependencies.studyDeletion)
                throw new ReadingError();
            return json(await dependencies.studyDeletion.status(user.id, deletionStatus[1]));
        }
        const deleteStudy = /^studies\/([1-9]\d*)$/.exec(path);
        if (deleteStudy && request.method === 'DELETE') {
            if (!deleteReady || !dependencies.studyDeletion)
                throw new ReadingError(503, 'CLEANUP_UNAVAILABLE');
            return json(await dependencies.studyDeletion.remove(user.id, deleteStudy[1], await body(request), session), 202);
        }
        const uploadReady = dependencies.uploadReady === true && dependencies.upload
            ? await dependencies.upload.ready()
            : false;
        if (path === "studies" && request.method === "POST") {
            if (!uploadReady || !dependencies.upload)
                throw new ReadingError(503, "UPLOAD_UNAVAILABLE");
            const result = await dependencies.upload.submit(request, user, async (connection) => {
                if (dependencies.uploadSession)
                    await dependencies.uploadSession(connection, token, user.id);
                else
                    await dependencies.auth.identity(token);
            });
            const { httpStatus, ...payload } = result;
            return json(payload, httpStatus);
        }
        const uploadStatus = /^study-uploads\/([^/]+)$/.exec(path);
        if (uploadStatus) {
            if (!uploadReady || !dependencies.upload)
                throw new ReadingError(503, "UPLOAD_UNAVAILABLE");
            return json(await dependencies.upload.status(user.id, uploadStatus[1]));
        }
        const familyReady = dependencies.family
            ? await dependencies.family.ready()
            : false;
        const query = {
            limit: url.searchParams.get("limit"),
            cursor: url.searchParams.get("cursor"),
            q: url.searchParams.get("q"),
            medico: url.searchParams.get("medico"),
            institution: url.searchParams.get("institution"),
            month: url.searchParams.get("month"),
            year: url.searchParams.get("year"),
            sort: url.searchParams.get("sort"),
            scope: url.searchParams.get("scope"),
            ...(url.searchParams.has("familyUuid")
                ? { familyUuid: url.searchParams.get("familyUuid") }
                : {}),
        };
        if (familyPath) {
            if (!familyReady || !dependencies.family)
                throw new ReadingError();
            if (path === "family-members") {
                if (request.method === "GET")
                    return json({ items: await dependencies.family.list(user.id) });
                if (request.method === "POST")
                    return json({
                        familyMember: await dependencies.family.create(user, await body(request)),
                    }, 201);
            }
            const member = /^family-members\/([^/]+)$/.exec(path), memberStudies = /^family-members\/([^/]+)\/studies$/.exec(path), operation = /^operations\/([^/]+)$/.exec(path);
            if (member) {
                if (request.method === "GET")
                    return json({
                        familyMember: await dependencies.family.detail(user.id, member[1]),
                    });
                if (request.method === "PATCH")
                    return json({
                        familyMember: await dependencies.family.rename(user.id, member[1], await body(request)),
                    });
                if (request.method === "DELETE") {
                    if (dependencies.familyDeleteReady !== true)
                        throw new ReadingError(503, "CLEANUP_UNAVAILABLE");
                    return json(await dependencies.family.remove(user.id, member[1], await body(request)), 202);
                }
            }
            if (memberStudies && request.method === "GET")
                return json(await dependencies.studies.list(user.id, {
                    ...query,
                    scope: "family",
                    familyUuid: memberStudies[1],
                }));
            if (operation && request.method === "GET")
                return json(await dependencies.family.operation(user.id, operation[1]));
            return json({
                error: {
                    code: "METHOD_NOT_ALLOWED",
                    message: "Método no permitido.",
                },
                requestId,
            }, 405);
        }
        if (path === "capabilities")
            return json({
                version: 1,
                features: {
                    studiesRead: true,
                    profile: true,
                    logout: true,
                    ...(deleteReady ? { studiesDelete: true } : {}),
                    ...(analyzeReady ? { studiesAnalyze: true } : {}),
                    ...(uploadReady
                        ? { studiesUpload: true, studyImagesRead: true }
                        : {}),
                    ...(familyReady
                        ? {
                            familyRead: true,
                            familyWrite: true,
                            familyDelete: dependencies.familyDeleteReady === true,
                            studiesFamilyScope: true,
                        }
                        : {}),
                    ...(dependencies.studies.summary
                        ? { studiesSummary: true, studiesSearch: true }
                        : {}),
                },
                ...(uploadReady ? { uploadLimits: UPLOAD_LIMITS } : {}),
            });
        if (path === "me")
            return json({ user });
        if (path === "studies/summary") {
            if (!dependencies.studies.summary)
                throw new ReadingError();
            return json(await dependencies.studies.summary(user.id, query));
        }
        if (path === "studies")
            return json(await dependencies.studies.list(user.id, query));
        const fileMatch = /^studies\/([^/]+)\/files\/([^/]+)$/.exec(path);
        if (fileMatch) {
            const file = await dependencies.studies.file(user.id, fileMatch[1], fileMatch[2], dependencies.uploadRoot);
            return new Response(file.bytes as unknown as BodyInit, {
                headers: {
                    "Content-Type": "mimeType" in file ? String(file.mimeType) : "application/pdf",
                    "X-Content-Type-Options": "nosniff",
                    "Content-Length": String(file.bytes.length),
                    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
                    "Cache-Control": "no-store",
                },
            });
        }
        const detailMatch = /^studies\/([^/]+)$/.exec(path);
        if (detailMatch)
            return json({
                study: await dependencies.studies.detail(user.id, detailMatch[1]),
            });
        throw new ReadingError();
    }
    catch (error) {
        const known = error instanceof AuthError || error instanceof ReadingError;
        const unavailableStorage = path === "studies" &&
            request.method === "POST" &&
            ["ENOSPC", "EACCES"].includes((error as NodeJS.ErrnoException)?.code ?? "");
        const status = known ? error.status : unavailableStorage ? 503 : 500;
        const code = known
            ? error.code
            : unavailableStorage
                ? "UPLOAD_UNAVAILABLE"
                : "INTERNAL_ERROR";
        const message = status === 401
            ? "La sesión venció. Iniciá sesión nuevamente."
            : status === 404
                ? "No encontrado."
                : status === 429
                    ? code === "UPLOAD_LIMIT_REACHED"
                        ? "Alcanzaste el límite diario de estudios. Intentá nuevamente el próximo día."
                        : "Demasiados intentos. Esperá un minuto."
                    : status >= 500
                        ? "No se pudo completar la operación. Intentá nuevamente."
                        : "Solicitud inválida.";
        return json({ error: { code, message }, requestId }, status);
    }
}
