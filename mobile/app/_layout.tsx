import { Stack, ThemeProvider, DefaultTheme } from "expo-router";
import { SessionProvider } from "../src/session-provider";

const nativeCard = {
  headerShown: true,
  presentation: "card" as const,
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
  headerBackButtonDisplayMode: "minimal" as const,
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="study/[id]" options={{ ...nativeCard, title: "Estudio" }} />
          <Stack.Screen name="upload" options={{ ...nativeCard, title: "Cargar estudio" }} />
          <Stack.Screen name="family/[uuid]" options={{ ...nativeCard, title: "Carpeta familiar" }} />
          <Stack.Screen name="family-form" options={{ ...nativeCard, title: "Familiar" }} />
        </Stack>
      </SessionProvider>
    </ThemeProvider>
  );
}
