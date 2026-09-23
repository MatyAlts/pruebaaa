import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import * as Crypto from "expo-crypto";
import { PremiumText, PrimaryAction, SecondaryAction } from "./PremiumUI";
import { premium } from "./premium-theme";
import { suggestionFields, validateSuggestions, type FieldVersions, type SuggestionField, type Suggestions } from "./ai-suggestions";
import type { UploadDraft, UploadFile } from "./upload-draft";
import type { createNativeOcr } from "./native-ocr";
import type { StudyMutationClient } from "./study-deletion";
import { useGestureProtection } from "./tab-swipe";

type AnalysisResponse = {
  requestId: string;
  status: "pending" | "completed" | "failed" | "unavailable";
  suggestions?: unknown;
};
const labels: Record<SuggestionField, string> = {
  title: "Título", institution: "Institución", medico: "Médico", date: "Fecha", conclusion: "Conclusión",
};

export function AiAssist({ files, draft, versions, ocr, client, enabled, disabled = false, automatic = false, onApply, onPendingAnalysis }: {
  files: UploadFile[];
  draft: UploadDraft;
  versions: FieldVersions;
  ocr: ReturnType<typeof createNativeOcr>;
  client: StudyMutationClient;
  enabled: boolean;
  disabled?: boolean;
  automatic?: boolean;
  onPendingAnalysis?: (pending: boolean, requestId: string | null) => void;
  onApply: (suggestions: Suggestions, selected: SuggestionField[], started: FieldVersions, overwrite: SuggestionField[]) => void;
}) {
  const signature = files.map(file => `${file.uri}:${file.size}:${file.mimeType}`).join("|");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [selected, setSelected] = useState<SuggestionField[]>([]);
  const [overwrite, setOverwrite] = useState<SuggestionField[]>([]);
  const [confirmedVersions, setConfirmedVersions] = useState<FieldVersions>({});
  const [unknown, setUnknown] = useState(false);
  const [startedVersions, setStartedVersions] = useState<FieldVersions>({});
  const generation = useRef(0);
  const request = useRef<string | null>(null);
  const submitted = useRef(false);
  const running = useRef(false);
  const latestVersions = useRef(versions);
  useLayoutEffect(() => { latestVersions.current = versions; }, [versions]);
  const protection = useGestureProtection();
  const pendingAnalysis = submitted.current && (busy || unknown);
  useLayoutEffect(() => { onPendingAnalysis?.(pendingAnalysis, request.current); }, [onPendingAnalysis, pendingAnalysis]);

  const extract = async (file: UploadFile) => {
    if (disabled || running.current) return;
    const current = ++generation.current;
    request.current = Crypto.randomUUID();
    submitted.current = false;
    running.current = true;
    setBusy(true); setMessage(null); setText(""); setSuggestions(null); setUnknown(false);
    const extractionStarted = { ...latestVersions.current };
    setStartedVersions(extractionStarted);
    try {
      const result = await ocr.extract(file.uri, request.current);
      if (current === generation.current) {
        setText(result.text);
        if (automatic && enabled) {
          const requestId = request.current;
          if (!requestId) throw new Error("Solicitud de análisis inválida.");
          const resultFromAi = await client.write<AnalysisResponse>("/studies/analyze", "POST", { requestId, ocrText: result.text });
          if (current !== generation.current || resultFromAi.requestId !== requestId) return;
          if (resultFromAi.status !== "completed" || !resultFromAi.suggestions) throw new Error("La IA no pudo completar los campos.");
          const valid = validateSuggestions(resultFromAi.suggestions);
          const started = extractionStarted;
          const selectedAutomatically = suggestionFields.filter(field =>
            Boolean(valid[field]) && (started[field] ?? 0) === (latestVersions.current[field] ?? 0),
          );
          onApply(valid, selectedAutomatically, started, []);
          setSuggestions(null);
          setText("");
        }
      }
    } catch (reason) {
      if (current === generation.current) setMessage(reason instanceof Error ? reason.message : "No pudimos extraer texto. Podés completar los campos manualmente.");
    } finally {
      if (current === generation.current) { running.current = false; setBusy(false); }
    }
  };

  useEffect(() => {
    const lifecycle = generation;
    lifecycle.current++;
    setText(""); setSuggestions(null); setSelected([]); setOverwrite([]); setConfirmedVersions({});
    setBusy(false); running.current = false; submitted.current = false; request.current = null;
    if (automatic && enabled && files[0] && !disabled) void extract(files[0]);
    return () => {
      lifecycle.current++;
      if (request.current) void ocr.cancel(request.current).catch(() => {});
      void ocr.clear().catch(() => {});
    };
  }, [signature, ocr, automatic, enabled, disabled]);

  const analyze = async () => {
    if (!enabled || disabled || running.current || submitted.current || !request.current || !text.trim() || text.length > 20000) return;
    const current = generation.current;
    const requestId = request.current;
    submitted.current = true; running.current = true;
    setBusy(true); setMessage(null);
    try {
      const result = await client.write<AnalysisResponse>("/studies/analyze", "POST", { requestId, ocrText: text });
      if (current !== generation.current) return;
      if (result.requestId !== requestId) throw new Error("Respuesta de análisis inválida.");
      if (result.status !== "completed" || !result.suggestions) {
        setUnknown(true); setMessage("Las sugerencias no pueden recuperarse. Verificá el estado y continuá manualmente.");
        return;
      }
      const valid = validateSuggestions(result.suggestions);
      setSuggestions(valid);
      setSelected(suggestionFields.filter(field => Boolean(valid[field]) && (startedVersions[field] ?? 0) === (latestVersions.current[field] ?? 0)));
      setText("");
    } catch (reason) {
      if (current === generation.current) {
        setUnknown(true); setText("");
        setMessage(reason instanceof Error ? reason.message : "No conocemos el resultado. No repetiremos el análisis.");
      }
    } finally {
      if (current === generation.current) { running.current = false; setBusy(false); }
    }
  };

  const reconcile = async () => {
    if (!request.current || running.current) return;
    const current = generation.current;
    running.current = true; setBusy(true);
    try {
      const result = await client.get<AnalysisResponse>(`/study-analyses/${encodeURIComponent(request.current)}`);
      if (current === generation.current) setMessage(result.status === "pending"
        ? "El análisis sigue pendiente. Cancelar en el teléfono no garantiza cancelar el proveedor."
        : "Las sugerencias de esta operación no pueden recuperarse. Podés seguir manualmente o extraer de nuevo e iniciar un análisis con nuevo consentimiento; puede consumir otra cuota y tener coste.");
    } catch (reason) {
      if (current === generation.current) setMessage(reason instanceof Error ? reason.message : "No pudimos verificar el análisis.");
    } finally {
      if (current === generation.current) { running.current = false; setBusy(false); }
    }
  };

  const cancel = () => {
    generation.current++;
    if (request.current) void ocr.cancel(request.current).catch(() => {});
    running.current = false; setBusy(false); setText(""); setSuggestions(null);
    setUnknown(submitted.current);
    setMessage(submitted.current ? "El envío ya comenzó. Verificá el estado; cancelar aquí no garantiza cancelar al proveedor." : "Extracción cancelada. Podés cargar el estudio manualmente.");
  };

  const effectiveSelected = selected.filter(field =>
    (startedVersions[field] ?? 0) === (versions[field] ?? 0) ||
    (overwrite.includes(field) && confirmedVersions[field] === (versions[field] ?? 0)),
  );

  return (
    <View style={styles.container}>
    <PremiumText accessibilityRole="header" style={styles.heading}>
      Ayuda para completar los datos
    </PremiumText>
    <PremiumText>
      {automatic ? "Procesamos automáticamente el documento para completar los datos." : "Extraé el texto de un adjunto. Podés revisar y editar el texto antes de enviarlo."}
    </PremiumText>
    {!automatic && files.map(file => (
      <SecondaryAction
        key={file.uri}
        title={`Extraer texto de ${file.name}`}
        disabled={disabled || busy}
        onPress={() => void extract(file)}
      />
    ))}
    {!files.length ? <PremiumText>Adjuntá un PDF o una imagen para extraer su texto.</PremiumText> : null}
    {busy ? <><PremiumText accessibilityState={{ busy: true }}>Procesando documento…</PremiumText><SecondaryAction title="Cancelar asistencia" onPress={cancel} /></> : null}
    {!automatic && text ? <>
      <PremiumText style={styles.label}>Texto extraído · revisión local</PremiumText>
      <TextInput
        {...protection}
        accessibilityLabel="Texto extraído para revisar"
        value={text}
        onChangeText={setText}
        editable={!busy && !disabled}
        multiline
        maxLength={20000}
        style={styles.text}
      />
      <PremiumText>Al tocar Enviar texto y analizar con IA autorizás enviar este texto al backend y a OpenRouter. El documento no se envía para el análisis. Revisá las sugerencias: no son un diagnóstico y no se guardará ningún estudio automáticamente.</PremiumText>
      {enabled ? <PrimaryAction title="Enviar texto y analizar con IA" disabled={disabled || busy || submitted.current} onPress={() => void analyze()} /> : <PremiumText>La asistencia con IA no está habilitada en este servidor. La carga manual sigue disponible.</PremiumText>}
      <SecondaryAction title="Descartar texto extraído" disabled={busy} onPress={cancel} />
    </> : null}
    {message ? <PremiumText accessibilityRole="alert">{message}</PremiumText> : null}
    {unknown ? <SecondaryAction title="Verificar análisis" disabled={busy} onPress={() => void reconcile()} /> : null}
    {suggestions ? <>
      <PremiumText accessibilityRole="header" style={styles.heading}>Revisar sugerencias</PremiumText>
      {suggestionFields.filter(field => Boolean(suggestions[field])).map(field => {
        const dirty = (startedVersions[field] ?? 0) !== (versions[field] ?? 0);
        return <View key={field} style={styles.field}>
          <PremiumText style={styles.label}>{labels[field]}</PremiumText>
          <PremiumText>Actual: {draft[field] || "Sin completar"}</PremiumText>
          <PremiumText>Sugerencia: {suggestions[field]}</PremiumText>
          {dirty ? <PremiumText>Modificaste este campo después de iniciar la asistencia. Se conservará salvo que confirmes reemplazarlo.</PremiumText> : null}
          <Pressable
            onTouchStart={protection.onTouchStart}
            accessibilityRole="checkbox"
            accessibilityLabel={dirty ? `Confirmar reemplazo de ${labels[field]}` : `Usar sugerencia de ${labels[field]}`}
            accessibilityState={{ checked: effectiveSelected.includes(field), disabled }}
            disabled={disabled}
            style={styles.choice}
            onPress={() => {
            const next = !effectiveSelected.includes(field);
            setSelected(old => next ? [...old.filter(value => value !== field), field] : old.filter(value => value !== field));
            if (dirty) {
              setOverwrite(old => next ? [...old.filter(value => value !== field), field] : old.filter(value => value !== field));
              setConfirmedVersions(old => ({ ...old, [field]: versions[field] ?? 0 }));
            }
            }}
          >
            <PremiumText>
              {effectiveSelected.includes(field) ? "Seleccionado" : "Seleccionar campo"}
            </PremiumText>
          </Pressable>
        </View>;
      })}
      <PrimaryAction
        title="Aplicar campos seleccionados"
        disabled={disabled || !effectiveSelected.length}
        onPress={() => {
          if (!disabled) {
            onApply(suggestions, effectiveSelected, startedVersions, overwrite.filter(field => effectiveSelected.includes(field)));
            setSuggestions(null);
          }
        }}
      />
      <SecondaryAction title="Descartar sugerencias" onPress={() => setSuggestions(null)} />
    </> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { fontSize: 22, fontWeight: "600", color: premium.colors.ink },
  label: { fontWeight: "600", color: premium.colors.ink },
  text: { minHeight: 120, maxHeight: 260, borderRadius: 16, padding: 12, backgroundColor: premium.colors.canvas, color: premium.colors.ink, fontSize: 17, textAlignVertical: "top" },
  field: { gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderColor: premium.colors.border },
  choice: { minHeight: 44, padding: 12, borderRadius: 16, backgroundColor: premium.colors.wash },
});
