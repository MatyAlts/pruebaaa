## 1. Implementación y verificación

- [x] 1.1 Presentar diseño de autorización/cascada/outbox/DDL y obtener aprobación CRITICAL/HIGH antes apply; ejecutar safety net reader/backend/móvil y documentar esquema TEST verificado.
- [x] 1.2 RED mínimo CRUD/filtros de familiares propios, GREEN y triangulación dos cuentas, nombres0/40/41, UUID ajeno y resumen completo; comprobar en MySQL/HTTP reales.
- [x] 1.3 RED DELETE con confirmación y transacción+outbox, GREEN; cubrir cancelación, rollback, rutas confinadas, retry/ENOENT y operationId ajeno sin acceso a datos borrados.
- [x] 1.4 Extender DTO paciente/resumen/filtros y capabilities solo cuando endpoints estén listos; verificar que v1 anterior sigue self y no filtra datos familiares ajenos.
- [x] 1.5 RED tab/lista/formularios/detalle nativos con adaptadores reales, GREEN y casos teclado/VoiceOver/loading/empty/error/filtros tardíos/logout; carga permanece oculta hasta write disponible.
- [ ] 1.6 Validar HTTP/MySQL y móvil, types/lint y build macOS; comprobar en iPhone CRUD/cascada y dos cuentas con fixtures, mantener aceptación física pendiente si no ejecutada.
