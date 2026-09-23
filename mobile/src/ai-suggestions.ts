import { validateUploadDraft, type UploadDraft } from "./upload-draft";

export const suggestionFields = ["title", "institution", "medico", "date", "conclusion"] as const;
export type SuggestionField = typeof suggestionFields[number];
export type Suggestions = Partial<Record<SuggestionField, string>>;
export type FieldVersions = Partial<Record<SuggestionField, number>>;

export function validateSuggestions(value: unknown): Suggestions {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("La IA respondió con sugerencias inválidas.");
  const result: Suggestions = {};
  const entries = Object.entries(value);
  for (const [key, text] of entries) {
    if (!suggestionFields.includes(key as SuggestionField) || typeof text !== "string") throw new Error("La IA respondió con campos no admitidos.");
    result[key as SuggestionField] = text.trim();
  }
  const draft: UploadDraft = { date: "01-01-2026", title: "", institution: "", medico: "", conclusion: "", description: "", patient: "self", files: [], ...result };
  if (!draft.date) draft.date = "01-01-2026";
  const errors = validateUploadDraft(draft);
  for (const field of suggestionFields) {
    if (errors[field]) throw new Error("La IA respondió con una fecha o un campo fuera de los límites.");
  }
  return result;
}

export function applySuggestions(
  draft: UploadDraft,
  suggestions: Suggestions,
  selected: SuggestionField[],
  started: FieldVersions,
  current: FieldVersions,
  overwrite: SuggestionField[] = [],
): UploadDraft {
  const result = { ...draft };
  for (const field of selected) {
    const value = suggestions[field];
    if (typeof value === "string" && ((started[field] ?? 0) === (current[field] ?? 0) || overwrite.includes(field))) result[field] = value;
  }
  return result;
}
