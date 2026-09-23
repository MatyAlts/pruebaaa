import { TabSwipeProvider, type TabName } from "../../src/tab-swipe";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import { useSession } from "../../src/session-provider";
import { premium } from "../../src/premium-theme";
import { useReducedTransparency } from "../../src/use-reduced-transparency";
import { privateRoute } from "../../src/route-guard";
import { SafeAreaView } from "react-native-safe-area-context";
import { PremiumIcon } from "../../src/PremiumUI";

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const reducedTransparency = useReducedTransparency();
  const { state, capabilities } = useSession();
  const route = privateRoute(state);
  if (route === "pending") return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator accessibilityLabel="Restaurando sesión" /></View>;
  if (route === "public") return <Redirect href="/" />;
  const tabs: TabName[] = [...(capabilities.studiesSummary ? ["home" as const] : []), "studies", ...(capabilities.familyRead ? ["family" as const] : []), "account"];
  const currentTab = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const navigate = (tab: string) => { if (tabs.includes(tab as TabName)) router.navigate(`/(tabs)/${tab}` as `/(tabs)/${TabName}`); };
  return <TabSwipeProvider tabs={tabs} currentTab={currentTab} width={width} navigate={navigate}>{Platform.OS === "android" ? <View style={styles.androidRoot}><SafeAreaView edges={["top"]} style={styles.androidContent}><Slot /></SafeAreaView><AndroidTabBar tabs={tabs} currentTab={currentTab} navigate={navigate} /></View> : <NativeTabs tintColor={premium.colors.blue} backgroundColor={reducedTransparency ? premium.colors.surface : undefined} blurEffect={reducedTransparency ? "none" : "systemMaterial"} disableTransparentOnScrollEdge>{capabilities.studiesSummary ? <NativeTabs.Trigger name="home"><NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} /></NativeTabs.Trigger> : null}<NativeTabs.Trigger name="studies"><NativeTabs.Trigger.Label>Estudios</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} /></NativeTabs.Trigger>{capabilities.familyRead ? <NativeTabs.Trigger name="family"><NativeTabs.Trigger.Label>Familia</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} /></NativeTabs.Trigger> : null}<NativeTabs.Trigger name="account"><NativeTabs.Trigger.Label>Cuenta</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} /></NativeTabs.Trigger></NativeTabs>}</TabSwipeProvider>;
}

function AndroidTabBar({ tabs, currentTab, navigate }: { tabs: readonly TabName[]; currentTab: string; navigate: (tab: string) => void }) {
  const labels: Record<TabName, string> = { home: "Inicio", studies: "Estudios", family: "Familia", account: "Cuenta" };
  const icons: Record<TabName, "home" | "document" | "people" | "person"> = { home: "home", studies: "document", family: "people", account: "person" };
  return <SafeAreaView edges={["bottom"]} style={styles.androidBar}>{tabs.map(tab => {
    const selected = tab === currentTab;
    return <Pressable key={tab} accessibilityRole="tab" accessibilityLabel={labels[tab]} accessibilityState={{ selected }} onPress={() => navigate(tab)} style={({ pressed }) => [styles.androidTab, pressed && styles.androidTabPressed]}>
      <PremiumIcon name={icons[tab]} size={23} color={selected ? premium.colors.blue : premium.colors.muted} />
      <Text style={[styles.androidLabel, selected && styles.androidLabelSelected]}>{labels[tab]}</Text>
    </Pressable>;
  })}</SafeAreaView>;
}

const styles = StyleSheet.create({
  androidRoot: { flex: 1, backgroundColor: premium.colors.canvas },
  androidContent: { flex: 1 },
  androidBar: { flexDirection: "row", backgroundColor: premium.colors.surface, borderTopWidth: 1, borderTopColor: premium.colors.border, paddingTop: 8 },
  androidTab: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 14, marginHorizontal: 4 },
  androidTabPressed: { backgroundColor: premium.colors.wash },
  androidLabel: { color: premium.colors.muted, fontSize: 12, fontWeight: "500" },
  androidLabelSelected: { color: premium.colors.blue, fontWeight: "700" },
});
