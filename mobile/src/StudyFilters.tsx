import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { premium as brand } from "./premium-theme";
import { PremiumText as BrandText, PrimaryAction, SecondaryAction as BrandButton, ScreenBackdrop } from "./PremiumUI";
import { clinicalStyles } from "./ClinicalUI";
import type { Filters } from "./study-reader";
import { useReducedMotion } from "./use-reduced-motion";
import { useGestureProtection, useTabSwipeBlocker } from "./tab-swipe";

// Intent: ubicar el estudio correcto por datos del documento. Inset controls sobre papel sólido.
// Inter, sombras suaves, spacing 4 pt; teclado y scroll independientes del tab bar.
export function StudyFilters({ visible, filters, apply, close }: { visible: boolean; filters: Filters; apply: (filters: Filters) => void; close: () => void }) {
  const reducedMotion = useReducedMotion();
  const protection = useGestureProtection();
  useTabSwipeBlocker(visible);
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if ((draft.month && (!/^\d{1,2}$/.test(draft.month) || +draft.month < 1 || +draft.month > 12)) || (draft.year && !/^[1-9]\d{3}$/.test(draft.year))) {
      setError("Ingresá un mes entre 1 y 12 y un año de cuatro cifras.");
      return;
    }
    apply({ ...draft, month: draft.month ? String(Number(draft.month)) : "" });
  };
  return <Modal visible={visible} animationType={reducedMotion ? "none" : "slide"} presentationStyle="pageSheet" onRequestClose={close}><SafeAreaProvider><SafeAreaView style={clinicalStyles.canvas}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentInsetAdjustmentBehavior="never" keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={clinicalStyles.content}>
    <ScreenBackdrop behind />
    <BrandText accessibilityRole="header" style={clinicalStyles.heading}>Filtrar estudios</BrandText><BrandText style={clinicalStyles.subtitle}>Buscá en todo tu historial.</BrandText>
    {([["medico", "Médico", "Nombre del médico"], ["institution", "Institución", "Hospital, clínica o laboratorio"], ["month", "Mes", "1 a 12"], ["year", "Año", "Por ejemplo, 2026"]] as const).map(([key, label, placeholder]) => <View key={key} style={styles.field}><BrandText style={styles.label}>{label}</BrandText><TextInput {...protection} accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={brand.colors.body} value={draft[key]} onChangeText={(value) => setDraft((old) => ({ ...old, [key]: value }))} style={styles.input} keyboardType={key === "month" || key === "year" ? "number-pad" : "default"} maxLength={key === "month" ? 2 : key === "year" ? 4 : 400} /></View>)}
    {error ? <BrandText accessibilityRole="alert" style={{ color: brand.colors.danger }}>{error}</BrandText> : null}
    <View style={styles.actions}><PrimaryAction title="Aplicar filtros" onPress={submit} /><BrandButton title="Cancelar" onPress={close} /></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView></SafeAreaProvider></Modal>;
}
const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: brand.colors.ink, fontWeight: "500", fontSize: 15 },
  input: { minHeight: 52, backgroundColor: brand.colors.surface, borderRadius: 16, padding: 16, color: brand.colors.ink, fontSize: 17 },
  actions: { gap: 12, paddingVertical: 12 },
});
