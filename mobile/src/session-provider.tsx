import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { createNativeClient } from "./native-adapters";
import type { MobileClient, SessionState } from "./session";
import type { PdfCoordinator } from "./pdf";
import { loadCapabilities, type Capabilities } from "./capabilities";
import type { PrivateUploadFiles } from "./upload-files";

type Services = { client: MobileClient; pdf: PdfCoordinator; uploadFiles?: PrivateUploadFiles };
type SessionContextValue = Partial<Services> & { state: SessionState; configurationError: string | null; fontsReady: boolean; capabilities: Partial<Capabilities>; capabilitiesReady: boolean; historyRevision: number; invalidateHistory: () => void };
const SessionContext = createContext<SessionContextValue | null>(null);
const defaultCreateServices = () => createNativeClient() as Services;

export function SessionProvider({ children, createServices = defaultCreateServices }: { children: React.ReactNode; createServices?: () => Services }) {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const services = useMemo(() => {
    try {
      return { value: createServices(), error: null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "El servicio de Mi Saluteca no está configurado." };
    }
  }, [createServices]);
  const [state, setState] = useState<SessionState>({ user: null, busy: Boolean(services.value), message: null });
  const restoreStarted = useRef(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [capabilitySnapshot, setCapabilitySnapshot] = useState<{ user: SessionState["user"]; client?: MobileClient; features: Partial<Capabilities> } | null>(null);
  useEffect(() => {
    if (!services.value) return;
    const unsubscribe = services.value.client.subscribe(() => setState({ ...services.value!.client.state }));
    if (!restoreStarted.current) {
      restoreStarted.current = true;
      void services.value.client.restore();
    }
    return unsubscribe;
  }, [services]);
  const user = state.user;
  useEffect(() => {
    let active = true;
    if (user && services.value) {
      const client = services.value.client;
      void loadCapabilities(client).then((features) => { if (active) setCapabilitySnapshot({ user, client, features }); }).catch(() => { if (active) setCapabilitySnapshot({ user, client, features: {} }); });
    }
    return () => { active = false; };
  }, [user, services]);
  const knownCapabilities = Boolean(user && capabilitySnapshot?.user === user && capabilitySnapshot.client === services.value?.client);
  const capabilities = knownCapabilities ? capabilitySnapshot!.features : {};
  const capabilitiesReady = !user || knownCapabilities;
  return <SessionContext.Provider value={{ ...services.value, state, configurationError: services.error, fontsReady: fontsLoaded || Boolean(fontError), capabilities, capabilitiesReady, historyRevision, invalidateHistory: () => setHistoryRevision((old) => old + 1) }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider requerido.");
  return value;
}
