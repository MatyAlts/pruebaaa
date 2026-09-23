import { useTabSwipe } from "../../src/tab-swipe";
import { premium } from "../../src/premium-theme";
import { ScrollView, StyleSheet, View } from "react-native";
import { PremiumHeader, PremiumIcon, PremiumText, PrimaryAction, ScreenBackdrop, premiumStyles } from "../../src/PremiumUI";
import { useSession } from "../../src/session-provider";
import { GoogleAvatar } from "../../src/GoogleAvatar";

export default function Account() {
  const swipe = useTabSwipe("account");
  const { client, state } = useSession();
  return <View {...swipe} style={premiumStyles.canvas}><ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={premiumStyles.content}>
    <ScreenBackdrop behind />
    <PremiumHeader eyebrow="MI SALUTECA" title="Cuenta" subtitle="Tu perfil y el acceso a tu historial." />
    <View style={premiumStyles.card}><GoogleAvatar user={state.user} size={64} systemText /><PremiumText style={styles.name}>{state.user?.name ?? "Tu cuenta"}</PremiumText>{state.user?.email ? <PremiumText style={styles.email}>{state.user.email}</PremiumText> : null}</View>
    <View style={premiumStyles.card}><View style={styles.sessionHeading}><View style={styles.lock}><PremiumIcon name="lock" size={28} /></View><PremiumText accessibilityRole="header" style={styles.section}>Sesión</PremiumText></View><PremiumText>Cerrá tu sesión cuando termines de usar la app en este dispositivo.</PremiumText>{state.message ? <PremiumText accessibilityRole="alert">{state.message}</PremiumText> : null}<PrimaryAction title="Cerrar sesión" icon="logout" busy={state.busy} disabled={!client || state.busy} onPress={() => void client?.logout()} /></View>
  </ScrollView></View>;
}
const styles = StyleSheet.create({
  name: { fontWeight: "700", fontSize: 23, lineHeight: 30, color: premium.colors.ink, marginTop: 4 },
  email: { fontSize: 16, lineHeight: 24, color: premium.colors.body },
  sessionHeading: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 4 },
  lock: { width: 46, height: 46, borderRadius: 14, backgroundColor: premium.colors.wash, alignItems: "center", justifyContent: "center" },
  section: { fontWeight: "700", fontSize: 23, color: premium.colors.ink, flex: 1 },
});
