import Foundation
import PDFKit
import CoreGraphics
import CoreText
import ImageIO

// macOS fixture harness: compile with the Foundation/Vision engine, not Expo/UIKit.
// All content is synthetic. No existing user documents are read.
@main struct NativeOcrFixtures {
  static func main() throws {
    let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
    defer { try? FileManager.default.removeItem(at: root) }
    var passed = 0
    func rejects(_ operation: () throws -> Void) throws {
      do { try operation() } catch { passed += 1; return }
      throw NSError(domain: "Fixture", code: 1, userInfo: [NSLocalizedDescriptionKey: "Expected rejection"])
    }
    func pdf(_ name: String, pages: Int) -> URL {
      let file = root.appendingPathComponent(name)
      var media = CGRect(x: 0, y: 0, width: 400, height: 500)
      let context = CGContext(file as CFURL, mediaBox: &media, nil)!
      for _ in 0..<pages {
        context.beginPDFPage(nil)
        let line = CTLineCreateWithAttributedString(NSAttributedString(string: "Documento ficticio de prueba", attributes: [.init(kCTFontAttributeName as String): CTFontCreateWithName("Helvetica" as CFString, 16, nil)]))
        context.textPosition = CGPoint(x: 30, y: 400)
        CTLineDraw(line, context)
        context.endPDFPage()
      }
      context.closePDF()
      return file
    }
    let valid = pdf("valid.pdf", pages: 2)
    let result = try SalutecaOcrEngine.extract(url: valid, root: root, cancellation: OcrCancellation())
    guard result.pages == 2, result.text.contains("Documento ficticio") else { throw NSError(domain: "Fixture", code: 2) }
    passed += 1
    try rejects { _ = try SalutecaOcrEngine.extract(url: pdf("too-many.pdf", pages: 21), root: root, cancellation: OcrCancellation()) }
    let token = OcrCancellation(); token.cancel()
    try rejects { _ = try SalutecaOcrEngine.extract(url: valid, root: root, cancellation: token) }
    try rejects { _ = try SalutecaOcrEngine.extract(url: URL(string: "https://example.test/file.pdf")!, root: root, cancellation: OcrCancellation()) }
    let invalid = root.appendingPathComponent("invalid.png"); try Data("not an image".utf8).write(to: invalid)
    try rejects { _ = try SalutecaOcrEngine.extract(url: invalid, root: root, cancellation: OcrCancellation()) }
    let big = root.appendingPathComponent("big.jpg"); try Data(count: 10 * 1024 * 1024 + 1).write(to: big)
    try rejects { _ = try SalutecaOcrEngine.extract(url: big, root: root, cancellation: OcrCancellation()) }
    let link = root.appendingPathComponent("link.pdf"); try FileManager.default.createSymbolicLink(at: link, withDestinationURL: valid)
    try rejects { _ = try SalutecaOcrEngine.extract(url: link, root: root, cancellation: OcrCancellation()) }
    for (suffix, type) in [("png", "public.png"), ("jpg", "public.jpeg")] {
      let context = CGContext(data: nil, width: 1200, height: 400, bitsPerComponent: 8, bytesPerRow: 4800, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
      context.setFillColor(CGColor(gray: 1, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: 1200, height: 400))
      let line = CTLineCreateWithAttributedString(NSAttributedString(string: "Documento ficticio de prueba", attributes: [.init(kCTFontAttributeName as String): CTFontCreateWithName("Helvetica" as CFString, 48, nil)]))
      context.textPosition = CGPoint(x: 30, y: 200); CTLineDraw(line, context)
      let file = root.appendingPathComponent("text.\(suffix)")
      let destination = CGImageDestinationCreateWithURL(file as CFURL, type as CFString, 1, nil)!
      CGImageDestinationAddImage(destination, context.makeImage()!, nil)
      guard CGImageDestinationFinalize(destination) else { throw NSError(domain: "Fixture", code: 3) }
      let value = try SalutecaOcrEngine.extract(url: file, root: root, cancellation: OcrCancellation())
      guard value.pages == 1, value.text.lowercased().contains("documento") else { throw NSError(domain: "Fixture", code: 4) }
      passed += 1
      if suffix == "png" {
        let scan = root.appendingPathComponent("scanned.pdf")
        var box = CGRect(x: 0, y: 0, width: 1200, height: 400)
        let pdfContext = CGContext(scan as CFURL, mediaBox: &box, nil)!
        pdfContext.beginPDFPage(nil); pdfContext.draw(context.makeImage()!, in: box)
        pdfContext.endPDFPage(); pdfContext.closePDF()
        let scanned = try SalutecaOcrEngine.extract(url: scan, root: root, cancellation: OcrCancellation())
        guard scanned.pages == 1, scanned.text.lowercased().contains("documento") else { throw NSError(domain: "Fixture", code: 5) }
        passed += 1
      }
    }
    print("Native OCR fixtures: \(passed) passed")
  }
}
