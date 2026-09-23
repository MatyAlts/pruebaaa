import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { premium as brand, premiumStyles } from "./premium-theme";
import { PremiumText as BrandText } from "./PremiumUI";
import type { Study } from "./study-reader";
import { useGestureProtection } from "./tab-swipe";

// Intent: reconocer el documento antes de una consulta. Azul de carpeta, tinta y papel.
// Depth: sombras suaves sobre canvas gris; superficies sólidas, tipografía del sistema y spacing 4 pt.
export function ClinicalIcon({ name = "document", size = 24 }: { name?: "document" | "search" | "filter" | "person" | "chevron"; size?: number }) {
  const paths = {
    document: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z M14 2v6h6 M8 13h8 M8 17h6",
    search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    filter: "M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6",
    person: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    chevron: "m9 5 7 7-7 7",
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d={paths[name]} stroke={brand.colors.blue} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

export function PaperCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[clinicalStyles.card, style]}>{children}</View>;
}

export function StudyCard({ study, onPress, disabled }: { study: Study; onPress: () => void; disabled?: boolean }) {
  const protection = useGestureProtection();
  return <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel={study.title ?? "Estudio médico"} accessibilityHint={`Abrir detalle. Paciente: ${study.patient?.kind === "family" ? study.patient.name : "mi historial"}. ${study.date}${study.institution ? `. ${study.institution}` : ""}`} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [clinicalStyles.study, pressed && clinicalStyles.pressed]}>
    <View style={clinicalStyles.studyTop}><View style={clinicalStyles.document}><ClinicalIcon /></View><View style={clinicalStyles.studyHeading}><BrandText style={clinicalStyles.date}>{study.date || "Fecha no informada"}</BrandText><BrandText style={clinicalStyles.studyTitle}>{study.title ?? "Estudio médico"}</BrandText>{study.institution ? <BrandText style={clinicalStyles.metadata}>{study.institution}</BrandText> : null}{study.medico ? <BrandText style={clinicalStyles.metadata}>Profesional: {study.medico}</BrandText> : null}<BrandText style={clinicalStyles.patient}>{study.patient?.kind === "family" ? `Paciente: ${study.patient.name}` : "Mi historial"}</BrandText></View><ClinicalIcon name="chevron" size={18} /></View>
  </Pressable>;
}

export function EmptyHistory({ filtered = false }: { filtered?: boolean }) {
  return <View style={clinicalStyles.empty}><View style={clinicalStyles.emptyIcon}><ClinicalIcon size={32} /></View><BrandText style={clinicalStyles.emptyTitle}>{filtered ? "No encontramos estudios" : "Tu historial comienza acá"}</BrandText><BrandText style={clinicalStyles.emptyCopy}>{filtered ? "Probá otra búsqueda o ajustá los filtros." : "Todavía no tenés estudios."}</BrandText>{!filtered ? <BrandText style={clinicalStyles.emptyCopy}>Los estudios que guardes en Mi Saluteca aparecerán en este lugar.</BrandText> : null}</View>;
}

export const clinicalStyles = StyleSheet.create({
  canvas: premiumStyles.canvas,
  content: premiumStyles.content,
  heading: premiumStyles.heading,
  eyebrow: premiumStyles.eyebrow,
  subtitle: premiumStyles.subtitle,
  card: premiumStyles.card,
  study: { ...premiumStyles.card, marginBottom:12 },
  pressed: { backgroundColor: brand.colors.wash },
  studyTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  document: { width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: brand.colors.wash, borderRadius: 16 },
  studyHeading: { flex: 1, gap: 4 },
  studyTitle: { fontWeight: "600", color: brand.colors.ink, fontSize: 18, lineHeight: 26 },
  date: { color: brand.colors.body, fontSize: 13, lineHeight: 20 },
  studyMetadata: { gap: 4 },
  metadata: { color: brand.colors.body, fontSize: 14, lineHeight: 22 },
  patient: { color: brand.colors.ink, fontWeight: "500", fontSize: 12, lineHeight: 20, alignSelf: "flex-start", backgroundColor: brand.colors.wash, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  empty: { paddingVertical: 36, paddingHorizontal: 16, gap: 12, alignItems: "center" },
  emptyIcon: { width: 72, height: 72, alignItems: "center", justifyContent: "center", backgroundColor: brand.colors.wash, borderRadius: 20, marginBottom: 8 },
  emptyTitle: { fontWeight: "600", color: brand.colors.ink, fontSize: 22, lineHeight: 30, textAlign: "center" },
  emptyCopy: { color: brand.colors.body, fontSize: 15, lineHeight: 24, textAlign: "center", maxWidth: 320 },
});
