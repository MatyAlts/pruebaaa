import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { premium as brand } from "./premium-theme";
import { PremiumText as BrandText, SecondaryAction as BrandButton, ScreenBackdrop } from "./PremiumUI";
import { ClinicalIcon, clinicalStyles, PaperCard } from "./ClinicalUI";
import type { Study } from "./study-reader";
import { useReducedMotion } from "./use-reduced-motion";
import { useTabSwipeBlocker } from "./tab-swipe";
import type { ReactNode } from "react";

// Intent: leer un documento clínico sin ruido. Papel sólido, azul/tinta y sombras suaves.
// System typography and a native safe area provider scoped to the modal window.
export function StudyDetail({ study, busy, error, close, openPdf, imagesRead = false, embedded = false, deletion, deletionBlocked = false, visible = Boolean(study) }: {
  study: Study | null; busy: boolean; error: string | null; close: () => void; openPdf: (file: string, mime?: string) => void; imagesRead?: boolean; embedded?: boolean; deletion?: ReactNode; deletionBlocked?: boolean; visible?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  useTabSwipeBlocker(visible && !embedded);
  const content = <SafeAreaProvider><SafeAreaView edges={embedded ? ["left", "right", "bottom"] : ["top", "left", "right", "bottom"]} style={clinicalStyles.canvas}><ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={clinicalStyles.content}>
      <ScreenBackdrop behind />
      {!embedded ? <BrandButton title="Volver a estudios" disabled={deletionBlocked} onPress={close} /> : null}
      {study ? <>
        <View style={styles.heading}><BrandText style={clinicalStyles.eyebrow}>MI HISTORIAL</BrandText><BrandText accessibilityRole="header" style={clinicalStyles.heading}>{study.title ?? "Estudio médico"}</BrandText><BrandText style={clinicalStyles.subtitle}>{study.date || "Fecha no informada"}</BrandText></View>
        <PaperCard>{[["Médico", study.medico], ["Institución", study.institution]].filter(([, value]) => value).map(([label, value]) => <View key={label} style={styles.field}><BrandText style={styles.label}>{label}</BrandText><BrandText>{value}</BrandText></View>)}<View style={styles.field}><BrandText style={styles.label}>Paciente</BrandText><BrandText>{study.patient?.kind === "family" ? study.patient.name : "Mi historial"}</BrandText></View></PaperCard>
        {study.description ? <PaperCard><BrandText style={styles.section}>Descripción</BrandText><BrandText>{study.description}</BrandText></PaperCard> : null}
        {study.conclusion ? <PaperCard><BrandText style={styles.section}>Conclusión</BrandText><BrandText>{study.conclusion}</BrandText></PaperCard> : null}
        <BrandText accessibilityRole="header" style={styles.section}>Documentos adjuntos</BrandText>
        {error ? <BrandText accessibilityRole="alert" style={styles.error}>{error}</BrandText> : null}
        {busy ? <BrandText accessibilityState={{ busy: true }}>Abriendo documento…</BrandText> : null}
        {!study.files?.length ? <PaperCard><BrandText>Este estudio no tiene archivos disponibles.</BrandText></PaperCard> : null}
        {study.files?.map((file) => <PaperCard key={file.id}><View style={styles.attachment}><ClinicalIcon /><BrandText style={styles.filename}>{file.name}</BrandText></View>{(file.mimeType === "application/pdf" || (imagesRead && ["image/jpeg", "image/png"].includes(file.mimeType))) ? <BrandButton title={`Abrir ${file.name}`} disabled={busy} onPress={() => file.mimeType === "application/pdf" ? openPdf(file.id) : openPdf(file.id, file.mimeType)} /> : <BrandText>{file.name}: formato no disponible</BrandText>}</PaperCard>)}
      </> : null}
      {deletion}
    </ScrollView></SafeAreaView></SafeAreaProvider>;
  return embedded ? content : <Modal visible={visible} animationType={reducedMotion ? "none" : "slide"} presentationStyle="fullScreen" onRequestClose={() => { if (!deletionBlocked) close(); }}>{content}</Modal>;
}
const styles = StyleSheet.create({
  heading: { gap: 8 },
  field: { gap: 4 },
  label: { fontWeight: "500", fontSize: 13, color: brand.colors.body },
  section: { fontWeight: "600", color: brand.colors.ink, fontSize: 22, lineHeight: 29 },
  attachment: { flexDirection: "row", alignItems: "center", gap: 12 },
  filename: { flex: 1, color: brand.colors.ink, fontSize: 16 },
  error: { color: brand.colors.danger, fontSize: 16 },
});
