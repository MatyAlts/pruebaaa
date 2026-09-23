import { useEffect, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "../src/session-provider";
import { UploadFlow } from "../src/UploadEntry";
import { privateRoute } from "../src/route-guard";
import { useFlowBackGuard, type NavigationState } from "../src/flow-navigation";
import { PremiumText, SecondaryAction } from "../src/PremiumUI";

export default function UploadRoute() {
  const router = useRouter();
  const { familyUuid } = useLocalSearchParams<{ familyUuid?: string }>();
  const { state, client, uploadFiles, capabilities, capabilitiesReady, invalidateHistory } = useSession();
  const route = privateRoute(state);
  const owner = state.user?.id;
  const [navigation, setNavigation] = useState<NavigationState>({ blocked: false, dirty: false });
  const [family, setFamily] = useState<{ owner: string; uuid: string; name: string } | null>(null);
  const [error, setError] = useState<{ scope: string; message: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const scope = `${owner}:${familyUuid ?? "self"}`;
  useFlowBackGuard(navigation, route === "private", `${owner}:${familyUuid ?? "self"}`);
  useEffect(() => {
    let active = true;
    if (route === "private" && owner && client && familyUuid && capabilities.familyRead) {
      void client.get<{ familyMember: { uuid: string; name: string } }>(`/family-members/${encodeURIComponent(familyUuid)}`)
        .then(result => { if (active) { setFamily({ ...result.familyMember, owner }); setError(null); } })
        .catch(reason => { if (active) setError({ scope, message: reason instanceof Error ? reason.message : "No pudimos abrir el paciente." }); });
    }
    return () => { active = false; };
  }, [client, owner, route, familyUuid, capabilities.familyRead, revision, scope]);
  if (route === "public") return <Redirect href="/" />;
  if (route === "pending" || !capabilitiesReady) return null;
  if (!capabilities.studiesUpload || (familyUuid && !capabilities.familyRead)) return <Redirect href="/(tabs)/studies" />;
  if (!client || !uploadFiles) return null;
  if (familyUuid && (family?.owner !== owner || family?.uuid !== familyUuid)) {
    return error?.scope === scope ? <><PremiumText accessibilityRole="alert">{error.message}</PremiumText><SecondaryAction title="Reintentar paciente" onPress={() => setRevision(value => value + 1)} /></> : <PremiumText>Cargando paciente…</PremiumText>;
  }
  return <UploadFlow
    key={`${owner}:${familyUuid ?? "self"}`}
    embedded
    client={client}
    files={uploadFiles}
    onChanged={invalidateHistory}
    close={() => router.back()}
    initialFamily={familyUuid ? family ?? undefined : undefined}
    familyRead={capabilities.familyRead === true}
    analyzeEnabled={capabilities.studiesAnalyze === true}
    onNavigationState={setNavigation}
  />;
}
