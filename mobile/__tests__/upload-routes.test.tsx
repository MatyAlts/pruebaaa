import { pickUploadDocuments } from "../src/upload-picker";
import Studies from "../app/(tabs)/studies";
import { selectStudyDate } from "../test-utils/date-selection";
import {
  renderAsync,
  waitFor,
  fireEventAsync,
} from "@testing-library/react-native";
import { SessionProvider } from "../src/session-provider";
import { MobileClient } from "../src/session";
import Home from "../app/(tabs)/home";
import UploadRoute from "../app/upload";
const mockPush=jest.fn();
jest.mock("expo-router/react-navigation",()=>({usePreventRemove:jest.fn(),useNavigation:()=>({dispatch:jest.fn()})}));
jest.mock("expo-router", () => {
  const { Text } = jest.requireActual("react-native");
  return { useLocalSearchParams:()=>({}), useRouter: () => ({ navigate: jest.fn(), push: mockPush, back: jest.fn() }), Redirect: ({ href }: { href: string }) => <Text>{href}</Text> };
});
jest.mock("expo-crypto", () => ({ randomUUID: () => "key" }));
jest.mock("../src/upload-picker", () => ({
  ...jest.requireActual("../src/upload-picker"),
  pickUploadDocuments: jest.fn(),
  pickUploadCamera: jest.fn(),
}));
test.each([true, false])(
  "Inicio/Estudios upload entry follows server readiness %s",
  async (enabled) => {
    const client = new MobileClient("https://test.invalid", {
      fetch: jest.fn(),
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
      user: { id: "17", name: "Ana" },
      busy: false,
      message: null,
    };
    jest
      .spyOn(client, "get")
      .mockImplementation(
        async (path) =>
          (path === "/capabilities"
            ? {
                features: {
                  studiesRead: true,
                  studiesSummary: true,
                  studiesUpload: enabled,
                },
              }
            : path.startsWith("/studies/summary")
              ? { propiosTotal: 0, recientes: [] }
              : { items: [], nextCursor: null }) as never,
      );
    const uploadFiles = {
      import: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    };
    const screen = await renderAsync(
      <SessionProvider
        createServices={() => ({
          client,
          pdf: { open: jest.fn() } as never,
          uploadFiles: uploadFiles as never,
        })}
      >
        <Home />
        <Studies />
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByText("Hola, Ana")).toBeTruthy());
    if (enabled) {
      await waitFor(() =>
        expect(
          screen.getAllByRole("button", { name: "Cargar estudio" }),
        ).toHaveLength(2),
      );
      await fireEventAsync.press(
        screen.getAllByRole("button", { name: "Cargar estudio" })[1],
      );
      expect(mockPush).toHaveBeenLastCalledWith("/upload");
      expect(screen.queryByLabelText("Fecha del estudio")).toBeNull();
    } else
      expect(
        screen.queryByRole("button", { name: "Cargar estudio" }),
      ).toBeNull();
  },
);
test("committed upload preserves patient/search filters and confirms result while rereading mounted history", async () => {
  const client = new MobileClient("https://test.invalid", {
    fetch: jest.fn(),
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
    user: { id: "17", name: "Ana" },
    busy: false,
    message: null,
  };
  let saved = false;
  const get = jest
    .spyOn(client, "get")
    .mockImplementation(
      async (path) =>
        (path === "/capabilities"
          ? {
              features: {
                studiesRead: true,
                studiesSummary: true,
                studiesSearch: true,
                studiesUpload: true,
                familyRead: true,
                studiesFamilyScope: true,
              },
            }
          : path === "/family-members"
            ? { items: [{ uuid: "ana-uuid", name: "Ana" }] }
            : path.startsWith("/studies/summary")
              ? { propiosTotal: saved ? 1 : 0, recientes: [] }
              : { items: [], nextCursor: null }) as never,
    );
  jest.spyOn(client, "upload").mockImplementation(async () => {
    saved = true;
    return {
      operationId: "key",
      status: "complete",
      studyId: "study",
    } as never;
  });
  const file = {
    uri: "file:///cache/private.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...file, lastModified: 0 }]);
  const screen = await renderAsync(
    <SessionProvider
      createServices={() => ({
        client,
        pdf: { open: jest.fn() } as never,
        uploadFiles: {
          import: jest.fn().mockResolvedValue(file),
          remove: jest.fn(),
          clear: jest.fn(),
        } as never,
      })}
    >
      <Home />
      <Studies />
      <UploadRoute />
    </SessionProvider>,
  );
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", { name: "Cargar estudio" }),
    ).toHaveLength(2),
  );
  await fireEventAsync.press(screen.getByRole("button", { name: "Seleccionar paciente" }));
  await fireEventAsync.press(
    screen.getByRole("button", { name: "Paciente: Ana" }),
  );
  await fireEventAsync.changeText(
    screen.getByLabelText("Buscar estudios"),
    "Control",
  );
  await fireEventAsync(
    screen.getByLabelText("Buscar estudios"),
    "submitEditing",
  );
  await fireEventAsync.press(
    screen.getAllByRole("button", { name: "Cargar estudio" })[1],
  );
  selectStudyDate(screen, "10-09-2026");
  await fireEventAsync.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  await fireEventAsync.press(screen.getByText("Guardar estudio"));
  await screen.findByText("Estudio guardado");
  expect(screen.getByLabelText("Buscar estudios").props.value).toBe("Control");
  expect(screen.getByText("Mostrando: Ana")).toBeTruthy();
  await waitFor(() =>
    expect(
      get.mock.calls.filter(
        ([path]) =>
          path.includes("q=Control") && path.includes("familyUuid=ana-uuid"),
      ).length,
    ).toBe(2),
  );
});
