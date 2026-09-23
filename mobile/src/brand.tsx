import { Pressable, StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

export const brand = {
  colors: { navy: "#2F416A", blue: "#43599E", ink: "#0F172A", body: "#4A5568", surface: "#FFFFFF", accent: "#7ABB85", canvas: "#F8FAFC", wash: "#EEF3F0", border: "rgba(47,65,106,0.12)", control: "#F1F4F8", danger: "#B42318" },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { control: 12, card: 16 },
  typography: {
    title: { style: { fontFamily: "Inter_700Bold", fontSize: 36, lineHeight: 44 } satisfies TextStyle, allowFontScaling: true, maxFontSizeMultiplier: 1.4 },
    body: { style: { fontFamily: "Inter_400Regular", fontSize: 18, lineHeight: 28 } satisfies TextStyle, allowFontScaling: true, maxFontSizeMultiplier: 1.6 },
  },
} as const;

export function BrandText({ style, allowFontScaling = true, maxFontSizeMultiplier = 1.6, ...props }: TextProps) {
  return <Text {...props} allowFontScaling={allowFontScaling} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[styles.body, style]} />;
}

export function BrandButton({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.buttonInactive]}
    >
      <Text {...brand.typography.body} style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { ...brand.typography.body.style, color: brand.colors.body },
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: brand.colors.blue,
    borderRadius: brand.radius.control,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: brand.spacing.md,
    paddingVertical: brand.spacing.sm,
  },
  buttonInactive: { opacity: 0.55 },
  buttonText: { ...brand.typography.body.style, color: brand.colors.surface, fontSize: 16, lineHeight: 22 },
});
