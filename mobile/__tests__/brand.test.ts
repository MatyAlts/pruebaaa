import { brand } from "../src/brand";

test("brand tokens keep readable clinical ink and bundled Inter", () => {
  expect(brand.colors.ink).toBe("#0F172A");
  expect(brand.typography.title.style.fontFamily).toBe("Inter_700Bold");
  expect(brand.typography.body.allowFontScaling).toBe(true);
});

test("brand spacing and radii use the shared 4-point scale", () => {
  expect(brand.spacing.lg).toBe(24);
  expect(brand.radius.card).toBe(16);
});
