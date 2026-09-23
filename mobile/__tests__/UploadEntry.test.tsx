import { selectStudyDate } from "../test-utils/date-selection";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { UploadEntry } from "../src/UploadEntry";
import { pickUploadDocuments } from "../src/upload-picker";
jest.mock("expo-crypto", () => ({ randomUUID: () => "key" }));
jest.mock("../src/use-reduced-motion", () => ({
  useReducedMotion: () => false,
}));
jest.mock("../src/upload-picker", () => ({
  ...jest.requireActual("../src/upload-picker"),
  pickUploadDocuments: jest.fn(),
  pickUploadCamera: jest.fn(),
}));
test("older backend hides upload CTA despite a valid read session", () => {
  const screen = render(
    <UploadEntry
      enabled={false}
      client={{ get: jest.fn() } as never}
      files={{ clear: jest.fn() } as never}
      onChanged={jest.fn()}
    />,
  );
  expect(screen.queryByText("Cargar estudio")).toBeNull();
});
test("family selection failure is explicit and retry loads owner choices", async () => {
  const get = jest
    .fn()
    .mockRejectedValueOnce(new Error("Family temporarily unavailable"))
    .mockResolvedValueOnce({ items: [{ uuid: "ana-uuid", name: "Ana" }] });
  const screen = render(
    <UploadEntry
      enabled
      familyRead
      client={{ get } as never}
      files={{ clear: jest.fn() } as never}
      onChanged={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Cargar estudio"));
  await screen.findByText("Family temporarily unavailable");
  fireEvent.press(screen.getByText("Reintentar pacientes"));
  await screen.findByText("Ana");
  expect(get).toHaveBeenCalledTimes(2);
});
test("patient choices load actual owned family folders only when capability is ready", async () => {
  const get = jest
    .fn()
    .mockResolvedValue({ items: [{ uuid: "ana-uuid", name: "Ana" }] });
  const screen = render(
    <UploadEntry
      enabled
      familyRead
      client={{ get } as never}
      files={{ clear: jest.fn() } as never}
      onChanged={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Cargar estudio"));
  await screen.findByText("Ana");
  expect(get).toHaveBeenCalledWith("/family-members");
});
test("unmount aborts and clears private draft without accepting late upload success", async () => {
  const file = {
    uri: "file:///cache/private.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...file, lastModified: 0 }]);
  let signal!: AbortSignal;
  let finish!: (value: unknown) => void;
  const client = {
    get: jest.fn(),
    upload: jest.fn((_key, _body, _transport, passedSignal) => {
      signal = passedSignal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    }),
  };
  const clear = jest.fn();
  const onChanged = jest.fn();
  const screen = render(
    <UploadEntry
      enabled
      client={client as never}
      files={
        {
          import: jest.fn().mockResolvedValue(file),
          remove: jest.fn(),
          clear,
        } as never
      }
      onChanged={onChanged}
    />,
  );
  fireEvent.press(screen.getByText("Cargar estudio"));
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  selectStudyDate(screen, "10-09-2026");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await screen.findByText("Enviando estudio: 0%");
  screen.unmount();
  expect(signal.aborted).toBe(true);
  expect(clear).toHaveBeenCalledTimes(1);
  finish({ operationId: "key", status: "complete", studyId: "study" });
  await waitFor(() => expect(onChanged).not.toHaveBeenCalled());
});
test("actual services show XHR progress and invalidate history after confirmed commit", async () => {
  const file = {
    uri: "file:///cache/private.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...file, lastModified: 0 }]);
  let finish!: (value: unknown) => void;
  const client = {
    get: jest.fn(),
    upload: jest.fn((_key, _body, _transport, _signal, progress) => {
      progress(0.5);
      return new Promise((resolve) => {
        finish = resolve;
      });
    }),
  };
  const onChanged = jest.fn();
  const screen = render(
    <UploadEntry
      enabled
      client={client as never}
      files={
        {
          import: jest.fn().mockResolvedValue(file),
          remove: jest.fn(),
          clear: jest.fn(),
        } as never
      }
      onChanged={onChanged}
    />,
  );
  fireEvent.press(screen.getByText("Cargar estudio"));
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  selectStudyDate(screen, "10-09-2026");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await screen.findByText("Enviando estudio: 50%");
  finish({ operationId: "key", status: "complete", studyId: "study" });
  await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
});
test("ready backend opens the native upload form", () => {
  const screen = render(
    <UploadEntry
      enabled
      client={{ get: jest.fn() } as never}
      files={{ clear: jest.fn() } as never}
      onChanged={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Cargar estudio"));
  expect(screen.getByLabelText("Fecha del estudio")).toBeTruthy();
});

test("native route opener does not mount a parallel modal upload", () => {
  const onOpen = jest.fn();
  const get = jest.fn();
  const screen = render(<UploadEntry enabled client={{get} as never} files={{clear:jest.fn()} as never} onChanged={jest.fn()} onOpen={onOpen}/>);
  fireEvent.press(screen.getByText("Cargar estudio"));
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Fecha del estudio")).toBeNull();
  expect(get).not.toHaveBeenCalled();
});
