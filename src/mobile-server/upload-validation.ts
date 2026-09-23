import { ReadingError } from "./studies.ts";
export const UPLOAD_LIMITS = {
  files: 10,
  fileBytes: 10 * 1024 * 1024,
  totalBytes: 50 * 1024 * 1024,
  envelopeBytes: 50 * 1024 * 1024,
  maxImageEdge: 8192,
  maxImagePixels: 24_000_000,
};
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type UploadFields = {
  date: string;
  title: string;
  institution: string | null;
  medico: string | null;
  conclusion: string | null;
  description: string | null;
  patient: "self" | "family";
  familyUuid: string | null;
};
export function validateUploadFields(
  input: Record<string, string>,
): UploadFields {
  const date = input.date;
  if (!/^\d{2}-\d{2}-[1-9]\d{3}$/.test(date ?? ""))
    throw new ReadingError(400, "INVALID_DATE");
  const [day, month, year] = date.split("-").map(Number),
    actual = new Date(Date.UTC(year, month - 1, day));
  if (
    actual.getUTCFullYear() !== year ||
    actual.getUTCMonth() !== month - 1 ||
    actual.getUTCDate() !== day
  )
    throw new ReadingError(400, "INVALID_DATE");
  const patient = input.patient;
  if (
    (patient !== "self" && patient !== "family") ||
    (patient === "self" && input.familyUuid) ||
    (patient === "family" && !UUID.test(input.familyUuid ?? ""))
  )
    throw new ReadingError(400, "INVALID_PATIENT");
  const limits = {
    title: 400,
    institution: 400,
    medico: 400,
    conclusion: 10000,
    description: 2000,
  };
  const output: Record<string, string | null> = {};
  for (const [key, maximum] of Object.entries(limits)) {
    const value = (input[key] ?? "").trim();
    if ([...value].length > maximum)
      throw new ReadingError(400, "INVALID_FIELDS");
    output[key] = value || null;
  }
  if (
    Object.keys(input).some(
      (key) =>
        !["date", "patient", "familyUuid", ...Object.keys(limits)].includes(
          key,
        ),
    )
  )
    throw new ReadingError(400, "INVALID_FIELDS");
  return {
    date,
    title: output.title ?? "Estudio médico",
    institution: output.institution,
    medico: output.medico,
    conclusion: output.conclusion,
    description: output.description,
    patient,
    familyUuid: patient === "family" ? input.familyUuid.toLowerCase() : null,
  };
}
