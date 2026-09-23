import { renderAsync } from "@testing-library/react-native";
import Family from "../app/(tabs)/family";
let mockSession: Record<string, unknown>;
jest.mock("../src/session-provider", () => ({ useSession: () => mockSession }));
jest.mock("expo-router", () => { const { Text } = jest.requireActual("react-native"); return { useRouter:()=>({push:jest.fn()}), Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text> }; });
jest.mock("../src/FamilyScreen", () => { const { Text } = jest.requireActual("react-native"); return { FamilyScreen: ({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) => <Text>{`family:write=${canWrite}:delete=${canDelete}`}</Text> }; });
test("family route enables real read-only folders while worker delete is unavailable", async () => {
  mockSession = { state: { user: { id: "17" } }, capabilitiesReady: true, capabilities: { familyRead: true, familyWrite: true, familyDelete: false }, client: {}, pdf: {} };
  const screen = await renderAsync(<Family />); expect(screen.getByText("family:write=true:delete=false")).toBeTruthy();
});
test("legacy backend never exposes family route despite a signed-in user", async () => {
  mockSession = { state: { user: { id: "17" } }, capabilitiesReady: true, capabilities: { studiesRead: true }, client: {}, pdf: {} };
  const screen = await renderAsync(<Family />); expect(screen.getByText("redirect:/(tabs)/studies")).toBeTruthy();
});
test("logout immediately removes private family content", async () => {
  mockSession = { state: { user: null }, capabilitiesReady: true, capabilities: { familyRead: true }, client: {}, pdf: {} };
  const screen = await renderAsync(<Family />); expect(screen.getByText("redirect:/")).toBeTruthy(); expect(screen.queryByText(/family:write/)).toBeNull();
});
