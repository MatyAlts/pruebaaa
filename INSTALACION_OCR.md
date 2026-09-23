# Instalación y Configuración del Sistema de OCR y Análisis con IA

## 1. Instalar Dependencias

Ejecutá el siguiente comando en la raíz del proyecto:

```bash
npm install tesseract.js pdfjs-dist mammoth html2canvas openai file-type
```

### Dependencias instaladas:

- **tesseract.js**: Biblioteca de OCR para extraer texto de imágenes
- **pdfjs-dist**: Biblioteca para procesar archivos PDF
- **mammoth**: Para procesar archivos DOCX
- **html2canvas**: Para convertir HTML a imágenes (usado en procesamiento de DOCX)
- **openai**: Cliente oficial de OpenAI para análisis con IA
- **file-type**: Para validación segura de archivos mediante magic bytes

## 2. Configurar OpenAI API Key

1. Obtené tu API Key de OpenAI desde https://platform.openai.com/api-keys

2. Agregá la API Key al archivo `.env.development`:

```env
OPENAI_API_KEY="sk-proj-tu-api-key-real-aqui"
```

## 3. Actualizar Base de Datos

Agregá las nuevas columnas a la tabla `estudios`:

```sql
ALTER TABLE estudios
ADD COLUMN institucion VARCHAR(255) NULL AFTER fecha,
ADD COLUMN conclusion TEXT NULL AFTER institucion;
```

## 4. Funcionamiento del Sistema

### Flujo de trabajo:

1. **Usuario selecciona archivo**: PDF, JPG, PNG o DOCX
2. **Validación inicial**: Verifica tipo y tamaño del archivo
3. **Usuario hace clic en "Analizar estudio"**:
   - Se extrae el texto del documento usando OCR
   - El texto se envía a ChatGPT para análisis
   - La IA identifica: nombre del estudio, institución y conclusión
   - Los datos se inyectan automáticamente en el formulario
4. **Usuario revisa y edita** los datos sugeridos por la IA
5. **Usuario hace clic en "Confirmar y guardar"**: El estudio se guarda en la base de datos

### Validaciones de seguridad:

- ✅ Validación de tipo de archivo mediante magic bytes (no solo extensión)
- ✅ Verificación de tamaño máximo (10MB)
- ✅ Detección de caracteres peligrosos en nombres de archivo
- ✅ Validación de que el contenido del archivo coincida con su extensión

### Tipos de archivo soportados:

- **PDF**: Extrae texto mediante OCR página por página
- **JPG/PNG**: Aplica OCR directamente sobre la imagen
- **DOCX**: Convierte a HTML, renderiza a imagen y aplica OCR

## 5. Prompt de ChatGPT

El sistema usa GPT-4o-mini con un prompt específico que:

- Extrae el nombre EXACTO del estudio tal como aparece en el documento
- Identifica la institución médica
- Copia TEXTUALMENTE la conclusión (sin inventar ni resumir)
- Devuelve strings vacíos si no encuentra información explícita

## 6. Costos Estimados

### OpenAI:

- Modelo: GPT-4o-mini
- Costo aproximado: $0.15 por 1M de tokens de entrada, $0.60 por 1M de tokens de salida
- Por análisis típico: ~$0.001-0.005 USD

### Tesseract.js:

- Gratuito (se ejecuta en el navegador)

## 7. Consideraciones de Performance

- **OCR en el cliente**: El procesamiento OCR se realiza en el navegador del usuario, no consume recursos del servidor
- **Tiempo de procesamiento**:
  - Imagen simple: 5-10 segundos
  - PDF de 1 página: 10-15 segundos
  - PDF de múltiples páginas: 10-15 segundos por página
  - DOCX: 15-20 segundos

## 8. Troubleshooting

### Error "OPENAI_API_KEY no configurada"

- Verificá que la variable de entorno esté en `.env.development`
- Reiniciá el servidor de desarrollo después de agregar la variable

### OCR no funciona correctamente

- Asegurate de que la imagen tenga buena calidad y contraste
- Los PDFs escaneados funcionan mejor que los nativos digitales para OCR
- Para DOCX, verificá que el documento no tenga imágenes complejas

### Error "file-type" en validación

- Asegurate de tener la versión correcta instalada
- Si hay problemas, la validación rápida (`quickValidateFileType`) funciona como fallback

## 9. Archivos Creados/Modificados

### Nuevos archivos:

- `lib/ocr-utils.ts`: Función unificada de OCR
- `lib/file-validator.ts`: Validación segura de archivos
- `user-dashboard/server-actions/analyze-study.ts`: Server action para análisis con IA
- `INSTALACION_OCR.md`: Este archivo

### Archivos modificados:

- `components/modals/UploadStudyModal.tsx`: Implementación del flujo de análisis
- `user-dashboard/server-actions/upload-study.ts`: Soporte para nuevos campos
- `.env.development`: Agregada variable OPENAI_API_KEY
- `package.json`: Nuevas dependencias (después de ejecutar npm install)

## 10. Próximos Pasos

✅ El sistema está listo para usar después de:

1. Instalar dependencias
2. Configurar API Key de OpenAI
3. Actualizar base de datos con las nuevas columnas
4. Reiniciar el servidor de desarrollo

¡Todo configurado! 🎉
