export type UploadFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};
export type UploadDraft = {
  date: string;
  title: string;
  institution: string;
  medico: string;
  conclusion: string;
  description: string;
  patient: "self" | "family";
  familyUuid?: string;
  files: UploadFile[];
};
export type UploadErrors = Partial<Record<keyof UploadDraft, string>>;
export function validateUploadDraft(draft: UploadDraft): UploadErrors {
  const errors: UploadErrors = {};
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(draft.date);
  const day = Number(match?.[1]),
    month = Number(match?.[2]),
    year = Number(match?.[3]);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    !match ||
    year < 1000 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    errors.date = "Ingresá una fecha válida en formato DD-MM-AAAA.";
  }
  const limits = {
    title: 400,
    institution: 400,
    medico: 400,
    conclusion: 10000,
    description: 2000,
  };
  for (const field of Object.keys(limits) as (keyof typeof limits)[]) {
    if (Array.from(draft[field].trim()).length > limits[field])
      errors[field] = `El máximo es ${limits[field]} caracteres.`;
  }
  if (draft.patient === "family" && !draft.familyUuid)
    errors.familyUuid = "Elegí un integrante del grupo familiar.";
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (
    !draft.files.length ||
    draft.files.length > 10 ||
    draft.files.some(
      (file) =>
        !file.uri.startsWith("file://") ||
        !allowed.includes(file.mimeType) ||
        !Number.isSafeInteger(file.size) ||
        file.size <= 0 ||
        file.size > 10485760,
    ) ||
    draft.files.reduce((total, file) => total + file.size, 0) > 52428800
  ) {
    errors.files =
      "Adjuntá hasta 10 archivos PDF, JPEG o PNG de hasta 10 MiB cada uno y 50 MiB en total.";
  }
  return errors;
}
