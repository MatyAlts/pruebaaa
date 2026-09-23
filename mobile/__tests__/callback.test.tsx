import { render } from "@testing-library/react-native";
import Callback from "../app/auth/callback";

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text> };
});

test("a router callback is neutral and never exchanges a token", () => {
  const request = jest.spyOn(global, "fetch");
  try {
    const screen = render(<Callback />);
    expect(screen.getByText("redirect:/")).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  } finally {
    request.mockRestore();
  }
});
