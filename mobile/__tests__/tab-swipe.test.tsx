import { act, fireEvent, render } from "@testing-library/react-native";
import { PanResponder, Pressable, Text, View } from "react-native";
import { createTabSwipeController, TabSwipeProvider, useGestureProtection, useTabSwipe, useTabSwipeBlocker } from "../src/tab-swipe";
import { PrimaryAction, SecondaryAction } from "../src/PremiumUI";
const tabs = ["home", "studies", "family", "account"] as const;
afterEach(() => jest.restoreAllMocks());
function setup(current = "studies", enabled: readonly string[] = tabs) {
  const navigate = jest.fn();
  const state = { currentTab: current, tabs: enabled, width: 390, blocked: false };
  return { state, navigate, controller: createTabSwipeController(() => state, navigate) };
}
test("completed horizontal swipe navigates adjacent enabled tab once and clears its gesture", () => {
  const { controller, navigate } = setup(); controller.start(160, 1);
  expect(controller.move(-40, 4, 1)).toBe(true);
  controller.release(-95, 8); controller.release(-95, 8);
  expect(navigate).toHaveBeenCalledTimes(1); expect(navigate).toHaveBeenCalledWith("family");
});
test("right swipe goes to previous available tab without unavailable family", () => {
  const { controller, navigate } = setup("account", ["studies", "account"]); controller.start(160, 1);
  expect(controller.move(50, 4, 1)).toBe(true); controller.release(100, 8);
  expect(navigate).toHaveBeenCalledWith("studies");
});
test.each([[15, 0], [50, 30], [5, 80]])("vertical or ambiguous motion does not capture (%s,%s)", (dx, dy) => {
  const { controller, navigate } = setup(); controller.start(150, 1);
  expect(controller.move(dx, dy, 1)).toBe(false); controller.release(dx, dy); expect(navigate).not.toHaveBeenCalled();
});
test.each([0, 20, 370, 389])("edge start %s preserves system back gestures", x => {
  const { controller, navigate } = setup(); controller.start(x, 1);
  expect(controller.move(-90, 0, 1)).toBe(false); controller.release(-100, 0); expect(navigate).not.toHaveBeenCalled();
});
test("short and cancelled gestures never navigate", () => {
  const { controller, navigate } = setup(); controller.start(160, 1); controller.move(-40, 0, 1); controller.release(-50, 0);
  controller.start(160, 1); controller.move(-100, 0, 1); controller.cancel(); controller.release(-100, 0);
  expect(navigate).not.toHaveBeenCalled();
});
test("multi-touch permanently invalidates gesture including its eventual single-touch release", () => {
  const { controller, navigate } = setup(); controller.start(160, 1); expect(controller.move(-100, 0, 2)).toBe(false);
  expect(controller.move(-100, 0, 1)).toBe(false); controller.release(-100, 0); expect(navigate).not.toHaveBeenCalled();
});
test.each(["home", "account"])("outer tab %s does not wrap boundaries", current => {
  const { controller, navigate } = setup(current); const dx = current === "home" ? 100 : -100;
  controller.start(160, 1); controller.move(dx, 0, 1); controller.release(dx, 0); expect(navigate).not.toHaveBeenCalled();
});
test("interactive touch suppresses only that gesture and a new background touch can navigate", () => {
  const { controller, navigate } = setup(); controller.start(160, 1); controller.interactiveTouch();
  expect(controller.move(-100, 0, 1)).toBe(false); controller.release(-100, 0); expect(navigate).not.toHaveBeenCalled();
  controller.start(160, 1); controller.move(-100, 0, 1); controller.release(-100, 0); expect(navigate).toHaveBeenCalledWith("family");
});
test("modal focus or changed active tab prevent navigation even after capture", () => {
  const { controller, navigate, state } = setup(); controller.start(160, 1); controller.move(-100, 0, 1); state.blocked = true; controller.release(-100, 0);
  state.blocked = false; controller.start(160, 1); controller.move(-100, 0, 1); state.currentTab = "account"; controller.release(-100, 0);
  expect(navigate).not.toHaveBeenCalled();
});
function HookScreen({ modal = false, input = true, onAction = () => {} }: { modal?: boolean; input?: boolean; onAction?: () => void }) {
  const handlers = useTabSwipe("studies"); const protection = useGestureProtection(); useTabSwipeBlocker(modal);
  return <View {...handlers}><PrimaryAction title="Acción principal real" onPress={onAction} /><SecondaryAction title="Acción secundaria real" onPress={onAction} />{input ? <><Pressable accessibilityRole="button" accessibilityLabel="Focus" onPress={protection.onFocus}><Text>Focus</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Blur" onPress={protection.onBlur}><Text>Blur</Text></Pressable></> : null}</View>;
}
function hookSetup() {
  const spy = jest.spyOn(PanResponder, "create"); const navigate = jest.fn(); const onAction = jest.fn();
  const tree = (modal = false, input = true) => <TabSwipeProvider tabs={[...tabs]} currentTab="studies" width={390} navigate={navigate}><HookScreen modal={modal} input={input} onAction={onAction} /></TabSwipeProvider>;
  const screen = render(tree()); const config = spy.mock.calls[0][0];
  const start = () => config.onStartShouldSetPanResponderCapture?.({ nativeEvent: { pageX: 150, touches: [{}] } } as never, {} as never);
  const move = () => config.onMoveShouldSetPanResponderCapture?.({} as never, { dx: -100, dy: 0, numberActiveTouches: 1 } as never);
  const release = () => config.onPanResponderRelease?.({} as never, { dx: -100, dy: 0 } as never);
  return { screen, config, start, move, release, navigate, tree, spy, onAction };
}
test("input focus cancels captured gesture even when blurred before release", () => {
  const { screen, start, move, release, navigate, spy } = hookSetup();
  start(); expect(move()).toBe(true); fireEvent.press(screen.getByRole("button", { name: "Focus" })); fireEvent.press(screen.getByRole("button", { name: "Blur" })); release();
  expect(navigate).not.toHaveBeenCalled(); screen.unmount(); spy.mockRestore();
});
test("modal opening cancels capture and cleanup restores subsequent background gestures", () => {
  const { screen, start, move, release, navigate, tree, spy } = hookSetup();
  start(); expect(move()).toBe(true); screen.rerender(tree(true)); screen.rerender(tree(false)); release(); expect(navigate).not.toHaveBeenCalled();
  act(() => { start(); move(); release(); }); expect(navigate).toHaveBeenCalledWith("family"); screen.unmount(); spy.mockRestore();
});
test.each(["Acción principal real", "Acción secundaria real"])("real shared control %s excludes swiping and preserves its press", title => {
  const { screen, start, move, release, navigate, onAction } = hookSetup();
  start();
  const button = screen.getByRole("button", { name: title });
  fireEvent(button, "touchStart", { nativeEvent: { pageX: 150 } });
  expect(move()).toBe(false); release(); expect(navigate).not.toHaveBeenCalled();
  fireEvent.press(button); expect(onAction).toHaveBeenCalledTimes(1);
  start(); expect(move()).toBe(true); release(); expect(navigate).toHaveBeenCalledWith("family");
  screen.unmount();
});
