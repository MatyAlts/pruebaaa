import {
  render,
  renderAsync,
  fireEventAsync,
} from "@testing-library/react-native";
import App, { AppScreen } from "../App";
import { MobileClient } from "../src/session";
import { PdfCoordinator } from "../src/pdf";
test("logout removes the study screen immediately without waiting for server", async () => {
  const client = new MobileClient("https://test.invalid", {
    fetch: jest.fn(() => new Promise(() => {})),
    storage: {
      get: async () => null,
      set: async () => {},
      remove: async () => {},
    },
    browser: jest.fn(),
    proof: jest.fn(),
    cleanup: async () => {},
  });
  client.state = {
    user: { id: "17", name: "Usuario de prueba" },
    busy: false,
    message: null,
  };
  jest.spyOn(client, "restore").mockResolvedValue();
  jest
    .spyOn(client, "get")
    .mockResolvedValue({
      items: [{ id: "12", title: "Privado", date: "2026-09-17" }],
      nextCursor: null,
    });
  const pdf = new PdfCoordinator(
    client,
    { save: jest.fn(), remove: jest.fn(), clear: jest.fn() },
    { preview: jest.fn(), close: jest.fn() },
  );
  const screen = await renderAsync(<AppScreen services={{ client, pdf }} />);
  expect(screen.getByText("Mis estudios")).toBeTruthy();
  await fireEventAsync.press(screen.getByText("Cerrar sesión"));
  expect(screen.queryByText("Mis estudios")).toBeNull();
  expect(screen.queryByText("Usuario de prueba")).toBeNull();
  expect(screen.getByText("Continuar con Google")).toBeTruthy();
});
jest.mock("../src/native-adapters", () => ({
  createNativeClient: () => {
    throw new Error("El servicio de Mi Saluteca no está configurado.");
  },
}));
test("entry offers Google login and reports configuration without credentials", async () => {
  const screen = await render(<App />);
  expect(
    screen.getByText("El servicio de Mi Saluteca no está configurado."),
  ).toBeTruthy();
  expect(screen.getByText("Continuar con Google")).toBeTruthy();
});

test("primera apertura muestra identidad sin copy de prueba", async () => {
  const screen = await render(<App />);
  expect(screen.getByText("Mi Saluteca")).toBeTruthy();
  expect(
    screen.getByText(
      "Tu salud, siempre con vos.",
    ),
  ).toBeTruthy();
});

test("reapertura y re-render conservan contenido con servicios externos indisponibles", () => {
  const request = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("sin conectividad"));
  try {
    const first = render(<App />);
    first.unmount();
    const reopened = render(<App />);
    reopened.rerender(<App />);
    expect(reopened.getByRole("header", { name: "Mi Saluteca" })).toBeTruthy();
    expect(
      reopened.getByText(
        "Tu salud, siempre con vos.",
      ),
    ).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  } finally {
    request.mockRestore();
  }
});
