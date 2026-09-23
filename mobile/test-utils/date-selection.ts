import { fireEvent, type RenderResult } from "@testing-library/react-native";

export function selectStudyDate(screen: RenderResult, civil: string) {
  const [day, month, year] = civil.split("-").map(Number);
  fireEvent.press(screen.getByRole("button", { name: "Fecha del estudio" }));
  fireEvent(screen.getByTestId("study-date-picker"), "change", { type: "set" }, new Date(year, month - 1, day, 12));
  fireEvent.press(screen.getByRole("button", { name: "Confirmar fecha" }));
}
