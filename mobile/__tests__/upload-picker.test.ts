import { getDocumentAsync } from "expo-document-picker";
import {
  pickUploadDocuments,
  pickUploadCamera,
  uploadDocumentMetadata,
} from "../src/upload-picker";
import {
  requestCameraPermissionsAsync,
  launchCameraAsync,
} from "expo-image-picker";
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  UIImagePickerPreferredAssetRepresentationMode: { Compatible: "compatible" },
}));
beforeEach(() => jest.clearAllMocks());
test("Files missing MIME falls back to supported extension before actual byte validation", () => {
  expect(
    uploadDocumentMetadata({
      uri: "file:///picker/report.PDF",
      name: "report.PDF",
      size: 100,
      lastModified: 0,
    }),
  ).toMatchObject({ mimeType: "application/pdf", size: 100 });
  expect(
    uploadDocumentMetadata({
      uri: "file:///picker/photo.jpeg",
      name: "photo.jpeg",
      lastModified: 0,
    }),
  ).toMatchObject({ mimeType: "image/jpeg", size: 0 });
});

jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));

test("Files picker returns the selected cached medical document", async () => {
  const asset = {
    uri: "file:///private/report.pdf",
    name: "report.pdf",
    mimeType: "application/pdf",
    size: 400,
    lastModified: 0,
  };
  jest
    .mocked(getDocumentAsync)
    .mockResolvedValue({ canceled: false, assets: [asset] });
  expect(await pickUploadDocuments()).toEqual([asset]);
  expect(getDocumentAsync).toHaveBeenCalledWith({
    multiple: true,
    copyToCacheDirectory: true,
    type: ["application/pdf", "image/jpeg", "image/png"],
  });
});
test("permanent camera denial suggests settings without opening camera", async () => {
  jest
    .mocked(requestCameraPermissionsAsync)
    .mockResolvedValue({ granted: false, canAskAgain: false } as never);
  expect(await pickUploadCamera()).toEqual({
    status: "denied",
    settings: true,
  });
  expect(launchCameraAsync).not.toHaveBeenCalled();
});
test("camera cancellation differs from permission denial", async () => {
  jest
    .mocked(requestCameraPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  jest
    .mocked(launchCameraAsync)
    .mockResolvedValue({ canceled: true, assets: null });
  expect(await pickUploadCamera()).toEqual({ status: "cancelled" });
});
test("asks camera permission immediately before taking a still image", async () => {
  jest
    .mocked(requestCameraPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  jest
    .mocked(launchCameraAsync)
    .mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.jpg", mimeType: "image/jpeg" }],
    } as never);
  expect(await pickUploadCamera()).toMatchObject({
    status: "selected",
    asset: { mimeType: "image/jpeg" },
  });
  expect(launchCameraAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      mediaTypes: ["images"],
      allowsEditing: false,
      base64: false,
      exif: false,
    }),
  );
});
test("Files cancellation leaves no selected attachments", async () => {
  jest
    .mocked(getDocumentAsync)
    .mockResolvedValue({ canceled: true, assets: null });
  expect(await pickUploadDocuments()).toEqual([]);
});
