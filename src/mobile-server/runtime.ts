import { pool } from "@/src/lib/database/connection";
import { studyService } from "@/src/features/studies/services/study.service";
import { MobileAuth } from "./auth";
import { MysqlAuthStore } from "./mysql-auth-store";
import { MobileStudies } from "./studies";
import { MysqlStudyReading } from "./mysql-study-reading";
import { MysqlFamily } from "./mysql-family";
import { MysqlFamilyStudyReading } from "./mysql-family-study-reading";
import { MysqlStudyUpload } from "./mysql-study-upload";
import { assertUploadSession } from "./upload-session";
import { MysqlStudyDeletion } from './mysql-study-deletion';
import { MysqlStudyAnalysis } from './mysql-study-analysis';
export function mobileRuntime() {
    const origin = process.env.MOBILE_ORIGIN;
    if (!origin)
        throw new Error("MOBILE_ORIGIN is required");
    return {
        auth: new MobileAuth(new MysqlAuthStore(pool), {
            origin,
            redirect: "com.matyalts.misaluteca://auth/callback",
            allowExpoGo: process.env.MOBILE_ALLOW_EXPO_GO === "true",
        }),
        studies: new MobileStudies(new MysqlStudyReading(pool, (id, userId) => studyService.getStudyById(id, userId))),
        uploadRoot: process.env.DIRECTORY_UPLOADS || "/app/uploads",
        trustedProxy: process.env.MOBILE_TRUST_PROXY_HEADERS === "true",
    };
}
export async function mobileApiRuntime() {
    const base = mobileRuntime(), upload = new MysqlStudyUpload(pool, base.uploadRoot);
    const runtime = {
        uploadSession: assertUploadSession,
        studyDeletion: new MysqlStudyDeletion(pool),
        studyDeleteReady: process.env.MOBILE_CLEANUP_SUPERVISED === 'true',
        analysis: new MysqlStudyAnalysis(pool),
        ...base,
        upload,
        uploadReady: process.env.MOBILE_UPLOAD_SUPERVISED === "true",
    }, family = new MysqlFamily(pool);
    if (!(await family.ready()))
        return runtime;
    return {
        ...runtime,
        family,
        familyDeleteReady: process.env.MOBILE_CLEANUP_SUPERVISED === "true",
        studies: new MobileStudies(new MysqlFamilyStudyReading(pool)),
    };
}
