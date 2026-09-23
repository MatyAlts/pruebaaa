import { render, waitFor } from "@testing-library/react-native";
import { ScrollView, StyleSheet } from "react-native";
import Account from "../app/(tabs)/account";
import Studies from "../app/(tabs)/studies";
import { SessionProvider } from "../src/session-provider";
import { MobileClient } from "../src/session";
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

function services(get: jest.Mock) {
  const client = new MobileClient("https://test.invalid", {
    fetch: jest.fn(),
    storage: { get: async () => null, set: async () => {}, remove: async () => {} },
    browser: jest.fn(),
    proof: jest.fn(),
    cleanup: async () => {},
  });
  client.state = { user: { id: "17", name: "Ana", email: "ana@example.com" }, busy: false, message: null };
  jest.spyOn(client, "get").mockImplementation(get);
  return { client, pdf: { open: jest.fn() } as never };
}

test("Estudios uses the native brand while showing loading and a recoverable read error", async () => {
  const productServices = services(jest.fn().mockRejectedValue(new Error("Sin conexi\u00f3n")));
  const screen = render(<SessionProvider createServices={() => productServices}><Studies /></SessionProvider>);

  const loading = screen.getByText("Cargando\u2026");
  expect(StyleSheet.flatten(loading.props.style).fontFamily).toBeUndefined();
  expect(loading.props.allowFontScaling).toBe(true);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Sin conexi\u00f3n"));
  expect(StyleSheet.flatten(screen.getByRole("alert").props.style).fontFamily).toBeUndefined();
  const heading = screen.getByRole("header", { name: "Mis estudios" });
  expect(StyleSheet.flatten(heading.props.style).fontWeight).toBe("700");
  expect(heading.props.allowFontScaling).toBe(true);
  expect(screen.getByText("Reintentar")).toBeTruthy();
});

test("Cuenta uses the same readable brand tokens with the restored identity", async () => {
  const productServices = services(jest.fn());
  const screen = render(<SessionProvider createServices={() => productServices}><Account /></SessionProvider>);

  await waitFor(() => expect(screen.getByText("Ana")).toBeTruthy());
  const heading = screen.getByRole("header", { name: "Cuenta" });
  expect(StyleSheet.flatten(heading.props.style).fontWeight).toBe("700");
  expect(heading.props.allowFontScaling).toBe(true);
  expect(screen.getByText("ana@example.com")).toBeTruthy();
  expect(screen.getByText("Cerrar sesi\u00f3n")).toBeTruthy();
});

test("Cuenta lets UIKit inset its first scroll view instead of placing the profile under the status bar", async () => {
  const productServices = services(jest.fn());
  const screen = render(<SessionProvider createServices={() => productServices}><Account /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("Ana")).toBeTruthy());
  expect(screen.UNSAFE_getByType(ScrollView).props.contentInsetAdjustmentBehavior).toBe("automatic");
});
