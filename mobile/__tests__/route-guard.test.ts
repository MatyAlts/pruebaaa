import { privateRoute } from "../src/route-guard";

test("holds private navigation while restore is unresolved and redirects anonymous users", () => {
  expect(privateRoute({ user: null, busy: true })).toBe("pending");
  expect(privateRoute({ user: null, busy: false })).toBe("public");
});

test("allows a resolved authenticated session", () => {
  expect(privateRoute({ user: { id: "17", name: "Prueba" }, busy: false })).toBe("private");
});
