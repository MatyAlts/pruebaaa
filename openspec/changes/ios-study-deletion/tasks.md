## 1. Diseño y backend

- [x] 1.1 Obtener aprobación del diseño concreto de DELETE/propietario/revocación/outbox y SQL TEST; registrar baseline sin escrituras de producción.
- [ ] 1.2 RED endpoint y transacción propia, GREEN; triangular ajeno/revocado, cancelación, rollback, misma clave y conflicto de clave; integración MySQL TEST.
- [ ] 1.3 RED limpieza todos los adjuntos/links y reconciliación, GREEN; triangular unlink fallido/ENOENT/symlink/escape/worker detenido; entregar preflight y SQL aditivo sin ejecutarlo en VPS.

## 2. iOS y verificación

- [x] 2.1 RED confirmación/guard/reconciliación/refresco de listas y resumen, GREEN; casos cancelación, logout, red ambigua y VoiceOver.
- [x] 2.2 Ejecutar tipado/lint/regresión backend/móvil y filesystem; documentar TDD, supervisor EasyPanel y capability sólo cuando esté operativo.
- [ ] 2.3 Probar eliminación propia con varios adjuntos ficticios en iPhone TEST y verificar ausencia lógica/limpieza física; mantener pendiente hasta evidencia real.
