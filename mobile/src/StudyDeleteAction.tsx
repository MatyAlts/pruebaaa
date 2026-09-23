import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";
import { PremiumHeader, PremiumText, SecondaryAction } from "./PremiumUI";
import { premium, premiumStyles } from "./premium-theme";
import { StudyDeletion, type StudyMutationClient } from "./study-deletion";
import { useGestureProtection, useTabSwipeBlocker } from "./tab-swipe";
import { useReducedMotion } from "./use-reduced-motion";

export function StudyDeleteAction({ studyId, client, onChanged, onBlocked }: {
  studyId: string;
  client: StudyMutationClient;
  onChanged: () => void;
  onBlocked?: (value: boolean) => void;
}) {
  const callbacks = useRef({ onChanged, onBlocked });
  useEffect(() => { callbacks.current = { onChanged, onBlocked }; }, [onChanged, onBlocked]);
  const [operation] = useState(() => new StudyDeletion(client, studyId, Crypto.randomUUID, () => callbacks.current.onChanged()));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, update] = useState(0);
  const active = useRef(true);
  const protection = useGestureProtection();
  const reducedMotion = useReducedMotion();
  useTabSwipeBlocker(open);
  useEffect(() => () => { active.current = false; operation.cleanup(); }, [operation]);

  const run = async (reconcile: boolean) => {
    if (busy) return;
    setBusy(true); setError(null); callbacks.current.onBlocked?.(true);
    try {
      if (reconcile) await operation.reconcile();
      else await operation.confirm();
    } catch (reason) {
      if (active.current) setError(reason instanceof Error ? reason.message : "No pudimos confirmar la eliminación.");
    } finally {
      if (active.current) {
        setBusy(false); update(value => value + 1);
        callbacks.current.onBlocked?.(operation.locked);
      }
    }
  };
  const completed = operation.status === "committed" || operation.status === "complete";
  return <>
    <SecondaryAction title="Eliminar estudio" disabled={busy || completed} onPress={() => setOpen(true)} />
    <Modal visible={open} presentationStyle="pageSheet" animationType={reducedMotion ? "none" : "slide"} onRequestClose={() => { if (!busy && !operation.locked) setOpen(false); }}>
      <SafeAreaProvider><SafeAreaView style={premiumStyles.canvas}>
        <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={premiumStyles.content}>
          <PremiumHeader eyebrow="TU HISTORIAL" title="Eliminar estudio" subtitle="Esta acción no se puede deshacer." />
          <PremiumText>Se eliminarán el estudio, todos sus documentos adjuntos y el acceso mediante enlaces compartidos.</PremiumText>
          {error ? <PremiumText accessibilityRole="alert">{error}</PremiumText> : null}
          {completed ? <PremiumText accessibilityRole="alert">{operation.status === "complete" ? "Estudio y archivos eliminados." : "Estudio eliminado de tu historial. La limpieza de archivos sigue pendiente."}</PremiumText> : null}
          {!operation.key ? <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel="Eliminar definitivamente" accessibilityState={{busy,disabled:busy}} disabled={busy} style={styles.destructive} onPress={() => void run(false)}><PremiumText style={styles.white}>Eliminar definitivamente</PremiumText></Pressable> : null}
          {operation.key && operation.status !== "complete" ? <SecondaryAction title="Verificar eliminación" disabled={busy} onPress={() => void run(true)} /> : null}
          {operation.status === "unknown" ? <PremiumText>No conocemos el resultado del envío. Verificá su estado antes de salir; no enviaremos otra eliminación.</PremiumText> : null}
          <SecondaryAction title={completed ? "Cerrar confirmación" : "Cancelar eliminación"} disabled={busy || operation.locked} onPress={() => setOpen(false)} />
        </ScrollView>
      </SafeAreaView></SafeAreaProvider>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  destructive: { minHeight: 52, borderRadius: 20, padding: 16, backgroundColor: premium.colors.danger, alignItems: "center", justifyContent: "center" },
  white: { color: premium.colors.surface, fontWeight: "600" },
});
