import { act, fireEvent, render } from "@testing-library/react-native";
import { Image, StyleSheet } from "react-native";
import Account from "../app/(tabs)/account";
import { useSession } from "../src/session-provider";
import type { User } from "../src/session";

jest.mock("../src/session-provider", () => ({ useSession: jest.fn() }));
const session = jest.mocked(useSession);
const photo = "https://lh3.googleusercontent.com/fictional-avatar";
const logout = jest.fn();

function identity(user: User | null) {
  session.mockReturnValue({ state: { user, busy: false, message: null }, client: { logout } as never, configurationError: null, fontsReady: true, capabilities: {}, capabilitiesReady: true, historyRevision: 0, invalidateHistory: jest.fn() });
}

beforeEach(() => { logout.mockClear(); });

test("Cuenta keeps an initial while loading and displays the native photo after success without session headers", () => {
  identity({ id: "1", name: "Ana", image: photo });
  const screen = render(<Account />);
  expect(screen.getByText("A", { includeHiddenElements: true })).toBeTruthy();
  const image = screen.UNSAFE_getByType(Image);
  expect(image.props.source).toEqual({ uri: photo });
  expect(StyleSheet.flatten(image.props.style).opacity).toBe(0);
  fireEvent(image, "load");
  expect(screen.queryByText("A", { includeHiddenElements: true })).toBeNull();
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(Image).props.style).opacity).toBe(1);
  expect(screen.getByText("Ana")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(logout).toHaveBeenCalledTimes(1);
});

test.each([undefined, null, "https://untrusted.invalid/photo"])("keeps the profile and logout usable when its photo cannot be requested", (image) => {
  identity({ id: "1", name: "Ana", image });
  const screen = render(<Account />);
  expect(screen.getByText("A", { includeHiddenElements: true })).toBeTruthy();
  expect(screen.UNSAFE_queryByType(Image)).toBeNull();
  expect(screen.getByText("Ana")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
});

test.each(["network offline", "image unavailable"])("falls back quietly after native download fails: %s", (error) => {
  identity({ id: "1", name: "Ana", image: photo });
  const screen = render(<Account />);
  fireEvent(screen.UNSAFE_getByType(Image), "error", { nativeEvent: { error } });
  expect(screen.getByText("A", { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
});

test.each([photo, "https://lh3.googleusercontent.com/another-fictional-avatar"])("immediately clears a loaded previous identity even when the next URL is %s", (image) => {
  identity({ id: "1", name: "Ana", image: photo });
  const screen = render(<Account />);
  const priorLoad = screen.UNSAFE_getByType(Image).props.onLoad;
  fireEvent(screen.UNSAFE_getByType(Image), "load");
  identity({ id: "2", name: "Bea", image });
  screen.rerender(<Account />);
  expect(screen.getByText("B", { includeHiddenElements: true })).toBeTruthy();
  act(() => priorLoad());
  expect(screen.getByText("B", { includeHiddenElements: true })).toBeTruthy();
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(Image).props.style).opacity).toBe(0);
  fireEvent(screen.UNSAFE_getByType(Image), "load");
  expect(screen.queryByText("B", { includeHiddenElements: true })).toBeNull();
});

test("a changed photo URL for the same identity resets loading and ignores old errors", () => {
  identity({ id: "1", name: "Ana", image: photo });
  const screen = render(<Account />);
  const priorError = screen.UNSAFE_getByType(Image).props.onError;
  identity({ id: "1", name: "Ana", image: "https://lh3.googleusercontent.com/new-fictional-avatar" });
  screen.rerender(<Account />);
  fireEvent(screen.UNSAFE_getByType(Image), "load");
  act(() => priorError());
  expect(screen.queryByText("A", { includeHiddenElements: true })).toBeNull();
});

test("logging out removes the photo immediately and late callbacks cannot restore it", () => {
  identity({ id: "1", name: "Ana", image: photo });
  const screen = render(<Account />);
  const priorLoad = screen.UNSAFE_getByType(Image).props.onLoad;
  fireEvent(screen.UNSAFE_getByType(Image), "load");
  identity(null);
  screen.rerender(<Account />);
  act(() => priorLoad());
  expect(screen.UNSAFE_queryByType(Image)).toBeNull();
  expect(screen.getByText("M", { includeHiddenElements: true })).toBeTruthy();
});

test("a late success after a failed download cannot replace the fallback", () => {
  identity({ id: "1", name: "Ana", image: photo });
  const screen = render(<Account />);
  const priorLoad = screen.UNSAFE_getByType(Image).props.onLoad;
  fireEvent(screen.UNSAFE_getByType(Image), "error", { nativeEvent: { error: "network offline" } });
  act(() => priorLoad());
  expect(screen.getByText("A", { includeHiddenElements: true })).toBeTruthy();
  expect(screen.UNSAFE_queryByType(Image)).toBeNull();
});
