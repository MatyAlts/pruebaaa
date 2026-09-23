import { loadCapabilities } from "../src/capabilities";
import { SessionError } from "../src/session";
test("upload and private image flags require exact independent readiness", async () => {
  const ready = await loadCapabilities({ get: async <T,>() => ({ features: { studiesUpload: true, studyImagesRead: true } }) as T });
  expect(ready.studiesUpload).toBe(true); expect(ready.studyImagesRead).toBe(true);
  const legacy = await loadCapabilities({ get: async <T,>() => ({ features: { studiesUpload: "true", studyImagesRead: false, studiesRead: true } }) as T });
  expect(legacy.studiesUpload).toBeUndefined(); expect(legacy.studyImagesRead).toBeUndefined();
});
test("family permissions are read independently from canonical server flags", async () => {
  const value = await loadCapabilities({ get: async <T,>() => ({ features: { familyRead: true, familyWrite: true, familyDelete: false, studiesFamilyScope: true } }) as T });
  expect(value.familyRead).toBe(true); expect(value.familyWrite).toBe(true); expect(value.familyDelete).not.toBe(true); expect(value.studiesFamilyScope).toBe(true);
});
test("read-only or legacy flags never imply family mutations or patient scopes", async () => {
  const value = await loadCapabilities({ get: async <T,>() => ({ features: { familyRead: true, familyWrite: "true", familyDelete: 1, studiesRead: true } }) as T });
  expect(value.familyRead).toBe(true); expect(value.familyWrite).toBeUndefined(); expect(value.familyDelete).toBeUndefined(); expect(value.studiesFamilyScope).toBeUndefined();
});

test("uses known read-only capabilities when an older backend returns 404", async () => {
  const value = await loadCapabilities({
    get: async () => { throw new SessionError("404", "No encontrado."); },
  });
  expect(value).toEqual({ studiesRead: true, profile: true, logout: true });
});

test("production reading destinations are enabled only by explicit server capabilities", async () => {
  const value = await loadCapabilities({ get: async <T,>() => ({ features: { studiesRead: true, studiesSummary: true, studiesSearch: true } }) as T });
  expect(value.studiesSummary).toBe(true);
  expect(value.studiesSearch).toBe(true);
});

test("keeps absent or false server flags unavailable", async () => {
  const value = await loadCapabilities({
    get: async <T,>() => ({ features: { studiesRead: true, family: false } }) as T,
  });
  expect(value).toEqual({ studiesRead: true, profile: false, logout: false });
  expect(value.studiesSummary).not.toBe(true);
  expect(value.studiesSearch).not.toBe(true);
});
