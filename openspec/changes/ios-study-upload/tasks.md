## 1. Backend y almacenamiento

- [x] 1.1 Registrar baseline backend/MySQL real y ejecutar TDD de validadores civiles/campos/formatos/límites y parser streaming; probar exactos y excesos, falta Content-Length, duplicados multipart, traversal/symlink y rechazo autenticación antes de ingesta.
- [x] 1.2 Implementar migración TEST aditiva y preflight real para ledger/cuota/capacidad de columnas, preservando filas; probar bootstrap y schema incompatible, readiness deshabilitada y login/lectura intactos. Checkpoint: publicar diff de schema sin ejecutar SQL en VPS.
- [x] 1.3 Implementar POST Bearer y GET status owner-bound, clave/fingerprint, leases, manifiesto, promoción y transacción estudio/adjuntos/cuota. TDD con HTTP externo + MySQL + filesystem: simultáneos, 401/404, 409, límite diario/reset, disco lleno/rollback, commit con respuesta perdida y conservación de referencias compartidas.
- [x] 1.4 Integrar recuperación en supervisor Docker y lectura privada JPEG/PNG; ejecutar pruebas reales de muerte/reinicio y lease obsoleto, owner check de bytes/caché, PDF sin regresión, no credenciales/público, usuario node y puerto 3000. Registrar evidencia TDD backend.

## 2. App nativa

- [x] 2.1 Registrar baseline 144 móviles observado y validar dependencias Expo 57; incorporar cámara/Files, permisos y adjuntos mediante TDD de adaptadores/formulario/casos límite. Actualizar lock único, config nativa y textos de permisos, sin conservar dependencias temporales ni backups en artifacts.
- [x] 2.2 Implementar transporte XHR, progreso/abort, clave estable en memoria por cuenta durante borrador/reintentos (ledger durable servidor), reconstrucción tras 401 único, consulta pending y reintento seguro. No persistir borradores clínicos. TDD de conexión perdida, cancelación antes/después envío, cambio/logout durante upload/status y respuesta tardía; nunca afirmar cancelación de commit remoto por abort local.
- [x] 2.3 Integrar formulario desde Inicio/Estudios/familiar, paciente y campos web; JPEG/PNG privados y refresco de todas las vistas pertinentes sólo tras éxito. TDD RNTL con pacientes propios/ajenos, capabilities ausentes, filtros/paginación preservados, estados error/pending/complete, cuenta cambiada y accesibilidad. Registrar evidencia TDD móvil.

## 3. Entrega y aceptación

- [x] 3.1 Revisión independiente de contratos/recuperación/DDL/seguridad y guía EasyPanel/GitHub Actions con cada variable, volumen/permisos, tamaño/timeout proxy, migración manual, supervisión y rollback sin pérdida; documentar límite de carrera con uploader web existente.
- [x] 3.2 Ejecutar checks pertinentes, MySQL/HTTP/FS sin skips, Docker real sin dependencias móviles, Expo checks/Doctor/export y macOS IPA. Publicar exact commit/runs/SHA/bundle/origen/assets/dependencias y evidencia RED→GREEN→triangulación; no marcar por mera planificación ni por workflow todavía en ejecución.
- [ ] 3.3 Confirmar con usuario instalación del IPA y cámara/Files PDF/JPEG/PNG, propia/familiar, lectura, permisos/cancelación/red/reapertura, cuota y no duplicado. Mantener pendiente hasta aceptación física; agentes no ejecutan SQL ni deploy en VPS.
