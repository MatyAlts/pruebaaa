import { useTabSwipe, useGestureProtection, useTabSwipeBlocker } from "./tab-swipe";
import { premium } from "./premium-theme";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PremiumHeader, PremiumIcon, PremiumText, PrimaryAction, ScreenBackdrop, SecondaryAction, premiumStyles } from "./PremiumUI";
import { StudiesScreen } from "./StudiesScreen";
import type { Reader } from "./study-reader";
import { useReducedMotion } from "./use-reduced-motion";
export type FamilyMember = { id: string; uuid: string; name: string; studyCount: number; lastStudyDate: string | null };
export type FamilyClient = Reader & { write<T>(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown): Promise<T> };
type Pdf = { open(study: string, file: string, mime?: string): Promise<void> };
type Props = {
  client: FamilyClient;
  pdf: Pdf;
  canWrite?: boolean;
  canDelete?: boolean;
  canDeleteStudies?: boolean;
  onChanged?: () => void;
  imagesRead?: boolean;
  uploadForm?: (family: FamilyMember, close: () => void, committed: () => void) => React.ReactNode;
  flowMode?: "folder" | "create" | "edit";
  familyUuid?: string;
  onExit?: () => void;
  onSaved?: () => void;
  onNavigationState?: (state: { blocked: boolean; dirty: boolean; revision?: string }) => void;
  onOpenFamily?: (uuid: string) => void;
  onAddFamily?: () => void;
  onEditFamily?: (uuid: string) => void;
  onUploadFamily?: (uuid: string) => void;
  onOpenStudy?: (id: string) => void;
  revision?: number;
};
// Intent: encontrar la carpeta de un ser querido antes de una consulta. Azul de carpeta,
// tinta/papel y acento de cuidado; tipografía del sistema y una sola área segura por modal.
export function FamilyScreen({
  client,
  pdf,
  canWrite = false,
  canDelete = false,
  canDeleteStudies = false,
  onChanged,
  uploadForm,
  imagesRead = false,
  flowMode,
  familyUuid,
  onExit,
  onSaved,
  onNavigationState,
  onOpenFamily,
  onAddFamily,
  onEditFamily,
  onUploadFamily,
  onOpenStudy,
  revision = 0,
}: Props) {
  const swipe = useTabSwipe("family");
  const [items, setItems] = useState<FamilyMember[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const [uploading, setUploading] = useState(false);
  const [studyRevision, setStudyRevision] = useState(0);
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FamilyMember | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [cleanup, setCleanup] = useState<{ operationId: string; status: "pending" | "complete" } | null>(null);
  const cleanupOwner = useRef<{ client: FamilyClient; uuid: string } | null>(null);
  const nativeCleanup = flowMode ? cleanup : null;
  const protection = useGestureProtection();
  useTabSwipeBlocker(Boolean(deleting || form || selected));
  const active = useRef(true);
  const generation = useRef(0);
  const operating = useRef(false);
  const reducedMotion = useReducedMotion();
  const dirty = form && name !== initialName;
  // This revision stays in memory; discard consent applies only to this exact draft.
  const navigationRevision = JSON.stringify([
    flowMode ?? "list",
    familyUuid ?? editing?.uuid ?? selected?.uuid ?? null,
    form ? name : null,
  ]);
  useLayoutEffect(() => {
    onNavigationState?.({ blocked: busy || uploading || Boolean(deleting), dirty, revision: navigationRevision });
  }, [busy, deleting, dirty, navigationRevision, onNavigationState, uploading]);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    const requested = ++generation.current; setBusy(true); setError(null); setItems([]); setSelected(null); operating.current = false;
    if (flowMode) {
      if (nativeCleanup && cleanupOwner.current?.client === client && cleanupOwner.current.uuid === familyUuid) {
        setBusy(false);
        return;
      }
      if (nativeCleanup) {
        cleanupOwner.current = null;
        setCleanup(null);
      }
      setForm(false);
      setEditing(null);
      setName("");
      setInitialName("");
      setFormError(null);
      if (flowMode === "create") {
        setForm(true);
        setBusy(false);
        return;
      }
      if (!familyUuid) {
        setError("No pudimos identificar la carpeta familiar.");
        setBusy(false);
        return;
      }
      void client.get<{ familyMember: FamilyMember }>(`/family-members/${encodeURIComponent(familyUuid)}`)
        .then(value => {
          if (!active.current || requested !== generation.current) return;
          if (value.familyMember.uuid !== familyUuid) throw new Error("No pudimos verificar la carpeta familiar.");
          if (flowMode === "edit") {
            setEditing(value.familyMember);
            setName(value.familyMember.name);
            setInitialName(value.familyMember.name);
            setForm(true);
          } else setSelected(value.familyMember);
        })
        .catch(reason => {
          if (active.current && requested === generation.current) setError(reason instanceof Error ? reason.message : "No pudimos abrir la carpeta.");
        })
        .finally(() => {
          if (active.current && requested === generation.current) setBusy(false);
        });
      return;
    }
    void client.get<{ items: FamilyMember[] }>("/family-members").then((value) => { if (active.current && requested === generation.current) setItems(value.items); }).catch((reason) => { if (active.current && requested === generation.current) setError(reason instanceof Error ? reason.message : "No pudimos cargar tu familia."); }).finally(() => { if (active.current && requested === generation.current) setBusy(false); });

  }, [client, retry, flowMode, familyUuid, revision, nativeCleanup]);
  useEffect(() => {
    if (!cleanup?.operationId || cleanup.status === "complete") return;
    let current = true; let attempts = 0; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      attempts++;
      try {
        const value = await client.get<{ operationId: string; status: "pending" | "complete" }>(`/operations/${encodeURIComponent(cleanup.operationId)}`);
        if (!current || !active.current) return;
        if (value.operationId !== cleanup.operationId || !["pending", "complete"].includes(value.status)) throw new Error("No pudimos verificar la limpieza.");
        if (value.status === "complete") { setCleanup(value); return; }
      } catch { if (current && active.current) setError("No pudimos comprobar la limpieza de archivos. Sigue pendiente."); }
      if (current && attempts < 3) timer = setTimeout(() => void poll(), 1000);
    };
    timer = setTimeout(() => void poll(), 1000);
    return () => { current = false; clearTimeout(timer); };
  }, [client, cleanup?.operationId, cleanup?.status]);
  const open = async (member: FamilyMember) => {
    if (onOpenFamily) { onOpenFamily(member.uuid); return; }
    if (operating.current) return; operating.current = true;
    const requested = generation.current; setBusy(true); setError(null);
    try { const value = await client.get<{ familyMember: FamilyMember }>(`/family-members/${encodeURIComponent(member.uuid)}`); if (active.current && requested === generation.current) setSelected(value.familyMember); }
    catch (reason) { if (active.current && requested === generation.current) setError(reason instanceof Error ? reason.message : "No pudimos abrir la carpeta."); }
    finally { if (active.current && requested === generation.current) { operating.current = false; setBusy(false); } }
  };
  const save = async () => {
    if (operating.current) return;
    if (!name.trim() || name.trim().length > 40) { setFormError("El nombre debe tener entre 1 y 40 caracteres."); return; }
    operating.current = true; const requested = generation.current; setBusy(true); setFormError(null);
    try {
      await client.write(editing ? `/family-members/${encodeURIComponent(editing.uuid)}` : "/family-members", editing ? "PATCH" : "POST", { name: name.trim() });
      if (active.current && requested === generation.current) {
        onChanged?.();
        if (flowMode) {
          setName(name.trim());
          setInitialName(name.trim());
          onSaved?.();
        } else {
          setForm(false);
          setRetry(old => old + 1);
        }
      }
    }
    catch (reason) { if (active.current && requested === generation.current) setFormError(reason instanceof Error ? reason.message : "No pudimos guardar el familiar."); }
    finally { if (active.current && requested === generation.current) { operating.current = false; setBusy(false); } }
  };
  const remove = async () => {
    if (operating.current || !deleting || confirmation !== "misaluteca") return;
    operating.current = true; const requested = generation.current; setBusy(true); setFormError(null);
    try {
      const value = await client.write<{ operationId: string; status: "pending" | "complete" }>(`/family-members/${encodeURIComponent(deleting.uuid)}`, "DELETE", { confirmation });
      if (active.current && requested === generation.current) {
        cleanupOwner.current = { client, uuid: deleting.uuid };
        onChanged?.();
        setCleanup({
          operationId: typeof value.operationId === "string" ? value.operationId : "",
          status: value.status === "complete" && typeof value.operationId === "string" && value.operationId.length > 0 ? "complete" : "pending",
        });
        setDeleting(null);
        setSelected(null);
        if (!flowMode) setRetry(old => old + 1);
      }
    }
    catch (reason) { if (active.current && requested === generation.current) setFormError(reason instanceof Error ? reason.message : "No pudimos eliminar el familiar."); }
    finally { if (active.current && requested === generation.current) { operating.current = false; setBusy(false); } }
  };
  const checkCleanup = async () => {
    if (operating.current || !cleanup?.operationId || cleanup.status === "complete") return;
    operating.current = true; const requested = generation.current; setBusy(true); setError(null);
    try { const value = await client.get<{ operationId: string; status: "pending" | "complete" }>(`/operations/${encodeURIComponent(cleanup.operationId)}`); if (value.operationId !== cleanup.operationId || !["pending", "complete"].includes(value.status)) throw new Error("No pudimos verificar la limpieza. Sigue pendiente."); if (active.current && requested === generation.current) setCleanup(value); }
    catch (reason) { if (active.current && requested === generation.current) setError(reason instanceof Error ? reason.message : "No pudimos comprobar la limpieza. Sigue pendiente."); }
    finally { if (active.current && requested === generation.current) { operating.current = false; setBusy(false); } }
  };
  const deletionContent = deleting ? (
    <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={premiumStyles.content}>
            <SecondaryAction title="Cancelar" disabled={busy} onPress={() => { setSelected(deleting); setDeleting(null); }} />
            <PremiumHeader eyebrow="CARPETA FAMILIAR" title={`Eliminar ${deleting.name}`} subtitle="Esta acción no se puede deshacer." />
            <View style={premiumStyles.card}><PremiumText>Esta acción es irreversible. Se eliminarán el familiar, sus estudios, documentos adjuntos y el acceso mediante enlaces. No se pueden recuperar.</PremiumText></View>
            <View style={premiumStyles.card}><PremiumText style={familyStyles.fieldLabel}>Escribí misaluteca para confirmar</PremiumText><TextInput {...protection} accessibilityLabel="Escribí misaluteca para confirmar" autoCapitalize="none" autoCorrect={false} editable={!busy} value={confirmation} onChangeText={setConfirmation} style={familyStyles.input} />{formError ? <PremiumText accessibilityRole="alert" style={familyStyles.error}>{formError}</PremiumText> : null}</View>
            <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel="Eliminar definitivamente" accessibilityState={{ disabled: busy || confirmation !== "misaluteca", busy }} disabled={busy || confirmation !== "misaluteca"} onPress={() => void remove()} style={({ pressed }) => [familyStyles.destructive, (pressed || busy || confirmation !== "misaluteca") && familyStyles.pressed]}><PremiumText style={familyStyles.destructiveText}>Eliminar definitivamente</PremiumText></Pressable>
          </ScrollView>
  ) : null;
  const auxiliaryContent = (
    uploading && selected && uploadForm ? uploadForm(selected, () => setUploading(false), () => {
          onChanged?.(); setStudyRevision(old => old + 1); const requested = generation.current;
          void client.get<{ items: FamilyMember[] }>("/family-members").then(value => { if (active.current && requested === generation.current) setItems(value.items); }).catch(() => {});
        }) : deleting && !flowMode ? deletionContent : form ? (
          <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={premiumStyles.content}>
            {!flowMode ? <SecondaryAction title="Cancelar" disabled={busy} onPress={() => { setForm(false); if (editing) setSelected(editing); }} /> : null}
            <PremiumHeader eyebrow="CARPETA FAMILIAR" title={editing ? "Editar familiar" : "Agregar familiar"} subtitle="Una carpeta para su documentación médica." />
            <View style={premiumStyles.card}><View style={familyStyles.mintAvatar}><PremiumIcon name="person" color={premium.colors.mint} size={32} /></View><PremiumText style={familyStyles.fieldLabel}>Nombre del familiar</PremiumText><TextInput {...protection} accessibilityLabel="Nombre del familiar" editable={!busy && canWrite} autoCapitalize="words" autoCorrect={false} value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={() => { if (canWrite) void save(); }} style={familyStyles.input} /><PremiumText style={familyStyles.help}>Entre 1 y 40 caracteres.</PremiumText>{formError ? <PremiumText accessibilityRole="alert" style={familyStyles.error}>{formError}</PremiumText> : null}</View>
            <PrimaryAction title="Guardar familiar" icon="person-add" disabled={busy || !canWrite} busy={busy} onPress={() => void save()} />
          </ScrollView>
        ) : selected ? (
          <StudiesScreen onOpenStudy={onOpenStudy} deletionClient={canDeleteStudies ? client : undefined} onHistoryChanged={() => { onChanged?.(); const requested = generation.current; void client.get<{ items: FamilyMember[] }>("/family-members").then(value => { if (active.current && requested === generation.current) setItems(value.items); }).catch(() => {}); }} imagesRead={imagesRead} revision={studyRevision} client={client} pdf={pdf} advanced familyUuid={selected.uuid} patientName={selected.name} insetBehavior="never" header={
            <View accessibilityLabel="Acciones de la carpeta familiar" style={familyStyles.toolbar}>
              {!flowMode ? <SecondaryAction title="Volver a familia" disabled={busy} onPress={() => setSelected(null)} /> : null}
              {uploadForm || onUploadFamily ? <SecondaryAction title="Cargar estudio" disabled={busy} onPress={() => onUploadFamily ? onUploadFamily(selected.uuid) : setUploading(true)} /> : null}
              {canWrite ? <SecondaryAction title="Editar nombre" disabled={busy} onPress={() => { if (onEditFamily) { onEditFamily(selected.uuid); return; } setEditing(selected); setName(selected.name); setInitialName(selected.name); setFormError(null); setSelected(null); setForm(true); }} /> : null}
              {canDelete ? <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel="Eliminar familiar" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => { setDeleting(selected); if (!flowMode) setSelected(null); setConfirmation(""); setFormError(null); }} style={({ pressed }) => [familyStyles.deleteAction, pressed && familyStyles.pressed]}><PremiumText style={familyStyles.deleteLabel}>Eliminar familiar</PremiumText></Pressable> : null}
            </View>
          } />
        ) : null
  );
  if (flowMode) {
    return (
      <SafeAreaView style={premiumStyles.canvas} edges={["left", "right", "bottom"]}>
        <ScreenBackdrop />
        {busy && !form && !selected ? (
          <View style={premiumStyles.content}>
            <PremiumText accessibilityState={{ busy: true }}>Cargando carpeta…</PremiumText>
          </View>
        ) : null}
        {error ? (
          <View style={premiumStyles.content}>
            <PremiumText accessibilityRole="alert">{error}</PremiumText>
            <SecondaryAction title="Reintentar" onPress={() => setRetry(old => old + 1)} />
          </View>
        ) : null}
        {cleanup ? (
          <View style={premiumStyles.content}>
            <PremiumText>
              {cleanup.status === "pending"
                ? "Familiar eliminado. Limpieza de archivos pendiente."
                : "Familiar y archivos eliminados."}
            </PremiumText>
            {cleanup.status === "pending" && cleanup.operationId ? (
              <SecondaryAction title="Comprobar limpieza" disabled={busy} onPress={() => void checkCleanup()} />
            ) : null}
            {!cleanup.operationId ? (
              <PremiumText accessibilityRole="alert">
                No pudimos verificar el identificador de limpieza. No repitas la eliminación.
              </PremiumText>
            ) : null}
            {onExit ? <SecondaryAction title="Volver a familia" disabled={busy} onPress={onExit} /> : null}
          </View>
        ) : auxiliaryContent}
        <Modal
          visible={Boolean(deleting)}
          animationType={reducedMotion ? "none" : "slide"}
          presentationStyle="pageSheet"
          onRequestClose={() => { if (!busy) setDeleting(null); }}
        >
          <SafeAreaProvider>
            <SafeAreaView style={premiumStyles.canvas} edges={["top", "right", "bottom", "left"]}>
              {deletionContent}
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      </SafeAreaView>
    );
  }
  return <View {...swipe} style={premiumStyles.canvas}><FlatList contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={premiumStyles.content} data={items} keyExtractor={(item) => item.uuid} refreshControl={<RefreshControl refreshing={busy} onRefresh={() => setRetry((old) => old + 1)} tintColor={premium.colors.blue} />}
    ListHeaderComponent={<View style={{ gap: 20 }}><ScreenBackdrop behind />
      <PremiumHeader eyebrow="CARPETAS FAMILIARES" title="Mi familia" subtitle="La documentación de quienes cuidás, en su propia carpeta." />
      {canWrite ? <PrimaryAction title="Agregar familiar" icon="person-add" disabled={busy} onPress={() => { if (onAddFamily) { onAddFamily(); return; } setEditing(null); setName(""); setInitialName(""); setFormError(null); setForm(true); }} /> : null}
      <View style={[premiumStyles.card, familyStyles.info]}><View style={familyStyles.groupIcon}><PremiumIcon name="people" size={34} /></View><View style={familyStyles.copy}><PremiumText style={familyStyles.infoTitle}>Todo en un solo lugar</PremiumText><PremiumText>Agregá a tus familiares para tener sus estudios organizados y siempre a mano.</PremiumText></View></View>
      {cleanup ? <View style={premiumStyles.card}><PremiumText>{cleanup.status === "pending" ? "Familiar eliminado. Limpieza de archivos pendiente." : "Familiar y archivos eliminados."}</PremiumText>{!cleanup.operationId ? <PremiumText accessibilityRole="alert">No pudimos verificar el identificador de limpieza. Comprobá el historial; no repitas la eliminación.</PremiumText> : null}{cleanup.status === "pending" && cleanup.operationId ? <SecondaryAction title="Comprobar limpieza" disabled={busy} onPress={() => void checkCleanup()} /> : null}</View> : null}
      {busy ? <PremiumText accessibilityState={{ busy: true }}>Cargando familia…</PremiumText> : null}
      {error ? <View style={premiumStyles.card}><PremiumText accessibilityRole="alert">{error}</PremiumText><SecondaryAction title="Reintentar" onPress={() => setRetry((old) => old + 1)} /></View> : null}
      {!busy && !error ? <PremiumText accessibilityRole="header" style={familyStyles.listTitle}>Familiares ({items.length})</PremiumText> : null}
    </View>}
    ListEmptyComponent={!busy && !error ? <View style={premiumStyles.card}><PremiumText style={familyStyles.infoTitle}>Tu grupo familiar comienza acá</PremiumText><PremiumText>{canWrite ? "Usá Agregar familiar para organizar su historial." : "Las carpetas familiares aparecerán acá cuando están disponibles."}</PremiumText></View> : null}
    renderItem={({ item }) => <Pressable onTouchStart={protection.onTouchStart} accessibilityRole="button" accessibilityLabel={`Abrir carpeta de ${item.name}`} accessibilityHint={`${item.studyCount} ${item.studyCount === 1 ? "estudio" : "estudios"}`} disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => void open(item)} style={({ pressed }) => [premiumStyles.card, familyStyles.member, pressed && familyStyles.pressed]}><View style={familyStyles.mintAvatar}><PremiumIcon name="person" color={premium.colors.mint} size={32} /></View><View style={familyStyles.copy}><PremiumText style={familyStyles.memberName}>{item.name}</PremiumText><PremiumText>{item.studyCount} {item.studyCount === 1 ? "estudio" : "estudios"}</PremiumText></View><PremiumIcon name="chevron" size={18} /></Pressable>} />
    <Modal visible={Boolean(deleting || form || selected)} animationType={reducedMotion ? "none" : "slide"} presentationStyle="fullScreen" onRequestClose={() => { if (!busy && !uploading) { if (deleting) { setSelected(deleting); setDeleting(null); } else if (form) { setForm(false); if (editing) setSelected(editing); } else setSelected(null); } }}>
      {/* Modal owns a separate native UIView root; measure its own safe area. */}
      <SafeAreaProvider>
      <SafeAreaView style={premiumStyles.canvas} edges={["top", "right", "bottom", "left"]}>
        <ScreenBackdrop />
        {auxiliaryContent}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  </View>;
}
const familyStyles = StyleSheet.create({
  toolbar: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  fieldLabel: { fontSize: 16, fontWeight: "600", color: premium.colors.ink },
  input: { backgroundColor: premium.colors.canvas, borderColor: premium.colors.border, borderWidth: 1, color: premium.colors.ink, minHeight: 52, padding: 16, fontSize: 17, borderRadius: premium.radius.icon },
  help: { fontSize: 14, color: premium.colors.body },
  error: { color: premium.colors.danger },
  deleteAction: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  deleteLabel: { color: premium.colors.danger, fontWeight: "600", fontSize: 15 },
  destructive: { minHeight: 52, padding: 16, borderRadius: 20, backgroundColor: premium.colors.danger, alignItems: "center", justifyContent: "center" },
  destructiveText: { color: premium.colors.surface, fontWeight: "600", fontSize: 17 },
  info: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "rgba(255,255,255,0.72)", borderColor: "white", borderWidth: 1 },
  groupIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: premium.colors.wash, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 6 },
  infoTitle: { fontSize: 17, fontWeight: "600", color: premium.colors.ink },
  listTitle: { fontSize: 23, fontWeight: "700", color: premium.colors.ink, marginTop: 8, marginBottom: 4 },
  member: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 },
  mintAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: premium.colors.mintWash, justifyContent: "center", alignItems: "center" },
  memberName: { fontSize: 18, fontWeight: "600", color: premium.colors.ink },
  pressed: { opacity: 0.72 },
});
