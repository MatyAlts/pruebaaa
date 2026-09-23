import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedTransparency() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    let active = true;
    let receivedEvent = false;

    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((value) => {
        if (active && !receivedEvent) setReduced(value);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      (value) => {
        receivedEvent = true;
        if (active) setReduced(value);
      },
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
