import { renderAsync, fireEventAsync } from "@testing-library/react-native";
import Home from "../app/(tabs)/home";
import Studies from "../app/(tabs)/studies";
import Family from "../app/(tabs)/family";
import FamilyRoute from "../app/family/[uuid]";
import DetailRoute from "../app/study/[id]";
import { useSession } from "../src/session-provider";
jest.mock("../src/session-provider", () => ({ useSession: jest.fn() }));
jest.mock('expo-router/react-navigation',()=>({usePreventRemove:jest.fn(),useNavigation:()=>({dispatch:jest.fn()})}));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ navigate: jest.fn(), push: mockPush,back:jest.fn() }), useLocalSearchParams:()=>({id:'study',uuid:'ana-uuid'}), Redirect: () => null }));
beforeEach(()=>mockPush.mockClear());
test.each(["home", "studies", "family"])(
  "%s forwards private image capability and expected MIME through the real reader UI",
  async (route) => {
    const family = {
      id: "1",
      uuid: "ana-uuid",
      name: "Ana",
      studyCount: 1,
      lastStudyDate: "10-09-2026",
    };
    const study = {
      id: "study",
      title: "Control",
      date: "10-09-2026",
      files: [{ id: "image", name: "photo.jpg", mimeType: "image/jpeg" }],
    };
    const get = jest
      .fn()
      .mockImplementation(async (path) =>
        path === "/family-members"
          ? { items: [family] }
          : path.startsWith("/studies/summary")
            ? { propiosTotal: 1, recientes: [study] }
            : path.startsWith("/studies/study")
              ? { study }
              : path.includes("/studies?") || path === "/studies"
                ? { items: [study], nextCursor: null }
                : { familyMember: family },
      );
    const open = jest.fn().mockResolvedValue(undefined);
    jest
      .mocked(useSession)
      .mockReturnValue({
        client: { get } as never,
        pdf: { open } as never,
        state: { user: { id: "17", name: "Ana" }, busy: false, message: null },
        capabilities: {
          studiesSummary: true,
          studiesSearch: true,
          familyRead: true,
          studyImagesRead: true,
        },
        capabilitiesReady: true,
        historyRevision: 0,
        invalidateHistory: jest.fn(),
        configurationError: null,
        fontsReady: true,
      });
    const Component =
      route === "home" ? Home : route === "family" ? Family : Studies;
    let screen = await renderAsync(<Component />);
    if (route === "family") {
      await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
      expect(mockPush).toHaveBeenCalledWith({pathname:"/family/[uuid]",params:{uuid:"ana-uuid"}});
      await screen.unmountAsync();
      screen=await renderAsync(<FamilyRoute/>);
    }
    await fireEventAsync.press(screen.getByRole("button", { name: "Control" }));
    {
      expect(mockPush).toHaveBeenCalledWith({pathname:'/study/[id]',params:{id:'study'}});
      await screen.unmountAsync();
      screen = await renderAsync(<DetailRoute />);
    }
    await fireEventAsync.press(screen.getByText("Abrir photo.jpg"));
    expect(open).toHaveBeenCalledWith("study", "image", "image/jpeg");
  },
);
