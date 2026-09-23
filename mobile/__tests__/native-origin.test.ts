import { configuredApiOrigin } from "../src/native-origin";

describe("configuredApiOrigin", () => {
  test.each([
    "https://saluteca.matyalts.me",
    "https://api.example.test",
  ])("preserves a valid configured HTTPS origin: %s", (origin) => {
    expect(configuredApiOrigin(origin)).toBe(origin);
  });

  test.each([undefined, "http://api.example.test", "https://api.example.test/path"])(
    "rejects a missing or invalid origin: %s",
    (origin) => {
      expect(() => configuredApiOrigin(origin)).toThrow(
        "El servicio de Mi Saluteca no está configurado.",
      );
    },
  );
});
