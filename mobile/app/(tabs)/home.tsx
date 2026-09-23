import { Redirect, useRouter } from "expo-router";
import { HomeScreen } from "../../src/HomeScreen";
import { useSession } from "../../src/session-provider";
import { UploadEntry } from "../../src/UploadEntry";

export default function Home() {
  const router = useRouter();
  const { client, pdf, uploadFiles, state, capabilities, capabilitiesReady, historyRevision, invalidateHistory } = useSession();
  if (!state.user) return <Redirect href="/" />;
  if (!capabilitiesReady) return null;
  if (!capabilities.studiesSummary) return <Redirect href="/(tabs)/studies" />;
  if (!client || !pdf) return null;
  return <HomeScreen onOpenStudy={id => router.push({ pathname: '/study/[id]', params: { id } })} user={state.user} onViewFamily={capabilities.familyRead ? () => router.navigate("/(tabs)/family") : undefined} onViewAll={() => router.navigate("/(tabs)/studies")} imagesRead={capabilities.studyImagesRead === true} client={client} pdf={pdf} key={state.user.id} revision={historyRevision} name={state.user.name} familyScope={capabilities.studiesFamilyScope === true} upload={uploadFiles ? <UploadEntry onOpen={() => router.push("/upload")} analyzeEnabled={capabilities.studiesAnalyze === true} enabled={capabilities.studiesUpload === true} client={client} files={uploadFiles} onChanged={invalidateHistory} familyRead={capabilities.familyRead === true} /> : null} />;
}
