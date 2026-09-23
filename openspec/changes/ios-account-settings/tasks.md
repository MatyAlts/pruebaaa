## 1. Implementación y verificación

- [ ] 1.1 Presentar y aprobar diseño CRITICAL/HIGH de reauth auth_time/ventana 10 min, identidad, sesiones web, transacción/outbox/DDL y estrategia de verificación antes apply; ejecutar baseline auth/archivos/enlaces/móvil.
- [ ] 1.2 RED Cuenta con perfil readonly/legales/enlaces/logout reales, GREEN y triangulación error de red/resultados tardíos/accesibilidad, sin modificar protocolo Google.
- [ ] 1.3 RED reauth reciente misma identidad+confirmación+borrado transaccional, GREEN; casos sesión ausente/reauth vencida/cuenta cambiada/cancelación/rollback/FK/cleanup pendiente/red ambigua en DB dedicada.
- [ ] 1.4 RED denegar tokens y enlaces/archivos web después de borrar, GREEN y casos dos cuentas/refresh antiguo/enlace público/cuenta Google recreada vacía; aprobar edits focales de auth web antes escribir.
- [ ] 1.5 RED UI destructiva/confirmación/reautenticación/limpieza privada, GREEN≥ 2 casos; copy explícito sobre Google y copias externas, sin afirmar completion no confirmado.
- [ ] 1.6 Validar HTTP/MySQL/móvil/types/lint/macOS e iPhone con cuenta TEST descartable y fixtures; registrar aceptación física pendiente y no ejecutar borrados VPS/producción por aprobación de planificación.
