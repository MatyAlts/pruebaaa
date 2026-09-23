import { Fragment, useEffect, useLayoutEffect, useCallback, useRef, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { NavigationState } from "./flow-navigation";
import { CalendarInput } from "./CalendarInput";
import { AiAssist } from "./AiAssist";
import { applySuggestions, suggestionFields, type FieldVersions, type SuggestionField } from "./ai-suggestions";
import type { createNativeOcr } from "./native-ocr";
import type { StudyMutationClient } from "./study-deletion";
import { PremiumHeader, PremiumText as BrandText, PrimaryAction, ScreenBackdrop, SecondaryAction as BrandButton } from "./PremiumUI";
import { premium } from "./premium-theme";
import { useGestureProtection, useTabSwipeBlocker } from "./tab-swipe";
import { clinicalStyles, PaperCard } from "./ClinicalUI";
import {
  validateUploadDraft,
  type UploadDraft,
  type UploadErrors,
  type UploadFile,
} from "./upload-draft";
import type { UploadCoordinator, UploadStatus } from "./upload-coordinator";
import type { PrivateUploadFiles } from "./upload-files";
import {
  pickUploadCamera,
  pickUploadDocuments,
  uploadDocumentMetadata,
} from "./upload-picker";
const fields = {
  date: "Fecha del estudio",
  title: "Título",
  institution: "Institución",
  medico: "Médico",
  conclusion: "Conclusión",
  description: "Descripción",
} as const;
export function UploadScreen({
  coordinator,
  files,
  close,
  families = [],
  initialFamilyUuid,
  progress = 0,
  safeArea = true,
  embedded = false,
  onNavigationState,
  patientNotice,
  ai,
}: {
  coordinator: UploadCoordinator;
  files: PrivateUploadFiles;
  close: () => void;
  families?: { uuid: string; name: string }[];
  initialFamilyUuid?: string;
  progress?: number;
  safeArea?: boolean;
  embedded?: boolean;
  onNavigationState?: (state: NavigationState) => void;
  patientNotice?: ReactNode;
  ai?: { enabled: boolean; client: StudyMutationClient; ocr: ReturnType<typeof createNativeOcr> };
}) {
  const protection = useGestureProtection();
  const fieldVersions = useRef<FieldVersions>({});
  const changeField = (field: keyof typeof fields, value: string) => {
    if (suggestionFields.includes(field as SuggestionField)) {
      const key = field as SuggestionField;
      fieldVersions.current[key] = (fieldVersions.current[key] ?? 0) + 1;
    }
    setDraft(old => ({ ...old, [field]: value }));
  };
  useTabSwipeBlocker(true);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [draft, setDraft] = useState<UploadDraft>({
    date: "",
    title: "",
    institution: "",
    medico: "",
    conclusion: "",
    description: "",
    patient: initialFamilyUuid ? "family" : "self",
    familyUuid: initialFamilyUuid,
    files: [],
  });
  const [errors, setErrors] = useState<UploadErrors>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ pending: boolean; requestId: string | null }>({ pending: false, requestId: null });
  const reportAnalysis = useCallback((pending: boolean, requestId: string | null) => { setAnalysis({ pending, requestId }); }, []);
  const [settings, setSettings] = useState(false);
  const locked = busy || Boolean(coordinator.key);
  const navigationBlocked = busy || Boolean(coordinator.key && status?.status !== "complete" && status?.status !== "failed");
  const dirty = draft.files.length > 0 || Object.keys(fields).some(field => draft[field as keyof typeof fields].trim().length > 0);
  const draftRevision = JSON.stringify(draft);
  useLayoutEffect(() => {
    onNavigationState?.({ blocked: navigationBlocked, dirty: dirty && status?.status !== "complete", revision: `${draftRevision}:${analysis.requestId ?? ""}`, pendingAnalysis: analysis.pending });
  }, [onNavigationState, navigationBlocked, dirty, draftRevision, status?.status, analysis]);
  const camera = async () => {
    setBusy(true);
    setError(null);
    setSettings(false);
    try {
      const picked = await pickUploadCamera();
      if (!active.current) {
        if (picked.status === "selected") await files.remove(picked.asset.uri);
        return;
      }
      if (picked.status === "denied") {
        setError("Permití el acceso a la cámara para fotografiar tu estudio.");
        setSettings(picked.settings);
      }
      if (picked.status === "selected") {
        const file = await files.import({
          uri: picked.asset.uri,
          name: "Foto del estudio.jpg",
          mimeType: picked.asset.mimeType || "image/jpeg",
          size: picked.asset.fileSize || 0,
        });
        if (active.current)
          setDraft((old) => ({ ...old, files: [...old.files, file] }));
        else await files.remove(file.uri);
      }
    } catch (reason) {
      if (active.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "No pudimos abrir la cámara.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const remove = async (uri: string) => {
    setBusy(true);
    setError(null);
    try {
      await files.remove(uri);
      if (active.current)
        setDraft((old) => ({
          ...old,
          files: old.files.filter((file) => file.uri !== uri),
        }));
    } catch (reason) {
      if (active.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "No pudimos quitar el archivo. Volvé a intentar.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const attach = async () => {
    setBusy(true);
    setError(null);
    let picked: Awaited<ReturnType<typeof pickUploadDocuments>> = [];
    const imported: UploadFile[] = [];
    try {
      picked = await pickUploadDocuments();
      if (!active.current) return;
      if (draft.files.length + picked.length > 10)
        throw new Error("Podés adjuntar hasta 10 archivos.");
      for (const asset of picked) {
        if (!active.current) break;
        imported.push(await files.import(uploadDocumentMetadata(asset)));
      }
      if (!active.current) {
        await Promise.all(imported.map((file) => files.remove(file.uri)));
        return;
      }
      setDraft((old) => ({ ...old, files: [...old.files, ...imported] }));
    } catch (reason) {
      await Promise.all(imported.map((file) => files.remove(file.uri)));
      if (active.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "No pudimos adjuntar el archivo.",
        );
    } finally {
      await Promise.all(picked.map((file) => files.remove(file.uri)));
      if (active.current) setBusy(false);
    }
  };
  const reconcile = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await coordinator.reconcile();
      if (active.current) setStatus(result);
    } catch (reason) {
      if (active.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "No se pudo verificar. Volvé a intentar.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const save = async () => {
    const errors = validateUploadDraft(draft);
    setErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setError(null);
    try {
      const result = await coordinator.submit(draft);
      if (active.current) setStatus(result);
    } catch (reason) {
      if (active.current)
        setError(
          reason instanceof Error && "code" in reason && reason.code === "413"
            ? "La carga completa supera 50 MiB: incluye los archivos y los datos del formulario. Quitá un archivo o elegí uno más pequeño."
            : reason instanceof Error
              ? reason.message
              : "No pudimos completar la carga.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const Container = safeArea ? SafeAreaView : View;
  const AreaProvider = safeArea && !embedded ? SafeAreaProvider : Fragment;
  return (
    <AreaProvider>
    <Container style={clinicalStyles.canvas} {...(safeArea && embedded ? { edges: ["left", "right", "bottom"] as const } : {})}>
      <ScreenBackdrop />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={clinicalStyles.content}
      >
        {!embedded ? <BrandButton
          title="Volver"
          disabled={
            busy ||
            Boolean(
              coordinator.key &&
              status?.status !== "complete" &&
              status?.status !== "failed",
            )
          }
          onPress={close}
        /> : null}
        <PremiumHeader eyebrow="TU HISTORIAL" title="Cargar estudio" subtitle="Guardá tus documentos médicos en tu historial." />
        {patientNotice}
        <PaperCard>
          <BrandText>Paciente</BrandText>
          <Pressable
            onTouchStart={protection.onTouchStart}
            accessibilityRole="button"
            accessibilityLabel="Mi historial"
            accessibilityState={{selected: draft.patient === "self", disabled: locked}}
            style={[styles.patient, draft.patient === "self" && styles.patientSelected]}
            disabled={locked}
            onPress={() =>
              setDraft((old) => ({
                ...old,
                patient: "self",
                familyUuid: undefined,
              }))
            }
          ><BrandText style={styles.patientText}>Mi historial</BrandText></Pressable>
          {families.map((family) => (
            <Pressable
            onTouchStart={protection.onTouchStart}
              key={family.uuid}
              accessibilityRole="button"
              accessibilityLabel={family.name}
              accessibilityState={{selected: draft.patient === "family" && draft.familyUuid === family.uuid, disabled: locked}}
              style={[styles.patient, draft.patient === "family" && draft.familyUuid === family.uuid && styles.patientSelected]}
              disabled={locked}
              onPress={() =>
                setDraft((old) => ({
                  ...old,
                  patient: "family",
                  familyUuid: family.uuid,
                }))
              }
            ><BrandText style={styles.patientText}>{family.name}</BrandText></Pressable>
          ))}
          <BrandText>
            {draft.patient === "self"
              ? "Mi historial seleccionado"
              : `Paciente: ${families.find((family) => family.uuid === draft.familyUuid)?.name || "familiar"}`}
          </BrandText>
        </PaperCard>
        <PaperCard>
          {(Object.keys(fields) as (keyof typeof fields)[]).map((field) => (
            <View key={field}>
              <BrandText>
                {fields[field]}
                {field === "date" ? " (obligatoria)" : " (opcional)"}
              </BrandText>
              {field === "date" ? <CalendarInput value={draft.date} disabled={locked} onChange={(date) => changeField("date", date)} /> : <TextInput
                {...protection}
                accessibilityLabel={fields[field]}
                value={draft[field]}
                editable={!locked}
                onChangeText={(value) =>
                  changeField(field, value)
                }
                multiline={field === "conclusion" || field === "description"}
                style={[styles.input, (field === "conclusion" || field === "description") && styles.multiline]}
              />}
              {errors[field] ? (
                <BrandText accessibilityRole="alert">{errors[field]}</BrandText>
              ) : null}
            </View>
          ))}
        </PaperCard>
        {errors.files ? (
          <BrandText accessibilityRole="alert">{errors.files}</BrandText>
        ) : null}
        <PaperCard>
          <BrandText accessibilityRole="header">Documentos adjuntos</BrandText>
          <BrandText>
            PDF, JPEG o PNG. Hasta 10 archivos de 10 MiB cada uno y 50 MiB en
            total.
          </BrandText>
          <BrandButton
            title="Usar cámara"
            disabled={locked || draft.files.length >= 10}
            onPress={() => void camera()}
          />
          <BrandButton
            title="Adjuntar desde Files"
            disabled={locked}
            onPress={() => void attach()}
          />
          {draft.files.map((file) => (
            <View key={file.uri}>
              <BrandText>{file.name}</BrandText>
              <BrandButton
                title={`Quitar ${file.name}`}
                disabled={locked}
                onPress={() => void remove(file.uri)}
              />
            </View>
          ))}
        </PaperCard>
        {ai ? <PaperCard><AiAssist automatic={Platform.OS === "android"} onPendingAnalysis={reportAnalysis} files={draft.files} draft={draft} versions={{ ...fieldVersions.current }} client={ai.client} ocr={ai.ocr} enabled={ai.enabled} disabled={locked} onApply={(suggestions, selected, started, overwrite) => {
          if (locked) return;
          const current = { ...fieldVersions.current };
          setDraft(old => applySuggestions(old, suggestions, selected, started, current, overwrite));
          for (const field of selected) {
            if ((started[field] ?? 0) === (current[field] ?? 0) || overwrite.includes(field)) fieldVersions.current[field] = (current[field] ?? 0) + 1;
          }
        }} /></PaperCard> : null}
        {settings ? (
          <BrandButton
            title="Abrir configuración"
            onPress={() => void Linking.openSettings()}
          />
        ) : null}
        {error ? (
          <BrandText accessibilityRole="alert">{error}</BrandText>
        ) : null}
        {busy && coordinator.key ? (
          <PaperCard>
            <BrandText
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(progress * 100),
              }}
            >
              Enviando estudio: {Math.round(progress * 100)}%
            </BrandText>
            <BrandButton
              title="Cancelar envío"
              onPress={() => coordinator.cancel()}
            />
            <BrandText>
              Interrumpir el envío no garantiza que el servidor lo haya
              cancelado. Verificaremos el resultado.
            </BrandText>
          </PaperCard>
        ) : null}
        {status?.status === "pending" || (coordinator.key && !status) ? (
          <PaperCard>
            <BrandText>
              La carga todavía no está confirmada. Verificá su estado antes de
              volver a enviarla.
            </BrandText>
            <BrandButton
              title="Verificar estado"
              disabled={busy}
              onPress={() => void reconcile()}
            />
          </PaperCard>
        ) : null}
        {status?.status === "failed" ? (
          <PaperCard>
            <BrandText accessibilityRole="alert">
              La carga no se guardó.
            </BrandText>
            {status.retryable === true ? (
              <BrandButton
                title="Reintentar misma carga"
                disabled={busy}
                onPress={() => void save()}
              />
            ) : null}
            <BrandButton
              title="Editar carga"
              disabled={busy}
              onPress={() => {
                coordinator.reset();
                setStatus(null);
                setError(null);
              }}
            />
          </PaperCard>
        ) : null}
        {coordinator.key && !status ? (
          <BrandButton
            title="Reintentar misma carga"
            disabled={busy}
            onPress={() => void save()}
          />
        ) : null}
        {status?.status === "complete" ? (
          <BrandText accessibilityRole="alert">Estudio guardado</BrandText>
        ) : !coordinator.key ? (
          <PrimaryAction
            title="Guardar estudio"
            disabled={busy}
            busy={busy}
            onPress={() => void save()}
          />
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </Container>
    </AreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  input: { minHeight: 48, borderWidth: 1, borderColor: premium.colors.border, backgroundColor: premium.colors.canvas, borderRadius: 16, padding: 12, color: premium.colors.ink, fontSize: 17, marginTop: 8 },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  patient: { minHeight: 44, padding: 12, borderRadius: 16, backgroundColor: premium.colors.canvas },
  patientSelected: { backgroundColor: premium.colors.wash, borderWidth: 1, borderColor: premium.colors.blue },
  patientText: { color: premium.colors.ink, fontWeight: "500" },
});
