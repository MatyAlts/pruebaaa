# Eliminar estudios y autocompletar con IA en TEST

Estas capacidades requieren el backend nuevo y las migraciones manuales siguientes. No ejecutar el bootstrap nuevamente: la base `portfolio` ya contiene datos. El agente no ejecuta SQL ni despliega en la VPS; primero respaldar TEST y revisar los scripts/SQL.

## EasyPanel

Desplegar `main` usando el Dockerfile del repositorio y su comando por defecto `node scripts/start-mobile-backend.mjs`. Quitar overrides `npm start`; el supervisor mantiene Next y el worker juntos. Dominio `https://saluteca.matyalts.me`, puerto interno **3000**. Conservar el volumen privado persistente `/app/uploads`, accesible por usuario/grupo 1000; no servirlo públicamente.

| Variable | Valor / uso |
|---|---|
| `DB_HOST` | DNS interno del servicio MySQL actual |
| `DB_NAME` | `portfolio`, exclusivamente base TEST confirmada |
| `DB_USER`, `DB_PASSWORD` | Credenciales actuales, sólo backend |
| `DIRECTORY_UPLOADS` | `/app/uploads`, ruta absoluta del volumen privado |
| `PORT` | `3000`; el supervisor conserva este listener |
| `NEXTAUTH_URL`, `MOBILE_ORIGIN` | `https://saluteca.matyalts.me` |
| `NEXTAUTH_SECRET` | Conservar secreto actual |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Conservar configuración Google actual |
| `LIMIT_UPLOAD` | Límite actual de estudios cargados por día; borrar no lo reembolsa |
| `OPENROUTER_API_KEY` | Clave runtime sólo backend; habilita proveedor IA, no necesaria para borrar/cargar manualmente |
| `LIMIT_ANALYZE` | Entero positivo, límite diario compartido web/iOS; por ejemplo `5` |
| `MOBILE_TRUST_PROXY_HEADERS` | Conservar valor verificado; no habilitar por este cambio |

No configurar `MOBILE_UPLOAD_SUPERVISED` ni `MOBILE_CLEANUP_SUPERVISED`: el supervisor los genera internamente. `OPENAI_API_KEY` no habilita el proveedor actual. Modelo fijo **`openai/gpt-4o-mini`**, prompt web existente, SDK sin retries automáticos.

## Migraciones manuales

Desde la consola del contenedor **App**, después del deploy y del respaldo:

```sh
cd /app
node scripts/migrate-mobile-management.mjs --test-database portfolio delete --check
node scripts/migrate-mobile-management.mjs --test-database portfolio analyze --check
```

Sólo si ambos checks informan esquema compatible y migración pendiente:

```sh
node scripts/migrate-mobile-management.mjs --test-database portfolio delete --apply
node scripts/migrate-mobile-management.mjs --test-database portfolio analyze --apply
node scripts/migrate-mobile-management.mjs --test-database portfolio delete --check
node scripts/migrate-mobile-management.mjs --test-database portfolio analyze --check
```

Resultado final `ready`. Ante incompatibilidad detenerse y revisar la salida, sin ejecutar SQL alternativo ni volver a crear tablas. MySQL DDL no es una transacción integral: una interrupción requiere revisión antes de continuar. Los scripts exigen que el nombre TEST coincida exactamente con `DB_NAME`; nunca hay DDL al iniciar el servidor.

La migración `delete` crea operación propia y outbox; la de `analyze` crea sólo metadatos operativos y agrega `users.count_analyze/date_analyze` si faltan. Conserva campos/counters existentes compatibles. No persiste texto OCR ni sugerencias clínicas. Ejecutar archivos SQL solos no reemplaza introspección ni alineación de los contadores.

## GitHub Actions / iPhone

No agregar claves Google, SQL u OpenRouter a Actions. Usar el workflow iOS existente, con `api_base_url=https://saluteca.matyalts.me`; `EXPO_PUBLIC_API_BASE_URL` contiene únicamente el origen público. `EASYPANEL_DEPLOY_WEBHOOK` es opcional para deploy automático y permanece privado en Secrets.

Instalar el IPA nuevo con Impactor conservando `com.matyalts.misaluteca`. Cerrar sesión y entrar nuevamente después de migrar para renovar capabilities. Borrar se anuncia sólo con esquema y supervisor; IA sólo con esquema/clave/límite. La carga manual sigue disponible sin IA.

## Semántica y prueba

Borrar requiere confirmación, dueño y sesión vigente en la misma transacción. El commit elimina estudio, filas de todos los adjuntos y links; las listas/conteos se actualizan entonces. `committed` puede implicar limpieza física pendiente: el worker reintenta sin perder el outbox. `complete` confirma limpieza de las claves registradas. Reutilizar la misma operación después de pérdida de conexión; no crear otra por defecto. Claves fuera del volumen, symlinks y referencias compartidas se mantienen pendientes; revisar datos incompatibles sin borrado inseguro.

Autocompletar extrae localmente un adjunto PDF/JPEG/PNG del borrador, muestra texto revisable y solicita consentimiento antes de enviar **sólo texto** a backend/OpenRouter. Sugerencias requieren revisión; no guarda un estudio automáticamente. Texto y resultados no se guardan en SQL ni logs. El proveedor puede facturar aun si su JSON es inválido; liberar una reserva no promete devolución económica.

La cuota reserva capacidad concurrente común web/iOS. Éxito validado incrementa `count_analyze`; fallo definitivo libera reserva. Timeout/respuesta incierta conserva capacidad durante su ventana diaria. El mismo `requestId` nunca repite proveedor. Si se perdió el resultado, GET devuelve sólo estado: continuar manualmente o consentir explícitamente otra operación, posiblemente con costo/cuota adicional.

Probar en iPhone TEST con documentos ficticios: cancelar confirmación, eliminar estudio con varios adjuntos, cambio entre cuentas, red perdida/reconciliación, OCR textual/escaneado, revisión de campos ya editados, VoiceOver/texto grande y calendario. Las pruebas automatizadas mockean proveedor y no realizan llamadas pagas; una prueba real de IA requiere autorización explícita posterior.
