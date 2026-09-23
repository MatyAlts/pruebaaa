import { useLayoutEffect, useRef } from "react";
import { Alert } from "react-native";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";

export type NavigationState = {
  blocked: boolean;
  dirty: boolean;
  revision?: string;
  pendingAnalysis?: boolean;
};

export function useFlowBackGuard(
  state: NavigationState,
  enabled = true,
  identity = "",
) {
  const navigation = useNavigation();
  const latest = useRef({ state, enabled, identity, active: true });
  useLayoutEffect(() => {
    latest.current = { state, enabled, identity, active: true };
    return () => {
      latest.current.active = false;
    };
  }, [state, enabled, identity]);
  usePreventRemove(enabled && (state.blocked || state.dirty || Boolean(state.pendingAnalysis)), ({ data }) => {
    if (latest.current.state.blocked) {
      Alert.alert("Operación en curso", "Verificá el resultado de la operación antes de salir.");
      return;
    }
    const confirmation = latest.current;
    Alert.alert("Descartar cambios", confirmation.state.pendingAnalysis
      ? "Los cambios no guardados se perder\u00e1n. El an\u00e1lisis enviado puede continuar y consumir cuota; salir cancela la revisi\u00f3n local y no guarda el estudio."
      : "Los cambios que no guardaste se perder\u00e1n.", [
      { text: "Seguir editando", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: () => {
          const current = latest.current;
          if (
            current.active && current.enabled && !current.state.blocked &&
            current.identity === confirmation.identity &&
            current.state.revision === confirmation.state.revision &&
            current.state.pendingAnalysis === confirmation.state.pendingAnalysis
          ) navigation.dispatch(data.action);
        },
      },
    ]);
  });
}
