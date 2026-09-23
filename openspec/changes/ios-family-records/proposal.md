## Why

La web organiza familiares y sus carpetas, pero la API móvil actual excluye estudios familiares. La tab Familia requiere aislamiento real y formularios funcionales, no datos simulados.

## What Changes

- Lista/detalle familiares y estudios, filtros y paciente visible.
- Añadir/renombrar nombre≤40 y eliminar familiar con confirmación misaluteca y advertencia de estudios/archivos.
- APIs Bearer propias y extensión explícita de lectura/resumen para familiares pertenecientes a la misma cuenta.
- DDL TEST adicional revisado; no asumir que bootstrap mínimo contiene familiares.

## Capabilities

### New Capabilities

- `ios-family-records`: Lista/detalle familiares y estudios, filtros y paciente visible.

### Modified Capabilities

Ninguna en specs principales. Referenciar contratos en changes previos al implementar; las ampliaciones de privacidad se revisan explícitamente, sin reescribirlos ahora.

## Impact

Fuentes inspeccionadas: user-dashboard/family/FamilyDashboard/FamilyDashboard.tsx, FamilyMemberDetail.tsx, FamilyMemberActions.tsx; components/modals/AddFamilyMemberModal.tsx; user-dashboard/server-actions/new-member-family.ts/edit-family-member.ts/delete-family-member.ts; config/constants.ts.

Dependencias funcionales: ios-home-study-reading. Upload de estudios familiares depende después ios-study-management; no CTA upload antes.

APIs/adaptadores/DDL propuestos para funcionalidad nativa real. Planificación solamente; aprobación de diseño CRITICAL/HIGH antes apply según Decisions. No código ni migración/deploy autorizados por este documento. Mapa y dirección visual en docs/ios-pantallas-roadmap.md.
