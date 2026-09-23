import { validateUploadDraft } from "../src/upload-draft";

const draft = {
  date: "29-02-2024",
  title: "",
  institution: "",
  medico: "",
  conclusion: "",
  description: "",
  patient: "self" as const,
  files: [
    {
      uri: "file:///report.pdf",
      name: "report.pdf",
      mimeType: "application/pdf",
      size: 120,
    },
  ],
};
test("accepts a valid civil date and a PDF for my history", () => {
  expect(validateUploadDraft(draft)).toEqual({});
});
test("requires attachments and a family when family patient is selected", () => {
  const errors = validateUploadDraft({
    ...draft,
    files: [],
    patient: "family",
  });
  expect(errors.files).toBeTruthy();
  expect(errors.familyUuid).toBeTruthy();
});
test("rejects excessive file count, bytes, unsupported formats and remote URIs", () => {
  const file = draft.files[0];
  expect(
    validateUploadDraft({ ...draft, files: Array(11).fill(file) }).files,
  ).toBeTruthy();
  expect(
    validateUploadDraft({ ...draft, files: [{ ...file, size: 10485761 }] })
      .files,
  ).toBeTruthy();
  expect(
    validateUploadDraft({
      ...draft,
      files: Array(6).fill({ ...file, size: 10485760 }),
    }).files,
  ).toBeTruthy();
  expect(
    validateUploadDraft({
      ...draft,
      files: [{ ...file, mimeType: "application/msword" }],
    }).files,
  ).toBeTruthy();
  expect(
    validateUploadDraft({
      ...draft,
      files: [{ ...file, uri: "https://foreign/report.pdf" }],
    }).files,
  ).toBeTruthy();
});
test("counts trimmed Unicode characters for exact web field limits", () => {
  expect(
    validateUploadDraft({ ...draft, title: ` ${"🙂".repeat(400)} ` }).title,
  ).toBeUndefined();
  for (const [field, limit] of Object.entries({
    title: 400,
    institution: 400,
    medico: 400,
    conclusion: 10000,
    description: 2000,
  })) {
    expect(
      validateUploadDraft({ ...draft, [field]: "🙂".repeat(limit + 1) })[
        field as keyof typeof draft
      ],
    ).toBeTruthy();
  }
});
test.each(["29-02-2023", "31-04-2024", "2024-02-29", "", "00-12-2024"])(
  "rejects invalid civil date %s",
  (date) => {
    expect(validateUploadDraft({ ...draft, date }).date).toBeTruthy();
  },
);
