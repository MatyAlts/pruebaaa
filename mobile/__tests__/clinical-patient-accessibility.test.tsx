import { renderAsync } from "@testing-library/react-native";
import { StudyCard } from "../src/ClinicalUI";
test("VoiceOver differentiates the same study title across patient folders", async () => {
  const screen = await renderAsync(<><StudyCard study={{ id: "1", title: "Control", date: "18-09-2026", patient: { kind: "family", id: "10", name: "Ana" } }} onPress={jest.fn()} /><StudyCard study={{ id: "2", title: "Control", date: "18-09-2026", patient: { kind: "self", id: "17", name: "Usuario" } }} onPress={jest.fn()} /></>);
  const cards = screen.getAllByRole("button", { name: "Control" });
  expect(cards[0].props.accessibilityHint).toMatch(/Paciente: Ana/); expect(cards[1].props.accessibilityHint).toMatch(/Paciente: mi historial/);
});
test("legacy own DTO remains explicitly announced as own history", async () => {
  const screen = await renderAsync(<StudyCard study={{ id: "1", title: "Control antiguo", date: "01-01-2020" }} onPress={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Control antiguo" }).props.accessibilityHint).toMatch(/Paciente: mi historial/);
});
