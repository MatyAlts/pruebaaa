## Context

http.ts no implementa DELETE individual; la acción web elimina sólo el primer adjunto y tolera error de unlink. Familia ya dispone de outbox/worker y verificación de sesión transaccional; reutilizar esos patrones sin alterar su contrato. Implementación de endpoints pendiente de aprobación CRITICAL/HIGH.

## Goals / Non-Goals

**Goals:** borrar un estudio propio y todos sus adjuntos con confirmación, identidad existente y reconciliación segura.

**Non-Goals:** editar estudios, eliminar usuarios/familias, modificar auth, reembolsar cuotas, ejecutar DDL o deploy en VPS.

## Decisions

DELETE /api/mobile/v1/studies/:id recibe exclusivamente confirmation e idempotencyKey UUID. La identidad proviene del Bearer canónico; nunca userId/fileKey/rutas aportados por cliente. En transacción: bloquear operación/estudio, revalidar sesión no revocada, verificar dueño y resolver todos los adjuntos de DB; registrar operación propia y cleanup de claves confiables, borrar links y filas de adjuntos/estudio atómicamente. Una revocación o falta de dueño rechaza sin efecto; no filtrar existencia ajena. Retry misma clave/estudio devuelve operación previa propia; misma clave con distinto estudio rechaza. Un estudio ausente sin operación previa devuelve no encontrado.

Respuesta 202 con operationId/status: committed significa borrado lógico; complete sólo después de limpieza física. Endpoint GET de operación propio permite reconciliar una respuesta perdida sin repetir efectos. Worker existente o extensión acotada con supervisor EasyPanel usa paths canónicos bajo DIRECTORY_UPLOADS, rechaza symlinks/escape y reintenta unlink; ENOENT completa. No borrado físico antes de commit. Fallos de worker conservan outbox y estado pendiente; startup preflight exige esquema/worker antes de anunciar studiesDelete.

SQL aditivo dedicado TEST crea operación/outbox o extiende infraestructura compatible tras introspección de esquema/constraints; entregar SQL y guía, ejecución manual autorizada por separado. No DROP/TRUNCATE ni migración automática. Contadores count_files/date_files no se descuentan: cuota de cargas diarias y cantidad actual de estudios son conceptos distintos. Resumen/listas se refrescan tras commit, no esperan unlink.

Detalle muestra confirmación destructiva y guard de una operación activa; cancelar antes de confirmar no escribe. Respuesta ambigua bloquea duplicados y consulta operationId/idempotencyKey, logout invalida generación UI. No logs de documentos/tokens/correos.

## Risks / Trade-offs

DB y filesystem no comparten transacción: outbox evita pérdida de referencias, limpieza puede quedar pendiente. Ningún mock prueba worker real: integración MySQL/filesystem TEST y macOS/iPhone separados. No portar la deuda del delete web ni corregirla fuera del alcance aprobado.
