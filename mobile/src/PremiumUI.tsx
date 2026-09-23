import { useId, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextProps,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { premium, premiumStyles } from "./premium-theme";
import { useGestureProtection } from "./tab-swipe";

export { premiumStyles } from "./premium-theme";

// Intent: encontrar documentos propios y familiares con calma. Papel frío,
// azul de acción, sombras discretas, tipografía del sistema y escala de 4 pt.
export function PremiumText({
  style,
  allowFontScaling = true,
  ...props
}: TextProps) {
  return (
    <Text
      {...props}
      allowFontScaling={allowFontScaling}
      style={[styles.text, style]}
    />
  );
}

type ActionProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function SecondaryAction({
  title,
  onPress,
  disabled = false,
}: ActionProps) {
  const protection = useGestureProtection();
  return (
    <Pressable
      onTouchStart={protection.onTouchStart}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        (pressed || disabled) && styles.secondaryInactive,
      ]}
    >
      <PremiumText style={styles.secondaryText}>{title}</PremiumText>
    </Pressable>
  );
}

const paths = {
  home: "M3 10.5 12 3l9 7.5 M5 9v11h14V9 M9 20v-6h6v6",
  document: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z M14 2v6h6 M8 13h8 M8 17h6",
  "document-add": "M13 2H5v20h9 M13 2v7h7l-7-7 M8 13h5 M8 17h4 M19 14v8 M15 18h8",
  "person-add": "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M12 15H9a6 6 0 0 0-6 6h10 M19 14v8 M15 18h8",
  people: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-2a5 5 0 0 1 10 0v2Z M17 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M14 21v-2a4 4 0 0 1 8 0v2Z",
  person: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  lock: "M6 10h12v10H6Z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3",
  logout: "M13 3H4v18h9 M10 12h12 M17 7l5 5-5 5",
  chevron: "m9 5 7 7-7 7",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  filter: "M3 6h18 M3 12h18 M3 18h18 M8 3v6 M16 9v6 M10 15v6",
};

type IconProps = {
  name?: keyof typeof paths;
  size?: number;
  color?: string;
};

export function PremiumIcon({
  name = "document",
  size = 24,
  color = premium.colors.blue,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      style={{ width: size, height: size, flexShrink: 0, flexGrow: 0 }}
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={paths[name]}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ScreenBackdrop({ behind = false }: { behind?: boolean }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, behind && styles.behind]}
    >
      <View style={styles.orbTop} />
      <View style={styles.orbSide} />
    </View>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  accessory?: React.ReactNode;
};

export function PremiumHeader({
  eyebrow,
  title,
  subtitle,
  accessory,
}: HeaderProps) {
  return (
    <View style={styles.headerRow}>
      <View testID="header-copy" style={styles.header}>
        <PremiumText style={premiumStyles.eyebrow}>{eyebrow}</PremiumText>
        <PremiumText accessibilityRole="header" style={premiumStyles.heading}>
          {title}
        </PremiumText>
        <PremiumText style={premiumStyles.subtitle}>{subtitle}</PremiumText>
      </View>
      {accessory}
    </View>
  );
}

type PrimaryActionProps = ActionProps & {
  icon?: "document-add" | "person-add" | "logout";
  busy?: boolean;
};

export function PrimaryAction({
  title,
  onPress,
  icon = "document-add",
  disabled = false,
  busy = false,
}: PrimaryActionProps) {
  const protection = useGestureProtection();
  const [bounds, setBounds] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const gradientId = `primary-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Pressable
      onTouchStart={protection.onTouchStart}
      onLayout={({ nativeEvent: { layout } }) => {
        const { width, height } = layout;
        const valid =
          Number.isFinite(width) &&
          Number.isFinite(height) &&
          width > 0 &&
          height > 0;
        setBounds(valid ? { width, height } : null);
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        (pressed || disabled) && styles.primaryInactive,
      ]}
    >
      {bounds ? (
        <Svg
          testID="primary-gradient"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
          width={bounds.width}
          height={bounds.height}
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={premium.colors.gradientStart} />
              <Stop offset="1" stopColor={premium.colors.gradientEnd} />
            </LinearGradient>
          </Defs>
          <Rect
            width={bounds.width}
            height={bounds.height}
            fill={`url(#${gradientId})`}
          />
        </Svg>
      ) : null}
      <PremiumIcon name={icon} color="white" size={26} />
      <PremiumText style={styles.primaryText}>{title}</PremiumText>
      {busy ? (
        <ActivityIndicator color="white" />
      ) : (
        <PremiumIcon name="chevron" color="white" size={20} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { color: premium.colors.body, fontSize: 17, lineHeight: 25 },
  behind: { zIndex: -1 },
  header: { flex: 1, gap: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  primary: {
    backgroundColor: premium.colors.gradientEnd,
    overflow: "hidden",
    borderRadius: 20,
    minHeight: 56,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  primaryInactive: { opacity: 0.65 },
  primaryText: {
    flex: 1,
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  secondary: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "flex-start",
    justifyContent: "center",
    backgroundColor: premium.colors.wash,
  },
  secondaryInactive: { opacity: 0.55 },
  secondaryText: {
    color: premium.colors.blue,
    fontSize: 16,
    fontWeight: "600",
  },
  orbTop: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    top: -180,
    right: -160,
    backgroundColor: premium.colors.blue,
    opacity: 0.045,
  },
  orbSide: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    top: 70,
    right: -255,
    backgroundColor: premium.colors.blue,
    opacity: 0.035,
  },
});
