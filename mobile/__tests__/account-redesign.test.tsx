import { fireEvent, render } from "@testing-library/react-native";
import Account from "../app/(tabs)/account";
import { useSession } from "../src/session-provider";

jest.mock("../src/session-provider", () => ({ useSession: jest.fn() }));
const session = jest.mocked(useSession);
const logout = jest.fn();
beforeEach(() => logout.mockClear());
function identity(busy = false) {
  session.mockReturnValue({ state: { user: { id: "fictional", name: "Persona de prueba", email: "sample@example.invalid" }, busy, message: null }, client: { logout } as never, configurationError: null, fontsReady: true, capabilities: {}, capabilitiesReady: true, historyRevision: 0, invalidateHistory: jest.fn() });
}
test("account displays current identity without inventing provider or profile editing destination", () => {
  identity(); const screen = render(<Account />);
  expect(screen.getByText("Persona de prueba")).toBeTruthy();
  expect(screen.getByText("sample@example.invalid")).toBeTruthy();
  expect(screen.queryByText("Conectada con Google")).toBeNull();
  expect(screen.queryByRole("button", { name: /Editar perfil/ })).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(logout).toHaveBeenCalledTimes(1);
});
test("account blocks logout while existing session operation is busy", () => {
  identity(true); const screen = render(<Account />);
  expect(screen.queryByText("Conectada con Google")).toBeNull();
  expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeDisabled();
  fireEvent.press(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(logout).not.toHaveBeenCalled();
});
