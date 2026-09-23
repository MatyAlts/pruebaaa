import { studyQuery } from "../src/study-reader";

test("queries the complete server history with search and explicit date order", () => {
  expect(studyQuery({ q: "control & análisis", medico: "", institution: "", month: "", year: "" })).toBe("/studies?sort=study-date-desc&q=control+%26+an%C3%A1lisis");
});

test("filters and opaque cursor stay encoded independently with no empty fields", () => {
  expect(studyQuery({ q: " ", medico: "Dra. Ana", institution: "Hospital Norte", month: "9", year: "2026" }, "a+/==")).toBe("/studies?sort=study-date-desc&medico=Dra.+Ana&institution=Hospital+Norte&month=9&year=2026&cursor=a%2B%2F%3D%3D");
});
