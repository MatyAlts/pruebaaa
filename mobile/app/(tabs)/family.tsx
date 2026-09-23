import { Redirect, useRouter } from "expo-router";
import { FamilyScreen } from "../../src/FamilyScreen";
import { useSession } from "../../src/session-provider";
import { UploadFlow } from "../../src/UploadEntry";
export default function Family() {
  const router = useRouter();
  const { client, pdf, uploadFiles, state, capabilities, capabilitiesReady, invalidateHistory, historyRevision } = useSession();
  if (!state.user) return <Redirect href="/" />;
  if (!capabilitiesReady) return null;
  if (!capabilities.familyRead) return <Redirect href="/(tabs)/studies" />;
  if (!client || !pdf) return null;
  return <FamilyScreen revision={historyRevision} onOpenFamily={uuid => router.push({ pathname: "/family/[uuid]", params: { uuid } })} onAddFamily={() => router.push("/family-form")} canDeleteStudies={capabilities.studiesDelete === true} imagesRead={capabilities.studyImagesRead === true} key={state.user.id} onChanged={invalidateHistory} client={client} pdf={pdf} canWrite={capabilities.familyWrite === true} canDelete={capabilities.familyDelete === true} uploadForm={capabilities.studiesUpload === true && uploadFiles ? (family, close, committed) => <UploadFlow analyzeEnabled={capabilities.studiesAnalyze === true} client={client} files={uploadFiles} onChanged={committed} close={close} initialFamily={family} safeArea={false} /> : undefined} />;
}
