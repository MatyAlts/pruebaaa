import { useEffect, useState } from "react";
import { Modal } from "react-native";
import * as Crypto from "expo-crypto";
import { PrimaryAction, SecondaryAction, PremiumText } from "./PremiumUI";
import { UploadCoordinator } from "./upload-coordinator";
import { UploadScreen } from "./UploadScreen";
import type { MobileClient } from "./session";
import type { PrivateUploadFiles } from "./upload-files";
import { useReducedMotion } from "./use-reduced-motion";
import type { NavigationState } from "./flow-navigation";
import { createNativeOcr } from "./native-ocr";
type Props = {
  enabled: boolean;
  client: MobileClient;
  files: PrivateUploadFiles;
  onChanged: () => void;
  familyRead?: boolean;
  compact?: boolean;
  analyzeEnabled?: boolean;
  onOpen?: () => void;
};
export function UploadEntry({
  enabled,
  client,
  files,
  onChanged,
  familyRead,
  compact = false,
  analyzeEnabled,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  if (!enabled) return null;
  return (
    <>
      {compact ? <SecondaryAction title="Cargar estudio" onPress={onOpen ?? (() => setOpen(true))} /> : <PrimaryAction title="Cargar estudio" onPress={onOpen ?? (() => setOpen(true))} />}
      {!onOpen ? <Modal
        visible={open}
        presentationStyle="fullScreen"
        animationType={reducedMotion ? "none" : "slide"}
      >
        {open ? (
          <UploadFlow
            client={client}
            files={files}
            onChanged={onChanged}
            familyRead={familyRead}
            analyzeEnabled={analyzeEnabled}
            close={() => setOpen(false)}
          />
        ) : null}
      </Modal> : null}
    </>
  );
}
export function UploadFlow({
  client,
  files,
  onChanged,
  close,
  familyRead = false,
  initialFamily,
  safeArea = true,
  embedded = false,
  onNavigationState,
  analyzeEnabled,
}: Omit<Props, "enabled"> & {
  close: () => void;
  initialFamily?: { uuid: string; name: string };
  safeArea?: boolean;
  embedded?: boolean;
  onNavigationState?: (state: NavigationState) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [ocr] = useState(() => createNativeOcr());
  const [coordinator] = useState(
    () =>
      new UploadCoordinator(client, Crypto.randomUUID, setProgress, onChanged),
  );
  const [families, setFamilies] = useState<{ uuid: string; name: string }[]>(
    initialFamily ? [initialFamily] : [],
  );
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [familyRevision, setFamilyRevision] = useState(0);
  useEffect(() => {
    let active = true;
    if (familyRead)
      void client
        .get<{ items: { uuid: string; name: string }[] }>("/family-members")
        .then((result) => {
          if (active) {
            setFamilies(result.items);
            setFamilyError(null);
          }
        })
        .catch((error) => {
          if (active)
            setFamilyError(
              error instanceof Error
                ? error.message
                : "No pudimos cargar los pacientes.",
            );
        });
    return () => {
      active = false;
    };
  }, [client, familyRead, familyRevision]);
  useEffect(
    () => () => {
      coordinator.cleanup();
      void ocr.clear();
      void files.clear();
    },
    [coordinator, files, ocr],
  );
  const patientNotice = familyError ? (
    <>
      <PremiumText accessibilityRole="alert">{familyError}</PremiumText>
      <SecondaryAction
        title="Reintentar pacientes"
        onPress={() => setFamilyRevision((value) => value + 1)}
      />
    </>
  ) : null;
  return (
    <UploadScreen
      coordinator={coordinator}
      files={files}
      close={close}
      progress={progress}
      families={families}
      initialFamilyUuid={initialFamily?.uuid}
      safeArea={safeArea}
      embedded={embedded}
      onNavigationState={onNavigationState}
      patientNotice={patientNotice}
      ai={analyzeEnabled === undefined ? undefined : { enabled: analyzeEnabled, client, ocr }}
    />
  );
}
