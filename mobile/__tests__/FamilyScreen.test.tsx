import { act, fireEvent, fireEventAsync, renderAsync, waitFor } from "@testing-library/react-native";
import { FamilyScreen, type FamilyClient, type FamilyMember } from "../src/FamilyScreen";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
const ana = { id: "1", uuid: "ana-uuid", name: "Ana", studyCount: 2, lastStudyDate: "18-09-2026" };
const pdf = { open: jest.fn() };
// RN initialization is expensive on a cold Windows worker; behavioral waits keep their defaults.
jest.setTimeout(30000);
test("creation owns safe area measurement in the modal native root without cached window metrics", async () => {
  const write = jest.fn();
  const screen = await renderAsync(<FamilyScreen client={{ get: jest.fn().mockResolvedValue({ items: [] }), write }} pdf={pdf} canWrite />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Agregar familiar" }));
  const provider = screen.UNSAFE_getByType(SafeAreaProvider);
  expect(provider.props.initialMetrics).toBeUndefined();
  expect(provider.findAllByType(SafeAreaView)).toHaveLength(1);
  expect(provider.findByType(SafeAreaView).props.edges).toEqual(["top", "right", "bottom", "left"]);
  await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "Nombre sin guardar");
  await fireEventAsync.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(write).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("Nombre del familiar")).toBeNull();
  await screen.unmountAsync();
});
test("editing shares the modal local provider and cancellation returns to the real folder", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : { familyMember: ana }));
  const write = jest.fn();
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canWrite />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
  await fireEventAsync.press(screen.getByRole("button", { name: "Editar nombre" }));
  const provider = screen.UNSAFE_getByType(SafeAreaProvider);
  expect(provider.props.initialMetrics).toBeUndefined();
  expect(provider.findAllByType(SafeAreaView)).toHaveLength(1);
  expect(screen.getByLabelText("Nombre del familiar").props.value).toBe("Ana");
  await fireEventAsync.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.getByText("Estudios de Ana")).toBeTruthy();
  expect(write).not.toHaveBeenCalled();
  await screen.unmountAsync();
});
test("family folder presents compact accessible actions while keeping patient locked for upload", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : { familyMember: ana }));
  const uploadForm = jest.fn((_family: FamilyMember, _close: () => void, _committed: () => void) => null);
  const screen = await renderAsync(<FamilyScreen client={{ get, write: jest.fn() }} pdf={pdf} canWrite canDelete uploadForm={uploadForm} />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
  const toolbar = screen.getByLabelText("Acciones de la carpeta familiar");
  expect(StyleSheet.flatten(toolbar.props.style).flexDirection).toBe("row");
  expect(StyleSheet.flatten(toolbar.props.style).flexWrap).toBe("wrap");
  expect(screen.getByRole("button", { name: "Editar nombre" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Eliminar familiar" })).toBeTruthy();
  await fireEventAsync.press(screen.getByRole("button", { name: "Cargar estudio" }));
  expect(uploadForm.mock.calls[0][0]).toEqual(ana);
  await screen.unmountAsync();
});
test("family creation modal uses one safe area and keyboard adjusted premium form", async () => {
  const screen = await renderAsync(<FamilyScreen client={{ get: jest.fn().mockResolvedValue({ items: [] }), write: jest.fn() }} pdf={pdf} canWrite />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Agregar familiar" }));
  const modalArea = screen.UNSAFE_getByType(SafeAreaView);
  expect(modalArea.props.edges).toEqual(["top", "right", "bottom", "left"]);
  const form = screen.UNSAFE_getAllByType(ScrollView).find(node => node.props.automaticallyAdjustKeyboardInsets);
  expect(form).toBeDefined();
  expect(form!.props.contentInsetAdjustmentBehavior).toBe("never");
  expect(form!.props.automaticallyAdjustKeyboardInsets).toBe(true);
  expect(screen.getByText("Una carpeta para su documentación médica.")).toBeTruthy();
  await fireEventAsync.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByLabelText("Nombre del familiar")).toBeNull();
  await screen.unmountAsync();
});
test("read-only family toolbar offers return without unavailable mutations", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : { familyMember: ana }));
  const screen = await renderAsync(<FamilyScreen client={{ get, write: jest.fn() }} pdf={pdf} />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
  expect(screen.queryByRole("button", { name: "Editar nombre" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Eliminar familiar" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Cargar estudio" })).toBeNull();
  await fireEventAsync.press(screen.getByRole("button", { name: "Volver a familia" }));
  expect(screen.getByRole("button", { name: "Abrir carpeta de Ana" })).toBeTruthy();
  await screen.unmountAsync();
});
test("redesigned family overview shows real folder count and useful information", async () => {
  const screen = await renderAsync(<FamilyScreen client={{ get: jest.fn().mockResolvedValue({ items: [ana] }), write: jest.fn() }} pdf={pdf} canWrite />);
  expect(screen.getByText("Familiares (1)")).toBeTruthy();
  expect(screen.getByText("Todo en un solo lugar")).toBeTruthy();
  expect(screen.getByText("Agregá a tus familiares para tener sus estudios organizados y siempre a mano.")).toBeTruthy();
});
test("empty read-only family overview does not invent folders or expose unavailable creation", async () => {
  const screen = await renderAsync(<FamilyScreen client={{ get: jest.fn().mockResolvedValue({ items: [] }), write: jest.fn() }} pdf={pdf} />);
  expect(screen.getByText("Familiares (0)")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Agregar familiar" })).toBeNull();
  expect(screen.getByText("Tu grupo familiar comienza acá")).toBeTruthy();
});
test("lists real family folders with study count and opens canonical detail", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.endsWith("/studies?sort=study-date-desc") ? { items: [], nextCursor: null } : { familyMember: ana }));
  const screen = await renderAsync(<FamilyScreen client={{ get, write: jest.fn() }} pdf={pdf} canWrite canDelete />);
  await waitFor(() => expect(screen.getByText("Ana")).toBeTruthy());
  expect(screen.getByText("2 estudios")).toBeTruthy();
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
  await waitFor(() => expect(get).toHaveBeenCalledWith("/family-members/ana-uuid"));
  expect(screen.getByText("Estudios de Ana")).toBeTruthy(); expect(screen.queryByText("Cargar estudio")).toBeNull();
});
test("a missing family is an error rather than an empty successful folder", async () => {
  const get = jest.fn().mockResolvedValueOnce({ items: [ana] }).mockRejectedValueOnce(new Error("No encontramos ese familiar."));
  const screen = await renderAsync(<FamilyScreen client={{ get, write: jest.fn() }} pdf={pdf} />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No encontramos ese familiar."));
  expect(screen.queryByText("Estudios de Ana")).toBeNull(); expect(screen.queryByText("Cargar estudio")).toBeNull();
});
test("adds only the trimmed web name and refreshes the real folders", async () => {
  const get = jest.fn().mockResolvedValueOnce({ items: [] }).mockResolvedValue({ items: [ana] });
  const write = jest.fn().mockResolvedValue({ familyMember: ana });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canWrite />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Agregar familiar" }));
  await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "  Ana  ");
  await fireEventAsync.press(screen.getByRole("button", { name: "Guardar familiar" }));
  await waitFor(() => expect(write).toHaveBeenCalledWith("/family-members", "POST", { name: "Ana" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Abrir carpeta de Ana" })).toBeTruthy());
});
test("invalid names0/41 never send writes;40characters accepted", async () => {
  const get = jest.fn().mockResolvedValue({ items: [] }); const write = jest.fn().mockResolvedValue({ familyMember: ana });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canWrite />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Agregar familiar" }));
  await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "   "); await fireEventAsync.press(screen.getByRole("button", { name: "Guardar familiar" }));
  expect(write).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toHaveTextContent(/1 y 40/);
  await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "a".repeat(41)); await fireEventAsync.press(screen.getByRole("button", { name: "Guardar familiar" })); expect(write).not.toHaveBeenCalled();
  await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "a".repeat(40)); await fireEventAsync.press(screen.getByRole("button", { name: "Guardar familiar" })); expect(write).toHaveBeenCalledWith("/family-members", "POST", { name: "a".repeat(40) });
});
test("renames the selected canonical family and cancel never writes", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : { familyMember: ana })); const write = jest.fn().mockResolvedValue({ familyMember: { ...ana, name: "Ana María" } });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canWrite />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
  await fireEventAsync.press(screen.getByRole("button", { name: "Editar nombre" }));
  await fireEventAsync.press(screen.getByRole("button", { name: "Cancelar" })); expect(write).not.toHaveBeenCalled();
  await fireEventAsync.press(screen.getByRole("button", { name: "Editar nombre" }));
  await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "Ana María");
  await fireEventAsync.press(screen.getByRole("button", { name: "Guardar familiar" }));
  expect(write).toHaveBeenCalledWith("/family-members/ana-uuid", "PATCH", { name: "Ana María" });
});
test("typed deletion commits202 and distinguishes pending files from complete", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : path.startsWith("/operations/") ? { operationId: "op1", status: "pending" } : { familyMember: ana }));
  const write = jest.fn().mockResolvedValue({ operationId: "op1", status: "pending" });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canDelete />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" })); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar familiar" }));
  expect(screen.getByText(/Esta acción es irreversible/)).toBeTruthy();
  await fireEventAsync.changeText(screen.getByLabelText("Escribí misaluteca para confirmar"), "misaluteca"); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar definitivamente" }));
  expect(write).toHaveBeenCalledWith("/family-members/ana-uuid", "DELETE", { confirmation: "misaluteca" });
  await waitFor(() => expect(screen.getByText(/Limpieza de archivos pendiente/)).toBeTruthy());
  expect(screen.queryByText("Archivos eliminados" )).toBeNull();
});
test("opens real family studies and their PDF detail with explicit patient", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [{ id: "44", title: "Control familiar", date: "18-09-2026", patient: { kind: "family", id: "1", name: "Ana" } }], nextCursor: null } : path === "/studies/44" ? { study: { id: "44", title: "Control familiar", date: "18-09-2026", patient: { kind: "family", id: "1", name: "Ana" }, files: [{ id: "7", name: "control.pdf", mimeType: "application/pdf" }] } } : { familyMember: ana }));
  const open = jest.fn().mockResolvedValue(undefined);
  const screen = await renderAsync(<FamilyScreen client={{ get, write: jest.fn() }} pdf={{ open }} />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" }));
  await waitFor(() => expect(screen.getByText("Control familiar")).toBeTruthy());
  await fireEventAsync.press(screen.getByRole("button", { name: "Control familiar" }));
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir control.pdf" })); expect(open).toHaveBeenCalledWith("44", "7");
});
test("checks the owner-bound cleanup operation and announces complete only after server proof", async () => {
  let deleted = false;
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: deleted ? [] : [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : path.startsWith("/operations/") ? { operationId: "op1", status: "complete" } : { familyMember: ana }));
  const write = jest.fn().mockImplementation(async () => { deleted = true; return { operationId: "op1", status: "pending" }; });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canDelete />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" })); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar familiar" }));
  await fireEventAsync.changeText(screen.getByLabelText("Escribí misaluteca para confirmar"), "misaluteca"); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar definitivamente" }));
  await fireEventAsync.press(screen.getByRole("button", { name: "Comprobar limpieza" }));
  await waitFor(() => expect(screen.getByText("Familiar y archivos eliminados.")).toBeTruthy()); expect(get).toHaveBeenCalledWith("/operations/op1");
  expect(screen.queryByRole("button", { name: "Abrir carpeta de Ana" })).toBeNull();
});
test("deletion cancellation or incorrect typed confirmation never sends DELETE", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : { familyMember: ana })); const write = jest.fn();
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canDelete />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" })); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar familiar" }));
  await fireEventAsync.changeText(screen.getByLabelText("Escribí misaluteca para confirmar"), "MISALUTECA");
  expect(screen.getByRole("button", { name: "Eliminar definitivamente" })).toBeDisabled();
  await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar definitivamente" })); expect(write).not.toHaveBeenCalled();
  await fireEventAsync.press(screen.getByRole("button", { name: "Cancelar" })); expect(write).not.toHaveBeenCalled(); expect(screen.getByText("Estudios de Ana")).toBeTruthy();
});
test("automatic cleanup polling stops after3 attempts and never pretends completion", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : path.startsWith("/operations/") ? { operationId: "op1", status: "pending" } : { familyMember: ana }));
  const write = jest.fn().mockResolvedValue({ operationId: "op1", status: "pending" });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canDelete />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" })); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar familiar" }));
  jest.useFakeTimers();
  try {
    await fireEventAsync.changeText(screen.getByLabelText("Escribí misaluteca para confirmar"), "misaluteca"); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar definitivamente" }));
    for (let i = 0; i < 4; i++) await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(get.mock.calls.filter(([path]) => path.startsWith("/operations/")).length).toBe(3);
    expect(screen.getByText(/Limpieza de archivos pendiente/)).toBeTruthy();
  } finally { jest.useRealTimers(); }
});
test("committed family mutation invalidates mounted summaries but SQL failure does not", async () => {
  const get = jest.fn().mockResolvedValue({ items: [] }); const changed = jest.fn(); const write = jest.fn().mockRejectedValueOnce(new Error("No se pudo guardar.")).mockResolvedValueOnce({ familyMember: ana });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canWrite onChanged={changed} />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Agregar familiar" })); await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "Ana"); await fireEventAsync.press(screen.getByRole("button", { name: "Guardar familiar" }));
  expect(changed).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toHaveTextContent(/No se pudo guardar/);
  await fireEventAsync.press(screen.getByRole("button", { name: "Guardar familiar" })); expect(changed).toHaveBeenCalledTimes(1);
});
test("two immediate save taps send one write and a late identity response stays hidden", async () => {
  const get = jest.fn().mockResolvedValue({ items: [] }); let finish!: (value: unknown) => void;
  const write = jest.fn(<T,>() => new Promise<T>((resolve) => { finish = resolve as (value: unknown) => void; })) as unknown as jest.MockedFunction<FamilyClient["write"]>;
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canWrite />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Agregar familiar" })); await fireEventAsync.changeText(screen.getByLabelText("Nombre del familiar"), "Ana");
  const button = screen.getByRole("button", { name: "Guardar familiar" });
  await act(async () => { fireEvent.press(button); fireEvent.press(button); }); expect(write).toHaveBeenCalledTimes(1);
  await screen.unmountAsync(); await act(async () => { finish({ familyMember: ana }); }); expect(get).toHaveBeenCalledTimes(1);
});
test("unknown cleanup status cannot be presented as complete", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : path.startsWith("/operations/") ? { operationId: "op1", status: "unknown" } : { familyMember: ana }));
  const write = jest.fn().mockResolvedValue({ operationId: "op1", status: "pending" });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canDelete />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" })); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar familiar" })); await fireEventAsync.changeText(screen.getByLabelText("Escribí misaluteca para confirmar"), "misaluteca"); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar definitivamente" }));
  await fireEventAsync.press(screen.getByRole("button", { name: "Comprobar limpieza" })); expect(screen.queryByText("Familiar y archivos eliminados.")).toBeNull(); expect(screen.getByText(/Limpieza de archivos pendiente/)).toBeTruthy();
});
test("SQL rejection keeps the family and never reports a committed deletion", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : { familyMember: ana }));
  const write = jest.fn().mockRejectedValue(new Error("No se pudo eliminar.")); const changed = jest.fn();
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canDelete onChanged={changed} />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" })); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar familiar" })); await fireEventAsync.changeText(screen.getByLabelText("Escribí misaluteca para confirmar"), "misaluteca"); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar definitivamente" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/No se pudo eliminar/); expect(changed).not.toHaveBeenCalled(); expect(screen.queryByText(/Familiar eliminado/)).toBeNull();
  await fireEventAsync.press(screen.getByRole("button", { name: "Cancelar" })); expect(screen.getByText("Estudios de Ana")).toBeTruthy();
});
test("late folders from a previous identity cannot replace the current account", async () => {
  let finish!: (value: unknown) => void;
  const previous = { get: jest.fn(() => new Promise((resolve) => { finish = resolve; })), write: jest.fn() };
  const current = { get: jest.fn().mockResolvedValue({ items: [{ ...ana, uuid: "new-uuid", name: "Actual" }] }), write: jest.fn() };
  const screen = await renderAsync(<FamilyScreen client={previous as never} pdf={pdf} />);
  await screen.rerenderAsync(<FamilyScreen client={current} pdf={pdf} />);
  await waitFor(() => expect(screen.getByText("Actual")).toBeTruthy()); await act(async () => { finish({ items: [ana] }); });
  expect(screen.queryByText("Ana")).toBeNull(); expect(screen.getByText("Actual")).toBeTruthy();
});
test("initial DELETE unknown status never announces physical completion or retries deletion", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [ana] } : path.includes("/studies?") ? { items: [], nextCursor: null } : { familyMember: ana }));
  const write = jest.fn().mockResolvedValue({ operationId: "op1", status: "unexpected" });
  const screen = await renderAsync(<FamilyScreen client={{ get, write }} pdf={pdf} canDelete />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Abrir carpeta de Ana" })); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar familiar" })); await fireEventAsync.changeText(screen.getByLabelText("Escribí misaluteca para confirmar"), "misaluteca"); await fireEventAsync.press(screen.getByRole("button", { name: "Eliminar definitivamente" }));
  expect(screen.queryByText("Familiar y archivos eliminados.")).toBeNull(); expect(screen.getByText(/Limpieza de archivos pendiente/)).toBeTruthy(); expect(write).toHaveBeenCalledTimes(1);
});
