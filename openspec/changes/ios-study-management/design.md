## Context

Fuentes inspeccionadas: components/modals/UploadStudyModal.tsx, EditStudyModal.tsx, ViewStudyModal.tsx; app/api/upload-study/route.ts; user-dashboard/server-actions/update-study.ts/delete-study.ts; lib/file-validator.ts; config/constants.ts; mobile/modules/saluteca-preview/ios/SalutecaPreviewModule.swift.

Ver proposal.md para motivación y docs/ios-pantallas-roadmap.md para inventario/dirección de interface-design. Dependencias funcionales: ios-home-study-reading e ios-family-records para selector paciente y limpieza outbox.

La API actual cubre lectura propia/Google, no estas escrituras. El bootstrap TEST mínimo no habilita paridad web completa. Usuario confirmó Google/login, no permisos o aceptación de estas funciones nuevas.

## Goals / Non-Goals

**Goals:** pantallas nativas equivalentes y operaciones reales con aislamiento, estados accesibles y contratos verificables.

**Non-Goals:** simular datos/botones, portar DOM/Server Actions, cambiar la web fuera de adaptaciones focales aprobadas, alterar permisos o procesar datos productivos sin aprobación; no ejecutar apply ni deploy en planificación.

## Decisions

API nueva: POST /api/mobile/v1/studies multipart, PATCH /studies/:id para metadata/paciente y DELETE confirmado. Obtener dueño de Bearer canónico y verificar familiar antes de escribir; nunca aceptar fileKey o ruta enviada por cliente. Campos conservan STUDY_FIELD_LIMITS y fecha DD-MM-YYYY sin desplazamiento de día. Cuota diaria count_files/date_files y LIMIT_UPLOAD mantienen semántica existente con bloqueo concurrente.

Los formatos son PDF/JPEG/PNG/DOCX, máximo10 MB por archivo existente. Proponer límite global50 MB/request y hasta10 adjuntos como política nueva de recursos que necesita revisión explícita; no presentarla como límite web observado. Parser multipart streaming compatible Node/Next debe seleccionarse con documentación primaria en una tarea acotada, evitando formData sin límite. Verificar bytes/MIME/estructura; DOCX ZIP tiene límites de expansión y rutas. Guardar staging privado; transacción, finalización y outbox de limpieza cubren rollback/cancelación. Idempotency-Key criptográfico ligado a usuario y fingerprint evita duplicar estudio/cuota tras resultado de red ambiguo.

Picker/documentos y formulario nativos conservan metadata opcional y paciente propio. Cancelación libera staging/imports y mantiene campos manuales; draft solo en memoria. Editar/borrar actualiza listas/resumen y presenta estado real. No activar CTAs por configuración optimista: consultar capabilities.

Ampliar lectura de adjuntos conservando límites de seguridad: PDFKit existente, imágenes con decodificación acotada, DOCX con APIs públicas de vista/exportación verificadas durante implementación. Lectura PDF por defecto sigue sin compartir. Exportar uno/todos es acción opt-in nueva: aviso y consentimiento de copia externa, sheet nativa y limpieza exclusivamente de caché app. Las copias en Files/otras apps no son revocables ni eliminables por logout. Esto amplía explícitamente el contrato de mobile-study-reading del change anterior y requiere revisión de privacidad; compartir enlace temporal sigue en otro change.

Revisar DDL TEST de adjuntos/cuotas y diseño de escrituras/inyección de archivos/exportación antes apply. No asumir que bootstrap mínimo habilita uploader/contador.

Identidad: CSS actual Mi Saluteca, Inter y spacing4pt, carpeta clínica/paciente/fecha/adjuntos. Usar superficies sólidas, sheets/forms nativos y barra de sistema de foundation. Contraste normal ≥ 4.5:1/grande ≥ 3:1; verde de marca como acento con tinta oscura, nunca blanco ilegible. Dynamic Type, VoiceOver, teclado/scroll, loading/empty/error/cancel/retry se diseñan como comportamiento.

## Risks / Trade-offs

File injection/ZIP/quotas/datos médicos requieren diseño HIGH/CRITICAL aprobado antes apply. Nuevas cantidades globales y exportación explícitas no se absorben como defaults ocultos. DOCX preview usa APIs públicas y validación nativa real; no bajar requisitos con botón dummy. BootstrapTEST lectura carece cuotas/DDLwrite: schema focal revisar/probar antes habilitar capability.

## Migration Plan

Revisar y aprobar el diseño concreto del dominio antes apply cuando sea CRITICAL/HIGH; no se solicita aprobación durante esta planificación. Safety net y un RED mínimo ejecutado, GREEN confirmado, triangulación ≥ 2casos y refactor con rerun por comportamiento. Validación SQL/HTTP en MySQL dedicado de prueba, sin credenciales de producción ni llamadas pagas automáticas. Migración TEST/deploy requieren autorización externa específica.

Backend publica capability sólo después de endpoint real compatible; UI no presenta acciones futuras como disponibles. Rollback UI/IPA a versión anterior y backend compatible; mantener outbox y datos necesarios para operaciones ya confirmadas, sin borrar tablas de negocio. Distinguir commit de datos y cleanup físico cuando aplique; ninguna aceptación manual se completa por mocks. No archivar changes previos ni cambiar su evidencia.
