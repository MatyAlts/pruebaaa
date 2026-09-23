package expo.modules.salutecapreview

import android.app.Dialog
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

class SalutecaPreviewModule : Module() {
  private val executor = Executors.newSingleThreadExecutor()
  private val mainHandler = Handler(Looper.getMainLooper())
  private val jobs = ConcurrentHashMap<String, AtomicBoolean>()
  private var dialog: Dialog? = null

  override fun definition() = ModuleDefinition {
    Name("SalutecaPreview")

    AsyncFunction("protect") { uri: String ->
      val file = checkedFile(uri, "misaluteca-uploads")
      // Android cache files are private to the application by default. Restricting
      // the path above also prevents protect() from changing arbitrary files.
      // appContext's cache directory is private to this application on Android.
    }

    AsyncFunction("preview") { uri: String, promise: Promise ->
      runOnMain {
        if (dialog?.isShowing == true) {
          promise.reject("PREVIEW_FAILED", "Ya hay un documento abierto.", null)
          return@runOnMain
        }
        try {
          val file = checkedFile(uri, "misaluteca-pdfs")
          val content = renderPreview(file)
          val activity = appContext.currentActivity
            ?: throw failure("La vista previa no está disponible mientras la aplicación está en segundo plano.")
          if (activity.isFinishing || activity.isDestroyed) {
            throw failure("La vista previa no está disponible mientras la aplicación se está cerrando.")
          }
          val context = activity
          val root = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
          }
          val close = Button(context).apply { text = "Cerrar"; setOnClickListener { dialog?.dismiss() } }
          root.addView(close, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
          val scroll = ScrollView(context)
          val pages = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
          }
          content.forEach { bitmap ->
            pages.addView(ImageView(context).apply {
              setImageBitmap(bitmap)
              adjustViewBounds = true
              setPadding(8, 8, 8, 8)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
          }
          scroll.addView(pages)
          root.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
          dialog = Dialog(context).apply {
            setTitle("Estudio")
            setContentView(root)
            setOnDismissListener {
              content.forEach { it.recycle() }
              dialog = null
              promise.resolve(null)
            }
            setOnCancelListener { dismiss() }
            show()
            window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
          }
        } catch (error: Throwable) {
          promise.reject("PREVIEW_FAILED", error.message ?: "Documento inválido.", null)
        }
      }
    }

    AsyncFunction("close") {
      runOnMain { dialog?.dismiss() }
    }

    AsyncFunction("extractText") { uri: String, requestId: String, promise: Promise ->
      try {
        UUID.fromString(requestId)
      } catch (_: IllegalArgumentException) {
        promise.reject("OCR_FAILED", "Solicitud de extracción inválida.", null)
        return@AsyncFunction
      }
      val cancelled = AtomicBoolean(false)
      if (jobs.isNotEmpty() || jobs.putIfAbsent(requestId, cancelled) != null) {
        promise.reject("OCR_FAILED", "Ya hay una extracción en progreso.", null)
        return@AsyncFunction
      }
      executor.execute {
        try {
          val result = extract(uri, cancelled)
          if (cancelled.get()) throw failure("Extracción cancelada.")
          promise.resolve(mapOf("text" to result.first, "pages" to result.second))
        } catch (error: Throwable) {
          promise.reject("OCR_FAILED", error.message ?: "No pudimos extraer texto del adjunto.", null)
        } finally {
          jobs.remove(requestId)
        }
      }
    }

    AsyncFunction("cancelExtraction") { requestId: String ->
      jobs[requestId]?.set(true)
    }

    OnDestroy {
      jobs.values.forEach { it.set(true) }
      jobs.clear()
      executor.shutdownNow()
      runOnMain { dialog?.dismiss() }
    }
  }

  private fun checkedFile(uri: String, directory: String): File {
    val parsed = Uri.parse(uri)
    if (parsed.scheme != "file" || !parsed.host.isNullOrEmpty()) throw failure("Adjunto local inválido.")
    val cache = File(appContext.reactContext?.cacheDir ?: throw failure("Caché privada no disponible."), directory)
      .canonicalFile
    val file = File(parsed.path ?: throw failure("Archivo temporal inválido.")).canonicalFile
    if (!file.path.startsWith(cache.path + File.separator) || !file.isFile || file.length() <= 0L || file.length() > MAX_BYTES) {
      throw failure(if (directory == "misaluteca-uploads") "Adjunto inválido o superior a 10 MB." else "El documento temporal no está disponible.")
    }
    if (file.extension.lowercase() !in setOf("pdf", "jpg", "jpeg", "png")) throw failure("Formato no compatible.")
    return file
  }

  private fun renderPreview(file: File): List<Bitmap> {
    if (file.extension.lowercase() != "pdf") {
      val bounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
      android.graphics.BitmapFactory.decodeFile(file.path, bounds)
      if (bounds.outWidth <= 0 || bounds.outHeight <= 0 ||
        bounds.outWidth > 8192 || bounds.outHeight > 8192 ||
        bounds.outWidth.toLong() * bounds.outHeight.toLong() > 24_000_000L) {
        throw failure("Imagen inválida o demasiado grande.")
      }
      val bitmap = android.graphics.BitmapFactory.decodeFile(file.path) ?: throw failure("Imagen inválida.")
      return listOf(bitmap)
    }
    val descriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    val renderer = PdfRenderer(descriptor)
    if (renderer.pageCount == 0 || renderer.pageCount > MAX_PAGES) {
      renderer.close(); descriptor.close(); throw failure("PDF inválido o superior a 20 páginas.")
    }
    val pages = (0 until renderer.pageCount).map {
      renderer.openPage(it).use { page ->
        val scale = min(MAX_SIDE.toFloat() / page.width, MAX_SIDE.toFloat() / page.height)
        val bitmap = Bitmap.createBitmap(max(1, ceil(page.width * scale).toInt()), max(1, ceil(page.height * scale).toInt()), Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(Color.WHITE)
        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        bitmap
      }
    }
    renderer.close(); descriptor.close()
    return pages
  }

  private fun extract(uri: String, cancelled: AtomicBoolean): Pair<String, Int> {
    val file = checkedFile(uri, "misaluteca-uploads")
    val bitmaps = renderPreview(file)
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    return try {
      val text = StringBuilder()
      bitmaps.forEachIndexed { index, bitmap ->
        if (cancelled.get()) throw failure("Extracción cancelada.")
        val result = Tasks.await(recognizer.process(InputImage.fromBitmap(bitmap, 0)))
        result.text.lines().filter { it.isNotBlank() }.forEach { line ->
          if (text.isNotEmpty()) text.append('\n')
          text.append(line)
          if (text.length > MAX_TEXT) throw failure("El texto supera 20000 caracteres.")
        }
        bitmap.recycle()
      }
      val value = text.toString().trim()
      if (value.isEmpty() || value.length > MAX_TEXT) throw failure("No hay texto válido dentro de los límites.")
      value to bitmaps.size
    } finally {
      recognizer.close()
      bitmaps.forEach { if (!it.isRecycled) it.recycle() }
    }
  }

  private fun runOnMain(block: () -> Unit) {
    mainHandler.post(block)
  }

  private fun failure(message: String) = IllegalArgumentException(message)

  companion object {
    private const val MAX_BYTES = 10L * 1024 * 1024
    private const val MAX_PAGES = 20
    private const val MAX_TEXT = 20_000
    private const val MAX_SIDE = 2048
  }
}
