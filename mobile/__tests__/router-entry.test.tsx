import { render } from "@testing-library/react-native";
import Entry from "../app/index";
import { SessionProvider } from "../src/session-provider";

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => <>{`redirect:${href}`}</>,
}));

test("the product entry keeps a visible local CONFIG state when services cannot start", () => {
  const screen = render(
    <SessionProvider createServices={() => { throw new Error("El servicio de Mi Saluteca no está configurado."); }}>
      <Entry />
    </SessionProvider>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(/no está configurado/);
  expect(screen.getByRole("button", { name: "Acceder con Google" })).toBeDisabled();
});
