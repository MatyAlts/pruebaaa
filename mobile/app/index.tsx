import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "../src/session-provider";
import { brand } from "../src/brand";
import { LoginScreen } from "../src/LoginScreen";
import { configuredApiOrigin } from "../src/native-origin";

export default function Entry() {
  const { client, state, configurationError, fontsReady, capabilities, capabilitiesReady } = useSession();
  if (!fontsReady) return <View style={styles.page}><ActivityIndicator accessibilityLabel="Preparando Mi Saluteca" color={brand.colors.blue} /></View>;
  if (state.user && !capabilitiesReady) return <View style={styles.page}><ActivityIndicator accessibilityLabel="Preparando tu historial" color={brand.colors.blue} /></View>;
  if (state.user) return <Redirect href={capabilities.studiesSummary ? "/(tabs)/home" : "/(tabs)/studies"} />;
  let legalOrigin: string | null = null;
  try { legalOrigin = configuredApiOrigin(process.env.EXPO_PUBLIC_API_BASE_URL); } catch {}
  return <LoginScreen login={client && !configurationError ? async () => { await client.login(); return client.state.message ? undefined : Boolean(client.state.user); } : undefined} busy={state.busy} message={configurationError ?? state.message} legalOrigin={legalOrigin} />;
}
const styles = StyleSheet.create({ page: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: brand.colors.surface } });
