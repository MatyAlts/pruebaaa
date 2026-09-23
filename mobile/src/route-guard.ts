import type { SessionState } from "./session";

export function privateRoute(state: Pick<SessionState, "user" | "busy">) {
  if (state.busy) return "pending";
  return state.user ? "private" : "public";
}
