import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { LoginScreen } from "../src/LoginScreen";
import { Linking } from "react-native";

test("web-branded Google action starts the existing login once", async () => {
  let finish!: () => void;
  const login = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
  const screen = render(<LoginScreen login={login} busy={false} message={null} legalOrigin="https://test.invalid" />);
  const google = screen.getByRole("button", { name: "Acceder con Google" });
  fireEvent.press(google);
  fireEvent.press(google);
  expect(login).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(google).not.toBeDisabled());
});

test("pending restoration keeps Google disabled and cancellation allows retry", async () => {
  const login = jest.fn().mockResolvedValue(undefined);
  const screen = render(<LoginScreen login={login} busy legalOrigin="https://test.invalid" message={null} />);
  fireEvent.press(screen.getByRole("button", { name: "Acceder con Google" }));
  expect(login).not.toHaveBeenCalled();
  screen.rerender(<LoginScreen login={login} busy={false} legalOrigin="https://test.invalid" message={null} />);
  fireEvent.press(screen.getByRole("button", { name: "Acceder con Google" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Acceder con Google" })).not.toBeDisabled());
  fireEvent.press(screen.getByRole("button", { name: "Acceder con Google" }));
  await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
});

test("legal links open the configured HTTPS website without session credentials", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  const screen = render(<LoginScreen login={jest.fn()} busy={false} message={null} legalOrigin="https://test.invalid" />);
  fireEvent.press(screen.getByRole("link", { name: "Términos" }));
  await waitFor(() => expect(open).toHaveBeenCalledWith("https://test.invalid/terminos"));
  open.mockRestore();
});

test("privacy link uses the same origin and browser failures expose retry feedback", async () => {
  const open = jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("browser unavailable"));
  const screen = render(<LoginScreen login={jest.fn()} busy={false} message={null} legalOrigin="https://test.invalid" />);
  fireEvent.press(screen.getByRole("link", { name: "Política de Privacidad" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/No pudimos abrir la página/));
  expect(open).toHaveBeenCalledWith("https://test.invalid/privacidad");
  expect(screen.getByRole("button", { name: "Acceder con Google" })).not.toBeDisabled();
  open.mockRestore();
});

test("network feedback keeps the local login readable without private information", async () => {
  const screen = render(<LoginScreen login={jest.fn().mockRejectedValue(new Error("network"))} busy={false} message={null} legalOrigin="https://test.invalid" />);
  fireEvent.press(screen.getByRole("button", { name: "Acceder con Google" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/No pudimos conectar tu cuenta/));
  expect(screen.getByRole("button", { name: "Acceder con Google" })).not.toBeDisabled();
  expect(screen.queryByText("Mis estudios")).toBeNull();
});

test("restore and cancellation have visible feedback without inventing a session", async () => {
  const screen = render(<LoginScreen login={jest.fn().mockResolvedValue(false)} busy message={null} legalOrigin="https://test.invalid" />);
  expect(screen.getByText("Restaurando tu sesión…")).toBeTruthy();
  screen.rerender(<LoginScreen login={jest.fn().mockResolvedValue(false)} busy={false} message={null} legalOrigin="https://test.invalid" />);
  fireEvent.press(screen.getByRole("button", { name: "Acceder con Google" }));
  await waitFor(() => expect(screen.getByText("Inicio de sesión cancelado. Podés volver a intentar.")).toBeTruthy());
});

test("unexpected server details never reveal credentials in the login screen", () => {
  const screen = render(<LoginScreen login={jest.fn()} busy={false} message="Bearer eyJhbGci.test.secret refreshToken=private-value" legalOrigin="https://test.invalid" />);
  expect(screen.queryByText(/private-value|eyJhbGci/)).toBeNull();
  expect(screen.getByRole("alert")).toHaveTextContent("No pudimos iniciar sesión. Volvé a intentar.");
});

test("recognized offline feedback remains useful without displaying unknown server internals", () => {
  const screen = render(<LoginScreen login={jest.fn()} busy={false} message="No hay conexión con Mi Saluteca. Volvé a intentar." legalOrigin="https://test.invalid" />);
  expect(screen.getByRole("alert")).toHaveTextContent("No hay conexión con Mi Saluteca. Volvé a intentar.");
  expect(screen.getByRole("button", { name: "Acceder con Google" })).not.toBeDisabled();
});
