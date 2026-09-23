## Why

Carga y edición web dependen de cookies/Server Actions y el lector móvil solo recibe PDF. Se necesitan formularios y adjuntos iOS funcionales con backend Bearer seguro.

## What Changes

- Document picker multiarchivo PDF/JPEG/PNG/DOCX y formulario manual metadata/paciente.
- Carga con progreso/cancel/validación, editar metadata/paciente y borrar con confirmación.
- Visualización imágenes y formatos compatibles; exportar uno/todos con consentimiento explícito y aviso de copia externa.
- APIs write Bearer sin acoplar cookies; respetar límites/cuotas existentes y aislamiento.

## Capabilities

### New Capabilities

- `ios-study-management`: Document picker multiarchivo PDF/JPEG/PNG/DOCX y formulario manual metadata/paciente.

### Modified Capabilities

Ninguna en specs principales. Referenciar contratos en changes previos al implementar; las ampliaciones de privacidad se revisan explícitamente, sin reescribirlos ahora.

## Impact

Fuentes inspeccionadas: components/modals/UploadStudyModal.tsx, EditStudyModal.tsx, ViewStudyModal.tsx; app/api/upload-study/route.ts; user-dashboard/server-actions/update-study.ts/delete-study.ts; lib/file-validator.ts; config/constants.ts; mobile/modules/saluteca-preview/ios/SalutecaPreviewModule.swift.

Dependencias funcionales: ios-home-study-reading e ios-family-records para selector paciente y limpieza outbox.

APIs/adaptadores/DDL propuestos para funcionalidad nativa real. Planificación solamente; aprobación de diseño CRITICAL/HIGH antes apply según Decisions. No código ni migración/deploy autorizados por este documento. Mapa y dirección visual en docs/ios-pantallas-roadmap.md.
