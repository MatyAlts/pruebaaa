import { selectStudyDate } from "../test-utils/date-selection";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { UploadScreen } from "../src/UploadScreen";
import { pickUploadDocuments, pickUploadCamera } from "../src/upload-picker";
import { SessionError } from "../src/session";
import { UploadCoordinator } from "../src/upload-coordinator";
jest.mock("../src/upload-picker", () => ({
  ...jest.requireActual("../src/upload-picker"),
  pickUploadDocuments: jest.fn(),
  pickUploadCamera: jest.fn(),
}));
test("attachment removal failure keeps draft and shows actionable filesystem error", async () => {
  const attachment = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValueOnce([
      { ...attachment, uri: "file:///picker/report.pdf", lastModified: 0 },
    ]);
  const remove = jest.fn().mockImplementation(async (uri) => {
    if (uri === attachment.uri) throw new Error("Attachment temporarily busy");
  });
  const screen = render(
    <UploadScreen
      coordinator={{ key: null } as never}
      files={
        { import: jest.fn().mockResolvedValue(attachment), remove } as never
      }
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  fireEvent.press(screen.getByText("Quitar report.pdf"));
  await screen.findByText("Attachment temporarily busy");
  expect(screen.getByText("report.pdf")).toBeTruthy();
});
test("late camera capture is removed after form unmount without private import", async () => {
  let finish!: (value: unknown) => void;
  jest.mocked(pickUploadCamera).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve as never;
      }),
  );
  const importer = jest.fn();
  const remove = jest.fn();
  const screen = render(
    <UploadScreen
      coordinator={{ key: null } as never}
      files={{ import: importer, remove } as never}
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Usar cámara"));
  screen.unmount();
  finish({
    status: "selected",
    asset: {
      uri: "file:///picker/late.jpg",
      mimeType: "image/jpeg",
      width: 10,
      height: 10,
    },
  });
  await waitFor(() =>
    expect(remove).toHaveBeenCalledWith("file:///picker/late.jpg"),
  );
  expect(importer).not.toHaveBeenCalled();
});
test("Files missing MIME imports the PDF extension as validated metadata", async () => {
  const asset = {
    uri: "file:///picker/report.PDF",
    name: "report.PDF",
    size: 100,
    lastModified: 0,
  };
  jest.mocked(pickUploadDocuments).mockResolvedValueOnce([asset]);
  const importer = jest
    .fn()
    .mockResolvedValue({
      ...asset,
      uri: "file:///private/report.pdf",
      mimeType: "application/pdf",
    });
  const screen = render(
    <UploadScreen
      coordinator={{ key: null } as never}
      files={{ import: importer, remove: jest.fn() } as never}
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.PDF");
  expect(importer).toHaveBeenCalledWith(
    expect.objectContaining({ mimeType: "application/pdf" }),
  );
});
test("Files without optional MIME imports extension metadata and removes late picker cache", async () => {
  let finish!: (assets: unknown[]) => void;
  jest.mocked(pickUploadDocuments).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve as never;
      }),
  );
  const importer = jest.fn();
  const remove = jest.fn();
  const screen = render(
    <UploadScreen
      coordinator={{ key: null } as never}
      files={{ import: importer, remove } as never}
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  screen.unmount();
  finish([
    {
      uri: "file:///picker/late.PDF",
      name: "late.PDF",
      size: 100,
      lastModified: 0,
    },
  ]);
  await waitFor(() =>
    expect(remove).toHaveBeenCalledWith("file:///picker/late.PDF"),
  );
  expect(importer).not.toHaveBeenCalled();
});
test("unknown pre-ledger result retries the same operation after owner status404", async () => {
  const attachment = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...attachment, lastModified: 0 }]);
  const upload = jest
    .fn()
    .mockRejectedValueOnce(new SessionError("AMBIGUOUS", "Network interrupted"))
    .mockResolvedValueOnce({
      operationId: "same-key",
      status: "complete",
      studyId: "study",
    });
  const get = jest
    .fn()
    .mockRejectedValue(new SessionError("404", "Unknown operation"));
  const changed = jest.fn();
  const uuid = jest.fn(() => "same-key");
  const coordinator = new UploadCoordinator(
    { upload, get } as never,
    uuid,
    jest.fn(),
    changed,
  );
  const screen = render(
    <UploadScreen
      coordinator={coordinator}
      files={
        {
          import: jest.fn().mockResolvedValue(attachment),
          remove: jest.fn(),
        } as never
      }
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  selectStudyDate(screen, "10-09-2026");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await screen.findByText("Unknown operation");
  fireEvent.press(screen.getByText("Reintentar misma carga"));
  await screen.findByText("Estudio guardado");
  expect(upload).toHaveBeenCalledTimes(2);
  expect(upload.mock.calls.map((call) => call[0])).toEqual([
    "same-key",
    "same-key",
  ]);
  expect(get).toHaveBeenCalledTimes(2);
  expect(uuid).toHaveBeenCalledTimes(1);
  expect(changed).toHaveBeenCalledTimes(1);
});
test("shows web fields and validates missing date and attachments before network", async () => {
  const submit = jest.fn();
  const screen = render(
    <UploadScreen
      coordinator={
        {
          submit,
          reconcile: jest.fn(),
          cancel: jest.fn(),
          cleanup: jest.fn(),
          key: null,
        } as never
      }
      files={{ import: jest.fn(), remove: jest.fn() } as never}
      close={jest.fn()}
    />,
  );
  for (const label of [
    "Fecha del estudio",
    "Título",
    "Institución",
    "Médico",
    "Conclusión",
    "Descripción",
  ])
    expect(screen.getByLabelText(label)).toBeTruthy();
  fireEvent.press(screen.getByText("Guardar estudio"));
  await waitFor(() =>
    expect(screen.getByText(/Ingresá una fecha válida/)).toBeTruthy(),
  );
  expect(screen.getByText(/Adjuntá hasta 10 archivos/)).toBeTruthy();
  expect(submit).not.toHaveBeenCalled();
});
test.each([true, false])(
  "definitive failed status offers safe retry or correction (retryable %s)",
  async (retryable) => {
    const attachment = {
      uri: "file:///private/report.pdf",
      name: "report.pdf",
      mimeType: "application/pdf",
      size: 100,
    };
    jest
      .mocked(pickUploadDocuments)
      .mockResolvedValue([{ ...attachment, lastModified: 0 }]);
    const coordinator = {
      key: null as string | null,
      submit: jest.fn().mockImplementation(async () => {
        coordinator.key = "key";
        return { operationId: "key", status: "failed", retryable };
      }),
      reset: jest.fn().mockImplementation(() => {
        coordinator.key = null;
      }),
    };
    const screen = render(
      <UploadScreen
        coordinator={coordinator as never}
        files={
          {
            import: jest.fn().mockResolvedValue(attachment),
            remove: jest.fn(),
          } as never
        }
        close={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText("Adjuntar desde Files"));
    await screen.findByText("report.pdf");
    selectStudyDate(screen, "10-09-2026");
    fireEvent.press(screen.getByText("Guardar estudio"));
    await screen.findByText("La carga no se guardó.");
    if (retryable) {
      fireEvent.press(screen.getByText("Reintentar misma carga"));
      await waitFor(() => expect(coordinator.submit).toHaveBeenCalledTimes(2));
    } else {
      expect(screen.queryByText("Reintentar misma carga")).toBeNull();
      fireEvent.press(screen.getByText("Editar carga"));
      expect(coordinator.reset).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("Título").props.editable).toBe(true);
    }
  },
);
test("ten attached files block another camera capture", async () => {
  const attachment = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        ...attachment,
        uri: `file:///picker/${i}.pdf`,
        lastModified: 0,
      })),
    );
  jest.mocked(pickUploadCamera).mockClear();
  const screen = render(
    <UploadScreen
      coordinator={{ key: null } as never}
      files={
        {
          import: jest
            .fn()
            .mockImplementation(async (file) => ({
              ...file,
              uri: file.uri.replace("picker", "private"),
            })),
          remove: jest.fn(),
        } as never
      }
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await waitFor(() =>
    expect(screen.getAllByText("report.pdf")).toHaveLength(10),
  );
  fireEvent.press(screen.getByText("Usar cámara"));
  expect(pickUploadCamera).not.toHaveBeenCalled();
});
test("cancel upload interrupts transport and pending result cannot close as unsaved", async () => {
  const attachment = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...attachment, lastModified: 0 }]);
  let finish!: (value: unknown) => void;
  const coordinator = {
    key: null as string | null,
    submit: jest.fn(() => {
      coordinator.key = "key";
      return new Promise((resolve) => {
        finish = resolve;
      });
    }),
    cancel: jest.fn(),
    reconcile: jest
      .fn()
      .mockResolvedValue({
        operationId: "key",
        status: "complete",
        studyId: "study",
      }),
  };
  const close = jest.fn();
  const screen = render(
    <UploadScreen
      coordinator={coordinator as never}
      files={
        {
          import: jest.fn().mockResolvedValue(attachment),
          remove: jest.fn(),
        } as never
      }
      close={close}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  selectStudyDate(screen, "10-09-2026");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await screen.findByText("Cancelar envío");
  fireEvent.press(screen.getByText("Cancelar envío"));
  expect(coordinator.cancel).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByText("Volver"));
  expect(close).not.toHaveBeenCalled();
  finish({ operationId: "key", status: "pending" });
  await screen.findByText("Verificar estado");
  fireEvent.press(screen.getByText("Volver"));
  expect(close).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("Verificar estado"));
  await screen.findByText("Estudio guardado");
  fireEvent.press(screen.getByText("Volver"));
  expect(close).toHaveBeenCalledTimes(1);
});
test("body413 explains multipart overhead and allows correction", async () => {
  const attachment = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...attachment, lastModified: 0 }]);
  const screen = render(
    <UploadScreen
      coordinator={
        {
          key: null,
          submit: jest
            .fn()
            .mockRejectedValue(new SessionError("413", "Request limit")),
        } as never
      }
      files={
        {
          import: jest.fn().mockResolvedValue(attachment),
          remove: jest.fn(),
        } as never
      }
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  selectStudyDate(screen, "10-09-2026");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await screen.findByText(/incluye los archivos y los datos del formulario/);
});
test("pending result blocks camera and attachment changes", async () => {
  const camera = jest.mocked(pickUploadCamera);
  camera.mockClear();
  const screen = render(
    <UploadScreen
      coordinator={{ key: "pending-key" } as never}
      files={{ import: jest.fn(), remove: jest.fn() } as never}
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Usar cámara"));
  expect(camera).not.toHaveBeenCalled();
});
test("camera denial offers Settings and no attachment or upload", async () => {
  jest
    .mocked(pickUploadCamera)
    .mockResolvedValue({ status: "denied", settings: true });
  const importer = jest.fn();
  const screen = render(
    <UploadScreen
      coordinator={{ key: null } as never}
      files={{ import: importer, remove: jest.fn() } as never}
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Usar cámara"));
  await screen.findByText("Abrir configuración");
  expect(importer).not.toHaveBeenCalled();
});
test("failed Files batch removes first private copy and all remaining picker temporaries", async () => {
  const assets = [
    {
      uri: "file:///picker/first.pdf",
      name: "first.pdf",
      mimeType: "application/pdf",
      size: 100,
      lastModified: 0,
    },
    {
      uri: "file:///picker/second.png",
      name: "second.png",
      mimeType: "image/png",
      size: 100,
      lastModified: 0,
    },
  ];
  jest.mocked(pickUploadDocuments).mockResolvedValue(assets);
  const remove = jest.fn();
  const importer = jest
    .fn()
    .mockResolvedValueOnce({ ...assets[0], uri: "file:///private/first.pdf" })
    .mockRejectedValueOnce(new Error("Invalid PNG"));
  const screen = render(
    <UploadScreen
      coordinator={{ key: null } as never}
      files={{ import: importer, remove } as never}
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("Invalid PNG");
  expect(remove).toHaveBeenCalledWith("file:///private/first.pdf");
  expect(remove).toHaveBeenCalledWith(assets[0].uri);
  expect(remove).toHaveBeenCalledWith(assets[1].uri);
  expect(screen.queryByText("first.pdf")).toBeNull();
});
test("pending upload freezes fields and offers status check rather than a new draft", async () => {
  const attachment = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...attachment, lastModified: 0 }]);
  const coordinator = {
    submit: jest.fn().mockImplementation(async () => {
      coordinator.key = "key";
      return { operationId: "key", status: "pending" };
    }),
    reconcile: jest
      .fn()
      .mockResolvedValue({
        operationId: "key",
        status: "complete",
        studyId: "study",
      }),
    key: null as string | null,
  };
  const screen = render(
    <UploadScreen
      coordinator={coordinator as never}
      files={
        {
          import: jest.fn().mockResolvedValue(attachment),
          remove: jest.fn(),
        } as never
      }
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  selectStudyDate(screen, "10-09-2026");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await screen.findByText("Verificar estado");
  expect(screen.getByLabelText("Título").props.editable).toBe(false);
  fireEvent.press(screen.getByText("Verificar estado"));
  await screen.findByText("Estudio guardado");
  expect(coordinator.submit).toHaveBeenCalledTimes(1);
});
test("camera attachment can be removed before upload", async () => {
  const attachment = {
    uri: "file:///private/photo.jpg",
    name: "Foto del estudio.jpg",
    mimeType: "image/jpeg",
    size: 100,
  };
  jest
    .mocked(pickUploadCamera)
    .mockResolvedValue({
      status: "selected",
      asset: {
        uri: "file:///camera/photo.jpg",
        mimeType: "image/jpeg",
        width: 10,
        height: 10,
      },
    });
  const remove = jest.fn();
  const screen = render(
    <UploadScreen
      coordinator={{ submit: jest.fn(), key: null } as never}
      files={
        { import: jest.fn().mockResolvedValue(attachment), remove } as never
      }
      close={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText("Usar cámara"));
  await waitFor(() => expect(screen.getByText(attachment.name)).toBeTruthy());
  await waitFor(() =>
    expect(
      screen.getByLabelText(`Quitar ${attachment.name}`).props
        .accessibilityState.disabled,
    ).toBe(false),
  );
  await act(async () => {
    fireEvent.press(screen.getByText(`Quitar ${attachment.name}`));
  });
  await waitFor(() => expect(screen.queryByText(attachment.name)).toBeNull());
  expect(remove).toHaveBeenCalledWith(attachment.uri);
});
test("offers owned family patients and passes chosen UUID", async () => {
  const attachment = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([{ ...attachment, lastModified: 0 }]);
  const submit = jest
    .fn()
    .mockResolvedValue({ status: "pending", operationId: "key" });
  const screen = render(
    <UploadScreen
      coordinator={{ submit, key: null } as never}
      files={
        {
          import: jest.fn().mockResolvedValue(attachment),
          remove: jest.fn(),
        } as never
      }
      close={jest.fn()}
      families={[{ uuid: "family-uuid", name: "Ana" }]}
    />,
  );
  fireEvent.press(screen.getByText("Ana"));
  selectStudyDate(screen, "10-09-2026");
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await screen.findByText("report.pdf");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ patient: "family", familyUuid: "family-uuid" }),
    ),
  );
});
test("imports Files privately and saves the civil date plus optional web fields", async () => {
  const attachment = {
    uri: "file:///cache/private.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 100,
  };
  jest
    .mocked(pickUploadDocuments)
    .mockResolvedValue([
      { ...attachment, uri: "file:///picker.pdf", lastModified: 0 },
    ]);
  const submit = jest
    .fn()
    .mockResolvedValue({
      operationId: "key",
      status: "complete",
      studyId: "study",
    });
  const close = jest.fn();
  const screen = render(
    <UploadScreen
      coordinator={
        {
          submit,
          reconcile: jest.fn(),
          cancel: jest.fn(),
          cleanup: jest.fn(),
          key: null,
        } as never
      }
      files={
        {
          import: jest.fn().mockResolvedValue(attachment),
          remove: jest.fn(),
        } as never
      }
      close={close}
    />,
  );
  fireEvent.press(screen.getByText("Adjuntar desde Files"));
  await waitFor(() => expect(screen.getByText("report.pdf")).toBeTruthy());
  selectStudyDate(screen, "10-09-2026");
  fireEvent.changeText(screen.getByLabelText("Médico"), "Dra. Ana");
  fireEvent.press(screen.getByText("Guardar estudio"));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "10-09-2026",
        medico: "Dra. Ana",
        files: [attachment],
      }),
    ),
  );
  expect(await screen.findByText("Estudio guardado")).toBeTruthy();
  expect(close).not.toHaveBeenCalled();
});

test("embedded native card reports changed draft without a duplicate back control", async () => {
 const changed=jest.fn();
 const screen=render(<UploadScreen embedded coordinator={{key:null} as never} files={{clear:jest.fn()} as never} close={jest.fn()} onNavigationState={changed}/>);
 expect(screen.queryByText("Volver")).toBeNull();
 expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({blocked:false,dirty:false}));
 fireEvent.changeText(screen.getByLabelText("T\u00edtulo"),"Informe revisado");
 await waitFor(()=>expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({blocked:false,dirty:true})));
});
test("embedded card reports an uncertain upload key as blocked even with an empty draft",()=>{
 const changed=jest.fn();
 render(<UploadScreen embedded coordinator={{key:"pending-key"} as never} files={{clear:jest.fn()} as never} close={jest.fn()} onNavigationState={changed}/>);
 expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({blocked:true,dirty:false}));
});
