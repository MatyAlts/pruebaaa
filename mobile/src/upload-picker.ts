import {
  getDocumentAsync,
  type DocumentPickerAsset,
} from "expo-document-picker";
import type { UploadFile } from "./upload-draft";
import {
  requestCameraPermissionsAsync,
  launchCameraAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from "expo-image-picker";

export async function pickUploadCamera() {
  const permission = await requestCameraPermissionsAsync();
  if (!permission.granted)
    return { status: "denied" as const, settings: !permission.canAskAgain };
  const result = await launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    base64: false,
    exif: false,
    preferredAssetRepresentationMode:
      UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  return result.canceled
    ? { status: "cancelled" as const }
    : { status: "selected" as const, asset: result.assets[0] };
}

export async function pickUploadDocuments() {
  const result = await getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
    type: ["application/pdf", "image/jpeg", "image/png"],
  });
  return result.canceled ? [] : result.assets;
}
export function uploadDocumentMetadata(asset: DocumentPickerAsset): UploadFile {
  const extension = asset.name.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType || types[extension || ""] || "",
    size: asset.size || 0,
  };
}
