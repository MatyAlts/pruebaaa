import { renderAsync, waitFor, fireEventAsync } from "@testing-library/react-native";
import { AccessibilityInfo, Modal } from "react-native";
import { StudyDetail } from "../src/StudyDetail";
test.each(["image/jpeg", "image/png"])("opens private %s attachment only with explicit image capability", async mimeType => {
  const openPdf = jest.fn(); const study = { id: "study", title: "Control", date: "18-09-2026", files: [{ id: "image", name: "photo", mimeType }] };
  const screen = await renderAsync(<StudyDetail study={study} busy={false} error={null} close={jest.fn()} openPdf={openPdf} imagesRead />);
  await fireEventAsync.press(screen.getByText("Abrir photo")); expect(openPdf).toHaveBeenCalledWith("image", mimeType);
  await screen.rerenderAsync(<StudyDetail study={study} busy={false} error={null} close={jest.fn()} openPdf={openPdf} imagesRead={false} />); expect(screen.queryByText("Abrir photo")).toBeNull();
});
test("family study detail identifies the actual patient rather than own history", async () => {
  const screen = await renderAsync(<StudyDetail study={{ id: "44", title: "Control", date: "18-09-2026", patient: { kind: "family", id: "1", name: "Ana" } }} busy={false} error={null} close={jest.fn()} openPdf={jest.fn()} />);
  expect(screen.getByText("Ana")).toBeTruthy(); expect(screen.queryByText("Mi historial")).toBeNull();
});

test("the document sheet respects the native Reduce Motion preference", async () => {
  const preference = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  const screen = await renderAsync(<StudyDetail study={{ id: "1", title: "Control", date: "17-09-2026" }} busy={false} error={null} close={jest.fn()} openPdf={jest.fn()} />);
  await waitFor(() => expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe("none"));
  preference.mockRestore();
});

test("the sheet may animate when Reduce Motion is disabled", async () => {
  const preference = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
  const screen = await renderAsync(<StudyDetail study={{ id: "1", title: "Control", date: "17-09-2026" }} busy={false} error={null} close={jest.fn()} openPdf={jest.fn()} />);
  await waitFor(() => expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe("slide"));
  preference.mockRestore();
});
