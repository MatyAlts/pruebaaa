import {
  act,
  renderAsync,
  fireEventAsync,
  waitFor,
} from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { StudiesScreen } from "../src/StudiesScreen";
test("family folder queries remain bound to the selected patient and show that patient", async () => {
  const get = jest.fn().mockResolvedValue({ items: [{ id: "44", title: "Control familiar", date: "18-09-2026", patient: { kind: "family", id: "1", name: "Ana" } }], nextCursor: "family-date" });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced familyUuid="ana-uuid" patientName="Ana" />);
  await waitFor(() => expect(get).toHaveBeenCalledWith("/family-members/ana-uuid/studies?sort=study-date-desc"));
  expect(screen.getByText("Paciente: Ana")).toBeTruthy();
  await fireEventAsync.press(screen.getByText("Cargar más")); expect(get).toHaveBeenLastCalledWith("/family-members/ana-uuid/studies?sort=study-date-desc&cursor=family-date");
});
test("patient selection queries all or an owned family folder without changing the defaultself", async () => {
  const get = jest.fn().mockImplementation((path: string) => Promise.resolve(path === "/family-members" ? { items: [{ id: "1", uuid: "ana-uuid", name: "Ana", studyCount: 2, lastStudyDate: null }] } : { items: [], nextCursor: null }));
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced familyScope />);
  await waitFor(() => expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc"));
  await fireEventAsync.press(screen.getByRole("button", { name: "Todos los pacientes" })); expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc&scope=all");
  await fireEventAsync.press(screen.getByRole("button", { name: "Seleccionar paciente" }));
  await fireEventAsync.press(screen.getByRole("button", { name: "Paciente: Ana" })); expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc&scope=family&familyUuid=ana-uuid");
  await fireEventAsync.press(screen.getByRole("button", { name: "Mi historial" })); expect(get).toHaveBeenLastCalledWith("/studies?sort=study-date-desc");
});
test("actual HTTP detail envelope renders the canonical own study", async () => {
  const get = jest.fn().mockResolvedValueOnce({ items: [{ id: "12", title: "Control", date: "18-09-2026" }], nextCursor: null }).mockResolvedValueOnce({ study: { id: "12", title: "Control", date: "18-09-2026", medico: "Dra. Real", files: [] } });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Control" })); await waitFor(() => expect(screen.getByText("Dra. Real")).toBeTruthy());
});
test("switching family patient discards a previous patient's late page", async () => {
  let finish!: (value: unknown) => void;
  const get = jest.fn().mockImplementation((path: string) => path.includes("cursor=") ? new Promise((resolve) => { finish = resolve; }) : Promise.resolve({ items: [{ id: path.includes("other-uuid") ? "99" : "44", title: path.includes("other-uuid") ? "Otra carpeta" : "Ana control", date: "18-09-2026" }], nextCursor: path.includes("other-uuid") ? null : "old-cursor" }));
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced familyUuid="ana-uuid" patientName="Ana" />);
  await fireEventAsync.press(screen.getByText("Cargar más"));
  await screen.rerenderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced familyUuid="other-uuid" patientName="Otro" />);
  await waitFor(() => expect(screen.getByText("Otra carpeta")).toBeTruthy()); await act(async () => { finish({ items: [{ id: "1", title: "Vieja carpeta", date: "01-01-2020" }], nextCursor: "stale" }); });
  expect(screen.queryByText("Vieja carpeta")).toBeNull(); expect(screen.queryByText("Cargar más")).toBeNull();
});
test("opens own study and returns to the list", async () => {
  const get = jest
    .fn()
    .mockResolvedValueOnce({
      items: [{ id: "12", title: "Control", date: "2026-09-17" }],
      nextCursor: null,
    })
    .mockResolvedValueOnce({ study: {
      id: "12",
      title: "Control",
      date: "2026-09-17",
      medico: "Dra. Ana",
      files: [],
    } });
  const screen = await renderAsync(
    <StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} />,
  );
  await waitFor(() => expect(screen.getByText("Control")).toBeTruthy());
  await fireEventAsync.press(screen.getByText("Control"));
  await waitFor(() => expect(screen.getByText("Dra. Ana")).toBeTruthy());
  const clinician = screen.getByText("Dra. Ana");
  expect(StyleSheet.flatten(clinician.props.style).fontFamily).toBeUndefined();
  expect(clinician.props.allowFontScaling).toBe(true);
  await fireEventAsync.press(screen.getByText("Volver a estudios"));
  expect(screen.getByText("Control")).toBeTruthy();
  expect(get).toHaveBeenNthCalledWith(2, "/studies/12");
});

test("a previous search cannot overwrite the latest server result", async () => {
  let old!: (value: unknown) => void;
  const get = jest.fn().mockImplementation((path: string) => {
    if (path.includes("q=anterior")) return new Promise((resolve) => { old = resolve; });
    return Promise.resolve({ items: path.includes("q=actual") ? [{ id: "25", title: "Resultado actual", date: "17-09-2026" }] : [], nextCursor: null });
  });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  const input = screen.getByPlaceholderText("Buscar por título o descripción");
  await fireEventAsync.changeText(input, "anterior");
  await fireEventAsync(input, "submitEditing");
  await fireEventAsync.changeText(input, "actual");
  await fireEventAsync(input, "submitEditing");
  await waitFor(() => expect(screen.getByText("Resultado actual")).toBeTruthy());
  await act(async () => { old({ items: [{ id: "1", title: "Resultado anterior", date: "01-01-2020" }], nextCursor: null }); });
  await waitFor(() => expect(screen.queryByText("Resultado anterior")).toBeNull());
});
test("loads a second page and opens only PDF files", async () => {
  const get = jest
    .fn()
    .mockResolvedValueOnce({
      items: [{ id: "12", title: "Control", date: "2026-09-17" }],
      nextCursor: "12",
    })
    .mockResolvedValueOnce({
      items: [{ id: "11", title: "Anterior", date: "2026-08-01" }],
      nextCursor: null,
    })
    .mockResolvedValueOnce({ study: {
      id: "11",
      title: "Anterior",
      date: "2026-08-01",
      files: [
        { id: "4", name: "informe.pdf", mimeType: "application/pdf" },
        { id: "5", name: "imagen.png", mimeType: "image/png" },
      ],
    } });
  const open = jest.fn().mockResolvedValue(undefined);
  const screen = await renderAsync(
    <StudiesScreen client={{ get }} pdf={{ open }} />,
  );
  await waitFor(() => expect(screen.getByText("Cargar más")).toBeTruthy());
  await fireEventAsync.press(screen.getByText("Cargar más"));
  await waitFor(() => expect(screen.getByText("Anterior")).toBeTruthy());
  await fireEventAsync.press(screen.getByText("Anterior"));
  await waitFor(() =>
    expect(screen.getByText("Abrir informe.pdf")).toBeTruthy(),
  );
  await fireEventAsync.press(screen.getByText("Abrir informe.pdf"));
  expect(open).toHaveBeenCalledWith("11", "4");
  expect(screen.getByText("imagen.png: formato no disponible")).toBeTruthy();
  expect(get).toHaveBeenNthCalledWith(2, "/studies?cursor=12");
});
test("failed list exposes retry and distinguishes an empty result", async () => {
  const get = jest
    .fn()
    .mockRejectedValueOnce(new Error("Sin conexión"))
    .mockResolvedValueOnce({ items: [], nextCursor: null });
  const screen = await renderAsync(
    <StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} />,
  );
  await waitFor(() => expect(screen.getByText("Sin conexión")).toBeTruthy());
  await fireEventAsync.press(screen.getByText("Reintentar"));
  await waitFor(() =>
    expect(screen.getByText("Todavía no tenés estudios.")).toBeTruthy(),
  );
});

test("production search submits a server query instead of filtering the loaded page", async () => {
  const get = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  await waitFor(() => expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc"));
  await fireEventAsync.changeText(screen.getByPlaceholderText("Buscar por título o descripción"), "control");
  await fireEventAsync(screen.getByPlaceholderText("Buscar por título o descripción"), "submitEditing");
  await waitFor(() => expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc&q=control"));
});

test("the native filter sheet queries clinician, institution and civil month/year", async () => {
  const get = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Filtros" }));
  await fireEventAsync.changeText(screen.getByLabelText("Médico"), "Dra. Ana");
  await fireEventAsync.changeText(screen.getByLabelText("Institución"), "Hospital Norte");
  await fireEventAsync.changeText(screen.getByLabelText("Mes"), "9");
  await fireEventAsync.changeText(screen.getByLabelText("Año"), "2026");
  await fireEventAsync.press(screen.getByRole("button", { name: "Aplicar filtros" }));
  await waitFor(() => expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc&medico=Dra.+Ana&institution=Hospital+Norte&month=9&year=2026"));
});

test("clearing filters resets the cursor and restores the entire authorized history", async () => {
  const get = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Filtros" }));
  await fireEventAsync.changeText(screen.getByLabelText("Mes"), "9");
  await fireEventAsync.press(screen.getByRole("button", { name: "Aplicar filtros" }));
  await waitFor(() => expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc&month=9"));
  await fireEventAsync.press(screen.getByRole("button", { name: "Limpiar filtros" }));
  await waitFor(() => expect(get).toHaveBeenLastCalledWith("/studies?sort=study-date-desc"));
});

test("pagination preserves the active search and date order", async () => {
  const get = jest.fn().mockResolvedValue({ items: [{ id: "12", title: "Control", date: "17-09-2026" }], nextCursor: "opaque==" });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  const search = screen.getByPlaceholderText("Buscar por título o descripción");
  await fireEventAsync.changeText(search, "control");
  await fireEventAsync(search, "submitEditing");
  await waitFor(() => expect(get).toHaveBeenCalledWith("/studies?sort=study-date-desc&q=control"));
  await fireEventAsync.press(screen.getByText("Cargar más"));
  expect(get).toHaveBeenLastCalledWith("/studies?sort=study-date-desc&q=control&cursor=opaque%3D%3D");
});

test("a late old page cannot append studies after the search changes", async () => {
  let finish!: (value: unknown) => void;
  const get = jest.fn().mockImplementation((path: string) => {
    if (path.includes("cursor=")) return new Promise((resolve) => { finish = resolve; });
    return Promise.resolve({ items: path.includes("q=nuevo") ? [{ id: "30", title: "Nuevo resultado", date: "17-09-2026" }] : [{ id: "12", title: "Control", date: "17-09-2026" }], nextCursor: path.includes("q=nuevo") ? null : "older" });
  });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  await fireEventAsync.press(screen.getByText("Cargar más"));
  const search = screen.getByPlaceholderText("Buscar por título o descripción");
  await fireEventAsync.changeText(search, "nuevo");
  await fireEventAsync(search, "submitEditing");
  await waitFor(() => expect(screen.getByText("Nuevo resultado")).toBeTruthy());
  await act(async () => { finish({ items: [{ id: "2", title: "Página anterior", date: "01-01-2020" }], nextCursor: "bad" }); });
  await waitFor(() => expect(screen.queryByText("Página anterior")).toBeNull());
  expect(screen.queryByText("Cargar más")).toBeNull();
});

test("a padded month is normalized to the canonical server filter", async () => {
  const get = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Filtros" }));
  await fireEventAsync.changeText(screen.getByLabelText("Mes"), "01");
  await fireEventAsync.press(screen.getByRole("button", { name: "Aplicar filtros" }));
  await waitFor(() => expect(get).toHaveBeenLastCalledWith("/studies?sort=study-date-desc&month=1"));
});

test("an invalid civil year stays in the filter sheet and never sends a failing request", async () => {
  const get = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
  const screen = await renderAsync(<StudiesScreen client={{ get }} pdf={{ open: jest.fn() }} advanced />);
  await fireEventAsync.press(screen.getByRole("button", { name: "Filtros" }));
  await fireEventAsync.changeText(screen.getByLabelText("Año"), "0000");
  await fireEventAsync.press(screen.getByRole("button", { name: "Aplicar filtros" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/año de cuatro cifras/));
  expect(get).toHaveBeenCalledTimes(1);
});
