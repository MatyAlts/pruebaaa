import { StudiesScreen } from "../../src/StudiesScreen";
import { useSession } from "../../src/session-provider";
import { UploadEntry } from "../../src/UploadEntry";
import { useRouter } from "expo-router";
export default function Studies() {
  const router = useRouter();
  const {
    client, pdf, uploadFiles, capabilities, state,
    historyRevision, invalidateHistory,
  } = useSession();
  if (!client || !pdf) return null;
  return (
    <StudiesScreen
      onOpenStudy={id => router.push({ pathname: "/study/[id]", params: { id } })}
      imagesRead={capabilities.studyImagesRead === true}
      key={state.user?.id}
      revision={historyRevision}
      familyScope={capabilities.studiesFamilyScope === true}
      client={client}
      pdf={pdf}
      advanced={capabilities.studiesSearch === true}
      header={uploadFiles ? (
        <UploadEntry onOpen={() => router.push("/upload")}
          analyzeEnabled={capabilities.studiesAnalyze === true}
          compact
          enabled={capabilities.studiesUpload === true}
          client={client}
          files={uploadFiles}
          onChanged={invalidateHistory}
          familyRead={capabilities.familyRead === true}
        />
      ) : null}
    />
  );
}
