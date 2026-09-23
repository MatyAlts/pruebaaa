import ExpoModulesCore
import PDFKit
import UIKit
import ImageIO

public class SalutecaPreviewModule: Module {
  private var viewer: PrivatePDFController?
  private let ocrQueue = DispatchQueue(label: "me.misaluteca.private-ocr")
  private let ocrLock = NSLock()
  private var ocrJobs: [String: OcrCancellation] = [:]
  public func definition() -> ModuleDefinition {
    Name("SalutecaPreview")
    AsyncFunction("extractText") { (uri: String, requestId: String, promise: Promise) throws in
      guard UUID(uuidString: requestId) != nil, let url = URL(string: uri),
            let cache = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
        throw SalutecaOcrEngine.failure("Solicitud de extracción inválida.")
      }
      let token = OcrCancellation()
      self.ocrLock.lock()
      guard self.ocrJobs.isEmpty else { self.ocrLock.unlock(); throw SalutecaOcrEngine.failure("Ya hay una extracción en progreso.") }
      self.ocrJobs[requestId] = token
      self.ocrLock.unlock()
      self.ocrQueue.async {
        defer {
          self.ocrLock.lock(); self.ocrJobs.removeValue(forKey: requestId); self.ocrLock.unlock()
        }
        do {
          let root = cache.appendingPathComponent("misaluteca-uploads", isDirectory: true)
          let value = try SalutecaOcrEngine.extract(url: url, root: root, cancellation: token)
          try token.check()
          promise.resolve(["text": value.text, "pages": value.pages])
        } catch {
          promise.reject("OCR_FAILED", (error as NSError).domain == "SalutecaOCR" ? error.localizedDescription : "No pudimos extraer texto del adjunto.")
        }
      }
    }
    AsyncFunction("cancelExtraction") { (requestId: String) in
      self.ocrLock.lock(); let token = self.ocrJobs[requestId]; self.ocrLock.unlock()
      token?.cancel()
    }
    OnDestroy {
      self.ocrLock.lock(); let tokens = Array(self.ocrJobs.values); self.ocrLock.unlock()
      tokens.forEach { $0.cancel() }
    }
    AsyncFunction("protect") { (uri: String) throws in
      guard let url = URL(string: uri), url.isFileURL,
            let cache = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
        throw self.failure("Archivo temporal inválido.")
      }
      let root = cache.appendingPathComponent("misaluteca-uploads", isDirectory: true).resolvingSymlinksInPath().standardizedFileURL
      let file = url.resolvingSymlinksInPath().standardizedFileURL
      guard file.path.hasPrefix(root.path + "/"), FileManager.default.fileExists(atPath: file.path) else {
        throw self.failure("Archivo temporal no disponible.")
      }
      try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: file.path)
    }
    AsyncFunction("preview") { (uri: String, promise: Promise) throws in
      guard self.viewer == nil else { throw self.failure("Ya hay un documento abierto.") }
      guard let url = URL(string: uri), url.isFileURL,
            let cache = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
        throw self.failure("Documento inválido.")
      }
      let root = cache.appendingPathComponent("misaluteca-pdfs", isDirectory: true).resolvingSymlinksInPath().standardizedFileURL
      let file = url.resolvingSymlinksInPath().standardizedFileURL
      guard file.path.hasPrefix(root.path + "/"),
            let presenter = self.appContext?.utilities?.currentViewController(),
            presenter.presentedViewController == nil else {
        throw self.failure("El documento temporal no está disponible.")
      }
      var document: PDFDocument?
      var image: UIImage?
      if file.pathExtension.lowercased() == "pdf" {
        guard let pdf = PDFDocument(url: file), pdf.pageCount > 0, !pdf.isLocked else { throw self.failure("PDF inválido.") }
        document = pdf
      } else {
        guard ["jpg", "jpeg", "png"].contains(file.pathExtension.lowercased()),
              let source = CGImageSourceCreateWithURL(file as CFURL, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let width = properties[kCGImagePropertyPixelWidth] as? Int,
              let height = properties[kCGImagePropertyPixelHeight] as? Int,
              width > 0, height > 0, width <= 8192, height <= 8192, width * height <= 24_000_000,
              let decoded = UIImage(contentsOfFile: file.path) else { throw self.failure("Imagen inválida o demasiado grande.") }
        image = decoded
      }
      try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: file.path)
      let viewer = PrivatePDFController(document: document, image: image) { [weak self] in
        self?.viewer = nil
        promise.resolve(nil)
      }
      self.viewer = viewer
      let navigation = UINavigationController(rootViewController: viewer)
      navigation.modalPresentationStyle = .fullScreen
      presenter.present(navigation, animated: true)
    }.runOnQueue(.main)
    AsyncFunction("close") { (promise: Promise) in
      guard let viewer = self.viewer else { promise.resolve(nil); return }
      viewer.navigationController?.dismiss(animated: false) {
        viewer.finish()
        promise.resolve(nil)
      }
    }.runOnQueue(.main)
  }
  private func failure(_ message: String) -> NSError {
    NSError(domain: "SalutecaPreview", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
  }
}
private final class PrivatePDFController: UIViewController, UIScrollViewDelegate {
  let document: PDFDocument?
  let image: UIImage?
  private var imageView: UIImageView?
  let onFinish: () -> Void
  private var finished = false
  init(document: PDFDocument?, image: UIImage? = nil, onFinish: @escaping () -> Void) {
    self.document = document
    self.image = image
    self.onFinish = onFinish
    super.init(nibName: nil, bundle: nil)
  }
  required init?(coder: NSCoder) { fatalError("Not supported") }
  override func viewDidLoad() {
    super.viewDidLoad()
    title = "Estudio"
    navigationItem.leftBarButtonItem = UIBarButtonItem(title: "Cerrar", style: .done, target: self, action: #selector(closeDocument))
    if let document = document {
      let pdf = PDFView(frame: view.bounds)
      pdf.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      pdf.autoScales = true
      pdf.document = document
      view.addSubview(pdf)
    } else if let image = image {
      let scroll = UIScrollView(frame: view.bounds)
      scroll.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      scroll.minimumZoomScale = 1
      scroll.maximumZoomScale = 4
      scroll.delegate = self
      let imageView = UIImageView(image: image)
      imageView.frame = scroll.bounds
      imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      imageView.contentMode = .scaleAspectFit
      imageView.isAccessibilityElement = true
      imageView.accessibilityLabel = "Imagen del estudio"
      self.imageView = imageView
      scroll.addSubview(imageView)
      scroll.contentSize = imageView.bounds.size
      view.backgroundColor = .systemBackground
      view.addSubview(scroll)
    }
    // No share/export action: this only previews the app's temporary document.
  }
  func viewForZooming(in scrollView: UIScrollView) -> UIView? { imageView }
  @objc private func closeDocument() { dismiss(animated: true) { self.finish() } }
  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    if isBeingDismissed || navigationController?.isBeingDismissed == true { finish() }
  }
  func finish() {
    guard !finished else { return }
    finished = true
    onFinish()
  }
}
