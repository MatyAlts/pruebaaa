# Evidencia backend: carga nativa de estudios iOS

Change: `ios-study-upload`. Implementación autorizada para TEST; no se ejecutó SQL ni deployment en la VPS. Aceptación física de cámara, Files y recuperación de conexión pendiente del usuario.

## Diseño aplicado

`POST /api/mobile/v1/studies` reutiliza Bearer existente y exige UUID `Idempotency-Key`. `operationId` es la misma clave normalizada. El UUID del estudio es independiente para evitar colisiones entre cuentas. El ledger identifica propietario, fingerprint, manifiesto privado, estado y lease; la transacción publica estudio, adjuntos, cuota y estado completo atómicamente. Replay devuelve el mismo estudio sin consumir otra carga; cambio de contenido con la misma clave devuelve 409.

Cuota serializada por usuario, una unidad por estudio, valor `LIMIT_UPLOAD` o 20; el día conserva `moment().subtract(3, "hours").format("DD-MM-YYYY")` y TZ existente. Un contador INT nullable compatible mantiene valores y default; NULL se interpreta como cero. La carga web anterior conserva su carrera de concurrencia de cuota; este cambio no altera su protocolo.

Parser streaming: 10 archivos, 10 MiB por archivo, cuerpo HTTP multipart completo de 50 MiB. Cabeceras y campos también cuentan; un total de archivos de exactamente 50 MiB supera el límite por el overhead. JPEG/PNG se decodifican secuencialmente con jpeg-js/pngjs, verificando dimensiones antes de asignar memoria (8192 por lado/24 MP). Se conservan bytes originales y Exif; PDF exige firma y EOF, sin prometer conformidad exhaustiva o antivirus.

Archivos entrantes privados con permisos 0700/0600, claves de servidor y promoción mediante hardlink sin sobrescritura. Worker interno supervisado, sin endpoint público: operación interrumpida pasa a fallo reintentable después de limpiar referencias seguras; después del commit conserva datos/archivos y elimina staging. Fencing token+vencimiento evita limpieza por actor viejo. Referencias ambiguas o compartidas conservan archivos para reintentar.

GC recorre como máximo 20 pasos de directorios por lote con cursor entre lotes, y preserva staging pendiente. Directorios sin ledger se limpian tras una hora. Ingestión tiene deadline 120 s, adquisición DB 5 s y claim previo al ledger 30 s; así las entradas activas no alcanzan el TTL. Errores del worker familiar no suprimen recuperación de cargas propias. El supervisor conserva puerto interno 3000 aunque EasyPanel inyecte PORT.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED ejecutado | GREEN ejecutado | Triangulación | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.2 esquema/cuota | `tests/mobile-backend/upload-schema.integration.test.ts` | MySQL real | 80/80 baseline | módulo ausente; defaults/PK incompatibles; contador nullable | 6/6 | bootstrap poblado, repeat, schema inválido, NULL conservado e incrementado | Prettier + focal GREEN; final 121/121 |
| 1.1 parser/contrato | `upload-validation.test.ts`, `upload-parser.test.ts`, `upload-http.test.ts` | Unit/streaming/FS | baseline preservado | módulos ausentes; JPEG válido rechazado; cuerpo truncado; boundary exacto; timeout | 3/3, 7/7, 3/3 | campos Unicode/límites/civil date, exacto10MiB/50MiB+1, EXIF/CRC/bombas | Prettier + focal GREEN; final 121/121 |
| 1.3 publicación/idempotencia | `upload.integration.test.ts`, `upload-session.integration.test.ts`, `upload-next.integration.test.ts` | MySQL/FS/HTTP real | baseline preservado | publicación ausente; UUID compartido; pool1 deadlock; familia ausente; HTTP503 | 15/15, 1/1, 1/1 | replay/conflicto/owner/familia, SQL rollback, cuota concurrente/reset, sesión revocada | Prettier + focal GREEN; final 121/121 |
| 1.4 recovery/runtime | `upload.integration.test.ts`, `upload-storage-wait.test.ts`, `family-supervisor.test.ts`, `tests/docker/study-upload.test.mjs` | proceso/DB/FS/Docker | supervisor2/2 | proceso no interrumpido; lease viejo; GC sin límite; error familiar; imagen sin closure; disco lleno bloquea parser | SQL/proceso15/15; espera1/1; supervisor3/3; Docker 7/7 (5 puerto + 2 carga) | muerte antes/después commit, referencias ambiguas, GC40 entradas, cola pool1 | Prettier + focal GREEN; final 121/121 |
| lectura imágenes | `upload-image-reading.test.ts` | FS/HTTP adapter | lectores previos preservados | JPEG415; corrupto aceptado | 3/3 | JPEG/PNG reales, nosniff/cache, owner/traversal | Prettier + focal GREEN; final 121/121 |

Los casos adicionales que ya pasan prueban triangulación de la implementación existente; no se presentan como RED nuevos. Refactor/format verificadas con suites focales GREEN y suite integrada final 121/121 PASS.

## Verificación final

Suite integrada final: 121/121 PASS, cero skips/fallos (86,1 s), MySQL8.4/Next HTTP real. Lint focal PASS. Docker final 7/7 PASS (5 puerto + 2 carga/worker) tras rebuild final (15,7 s). Typecheck root PASS; lint focal PASS. Imagen aislada sin mobile/Expo/RN y closure recovery/CLI/SQL PASS. El Docker inicial produjo `ERR_MODULE_NOT_FOUND upload-recovery.ts`; incluir cierre completo de `src/mobile-server` y scripts/SQL dio smoke real 1/1. La prueba posterior de disco lleno expuso un hang por stream sin drenar, con RED TimeoutError; drenar el stream después del error dio GREEN. Contrato 503 para ENOSPC/EACCES: RED500 y GREEN503 real.

Migración manual revisable: `node scripts/migrate-mobile-upload.mjs --test-database portfolio --check` y luego `--apply`; el nombre debe coincidir exactamente con `DB_NAME`. El SQL solo declara ledger; el CLI aplica condicionalmente columnas de cuota faltantes y anchuras insuficientes preservando defaults/collation/comentarios. No aplicar el SQL aislado como reemplazo del preflight.

## CI publicada

[Backend CI 35311865310](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35311865310) terminó **SUCCESS** para el commit exacto `0987400010cb04eecd7a7730a662da97b1377947` (primer intento). Los logs confirman **121/121** pruebas reales MySQL/HTTP/FS, **5/5** de puerto Docker y **2/2** de carga/worker Docker, con cero fallos y cero skips.

La imagen construida en CI es `sha256:d7e06f957ac478d0f3c0e5791638b61ad237aeb63ed7a54712ffc129e2e28862`. El runtime se verificó con disco lleno: respuesta 503 sin estudio, cuota ni staging parcial; muerte real del escritor con exit 17 y recuperación mediante worker interno; CLI de migración `--check` y `--apply` sobre la base aislada conserva el contador. También pasaron aislamiento sin mobile/Expo/React Native y comparación exacta del recurso `maintenance.html` servido por Next.

La rama del hook informó **“Hook no configurado: deployment omitido”**. Esta ejecución no desplegó ni migró la VPS; esa operación continúa siendo manual. La aceptación física del IPA permanece pendiente.
