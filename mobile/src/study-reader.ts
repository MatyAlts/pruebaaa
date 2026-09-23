export type Study = {
  patient?: { kind: "self" | "family"; id: string; name: string };
  id: string; title: string | null; date: string; medico?: string | null;
  institution?: string | null; description?: string | null; conclusion?: string | null;
  files?: { id: string; name: string; mimeType: string }[];
};
export type Reader = { get<T>(path: string): Promise<T> };
export type Page = { items: Study[]; nextCursor: string | null };
export type Summary = {
  scope: "self" | "all" | "family"; propiosTotal: number; familiaresTotal: number | null; total: number | null; recientes: Study[];
  filterOptions: { medicos: string[]; institutions: string[]; years: number[] };
};
export type Filters = { q: string; medico: string; institution: string; month: string; year: string };
export const emptyFilters: Filters = { q: "", medico: "", institution: "", month: "", year: "" };

export function studyQuery(filters: Filters, cursor?: string | null) {
  const query = new URLSearchParams({ sort: "study-date-desc" });
  for (const [key, value] of Object.entries(filters)) if (value.trim()) query.set(key, value.trim());
  if (cursor) query.set("cursor", cursor);
  return `/studies?${query.toString()}`;
}
