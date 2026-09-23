import { useEffect, useRef, useState } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { useSession } from "../../src/session-provider";
import { StudyDetail } from "../../src/StudyDetail";
import { PremiumText, SecondaryAction } from "../../src/PremiumUI";
import { premiumStyles } from "../../src/premium-theme";
import type { Study } from "../../src/study-reader";
import { privateRoute } from "../../src/route-guard";
import { usePreventRemove } from "expo-router/react-navigation";
import { StudyDeleteAction } from "../../src/StudyDeleteAction";

export default function DetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client, pdf, capabilities, state, invalidateHistory } = useSession();
  const route = privateRoute(state);
  const userId = state.user?.id;
  const [studyOwner, setStudyOwner] = useState<string | undefined>();
  const [studyRouteId, setStudyRouteId] = useState<string | undefined>();
  const [deleted, setDeleted] = useState(false);
  const [deletionBlocked, setDeletionBlocked] = useState(false);
  usePreventRemove(deletionBlocked && route === "private", () => {});
  const [study, setStudy] = useState<Study | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const opening = useRef(false);
  useEffect(() => {
    const lifecycle = generation;
    const requested = ++lifecycle.current;
    opening.current = false;
    setStudy(null);
    setStudyOwner(undefined);
    setStudyRouteId(undefined);
    setDeleted(false);
    setDeletionBlocked(false);
    setError(null);
    if (route !== "private" || !client || !id) return;
    setBusy(true);
    void client.get<{ study: Study }>(`/studies/${encodeURIComponent(id)}`)
      .then(result => {
        if (requested === generation.current) {
          setStudyOwner(userId);
          setStudyRouteId(id);
          setStudy(result.study);
        }
      })
      .catch(reason => { if (requested === generation.current) setError(reason instanceof Error ? reason.message : "No pudimos abrir el estudio."); })
      .finally(() => { if (requested === generation.current) setBusy(false); });
    return () => { lifecycle.current++; };
  }, [client, id, revision, route, userId]);

  const open = async (file: string, mime?: string) => {
    if (route !== "private" || studyOwner !== userId || studyRouteId !== id || !study || !pdf || opening.current) return;
    const requested = generation.current;
    opening.current = true;
    setBusy(true);
    setError(null);
    try {
      if (mime) await pdf.open(study.id, file, mime);
      else await pdf.open(study.id, file);
    } catch (reason) {
      if (requested === generation.current) setError(reason instanceof Error ? reason.message : "No pudimos abrir el documento.");
    } finally {
      if (requested === generation.current) { opening.current = false; setBusy(false); }
    }
  };
  if (route === "public") return <Redirect href="/" />;
  if (study && studyOwner === userId && studyRouteId === id && route === "private") return (
    <StudyDetail
      embedded
      study={deleted ? null : study}
      busy={busy}
      error={error}
      close={() => {}}
      openPdf={(file, mime) => void open(file, mime)}
      imagesRead={capabilities.studyImagesRead === true}
      deletion={capabilities.studiesDelete && client ? (
        <StudyDeleteAction key={`${userId}:${id}`} studyId={id} client={client} onBlocked={setDeletionBlocked} onChanged={() => { setDeleted(true); invalidateHistory(); }} />
      ) : undefined}
    />
  );
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={premiumStyles.canvas}>
      <View style={premiumStyles.content}>
        {busy ? <PremiumText accessibilityState={{ busy: true }}>Cargando estudio…</PremiumText> : null}
        {error ? <><PremiumText accessibilityRole="alert">{error}</PremiumText><SecondaryAction title="Reintentar estudio" onPress={() => setRevision(value => value + 1)} /></> : null}
      </View>
    </SafeAreaView>
  );
}
