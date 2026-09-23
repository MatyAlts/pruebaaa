# Diseño: capacidades nativas multiplataforma para móvil

## Contexto

La app móvil tiene capacidades implementadas únicamente mediante el módulo Expo
`SalutecaPreview` para Apple. En Android, el calendario no comunica correctamente
la fecha seleccionada y el visor, la protección de archivos y el OCR muestran
mensajes que indican que se requiere la versión iOS.

El alcance de este cambio es **iOS + Android**. La mención de Windows se interpreta
como el entorno de desarrollo/pruebas, no como una app React Native Windows
independiente.

## Objetivos

- Permitir elegir y confirmar fechas correctamente en iOS y Android.
- Visualizar PDF, JPEG y PNG desde la app en ambas plataformas.
- Mantener los archivos temporales privados y validados.
- Extraer OCR localmente en iOS y Android antes de enviar texto revisado a la IA.
- Mantener la carga manual funcional aunque el visor, OCR o la IA no estén
  disponibles.
- Conservar cancelación, limpieza de caché y protección contra resultados tardíos.

## No objetivos

- No cambiar el contrato del backend de análisis ni el proveedor de IA.
- No enviar documentos completos automáticamente a la IA.
- No implementar una app nativa para Windows.
- No reemplazar la revisión humana ni guardar metadatos automáticamente después
  del OCR.

## Arquitectura

### Calendario

`CalendarInput` conservará un único contrato civil `dd-mm-yyyy`, pero renderizará
el picker apropiado por plataforma:

- Android usará la API `@expo/ui` Jetpack Compose de Expo SDK 57
  (`onDateSelected`, `initialDate` y `onDismissRequest`).
- iOS conservará el picker SwiftUI existente.
- La selección será provisional hasta pulsar «Confirmar fecha».
- Confirmar o cancelar cerrará siempre el modal; cancelar no modificará el valor
  persistido.

### Visor y almacenamiento

Se ampliará `SalutecaPreview` a Apple y Android con el mismo contrato JavaScript:

- `preview(uri)` para PDF e imágenes.
- `close()` para cerrar el documento actual.
- `protect(uri)` para asegurar el archivo temporal.

Android validará que la URI esté bajo la caché privada de la aplicación, verificará
tipo y límites, y mostrará PDF con `PdfRenderer` e imágenes con un visor nativo
desplazable/zoomable. iOS mantendrá PDFKit/UIKit. La capa JS seguirá limpiando el
archivo después de cerrar el visor.

La protección será específica de plataforma: File Protection en iOS y caché
privada más validación de ruta/permisos de archivo en Android. No se aceptarán
URLs remotas ni rutas arbitrarias.

### OCR

`createNativeOcr` conservará su contrato actual (`extractText` y
`cancelExtraction`), con implementación local por plataforma:

- iOS: Vision + PDFKit existentes.
- Android: extracción de texto de PDF con `PdfRenderer`/lectura segura y OCR de
  páginas renderizadas e imágenes con ML Kit Text Recognition.

Se mantendrán los límites actuales: archivos de hasta 10 MiB, hasta 20 páginas y
texto resultante de hasta 20.000 caracteres. El procesamiento será cancelable,
serializado por solicitud y limpiará sus recursos al cancelar, cerrar sesión o
desmontar la pantalla. El texto se mostrará para revisión local y solo se enviará
al endpoint actual de análisis cuando el usuario pulse la acción explícita.

## Manejo de errores

- Los errores de plataforma se expresarán con mensajes neutrales, sin mencionar
  que una función requiere iOS.
- Si una capacidad nativa no está disponible, se permitirá continuar con carga y
  edición manual.
- Los errores de URI, formato, tamaño, PDF inválido, OCR vacío y cancelación serán
  explícitos y no producirán estados de éxito falsos.
- No se reintentará automáticamente una llamada pagada a la IA.

## Validación

- Tests del calendario para selección, confirmación, cancelación y bloqueo.
- Tests del coordinador PDF para PDF/imágenes, limpieza y errores de visor.
- Tests de OCR para PDF textual, imagen/PDF escaneado, límites, cancelación y
  ausencia de módulo.
- Tests de integración de carga y asistencia con IA en Android usando texto
  ficticio, sin llamadas pagadas.
- `mobile:test`, `mobile:typecheck`, `mobile:lint` y build/export Android e iOS
  cuando el entorno nativo esté disponible.

## Riesgos y mitigaciones

- ML Kit y PdfRenderer requieren dependencias y configuración Android específicas:
  se validarán en un spike de build antes de integrar el flujo completo.
- El OCR médico puede contener errores: se mantiene revisión y edición humana.
- Las diferencias de zona horaria pueden alterar fechas: se serializa siempre la
  fecha civil local, nunca un timestamp UTC.
