import { StyleSheet } from "react-native";

export function stackSummaryCards(width: number, fontScale: number) {
  return width < 360 || fontScale > 1.2;
}

export const premium = {
  colors: {
    canvas: "#F5F8FD",
    surface: "#FFFFFF",
    ink: "#10182C",
    body: "#657188",
    muted: "#8090AB",
    blue: "#007AFF",
    gradientStart: "#3D8BFF",
    gradientEnd: "#2456C5",
    wash: "#E8F1FF",
    border: "#E8EEF8",
    mint: "#159B87",
    mintWash: "#EAF8F3",
    danger: "#B42318",
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, page: 20, section: 24, xl: 32 },
  radius: { card: 24, control: 20, icon: 16 },
} as const;

export const premiumStyles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: premium.colors.canvas },
  content: { padding: 20, paddingBottom: 40, gap: 20 },
  heading: {
    color: premium.colors.ink,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  eyebrow: {
    color: premium.colors.blue,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  subtitle: { color: premium.colors.body, fontSize: 17, lineHeight: 25 },
  card: {
    backgroundColor: premium.colors.surface,
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: "#254981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
  },
});
