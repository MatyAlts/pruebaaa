import { useTabSwipe, useGestureProtection } from "./tab-swipe";
import { useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { brand } from "./brand";
import { SecondaryAction as BrandButton, PremiumText as BrandText, ScreenBackdrop, PremiumIcon, PremiumHeader } from "./PremiumUI";
import { premium, stackSummaryCards } from "./premium-theme";
import { GoogleAvatar } from "./GoogleAvatar";
import type { User } from "./session";
import { clinicalStyles, EmptyHistory, PaperCard, StudyCard } from "./ClinicalUI";
import { StudyDetail } from "./StudyDetail";
import type { Reader, Study, Summary } from "./study-reader";

// Intent: ver el historial completo y recuperar el último documento. Tinta, carpeta azul y papel.
// Depth: sombras suaves; superficie sólida, tipografía del sistema, spacing 4 pt; scroll automático UIKit.
export function HomeScreen({ client, pdf, name, familyScope = false, upload, revision = 0, imagesRead = false, user, onViewAll, onViewFamily, onOpenStudy }: { onOpenStudy?: (id: string) => void; user?: User; onViewAll?: () => void; onViewFamily?: () => void; client: Reader; pdf: { open(study: string, file: string, mime?: string): Promise<void> }; name: string | null; familyScope?: boolean; upload?: React.ReactNode; revision?: number; imagesRead?: boolean }) {
  const swipe = useTabSwipe("home");
  const protection = useGestureProtection();
  const { width, fontScale } = useWindowDimensions();
  const stacked = stackSummaryCards(width, fontScale);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [retry, setRetry] = useState(0);
  const [detail, setDetail] = useState<Study | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const mounted = useRef(true);
  const operationGeneration = useRef(0);
  const operating = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    setBusy(true); setError(null);
    void client.get<Summary>(familyScope ? "/studies/summary?scope=all" : "/studies/summary").then((value) => { if (active) setSummary(value); }).catch((reason) => { if (active) { setSummary(null); setError(reason instanceof Error ? reason.message : "No pudimos cargar tu historial."); } }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [client, retry, familyScope, revision]);
  const operation = async (work: () => Promise<void>) => {
    if (operating.current) return;
    const requested = operationGeneration.current;
    operating.current = true; setDetailBusy(true); setDetailError(null);
    try { await work(); }
    catch (reason) { if (mounted.current && requested === operationGeneration.current) setDetailError(reason instanceof Error ? reason.message : "No pudimos abrir el estudio."); }
    finally { if (mounted.current && requested === operationGeneration.current) { operating.current = false; setDetailBusy(false); } }
  };
  const select = (id: string) => onOpenStudy ? onOpenStudy(id) : operation(async () => {
    const requested = operationGeneration.current;
    const study = await client.get<{ study: Study }>(`/studies/${encodeURIComponent(id)}`);
    if (mounted.current && requested === operationGeneration.current) setDetail(study.study);
  });
  return <View {...swipe} style={clinicalStyles.canvas}><ScrollView testID="home-scroll" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={clinicalStyles.content} refreshControl={<RefreshControl refreshing={busy} onRefresh={() => setRetry((old) => old + 1)} tintColor={brand.colors.blue} />}>
    <ScreenBackdrop behind />
    <PremiumHeader
      eyebrow="MI SALUTECA"
      title={`Hola, ${name?.trim().split(/\s+/)[0] || "bienvenido"}`}
      subtitle="Tu salud, siempre con vos."
      accessory={user ? <GoogleAvatar user={user} size={48} round systemText /> : null}
    />
    {upload}
    {busy ? <BrandText accessibilityState={{ busy: true }}>Cargando tu historial…</BrandText> : null}
    {error ? <PaperCard><BrandText accessibilityRole="alert" style={styles.error}>{error}</BrandText><BrandButton title="Reintentar" onPress={() => setRetry((old) => old + 1)} /></PaperCard> : null}
    {summary ? <>
      <View style={[styles.summaryGrid,stacked && {flexDirection:"column"}]}><SummarySurface style={styles.summaryCard} action={onViewAll} label="Abrir mis estudios" hint={`${summary.propiosTotal} estudios en tu historial personal.`}><View style={styles.summaryIcon}><PremiumIcon size={24}/></View><BrandText style={styles.summaryLabel}>Mis estudios</BrandText><BrandText style={styles.summaryCount}>{summary.propiosTotal}</BrandText><BrandText style={styles.summaryCopyCompact}>Documentos guardados en tu historial personal.</BrandText></SummarySurface>
      {familyScope && typeof summary.familiaresTotal === "number" && typeof summary.total === "number" ? <SummarySurface style={styles.familySummaryCard} action={onViewFamily} label="Abrir estudios familiares" hint={`${summary.familiaresTotal} estudios familiares. Total del grupo familiar: ${summary.total} estudios.`}><View style={[styles.summaryIcon,{backgroundColor:premium.colors.mintWash}]}><PremiumIcon name="people" color={premium.colors.mint} size={24}/></View><BrandText style={styles.summaryLabel}>Estudios familiares</BrandText><BrandText style={styles.summaryCount}>{summary.familiaresTotal}</BrandText><View style={styles.divider}/><BrandText style={styles.summaryCopyCompact}>Total del grupo familiar</BrandText><BrandText style={styles.summaryGroupCount}>{summary.total}</BrandText></SummarySurface> : null}</View>
      <View style={styles.section}><View style={styles.sectionTop}><BrandText accessibilityRole="header" style={styles.sectionTitle}>Estudios recientes</BrandText>{onViewAll ? <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel="Ver todos" onPress={onViewAll} style={styles.viewAll}><BrandText style={{color:premium.colors.blue,fontSize:14}}>Ver todos</BrandText><PremiumIcon name="chevron" size={16}/></Pressable> : null}</View><BrandText style={styles.summaryCopy}>Los últimos documentos de tu historial.</BrandText></View>
      {detailBusy && !detail ? <BrandText accessibilityState={{ busy: true }}>Abriendo estudio…</BrandText> : null}
      {detailError && !detail ? <BrandText accessibilityRole="alert" style={styles.error}>{detailError}</BrandText> : null}
      {summary.recientes.length ? summary.recientes.map((study) => <StudyCard key={study.id} study={study} disabled={detailBusy} onPress={() => void select(study.id)} />) : <EmptyHistory />}
    </> : null}
  </ScrollView><StudyDetail imagesRead={imagesRead} study={detail} busy={detailBusy} error={detailError} close={() => { operationGeneration.current++; operating.current = false; setDetail(null); setDetailBusy(false); setDetailError(null); }} openPdf={(file, mime) => { if (detail) void operation(() => mime ? pdf.open(detail.id, file, mime) : pdf.open(detail.id, file)); }} /></View>;
}
function SummarySurface({action,label,hint,style,children}:{action?:()=>void;label:string;hint:string;style?: StyleProp<ViewStyle>;children:React.ReactNode}){
 const protection = useGestureProtection();
 return action ? <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} onPress={action} style={({pressed})=>[clinicalStyles.card,{flex:1},style,pressed&&{opacity:0.7}]}><View style={{position:"absolute",top:17,right:14}}><PremiumIcon name="chevron" size={16}/></View>{children}</Pressable> : <PaperCard style={[{flex:1},style]}>{children}</PaperCard>;
}
const styles=StyleSheet.create({ welcome:{gap:12},welcomeTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},summaryGrid:{flexDirection:"row",gap:12},summaryCard:{padding:17,gap:10},familySummaryCard:{padding:17,gap:10},icon:{width:48,height:48,borderRadius:16,backgroundColor:premium.colors.wash,alignItems:"center",justifyContent:"center"},summaryIcon:{width:41,height:41,borderRadius:14,backgroundColor:premium.colors.wash,alignItems:"center",justifyContent:"center"},label:{color:premium.colors.ink,fontSize:16,lineHeight:23,fontWeight:"500"},summaryLabel:{color:premium.colors.ink,fontSize:14,lineHeight:20,fontWeight:"500"},count:{color:premium.colors.ink,fontSize:40,lineHeight:48,fontWeight:"700"},summaryCount:{color:premium.colors.ink,fontSize:34,lineHeight:41,fontWeight:"700"},groupCount:{color:premium.colors.ink,fontSize:24,lineHeight:30,fontWeight:"700"},summaryGroupCount:{color:premium.colors.ink,fontSize:20,lineHeight:26,fontWeight:"700"},summaryCopy:{fontSize:14,lineHeight:22},summaryCopyCompact:{fontSize:13,lineHeight:19},divider:{height:1,backgroundColor:premium.colors.border},section:{gap:4,marginTop:8},sectionTop:{flexDirection:"row",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:8},sectionTitle:{color:premium.colors.ink,fontWeight:"700",fontSize:24,lineHeight:31},viewAll:{minHeight:44,flexDirection:"row",alignItems:"center",gap:4},error:{color:premium.colors.danger,fontSize:16}});
