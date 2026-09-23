## Why

iOS permite leer y cargar estudios pero todavía no eliminarlos individualmente. El usuario solicita esta operación real desde el detalle, conservando aislamiento y limpieza de todos los adjuntos.

## What Changes

- DELETE móvil confirmado con identidad Bearer existente, propietario y revocación verificados en la transacción.
- Operación idempotente y limpieza diferida de todos los archivos mediante outbox, sin aceptar rutas del cliente.
- Acción destructiva accesible, estado pendiente/reintento seguro y actualización de listas/conteos después del commit.
- Preflight y SQL aditivo TEST revisable; no ejecutar DDL ni desplegar automáticamente.
- No incluye edición, sharing, OCR ni modificación de autenticación. Requiere aprobación del diseño de borrado antes de escribir endpoints.

## Capabilities

### New Capabilities

- `ios-study-deletion`: eliminación individual propia y limpieza confiable.

### Modified Capabilities

Ninguna.

## Impact

API móvil, repositorio MySQL, worker de limpieza existente, detalle móvil, pruebas y guía EasyPanel. No reutilizar deleteStudy web, que sólo intenta borrar el primer archivo. Sin claves ni datos clínicos en logs/artifacts.
