import { useEffect, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { FamilyScreen } from "./FamilyScreen";
import { useSession } from "./session-provider";
import { privateRoute } from "./route-guard";
import { useFlowBackGuard, type NavigationState } from "./flow-navigation";

export function FamilyFlowRoute({ folder = false }: { folder?: boolean }) {
  const router = useRouter();
  const { uuid } = useLocalSearchParams<{ uuid?: string }>();
  const { state, client, pdf, capabilities, capabilitiesReady, invalidateHistory, historyRevision } = useSession();
  const route = privateRoute(state);
  const [navigation, setNavigation] = useState<NavigationState>({ blocked: false, dirty: false });
  const [finished, setFinished] = useState(false);
  useFlowBackGuard(navigation, route === "private" && !finished, `${state.user?.id}:${uuid ?? "new"}`);
  useEffect(() => { if (finished && route === "private") router.back(); }, [finished, route, router]);
  if (route === "public") return <Redirect href="/" />;
  if (route === "pending" || !capabilitiesReady) return null;
  if (!capabilities.familyRead || (!folder && !capabilities.familyWrite)) return <Redirect href="/(tabs)/family" />;
  if (!client || !pdf) return null;
  return <FamilyScreen
    key={`${state.user?.id}:${uuid ?? "new"}`}
    revision={historyRevision}
    client={client}
    pdf={pdf}
    flowMode={folder ? "folder" : uuid ? "edit" : "create"}
    familyUuid={uuid}
    canWrite={capabilities.familyWrite === true}
    canDelete={capabilities.familyDelete === true}
    canDeleteStudies={capabilities.studiesDelete === true}
    imagesRead={capabilities.studyImagesRead === true}
    onChanged={invalidateHistory}
    onNavigationState={setNavigation}
    onSaved={() => setFinished(true)}
    onExit={() => router.back()}
    onEditFamily={id => router.push({ pathname: "/family-form", params: { uuid: id } })}
    onOpenStudy={id => router.push({ pathname: "/study/[id]", params: { id } })}
    onUploadFamily={capabilities.studiesUpload ? id => router.push({ pathname: "/upload", params: { familyUuid: id } }) : undefined}
  />;
}
