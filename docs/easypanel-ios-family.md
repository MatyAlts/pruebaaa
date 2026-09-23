# Grupo familiar iOS en EasyPanel TEST

Esta entrega agrega Familia al backend existente de `saluteca.matyalts.me`. El usuario confirmó que Google funciona y que `portfolio` se creó con el bootstrap TEST. La revisión verifica scripts locales y pruebas aisladas: no inspecciona ni modifica la VPS. El responsable aplica la migración y despliega manualmente.

## Preparación

Conservar las variables de [la guía del backend](easypanel-ios-backend.md): `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MOBILE_ORIGIN` y `DIRECTORY_UPLOADS`. Para este entorno, `DB_NAME=portfolio` y `DIRECTORY_UPLOADS=/app/uploads`. No cambiar secretos Google, callbacks ni el identificador del IPA.

Mantener el volumen privado persistente en `/app/uploads`, accesible al usuario `node` UID/GID 1000. MySQL continúa interno en puerto 3306: aunque el CLI y worker leen `DB_PORT`, el pool de Next no lo lee; un puerto alternativo no constituye una configuración compatible. No agregar credenciales SQL, Google o NextAuth a GitHub Actions.

Revisar y conservar una copia de respaldo TEST antes de aplicar DDL. No ejecutar nuevamente `mobile-test-bootstrap.sql`, ni scripts históricos `create-familiares-table.sql` o `migrate-familiares-to-id.sql`. Esta entrega no agrega los contadores de upload web ni amplía campos de estudios: la reparación de carga web sigue pospuesta.

## Publicar la imagen y comprobar el esquema

En EasyPanel, servicio App del repositorio privado `MatyAlts/MiSaluteca-ios`, rama `main`, Dockerfile y contexto raíz, desplegar la revisión que incluye Familia. Conservar puerto interno 3000 y el comando predeterminado del Dockerfile; no sustituirlo por `npm start`.

El supervisor fija explícitamente Next en `0.0.0.0:3000`, igual que el Dockerfile anterior. Una variable `PORT=80` heredada del panel no debe cambiar ese listener: `80/443` pertenecen al proxy público. La primera revisión de Familia tomaba `PORT` del entorno y produjo un 502 en este despliegue; instalar la corrección del supervisor antes de probar la migración. Las pruebas Docker cubren PORT 80, 8080, ausente, inválido y base inaccesible.

La imagen contiene el CLI de migración. Antes de crear tablas, abrir la consola privada del contenedor App, directorio `/app`, y ejecutar:

```sh
node scripts/migrate-mobile-family.mjs --test-database portfolio --check
```

`--check` es de lectura. Exige que la base indicada coincida exactamente con `DB_NAME`, verifica la estructura base TEST y las tablas familiares existentes. Una base compatible sin las nuevas tablas informa `migration-required`; una migración completa compatible informa `ready`. Ante error de conexión o esquema incompatible, detenerse y revisar: no borrar tablas ni ejecutar DDL para ocultar el problema.

Tras revisar [la migración aditiva](../database/mobile-test-family.sql), el responsable del entorno TEST ejecuta explícitamente:

```sh
node scripts/migrate-mobile-family.mjs --test-database portfolio --apply
node scripts/migrate-mobile-family.mjs --test-database portfolio --check
```

El resultado esperado final es `ready`. Se agregan `familiares`, `mobile_cleanup_operations` y `mobile_cleanup_files`, preservando usuarios, sesiones y estudios. La repetición solo acepta la estructura completa compatible; no usa `IF NOT EXISTS` para legitimar tablas incompatibles. El DDL MySQL no es una transacción atómica: una ejecución interrumpida puede dejar tablas parciales y requiere revisión privada antes de continuar. No existe migración automática al iniciar Docker o Actions.

La API comprueba disponibilidad del esquema al atender peticiones. Antes de migrar, mantiene la lectura propia y omite las capabilities familiares; la app conserva su interfaz anterior. Después, volver a iniciar sesión en el iPhone para cargar las capabilities nuevas.

## Worker y eliminación

El comando Docker `node scripts/start-mobile-backend.mjs` supervisa conjuntamente Next y `scripts/mobile-cleanup-worker.mjs`; si un proceso termina, detiene el otro. SIGTERM detiene ambos, con límite de cinco segundos antes de SIGKILL. El worker funciona dentro del mismo servicio, utiliza las variables SQL y el volumen ya configurados y no expone una URL pública.

No hacen falta variables nuevas manuales. `MOBILE_CLEANUP_SUPERVISED` es una señal interna del supervisor hacia Next: **no configurarla en EasyPanel ni Actions**. El arranque directo sin supervisor no habilita DELETE. El worker usa parámetros fijos: lote máximo 20 archivos, lease de 60 segundos, reintento de cinco segundos e intervalo de cinco segundos. Una base sin migración deja la limpieza inactiva; un error se reintenta sin imprimir claves de archivos ni credenciales.

Eliminar exige escribir `misaluteca`. La transacción invalida familiar, estudios, adjuntos y enlaces existentes compatibles, y registra los archivos en la outbox. La respuesta 202 contiene `operationId` y `pending` o `complete`. `pending` significa que los registros ya se eliminaron pero la limpieza física todavía no terminó; no significa que se pueda deshacer. El estado solo es consultable por su cuenta propietaria.

El worker solo elimina claves canónicas bajo el directorio privado del propietario, por ejemplo `ID_USUARIO/documento-ficticio.pdf`. Rechaza traversal, enlaces simbólicos y referencias ambiguas o compartidas con registros conservados. Archivo ausente (`ENOENT`) cuenta como limpieza completa. Rutas inseguras, permisos insuficientes o archivos compartidos mantienen la operación pendiente: revisar el volumen y las referencias sin desactivar las comprobaciones. Las fixtures antiguas como `pruebas/ejemplo.pdf` pueden seguir siendo legibles, pero no cumplen el confinamiento por propietario para esta limpieza; preparar fixtures nuevas bajo su directorio de usuario.

## Comprobación manual

Usar exclusivamente dos cuentas y documentos ficticios de TEST. Comprobar alta y renombrado, nombres vacíos y límite 40, lista y estudios del familiar, filtros por paciente y totales completos. La cuenta B no debe acceder a familiares, estudios, PDFs ni operaciones de A. Camera/Files y carga no forman parte de esta entrega.

Cancelar la confirmación de eliminación no debe modificar datos. Confirmar elimina el acceso a los registros de inmediato; comprobar que el estado pasa a `complete` cuando los archivos están ausentes y que una limpieza pendiente se retoma después de reiniciar el servicio. Verificar también teclado, VoiceOver, texto grande y espacio bajo la barra de estado en el iPhone. Las pruebas automatizadas no sustituyen esta aceptación física.

## Rollback y Actions

Para volver a la versión anterior de interfaz o backend, conservar el volumen y las nuevas tablas: retirar la imagen nueva detiene su worker y deja operaciones pendientes sin procesar. No eliminar la outbox ni registros para simular éxito. Volver a una revisión compatible con worker para continuar la limpieza. Después del commit destructivo no se restauran familiares, estudios ni archivos mediante rollback de código; cualquier recuperación de respaldo es una operación separada del responsable TEST.

El workflow backend prueba y construye Docker. `EASYPANEL_DEPLOY_WEBHOOK` sigue siendo el único secret opcional de deploy: sin él, desplegar manualmente desde EasyPanel. El workflow IPA utiliza solamente el origen público `https://saluteca.matyalts.me` y no aplica SQL. Esta guía no autoriza ejecutar migraciones ni deploy en la VPS desde el agente.
