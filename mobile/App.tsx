import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createNativeClient } from "./src/native-adapters";
import { StudiesScreen } from "./src/StudiesScreen";
import type { MobileClient } from "./src/session";
import type { PdfCoordinator } from "./src/pdf";
type Services = { client: MobileClient; pdf: PdfCoordinator };
const emptyState = { user: null, busy: false, message: null };
const noSubscribe = () => () => {};

export default function App() {
  return <AppScreen />;
}
export function AppScreen({ services }: { services?: Services } = {}) {
  const [setup] = useState(() => {
    try {
      return { services: services ?? createNativeClient(), error: null };
    } catch (error) {
      return {
        services: null,
        error:
          error instanceof Error
            ? error.message
            : "El servicio no está configurado.",
      };
    }
  });
  const client = setup.services?.client;
  const state = useSyncExternalStore(
    client ? (listener) => client.subscribe(listener) : noSubscribe,
    () => client?.state ?? emptyState,
  );
  useEffect(() => {
    void client?.restore();
  }, [client]);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.page}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.identity}>
            <Image
              source={require("./assets/brand.png")}
              style={styles.logo}
              accessibilityLabel="Logo de Mi Saluteca"
            />
            <Text accessibilityRole="header" style={styles.title}>
              Mi Saluteca
            </Text>
            <Text style={styles.message}>
              Tu salud, siempre con vos.
            </Text>
          </View>
          {state.message && (
            <Text accessibilityRole="alert">{state.message}</Text>
          )}
          {state.user && setup.services ? (
            <View style={{ gap: 24 }}>
              <Text>{state.user.name ?? "Tu cuenta"}</Text>
              <Button
                title="Cerrar sesión"
                disabled={state.busy}
                onPress={() => void client?.logout()}
              />
              <StudiesScreen
                client={setup.services.client}
                pdf={setup.services.pdf}
              />
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {setup.error && <Text>{setup.error}</Text>}
              <Button
                title="Continuar con Google"
                disabled={!client || state.busy}
                onPress={() => void client?.login()}
              />
              {state.busy && <Text>Conectando…</Text>}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1, justifyContent: "center", padding: 32 },
  identity: { alignItems: "center", gap: 24 },
  logo: { width: 128, height: 128, resizeMode: "contain" },
  title: {
    color: "#016390",
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: "#36474F",
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 400,
  },
});
