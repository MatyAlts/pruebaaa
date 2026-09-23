# Evidencia backend de Grupo familiar iOS

Fecha: 18-09-2026. El usuario aprobó expresamente el diseño completo de `docs/ios-family-next-step.md`: aislamiento, DDL TEST aditiva, eliminación irreversible con confirmación `misaluteca`, transacción y outbox reintentable. No se ejecutó SQL ni se desplegó en la VPS. La reparación de carga web sigue pospuesta.

## Safety net y entorno

Baseline ejecutado: **62/62 pruebas backend PASS, cero omitidas**, con `RUN_MOBILE_MYSQL_TESTS=1`, MySQL 8.4 en Docker saludable y Next HTTP real. Las nuevas pruebas usan exclusivamente `127.0.0.1:33316`, credenciales públicas de fixture y la base separada `misaluteca_mobile_family_test`; recrean únicamente esa base de pruebas. No leen credenciales de producción.

El bootstrap real no incluye `familiares` ni `links`. Conserva `estudios.id_familiar` nullable sin FK familiar y adjuntos con cascada hacia estudios. La migración conserva usuarios, sesiones y estudios; se prueba un registro previo y repetición compatible. Preflight rechaza base incompatible, tablas parciales, tipos, nullability, motor, PK, índices, FKs y defaults incompatibles. No usa `IF NOT EXISTS` para legitimar una tabla existente.

## Comportamiento verificado

- CRUD propio con UUID del servidor, identidad Bearer canónica y nombre trim de 1 a 40 caracteres; rechazo de nombres vacíos/41, identidad inyectada y UUID ajeno. Conteos completos exigen propietario coincidente en estudio y familiar; fechas civiles inválidas no falsean la última fecha.
- GET/POST/PATCH/DELETE llegan a la ruta Next real; pruebas HTTP usan tokens reales emitidos por Google bridge/PKCE de fixture sin alterar el protocolo. Ausencia de Bearer devuelve 401, no se acepta cookie como identidad móvil.
- `scope=self` por defecto conserva paginación numérica legacy. `all` y `family` usan cursor por fecha ligado a usuario, filtros y paciente seleccionado; un cursor de otra selección es rechazado. DTO de paciente identifica `self` o `family`. Resumen cuenta el historial autorizado completo y filtra recientes/opciones por selección.
- Detalle/PDF familiar requiere propietario del estudio y familiar. PDF familiar rechaza claves de otro directorio y symlinks/junctions. Self conserva el contrato anterior de rutas privadas confinadas a uploads, incluido `pruebas/ejemplo.pdf`; un RED focal evitó ampliar el hardening legacy fuera del alcance aprobado.
- DELETE sin confirmación o ajeno no modifica. Transacción registra claves legacy **y** adjuntos deduplicadas, elimina enlaces compatibles, adjuntos, estudios y familiar. Inconsistencia de otra cuenta o links incompatibles rechaza. Trigger SQL de fixture falla después de escrituras y prueba rollback de datos/outbox. Tras commit no hay acceso a filas borradas ni promesa de deshacer.
- Operación ligada al dueño no expone rutas. Worker de lote 20 reclama con lease de 60 segundos, guarda un lock SQL sobre la fila mientras ejecuta IO y valida token antes de unlink. Un segundo `FOR UPDATE NOWAIT` comprueba el bloqueo real. ENOENT completa idempotentemente; EACCES reintenta después de cinco segundos. Claves compartidas, aliases ambiguos, traversal y symlinks quedan pendientes sin borrar archivos ajenos.
- Proceso worker real recupera operación persistida. Supervisor inicia Next y worker internos, propaga SIGTERM y conserva fallos del servicio. No existe endpoint público de limpieza. Docker copia sólo scripts/fuentes requeridos; no ejecuta migraciones al iniciar.
- Capabilities familiares requieren DDL verificada; `familyDelete` requiere supervisión interna explícita. Omitir la señal no concede DELETE; Next sin supervisor anuncia false y rechaza 503. La señal interna no es variable que el usuario deba configurar en EasyPanel.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 DDL/preflight | `tests/mobile-backend/family.integration.test.ts` | MySQL/CLI | 62/62 | Import ausente; luego base/nullability/índice/partial incompatibles no rechazados | Focal ejecutado PASS | Conservación, repetición, tipos/base/parcial/índices y CLI mismatch | Rerun postformato |
| 1.2 CRUD | `tests/mobile-backend/family.integration.test.ts` | MySQL/HTTP/Next | 62/62 | Servicio ausente, HTTP405 y Next404 | CRUD/HTTP focal PASS | Dos cuentas, UUID ajeno, nombre 0/40/41, inyección; fecha inválida RED→GREEN | Rerun postformato |
| 1.3 DELETE/outbox | `tests/mobile-backend/family.integration.test.ts` | MySQL/filesystem | 62/62 | Método ausente; shared alias eliminado; lease lock no ejecutado; links mal tipados aceptados | Focal ejecutado PASS | Confirmación, dueño ajeno, inconsistencia, trigger rollback, enlaces, ENOENT/EACCES/retry, shared/aliases/symlink y operación ajena | Rerun postformato |
| 1.3 procesos | `tests/mobile-backend/family-supervisor.test.ts`, `family.integration.test.ts` | Procesos reales/MySQL | 62/62 | Supervisor/worker ausentes; limpieza persistida no completa | Supervisor 2/2 y worker 1/1 | Web exit7, SIGTERM ambos, persistencia/ENOENT | Rerun postformato |
| 1.4 DTO/scopes | `tests/mobile-backend/family.integration.test.ts`, `studies.test.ts` | MySQL/reader | 62/62 | Reader nuevo ausente; cursor cambia paciente aceptado; PDF familiar cross-owner/junction leído; self legacy rechazado | Focal PASS; self 7/7 | Self/all/family, paciente, total autorizado, fingerprints, familias incoherentes, PDF propio/ajeno y legacy | Rerun postformato |

El RED de DELETE inicialmente mostró un problema del fixture: el test previo dejaba `nombre INT`. Se restauró el fixture y volvió a ejecutar RED: `remove is not a function`, antes de implementar. El test de worker inicialmente esperaba un evento exit ya ocurrido; se corrigió su teardown y ejecutó RED real por worker ausente. No se atribuyen esos fallos del arnés a producción.

La suite integrada final, repetida después de formatear, pasó **73/73, cero omitidas**. TypeScript pasó después de `next typegen` serial; ESLint focal con `--max-warnings 0` pasó sin errores ni advertencias. Revisión independiente final del backend/worker/preflight: PASS. Todos los renglones REFACTOR de la tabla quedaron verificados por esa ejecución integrada.

Docker real `misaluteca-family:checked`: build PASS, manifest list `sha256:5cafef1419b9da230f64551aa3145b173e91f4e993c27255bdb1eaeacf3b5138`. Runtime no contiene `/app/mobile`, Expo ni React Native; sólo ausencia MODULE_NOT_FOUND se acepta. Sin credenciales el CMD supervisado sirve `/maintenance.html` con contenido idéntico al archivo público, y `docker top -eo pid,args` comprueba simultáneamente supervisor, `next-server` y worker. SIGTERM de Docker termina con exit0. Containers temporales con puerto loopback efímero se eliminaron por nombre exacto en `finally`. Dos intentos de inspección del arnés necesitaron corregir quoting y añadir el campo PID; el smoke final completo pasó, sin modificar producción para sortearlos.

Build IPA y aceptación física siguen a cargo del flujo raíz; estas pruebas no completan manualmente la tarea 1.6.

## GitHub Actions verificado

[Backend CI 35306206623](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35306206623) terminó **SUCCESS** sobre commit exacto `507c33d0097ed620f04d0ef0457e76d3363e00a5`. Logs reales confirman **73 tests, 73 pass, 0 fail, 0 skipped** contra MySQL dedicado y HTTP local. Build Docker sin credenciales, aislamiento sin mobile/Expo/React Native y arranque de imagen final con comparación `cmp` de `/maintenance.html`: PASS. Imagen CI `sha256:8cacb3950a98134c66f45477070417765efc31b20544df4f8899e0bea8bae166`.

El paso final registró explícitamente: “Hook no configurado: deployment omitido. Primer deploy corresponde al responsable de EasyPanel.” No se solicitó deploy ni se ejecutó SQL en la VPS. La presencia simultánea Next/worker y SIGTERM exit0 se verificaron además mediante el smoke Docker local descrito arriba; no se atribuyen comprobaciones adicionales al workflow.

## Corrección del puerto de EasyPanel

Los logs del despliegue confirmaron una regresión introducida por el supervisor: heredaba `PORT=80`, mientras el CMD anterior fijaba 3000. Se restauró el puerto interno **3000**, escuchando en `0.0.0.0`, conservando el worker y su supervisión.

| Cambio | Safety net | RED ejecutado | GREEN y triangulación |
| --- | --- | --- | --- |
| Puerto fijo del supervisor | Supervisor 2/2 | Docker real con PORT=8080 no respondía en 3000 | Imagen final, sin mounts: 5/5 con PORT=80, 8080, omitido, inválido y base inaccesible |

Build real `misaluteca-family-port:checked`: PASS, manifest list `sha256:021be4f5c252a01553bb987a266bcf07077722b109b36b1f4cfceaa3d7640fe0`. Suite backend posterior a la corrección: **73/73, cero omitidas**. Contratos de automatización: **7/7**; el chequeo Docker distingue la carpeta `/app/mobile` de nombres de scripts del servidor. El workflow ahora ejecuta los cinco casos contra su imagen recién construida. El CI anterior registrado arriba precede a esta corrección; su nueva ejecución queda a cargo del flujo raíz.

## CI final de correcciones web

[Backend CI 35307568778](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35307568778): **SUCCESS**, commit exacto `453eceff455e77f5ea71ed03ba45d350ca64fbed`, **80/80 backend y 5/5 Docker**, cero fallos u omitidas. Incluye el puerto fijo 3000 con `PORT=80`, el adaptador de raíz de almacenamiento web y las pruebas previas de MySQL/HTTP familiar. Build Docker, aislamiento y comparación de `/maintenance.html`: PASS; imagen `sha256:a7f1d32379dc4986ba722eb4eabc0ed8912efb9b5b1f10a239809848eaa439b9`. El workflow confirmó hook no configurado y deployment omitido; carga manual/VPS pendientes del responsable.

## Despliegue preparado

Consultar `docs/easypanel-ios-family.md`. CLI manual disponible en la imagen: `node scripts/migrate-mobile-family.mjs --test-database portfolio --check`; sólo el usuario ejecuta `--apply` después de revisar, con DB_NAME coincidente. El ajuste posterior del almacenamiento web se documenta en `docs/web-upload-root-evidence.md`; la reparación de esquema/cuotas continúa pospuesta. Next sin migración conserva lectura self anterior; la app no debe ofrecer futuras cargas.
