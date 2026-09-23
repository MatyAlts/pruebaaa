import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import NativeDateTimePicker from "@expo/ui/community/datetime-picker";
import { DateTimePicker as AndroidDateTimePicker, Host as AndroidHost } from "@expo/ui/jetpack-compose";
import { PremiumHeader, PremiumText, PrimaryAction, SecondaryAction } from "./PremiumUI";
import { premium, premiumStyles } from "./premium-theme";
import { useReducedMotion } from "./use-reduced-motion";
import { useGestureProtection, useTabSwipeBlocker } from "./tab-swipe";

export function civilDateFromLocalDate(date: Date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((value, index) => String(value).padStart(index === 2 ? 4 : 2, "0"))
    .join("-");
}

function selectionFromCivil(value: string) {
  const [day, month, year] = value.split("-").map(Number);
  const candidate = new Date(year, month - 1, day, 12);
  return candidate.getDate() === day && candidate.getMonth() === month - 1
    && candidate.getFullYear() === year ? candidate : new Date();
}

export function CalendarInput({ value, onChange, disabled = false }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(() => selectionFromCivil(value));
  const reducedMotion = useReducedMotion();
  const protection = useGestureProtection();
  useTabSwipeBlocker(open);
  return (
    <>
      <Pressable
        onTouchStart={protection.onTouchStart}
        accessibilityRole="button"
        accessibilityLabel="Fecha del estudio"
        accessibilityHint="Elegir una fecha en el calendario"
        accessibilityValue={{ text: value || "Sin seleccionar" }}
        accessibilityState={{ disabled }}
        disabled={disabled}
        style={styles.field}
        onPress={() => { setSelection(selectionFromCivil(value)); setOpen(true); }}
      >
        <PremiumText style={styles.value}>{value || "Seleccionar fecha"}</PremiumText>
      </Pressable>
      <Modal
        visible={open}
        presentationStyle="pageSheet"
        animationType={reducedMotion ? "none" : "slide"}
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={premiumStyles.canvas}>
            <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={premiumStyles.content}>
              <PremiumHeader eyebrow="TU HISTORIAL" title="Fecha del estudio" subtitle="Seleccioná la fecha que figura en el documento." />
              {open ? Platform.OS === "android" ? (
                <View testID="study-date-picker">
                  <AndroidHost
                    matchContents={{ vertical: true }}
                    style={styles.androidHost}
                  >
                    <AndroidDateTimePicker
                      displayedComponents="date"
                      initialDate={selection.toISOString()}
                      variant="picker"
                      onDateSelected={(date) => {
                        if (date && Number.isFinite(date.getTime())) setSelection(date);
                      }}
                    />
                  </AndroidHost>
                </View>
              ) : <NativeDateTimePicker
                testID="study-date-picker"
                value={selection}
                mode="date"
                display="inline"
                locale="es-AR"
                accentColor={premium.colors.blue}
                themeVariant="light"
                onChange={(_, date) => { if (date && Number.isFinite(date.getTime())) setSelection(date); }}
              /> : null}
              <PrimaryAction title="Confirmar fecha" disabled={disabled} onPress={() => { if (!disabled) { onChange(civilDateFromLocalDate(selection)); setOpen(false); } }} />
              <SecondaryAction title="Cancelar fecha" onPress={() => setOpen(false)} />
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 48, borderWidth: 1, borderColor: premium.colors.border, backgroundColor: premium.colors.canvas, borderRadius: 16, padding: 12, justifyContent: "center", marginTop: 8 },
  value: { color: premium.colors.ink },
  androidHost: { width: "100%" },
});
