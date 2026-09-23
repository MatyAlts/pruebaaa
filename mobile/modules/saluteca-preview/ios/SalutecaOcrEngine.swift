import Foundation
import PDFKit
import Vision
import ImageIO
import CoreGraphics

final class OcrCancellation {
  private let lock = NSLock()
  private var cancelled = false
  private var request: VNRequest?
  func cancel() {
    lock.lock(); cancelled = true; let current = request; lock.unlock()
    current?.cancel()
  }
  func check() throws {
    lock.lock(); let value = cancelled; lock.unlock()
    if value { throw SalutecaOcrEngine.failure("Extracción cancelada.") }
  }
  func attach(_ value: VNRequest?) throws {
    lock.lock(); request = value; let stopped = cancelled; lock.unlock()
    if stopped { value?.cancel(); throw SalutecaOcrEngine.failure("Extracción cancelada.") }
  }
}

struct SalutecaOcrResult {
  let text: String
  let pages: Int
}

enum SalutecaOcrEngine {
  static let maximumBytes = 10 * 1024 * 1024
  static let maximumText = 20_000
  static let maximumSide = 2048
  static func failure(_ message: String) -> NSError {
    NSError(domain: "SalutecaOCR", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
  }

  static func extract(url: URL, root: URL, cancellation: OcrCancellation) throws -> SalutecaOcrResult {
    try cancellation.check()
    guard url.isFileURL, url.host == nil || url.host == "" || url.host == "localhost" else { throw failure("Adjunto local inválido.") }
    let canonicalRoot = root.resolvingSymlinksInPath().standardizedFileURL
    let file = url.resolvingSymlinksInPath().standardizedFileURL
    guard file.path.hasPrefix(canonicalRoot.path + "/") else { throw failure("Adjunto fuera de la caché privada.") }
    let attributes = try url.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey])
    guard attributes.isRegularFile == true, attributes.isSymbolicLink != true,
          let bytes = attributes.fileSize, bytes > 0, bytes <= maximumBytes else { throw failure("Adjunto inválido o superior a 10 MB.") }
    let kind = file.pathExtension.lowercased()
    if kind == "pdf" {
      guard let document = PDFDocument(url: file), !document.isLocked,
            document.pageCount > 0, document.pageCount <= 20 else { throw failure("PDF inválido, cifrado o superior a 20 páginas.") }
      var text = ""
      for index in 0..<document.pageCount {
        try cancellation.check()
        let value: String = try autoreleasepool {
          guard let page = document.page(at: index) else { throw failure("Página PDF no disponible.") }
          if let direct = page.string, !direct.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return direct }
          return try recognize(render(page), cancellation: cancellation)
        }
        try append(value, to: &text)
      }
      try cancellation.check()
      return try result(text, pages: document.pageCount)
    }
    guard ["jpg", "jpeg", "png"].contains(kind),
          let source = CGImageSourceCreateWithURL(file as CFURL, nil),
          let format = CGImageSourceGetType(source) as String?,
          ["public.jpeg", "public.png"].contains(format),
          let metadata = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
          let width = metadata[kCGImagePropertyPixelWidth] as? Int,
          let height = metadata[kCGImagePropertyPixelHeight] as? Int,
          width > 0, height > 0, width <= 8192, height <= 8192, width * height <= 24_000_000 else { throw failure("Imagen inválida o demasiado grande.") }
    let options: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true, kCGImageSourceThumbnailMaxPixelSize: maximumSide,
      kCGImageSourceShouldCacheImmediately: true]
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { throw failure("No pudimos leer la imagen.") }
    let text = try recognize(image, cancellation: cancellation)
    try cancellation.check()
    return try result(text, pages: 1)
  }

  private static func append(_ value: String, to text: inout String) throws {
    let extra = text.isEmpty ? value : "\n" + value
    guard text.utf16.count + extra.utf16.count <= maximumText else { throw failure("El texto supera 20000 caracteres.") }
    text += extra
  }
  private static func result(_ value: String, pages: Int) throws -> SalutecaOcrResult {
    let text = value.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !text.isEmpty, text.utf16.count <= maximumText else { throw failure("No hay texto válido dentro de los límites.") }
    return SalutecaOcrResult(text: text, pages: pages)
  }
  private static func recognize(_ image: CGImage, cancellation: OcrCancellation) throws -> String {
    try cancellation.check()
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["es", "en"]
    request.usesLanguageCorrection = true
    try cancellation.attach(request)
    defer { try? cancellation.attach(nil) }
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
    try cancellation.check()
    var text = ""
    for item in request.results ?? [] {
      if let value = item.topCandidates(1).first?.string { try append(value, to: &text) }
    }
    return text
  }
  private static func render(_ page: PDFPage) throws -> CGImage {
    let box = page.bounds(for: .mediaBox)
    guard box.width.isFinite, box.height.isFinite, box.width > 0, box.height > 0 else { throw failure("Dimensiones PDF inválidas.") }
    let scale = min(CGFloat(maximumSide) / box.width, CGFloat(maximumSide) / box.height)
    let width = max(1, min(maximumSide, Int(ceil(box.width * scale))))
    let height = max(1, min(maximumSide, Int(ceil(box.height * scale))))
    guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
      bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { throw failure("No pudimos preparar la página.") }
    context.setFillColor(CGColor(gray: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.scaleBy(x: scale, y: scale)
    context.translateBy(x: -box.minX, y: -box.minY)
    page.draw(with: .mediaBox, to: context)
    guard let image = context.makeImage() else { throw failure("No pudimos leer la página.") }
    return image
  }
}
