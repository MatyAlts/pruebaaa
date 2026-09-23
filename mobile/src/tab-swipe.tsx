import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { PanResponder } from "react-native";

export type TabName = "home" | "studies" | "family" | "account";
type SwipeState = { currentTab: string; tabs: readonly string[]; width: number; blocked: boolean };
export function createTabSwipeController(state: () => SwipeState, navigate: (tab: string) => void) {
  let started = false;
  let captured = false;
  let suppressed = false;
  let origin = "";
  const horizontal = (dx: number, dy: number) => Math.abs(dx) > 24 && Math.abs(dx) > 2 * Math.abs(dy);
  const cancel = () => { started = false; captured = false; };
  return {
    start(x: number, touches: number) {
      const current = state(); suppressed = false; captured = false; origin = current.currentTab;
      started = touches === 1 && Number.isFinite(x) && x >= 24 && x <= current.width - 24 && !current.blocked;
    },
    interactiveTouch() { suppressed = true; },
    move(dx: number, dy: number, touches: number) {
      if (touches !== 1) cancel();
      if (!started || suppressed || state().blocked || state().currentTab !== origin) return false;
      captured = captured || horizontal(dx, dy);
      return captured;
    },
    release(dx: number, dy: number) {
      const current = state();
      const valid = started && captured && !suppressed && !current.blocked && current.currentTab === origin && Math.abs(dx) > 64 && horizontal(dx, dy);
      cancel();
      if (!valid) return;
      const index = current.tabs.indexOf(origin);
      if (index < 0) return;
      const next = current.tabs[index + (dx < 0 ? 1 : -1)];
      if (next) navigate(next);
    },
    cancel,
  };
}
type ContextValue = {
  state: () => SwipeState;
  navigate: (tab: string) => void;
  blockers: Set<object>;
  focus: Set<object>;
  controllers: Set<ReturnType<typeof createTabSwipeController>>;
};
const Context = createContext<ContextValue | null>(null);
export function TabSwipeProvider({ children, tabs, currentTab, width, navigate }: { children: React.ReactNode; tabs: readonly TabName[]; currentTab: string; width: number; navigate: (tab: string) => void }) {
  const latest = useRef({ tabs, currentTab, width, navigate });
  useLayoutEffect(() => { latest.current = { tabs, currentTab, width, navigate }; }, [tabs, currentTab, width, navigate]);
  const context = useMemo<ContextValue>(() => {
    const blockers = new Set<object>(); const focus = new Set<object>();
    return { blockers, focus, controllers: new Set(), state: () => ({ ...latest.current, blocked: blockers.size > 0 || focus.size > 0 }), navigate: tab => latest.current.navigate(tab) };
  }, []);
  return <Context.Provider value={context}>{children}</Context.Provider>;
}
export function useTabSwipe(tab: TabName) {
  const context = useContext(Context);
  const controller = useMemo(() => context ? createTabSwipeController(() => ({ ...context.state(), blocked: context.state().blocked || context.state().currentTab !== tab }), context.navigate) : null, [context, tab]);
  useEffect(() => {
    if (!context || !controller) return;
    context.controllers.add(controller);
    return () => { controller.cancel(); context.controllers.delete(controller); };
  }, [context, controller]);
  return useMemo(() => {
    if (!controller) return {};
    return PanResponder.create({
      onStartShouldSetPanResponderCapture: event => { controller.start(event.nativeEvent.pageX, event.nativeEvent.touches.length); return false; },
      onMoveShouldSetPanResponderCapture: (_event, gesture) => controller.move(gesture.dx, gesture.dy, gesture.numberActiveTouches),
      onPanResponderMove: (_event, gesture) => controller.move(gesture.dx, gesture.dy, gesture.numberActiveTouches),
      onPanResponderRelease: (_event, gesture) => controller.release(gesture.dx, gesture.dy),
      onPanResponderTerminate: controller.cancel,
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,
    }).panHandlers;
  }, [controller]);
}
export function useGestureProtection() {
  const context = useContext(Context); const identity = useMemo(() => ({}), []);
  useEffect(() => () => { context?.focus.delete(identity); }, [context, identity]);
  return useMemo(() => ({
    onTouchStart: () => context?.controllers.forEach(controller => controller.interactiveTouch()),
    onFocus: () => { context?.focus.add(identity); context?.controllers.forEach(controller => controller.cancel()); },
    onBlur: () => { context?.focus.delete(identity); },
  }), [context, identity]);
}
export function useTabSwipeBlocker(blocked: boolean) {
  const context = useContext(Context); const identity = useMemo(() => ({}), []);
  useLayoutEffect(() => {
    if (blocked) { context?.blockers.add(identity); context?.controllers.forEach(controller => controller.cancel()); }
    return () => { context?.blockers.delete(identity); };
  }, [blocked, context, identity]);
}
