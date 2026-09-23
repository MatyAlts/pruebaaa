import { act, fireEventAsync, renderAsync, waitFor } from "@testing-library/react-native";
import { HomeScreen } from "../src/HomeScreen";

const summary = { scope: "self", propiosTotal: 42, familiaresTotal: null, total: null, recientes: [{ id: "12", title: "Control anual", date: "17-09-2026" }], filterOptions: { medicos: [], institutions: [], years: [2026] } };
test("family-enabled Inicio shows full own/family totals from scopeall", async () => {
  const get = jest.fn().mockResolvedValue({ ...summary, scope: "all", propiosTotal: 42, familiaresTotal: 17, total: 59 });
  const screen = await renderAsync(<HomeScreen client={{ get }} pdf={{ open: jest.fn() }} name="Ana" familyScope />);
  expect(get).toHaveBeenCalledWith("/studies/summary?scope=all"); expect(screen.getByText("17")).toBeTruthy(); expect(screen.getByText("59")).toBeTruthy(); expect(screen.getByText("Estudios familiares")).toBeTruthy();
});

test("Inicio displays the complete authorized summary rather than counting recent rows", async () => {
  const get = jest.fn().mockResolvedValue(summary);
  const screen = await renderAsync(<HomeScreen client={{ get }} pdf={{ open: jest.fn() }} name="Ana" />);
  await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
  expect(screen.getByText("Control anual")).toBeTruthy();
  expect(get).toHaveBeenCalledWith("/studies/summary");
  expect(screen.queryByText("Familiares")).toBeNull();
});

test("a real recent study opens its authorized detail and native PDF", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/studies/summary" ? summary : { study: { id: "12", title: "Control anual", date: "17-09-2026", files: [{ id: "2", name: "control.pdf", mimeType: "application/pdf" }] } }));
  const open = jest.fn().mockResolvedValue(undefined);
  const screen = await renderAsync(<HomeScreen client={{ get }} pdf={{ open }} name="Ana" />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Control anual" })).toBeTruthy());
  await fireEventAsync.press(screen.getByRole("button", { name: "Control anual" }));
  await waitFor(() => expect(screen.getByText("Abrir control.pdf")).toBeTruthy());
  await fireEventAsync.press(screen.getByText("Abrir control.pdf"));
  expect(open).toHaveBeenCalledWith("12", "2");
});

test("an unavailable summary shows retry rather than a fabricated zero or empty history", async () => {
  const get = jest.fn().mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValueOnce({ ...summary, propiosTotal: 0, recientes: [] });
  const screen = await renderAsync(<HomeScreen client={{ get }} pdf={{ open: jest.fn() }} name="Ana" />);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión"));
  expect(screen.queryByText("0")).toBeNull();
  await fireEventAsync.press(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(screen.getByText("0")).toBeTruthy());
  expect(screen.getByText("Todavía no tenés estudios.")).toBeTruthy();
});

test("a late response from the previous reader cannot replace the current identity history", async () => {
  let finish!: (value: unknown) => void;
  const previous = { get: jest.fn(() => new Promise((resolve) => { finish = resolve; })) };
  const current = { get: jest.fn().mockResolvedValue({ ...summary, propiosTotal: 3, recientes: [] }) };
  const screen = await renderAsync(<HomeScreen client={previous as never} pdf={{ open: jest.fn() }} name="Anterior" />);
  await screen.rerenderAsync(<HomeScreen client={current} pdf={{ open: jest.fn() }} name="Actual" />);
  await waitFor(() => expect(screen.getByText("3")).toBeTruthy());
  await act(async () => { finish(summary); });
  await waitFor(() => expect(screen.queryByText("42")).toBeNull());
  expect(screen.queryByText("Control anual")).toBeNull();
});
