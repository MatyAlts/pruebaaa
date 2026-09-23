import { selectStudyDate } from "../test-utils/date-selection";
import {
  renderAsync,
  fireEventAsync,
  waitFor,
} from "@testing-library/react-native";
import { Modal } from "react-native";
import { FamilyScreen } from "../src/FamilyScreen";
import { UploadFlow } from "../src/UploadEntry";
import { pickUploadDocuments } from "../src/upload-picker";
jest.mock("expo-crypto", () => ({ randomUUID: () => "key" }));
jest.mock("../src/upload-picker", () => ({
  ...jest.requireActual("../src/upload-picker"),
  pickUploadDocuments: jest.fn(),
  pickUploadCamera: jest.fn(),
}));
test("family upload uses the existing single modal, selected UUID and reloads committed folder", async () => {
  const family = {
    id: "1",
    uuid: "ana-uuid",
    name: "Ana",
    studyCount: 0,
    lastStudyDate: null,
  };
  let saved = false;
  const get = jest
    .fn()
    .mockImplementation(async (path) =>
      path === "/family-members"
        ? { items: [{ ...family, studyCount: saved ? 1 : 0 }] }
        : path.includes("/studies?")
          ? {
              items: saved
                ? [{ id: "study", title: "Control nuevo", date: "10-09-2026" }]
                : [],
              nextCursor: null,
            }
          : { familyMember: family },
    );
  const upload = jest.fn().mockImplementation(async () => {
    saved = true;
    return { operationId: "key", status: "complete", studyId: "study" };
  });
  const client = { get, upload, write: jest.fn() };
  const changed = jest.fn();
  const attachment = {
    uri: "file:///cache/private.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...attachment, lastModified: 0 }]);
  const files = {
    import: jest.fn().mockResolvedValue(attachment),
    remove: jest.fn(),
    clear: jest.fn(),
  };
  const screen = await renderAsync(
    <FamilyScreen
      client={client}
      pdf={{ open: jest.fn() }}
      onChanged={changed}
      uploadForm={(patient, close, committed) => (
        <UploadFlow
          client={client as never}
          files={files as never}
          onChanged={committed}
          close={close}
          initialFamily={patient}
          safeArea={false}
        />
      )}
    />,
  );
  await fireEventAsync.press(
    screen.getByRole("button", { name: "Abrir carpeta de Ana" }),
  );
  await fireEventAsync.press(
    screen.getByRole("button", { name: "Cargar estudio" }),
  );
  expect(screen.getByText("Paciente: Ana")).toBeTruthy();
  expect(
    screen.UNSAFE_getAllByType(Modal).filter((modal) => modal.props.visible),
  ).toHaveLength(1);
  selectStudyDate(screen, "10-09-2026");
  await fireEventAsync.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  await fireEventAsync.press(screen.getByText("Guardar estudio"));
  await screen.findByText("Estudio guardado");
  const body = upload.mock.calls[0][1]() as FormData;
  expect(body.get("patient")).toBe("family");
  expect(body.get("familyUuid")).toBe("ana-uuid");
  expect(changed).toHaveBeenCalledTimes(1);
  await fireEventAsync.press(screen.getByText("Volver"));
  await waitFor(() => expect(screen.getByText("Control nuevo")).toBeTruthy());
});
