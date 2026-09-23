import { useTabSwipe, useGestureProtection, useTabSwipeBlocker } from "./tab-swipe";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { brand } from "./brand";
import { SecondaryAction as BrandButton, PremiumText as BrandText, ScreenBackdrop, PremiumIcon } from "./PremiumUI";
import { useReducedMotion } from "./use-reduced-motion";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { premium } from "./premium-theme";
import { ClinicalIcon, clinicalStyles, EmptyHistory, StudyCard } from "./ClinicalUI";
import { emptyFilters, studyQuery, type Filters, type Page, type Reader, type Study } from "./study-reader";
import { StudyFilters } from "./StudyFilters";
import { StudyDetail } from "./StudyDetail";
import { StudyDeleteAction } from "./StudyDeleteAction";
import type { StudyMutationClient } from "./study-deletion";

// Intent: encontrar el documento antes de una consulta. Carpetas azules sobre papel sólido.
// Depth: sombras suaves; canvas gris, Inter y spacing 4 pt. Primer FlatList recibe insets UIKit.
export function StudiesScreen({ client, pdf, advanced = false, familyUuid, patientName, header, familyScope = false, insetBehavior = "automatic", revision = 0, imagesRead = false, onOpenStudy, deletionClient, onHistoryChanged }: { deletionClient?: StudyMutationClient; onHistoryChanged?: () => void; onOpenStudy?: (id: string) => void; imagesRead?: boolean; revision?: number; familyScope?: boolean; familyUuid?: string; patientName?: string; header?: React.ReactNode; insetBehavior?: "automatic" | "never"; client: Reader; pdf: { open(study: string, file: string, mime?: string): Promise<void> }; advanced?: boolean }) {
  const swipe = useTabSwipe("studies");
  const protection = useGestureProtection();
  const [patientScope, setPatientScope] = useState<string>("self");
  const [families, setFamilies] = useState<{ uuid: string; name: string }[]>([]);
  const [patientsRetry,setPatientsRetry]=useState(0);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filterSheet, setFilterSheet] = useState(false);
  const [items, setItems] = useState<Study[]>([]);
  const [detail, setDetail] = useState<Study | null>(null);
  const [detailDeleted, setDetailDeleted] = useState(false);
  const [deletionBlocked, setDeletionBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [retry, setRetry] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const active = useRef(true);
  const generation = useRef(0);
  const operating = useRef(false);
  const query = useCallback((cursor?: string | null) => { let path = studyQuery(filters, cursor); if (familyScope && patientScope !== "self") path += patientScope === "all" ? "&scope=all" : `&scope=family&familyUuid=${encodeURIComponent(patientScope)}`; return familyUuid ? path.replace("/studies?", `/family-members/${encodeURIComponent(familyUuid)}/studies?`) : path; }, [filters, familyScope, patientScope, familyUuid]);
  const hasFilters = Object.values(filters).some(Boolean);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    let current = true; setFamilies([]); setFamilyError(null);
    if (familyScope) void client.get<{ items: { uuid: string; name: string }[] }>("/family-members").then((value) => { if (current) setFamilies(value.items); }).catch(() => { if (current) setFamilyError("No pudimos cargar los pacientes. Intentá nuevamente."); });
    return () => { current = false; };
  }, [client, familyScope, patientsRetry]);
  useEffect(() => {
    let current = true;
    const requested = ++generation.current;
    setBusy(true); setError(null); setItems([]); setCursor(null); setDetail(null); operating.current = false;
    client.get<Page>(advanced ? query() : "/studies")
      .then((page) => { if (current && active.current && requested === generation.current) { setItems(page.items); setCursor(page.nextCursor); } })
      .catch((reason: unknown) => { if (current && active.current && requested === generation.current) setError(reason instanceof Error ? reason.message : "No se pudieron cargar los estudios."); })
      .finally(() => { if (current && active.current && requested === generation.current) setBusy(false); });
    return () => { current = false; };
  }, [client, retry, query, advanced, revision]);
  const operation = async (work: (requested: number) => Promise<void>) => {
    if (operating.current) return;
    const requested = generation.current;
    operating.current = true; setBusy(true); setError(null);
    try { await work(requested); }
    catch (reason) { if (active.current && requested === generation.current) setError(reason instanceof Error ? reason.message : "No se pudo completar la operación."); }
    finally { if (active.current && requested === generation.current) { operating.current = false; setBusy(false); } }
  };
  const more = () => operation(async (requested) => {
    if (!cursor) return;
    const page = await client.get<Page>(advanced ? query(cursor) : `/studies?cursor=${encodeURIComponent(cursor)}`);
    if (active.current && requested === generation.current) { setItems((old) => [...old, ...page.items.filter((item) => !old.some((existing) => existing.id === item.id))]); setCursor(page.nextCursor); }
  });
  const select = (id: string) => onOpenStudy ? onOpenStudy(id) : operation(async (requested) => {
    const item = await client.get<{ study: Study }>(`/studies/${encodeURIComponent(id)}`);
    if (active.current && requested === generation.current) { setDetailDeleted(false); setDetail(item.study); }
  });
  const reset = () => { setFilters(emptyFilters); setSearch(""); };
  return <View {...swipe} style={clinicalStyles.canvas}>
    <FlatList testID="studies-scroll" contentInsetAdjustmentBehavior={insetBehavior} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" data={items} keyExtractor={(item) => item.id} contentContainerStyle={clinicalStyles.content} refreshControl={<RefreshControl refreshing={busy && !detail} onRefresh={() => setRetry((old) => old + 1)} tintColor={brand.colors.blue} />}
      ListHeaderComponent={<View style={styles.header}><ScreenBackdrop behind /><BrandText style={clinicalStyles.eyebrow}>MI HISTORIAL</BrandText><BrandText accessibilityRole="header" style={clinicalStyles.heading}>{patientName ? `Estudios de ${patientName}` : "Mis estudios"}</BrandText><BrandText style={clinicalStyles.subtitle}>Tu documentación médica, ordenada y a mano.</BrandText>
        {header}
        {familyScope ? <PaperPatientSelection scope={patientScope} select={setPatientScope} families={families} error={familyError} retry={()=>setPatientsRetry(value=>value+1)} /> : null}{advanced ? <><View style={styles.search}><ClinicalIcon name="search" size={20} /><TextInput {...protection} accessibilityLabel="Buscar estudios" placeholder="Buscar por título o descripción" placeholderTextColor={brand.colors.body} value={search} onChangeText={setSearch} onSubmitEditing={() => setFilters((old) => ({ ...old, q: search.trim() }))} returnKeyType="search" maxLength={200} style={styles.input} />{search ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => { setSearch(""); setFilters((old) => ({ ...old, q: "" })); }} style={styles.clear}><BrandText>×</BrandText></Pressable> : null}</View><View style={styles.controls}><Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel="Filtros" accessibilityState={{ selected: hasFilters }} onPress={() => setFilterSheet(true)} style={styles.filterButton}><PremiumIcon name="filter" /><BrandText style={{color:premium.colors.blue,fontWeight:"600"}}>Filtros</BrandText></Pressable>{hasFilters ? <BrandButton title="Limpiar filtros" onPress={reset} /> : null}</View>{hasFilters ? <BrandText style={styles.activeFilters}>{[filters.q && `Búsqueda: ${filters.q}`, filters.medico, filters.institution, filters.month && `Mes ${filters.month}`, filters.year].filter(Boolean).join(" · ")}</BrandText> : null}</> : null}
        {busy && !detail ? <BrandText accessibilityState={{ busy: true }}>Cargando…</BrandText> : null}
        {error && !detail ? <><BrandText accessibilityRole="alert" style={styles.error}>{error}</BrandText><BrandButton title="Reintentar" onPress={() => setRetry((old) => old + 1)} /></> : null}
      </View>}
      ListEmptyComponent={!busy && !error ? <EmptyHistory filtered={hasFilters} /> : null}
      renderItem={({ item }) => <StudyCard study={item} disabled={busy} onPress={() => void select(item.id)} />}
      ListFooterComponent={cursor ? <BrandButton title="Cargar más" disabled={busy} onPress={() => void more()} /> : null}
    />
    {filterSheet ? <StudyFilters visible filters={filters} close={() => setFilterSheet(false)} apply={(value) => { setFilters(value); setFilterSheet(false); }} /> : null}
    <StudyDetail imagesRead={imagesRead} visible={Boolean(detail)} study={detailDeleted ? null : detail} deletionBlocked={deletionBlocked} deletion={detail && deletionClient ? <StudyDeleteAction key={detail.id} studyId={detail.id} client={deletionClient} onBlocked={setDeletionBlocked} onChanged={() => { setDetailDeleted(true); setRetry(old => old + 1); onHistoryChanged?.(); }} /> : undefined} busy={busy} error={error} close={() => { if (deletionBlocked) return; setDetailDeleted(false); generation.current++; operating.current = false; setBusy(false); setDetail(null); setError(null); }} openPdf={(file, mime) => { if (detail) void operation(() => mime ? pdf.open(detail.id, file, mime) : pdf.open(detail.id, file)); }} />
  </View>;
}
const styles = StyleSheet.create({ clear: { minWidth:44,minHeight:44,alignItems:"center",justifyContent:"center" }, filterButton:{minHeight:44,paddingHorizontal:16,paddingVertical:12,borderRadius:24,backgroundColor:premium.colors.wash,flexDirection:"row",gap:8,alignItems:"center"}, segment:{flex:1,minWidth:120,minHeight:44,borderRadius:20,padding:12,alignItems:"center",justifyContent:"center"}, segmented:{flexDirection:"row",flexWrap:"wrap",padding:4,borderRadius:24,backgroundColor:premium.colors.surface}, patientChoice:{minHeight:44,padding:12,borderRadius:20,backgroundColor:premium.colors.surface,flexDirection:"row",alignItems:"center",gap:12}, header: { gap: 12, marginBottom: 20 }, search: { backgroundColor: premium.colors.surface, borderRadius: 20, minHeight: 52, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }, input: { flex: 1, color: premium.colors.ink, fontSize: 15, paddingVertical: 16 }, controls: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, activeFilters: { fontSize: 13, lineHeight: 20 }, error: { color: brand.colors.danger, fontSize: 16 } });

// Intent: elegir el paciente de la carpeta; tinta/azul, papel sólido e Inter,
// sombras suaves y spacing4pt; etiquetas explícitas evitan confundir historiales.
function PaperPatientSelection({ scope, select, families, error, retry }: { retry:()=>void; scope: string; select: (value: string) => void; families: { uuid: string; name: string }[]; error: string | null }) {
  const [open,setOpen]=useState(false);
  const reducedMotion=useReducedMotion();
  const protection = useGestureProtection();
  useTabSwipeBlocker(open);
  const choose=(value:string)=>{select(value);setOpen(false);};
  return <View style={{gap:12}}><BrandText style={clinicalStyles.eyebrow}>PACIENTE</BrandText><View style={styles.segmented}>{[{value:"self",label:"Mi historial"},{value:"all",label:"Todos los pacientes"}].map(item=><Pressable onTouchStart={protection.onTouchStart} key={item.value} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{selected:scope===item.value}} onPress={()=>choose(item.value)} style={[styles.segment,{backgroundColor:scope===item.value?premium.colors.blue:"transparent"}]}><BrandText style={{color:scope===item.value?"white":premium.colors.body,fontSize:15,fontWeight:scope===item.value?"600":"400"}}>{item.label}</BrandText></Pressable>)}</View>{families.length ? <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel="Seleccionar paciente" accessibilityHint="Abrir lista de familiares" onPress={()=>setOpen(true)} style={styles.patientChoice}><PremiumIcon name="person"/><BrandText style={{flex:1,color:premium.colors.ink}}>{scope!=="self"&&scope!=="all" ? `Paciente: ${families.find(member=>member.uuid===scope)?.name ?? "familiar seleccionado"}` : "Elegir familiar"}</BrandText><PremiumIcon name="chevron" size={18}/></Pressable> : null}<BrandText style={{fontSize:14}}>Mostrando: {scope === "self" ? "mi historial" : scope === "all" ? "todos los pacientes" : families.find(member=>member.uuid===scope)?.name ?? "familiar seleccionado"}</BrandText>{error ? <><BrandText accessibilityRole="alert">{error}</BrandText><BrandButton title="Reintentar pacientes" onPress={retry}/></> : null}<Modal visible={open} presentationStyle="pageSheet" animationType={reducedMotion?"none":"slide"} onRequestClose={()=>setOpen(false)}><SafeAreaProvider><SafeAreaView style={clinicalStyles.canvas}><FlatList contentInsetAdjustmentBehavior="never" contentContainerStyle={clinicalStyles.content} data={families} keyExtractor={member=>member.uuid} ListHeaderComponent={<><BrandText accessibilityRole="header" style={clinicalStyles.heading}>Elegir paciente</BrandText><BrandButton title="Cerrar pacientes" onPress={()=>setOpen(false)}/></>} renderItem={({item:member})=><Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel={`Paciente: ${member.name}`} accessibilityState={{selected:scope===member.uuid}} onPress={()=>choose(member.uuid)} style={[styles.patientChoice,scope===member.uuid&&{backgroundColor:premium.colors.wash}]}><PremiumIcon name="person"/><BrandText style={{flex:1,color:premium.colors.ink}}>{member.name}</BrandText><PremiumIcon name="chevron" size={18}/></Pressable>}/></SafeAreaView></SafeAreaProvider></Modal></View>;
}
