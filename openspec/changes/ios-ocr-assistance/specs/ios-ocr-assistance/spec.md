## Purpose

La web ayuda a completar metadatos con OCR y OpenRouter, pero utiliza APIs DOM/pdfjs/Tesseract que no funcionan como módulo iOS. Se requiere asistencia nativa opcional con privacidad explícita y revisión humana.

## ADDED Requirements

### Requirement: Extracción local opcional

La app SHALL extraer texto de adjunto permitido con límites/progreso/cancelación y conservar carga manual independiente de OCR/IA.

#### Scenario: PDF o imagen o DOCX válido
- **WHEN** se elige un adjunto y se solicita extraer texto dentro límites
- **THEN** se procesa localmente y se muestra texto revisable; no se envía proveedor ni se guarda estudio por extraer.

#### Scenario: Cancelar o exceder recursos
- **WHEN** se cancela, falta texto o se exceden límites/tipo inválido
- **THEN** se libera trabajo/caché privada y se informa condición sin borrar campos manuales ni bloquear guardar manualmente.

### Requirement: Análisis autorizado y revisión humana

El sistema SHALL enviar texto solo tras consentimiento mediante API canónica con cuota server y clave backend, conservar modelo/prompts y aplicar sugerencias únicamente tras revisión.

#### Scenario: Aceptar análisis
- **WHEN** usuario acepta envío y tiene cuota válida con clave backend configurada
- **THEN** servidor usaOpenRouter y se presentan metadatos sugeridos para aceptar/editar sin guardar automático.

#### Scenario: Cuota, proveedor o respuesta tardía
- **WHEN** cuota agotada, proveedor falla o usuario editó/cerró sesión después de iniciar
- **THEN** no se envían nuevas peticiones fuera cuota ni se exponen secretos; sugerencias tardías no sobrescriben campos ni rehidratan datos.

#### Scenario: Infraestructura ausente o respuesta ambigua
- **WHEN** falta esquema/configuración de cuota o se pierde respuesta después de enviar una operación
- **THEN** se deshabilita IA sin bloquear carga manual, o se consulta estado sin reintentar automáticamente una llamada paga; texto clínico no se persiste en la operación
