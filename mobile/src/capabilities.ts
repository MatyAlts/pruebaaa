import { SessionError } from "./session";

export type Capabilities = { studiesRead: boolean; profile: boolean; logout: boolean; studiesSummary?: boolean; studiesSearch?: boolean; familyRead?: boolean; familyWrite?: boolean; familyDelete?: boolean; studiesFamilyScope?: boolean; studiesUpload?: boolean; studyImagesRead?: boolean; studiesDelete?: boolean; studiesAnalyze?: boolean };
const legacy: Capabilities = { studiesRead: true, profile: true, logout: true };

export async function loadCapabilities(client: { get<T>(path: string): Promise<T> }): Promise<Capabilities> {
  try {
    const response = await client.get<{ features?: Partial<Capabilities> }>("/capabilities");
    return {
      studiesRead: response.features?.studiesRead === true,
      profile: response.features?.profile === true,
      logout: response.features?.logout === true,
      ...(response.features?.studiesSummary === true ? { studiesSummary: true } : {}),
      ...(response.features?.studiesSearch === true ? { studiesSearch: true } : {}),
      ...(response.features?.familyRead === true ? { familyRead: true } : {}),
      ...(response.features?.familyWrite === true ? { familyWrite: true } : {}),
      ...(response.features?.familyDelete === true ? { familyDelete: true } : {}),
      ...(response.features?.studiesFamilyScope === true ? { studiesFamilyScope: true } : {}),
      ...(response.features?.studiesUpload === true ? { studiesUpload: true } : {}),
      ...(response.features?.studyImagesRead === true ? { studyImagesRead: true } : {}),
      ...(response.features?.studiesDelete === true ? { studiesDelete: true } : {}),
      ...(response.features?.studiesAnalyze === true ? { studiesAnalyze: true } : {}),
    };
  } catch (error) {
    if (error instanceof SessionError && error.code === "404") return legacy;
    throw error;
  }
}
