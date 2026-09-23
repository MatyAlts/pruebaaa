import { act, render, waitFor } from "@testing-library/react-native";
import { StrictMode } from "react";
import { SessionProvider } from "../src/session-provider";
import { MobileClient } from "../src/session";
import TabsLayout from "../app/(tabs)/_layout";
import { TabSwipeProvider } from "../src/tab-swipe";
const mockNavigate = jest.fn();

jest.mock("expo-router", () => { const { Text } = require("react-native"); return { usePathname: () => "/studies", useRouter: () => ({ navigate: mockNavigate }), Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text> }; });
jest.mock("expo-router/unstable-native-tabs", () => { const { Text, View } = require("react-native"); return { NativeTabs: Object.assign(({ children }: { children: React.ReactNode }) => <View>{children}</View>, { Trigger: Object.assign(({ children }: { children: React.ReactNode }) => <View>{children}</View>, { Label: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>, Icon: () => null }) }) }; });
test("swipe context reflects capability gated tabs and navigates the existing native destination", async () => {
  const client = new MobileClient("https://test.invalid", { fetch: jest.fn(), storage: { get: async () => null, set: async () => {}, remove: async () => {} }, browser: jest.fn(), proof: jest.fn(), cleanup: async () => {} });
  client.state = { user: { id: "fictional", name: "Prueba" }, busy: false, message: null };
  jest.spyOn(client, "get").mockResolvedValue({ features: { studiesRead: true, studiesSummary: true, familyRead: true } });
  const screen = render(<SessionProvider createServices={() => ({ client, pdf: {} as never })}><TabsLayout /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("Familia")).toBeTruthy());
  const provider = screen.UNSAFE_getByType(TabSwipeProvider);
  expect(provider.props.tabs).toEqual(["home", "studies", "family", "account"]);
  expect(provider.props.currentTab).toBe("studies");
  act(() => provider.props.navigate("family"));
  expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/family");
});
test("Familia appears only after an identity-bound real server familyRead flag", async () => {
  const client = new MobileClient("https://test.invalid", { fetch: jest.fn(), storage: { get: async () => null, set: async () => {}, remove: async () => {} }, browser: jest.fn(), proof: jest.fn(), cleanup: async () => {} });
  client.state = { user: { id: "17", name: "Ana" }, busy: false, message: null };
  jest.spyOn(client, "get").mockResolvedValue({ features: { studiesRead: true, familyRead: true, familyWrite: true } });
  const screen = render(<SessionProvider createServices={() => ({ client, pdf: {} as never })}><TabsLayout /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("Familia")).toBeTruthy());
});

test("product tabs keep anonymous state public", async () => {
  const client = new MobileClient("https://test.invalid", { fetch: jest.fn(), storage: { get: async () => null, set: async () => {}, remove: async () => {} }, browser: jest.fn(), proof: jest.fn(), cleanup: async () => {} });
  const restore = jest.spyOn(client, "restore");
  const screen = render(<SessionProvider createServices={() => ({ client, pdf: {} as never })}><TabsLayout /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("redirect:/")).toBeTruthy());
  expect(restore).toHaveBeenCalledTimes(1);
});

test("product tabs expose only the real authenticated destinations", async () => {
  const client = new MobileClient("https://test.invalid", { fetch: jest.fn(), storage: { get: async () => null, set: async () => {}, remove: async () => {} }, browser: jest.fn(), proof: jest.fn(), cleanup: async () => {} });
  client.state = { user: { id: "17", name: "Prueba" }, busy: false, message: null };
  const screen = render(<SessionProvider createServices={() => ({ client, pdf: {} as never })}><TabsLayout /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("Estudios")).toBeTruthy());
  expect(screen.getByText("Cuenta")).toBeTruthy();
  expect(screen.UNSAFE_getByType(TabSwipeProvider).props.tabs).toEqual(["studies", "account"]);
});

test("Inicio is presented only after the authenticated backend confirms its real summary", async () => {
  const client = new MobileClient("https://test.invalid", { fetch: jest.fn(), storage: { get: async () => null, set: async () => {}, remove: async () => {} }, browser: jest.fn(), proof: jest.fn(), cleanup: async () => {} });
  client.state = { user: { id: "17", name: "Ana" }, busy: false, message: null };
  jest.spyOn(client, "get").mockResolvedValue({ features: { studiesRead: true, studiesSummary: true, studiesSearch: true, profile: true, logout: true } });
  const screen = render(<SessionProvider createServices={() => ({ client, pdf: {} as never })}><TabsLayout /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("Inicio")).toBeTruthy());
  expect(screen.queryByText("Familia")).toBeNull();
});

test("StrictMode keeps the product client restore single-flight while tabs mount", async () => {
  const client = new MobileClient("https://test.invalid", { fetch: jest.fn(), storage: { get: async () => null, set: async () => {}, remove: async () => {} }, browser: jest.fn(), proof: jest.fn(), cleanup: async () => {} });
  const restore = jest.spyOn(client, "restore");
  const createServices = jest.fn(() => ({ client, pdf: {} as never }));

  render(
    <StrictMode>
      <SessionProvider createServices={createServices}>
        <TabsLayout />
      </SessionProvider>
    </StrictMode>,
  );

  await waitFor(() => expect(restore).toHaveBeenCalledTimes(1));
  expect(createServices).toHaveBeenCalled();
});

test("a logout wins over a late restore before tabs can expose private destinations", async () => {
  let resolveRestore: ((value: string | null) => void) | undefined;
  const restoreToken = new Promise<string | null>((resolve) => { resolveRestore = resolve; });
  const client = new MobileClient("https://test.invalid", {
    fetch: jest.fn(),
    storage: { get: jest.fn().mockImplementationOnce(() => restoreToken).mockResolvedValueOnce(null), set: async () => {}, remove: async () => {} },
    browser: jest.fn(), proof: jest.fn(), cleanup: async () => {},
  });
  client.state = { user: { id: "17", name: "Prueba" }, busy: false, message: null };
  const screen = render(<SessionProvider createServices={() => ({ client, pdf: {} as never })}><TabsLayout /></SessionProvider>);

  await waitFor(() => expect(client.state.busy).toBe(true));
  await act(async () => { await client.logout(); });
  await act(async () => { resolveRestore?.("stale-refresh-token"); });

  await waitFor(() => expect(screen.getByText("redirect:/")).toBeTruthy());
  expect(screen.queryByText("Estudios")).toBeNull();
  expect(screen.queryByText("Cuenta")).toBeNull();
});
