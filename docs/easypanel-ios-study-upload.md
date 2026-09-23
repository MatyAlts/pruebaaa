# Carga de estudios iOS en EasyPanel TEST

Esta entrega usa el backend existente `https://saluteca.matyalts.me`, base TEST `portfolio` y volumen `/app/uploads`. El responsable configura y despliega en EasyPanel; los agentes no ejecutan SQL ni despliegan en la VPS. Google ya funciona: conservar sus secretos, callbacks y bundle `com.matyalts.misaluteca`.

## Variables y servicios

Conservar el inventario completo de [backend y Actions](easypanel-ios-backend.md). Para cargar desde iOS:

| Variable | Servicio / condición | Configuración |
|---|---|---|
| `DB_HOST` | App runtime, obligatoria | DNS interno MySQL, no dominio HTTPS |
| `DB_NAME` | App runtime, obligatoria | `portfolio`, TEST confirmado |
| `DB_USER` / `DB_PASSWORD` | App runtime, obligatorias | Usuario privado autorizado para esta base; no duplicar en Actions |
| `NEXTAUTH_URL` / `MOBILE_ORIGIN` | App runtime, obligatorias | `https://saluteca.matyalts.me` |
| `NEXTAUTH_SECRET` | App runtime, obligatoria | Conservar secreto existente |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | App runtime, obligatorias | Conservar cliente OAuth web existente |
| `DIRECTORY_UPLOADS` | App runtime | `/app/uploads`, volumen persistente privado UID/GID 1000 |
| `LIMIT_UPLOAD` | App runtime, default `20` | Entero positivo; estudios por usuario/día, no adjuntos |
| `MOBILE_TRUST_PROXY_HEADERS` | App runtime, default false | Conservar configuración verificada de proxy existente |
| `PORT` | Docker | Listener fijo 3000; dominio interno EasyPanel también 3000 |
| `MOBILE_UPLOAD_SUPERVISED` / `MOBILE_CLEANUP_SUPERVISED` | Internas | Las pone el supervisor; no declararlas manualmente |
| `OPENROUTER_API_KEY` / `LIMIT_ANALYZE` | Sólo IA web | No necesarias para esta carga; no hay OCR ni llamadas pagas nuevas |
| `EASYPANEL_DEPLOY_WEBHOOK` | GitHub Secret opcional | Hook privado; sin él desplegar manualmente |
| `api_base_url` | Input workflow IPA | `https://saluteca.matyalts.me` |
| `EXPO_PUBLIC_API_BASE_URL` | Interna workflow IPA | Derivada del input; URL pública incorporada al IPA, sin credenciales |

No agregar secretos SQL/Google/OpenRouter/Apple a Actions. MySQL interno usa 3306; el pool Next no admite cambiarlo mediante `DB_PORT`. Mantener otras variables web existentes según la guía principal: esta tabla detalla las necesarias o relevantes para la carga, no elimina configuración de otras funciones.

Builder Dockerfile y contexto raíz, repo privado `MatyAlts/MiSaluteca-ios`, rama `main`. Mantener comando Docker predeterminado `node scripts/start-mobile-backend.mjs`; un override `npm start` omite supervisión/recuperación. Conservar volumen incluso al redeploy y garantizar usuario `node` UID/GID 1000 puede crear directorios y archivos; no resolver permisos ejecutando como root ni haciendo uploads públicos.

## Límites proxy y app

Admitir en el proxy un cuerpo multipart de al menos 55 MiB y tiempo suficiente para el envío desde celular. La app impone **50 MiB al cuerpo multipart entero**, hasta 10 adjuntos y 10 MiB por adjunto. Los archivos sumados deben caber en 50 MiB, pero exactamente 50 MiB de archivos puede recibir 413 por cabeceras y campos. El límite mayor del proxy permite que la API explique su propio límite, no aumenta la admisión del servidor.

El cliente y la ingesta del servidor limitan el envío a 120 segundos; revisar límites de proxy inferiores sin convertirlo en carga sin límites. No se comprobó la configuración del proxy de esta VPS. JPEG/PNG estructuralmente válidos tienen hasta 8192 píxeles por lado y 24 megapíxeles; PDF/JPEG/PNG son los formatos admitidos. HEIC y DOCX no se aceptan. Validación de formato no es antivirus ni análisis médico.

## Migración manual

Respaldar TEST y revisar [DDL ledger](../database/mobile-test-upload.sql), preflight y script antes de ejecutar. No repetir bootstrap ni borrar tablas. El SQL contiene sólo ledger; no basta ejecutarlo aislado para ajustar cuota/campos.

Desde consola privada del contenedor App en `/app`:

```sh
node scripts/migrate-mobile-upload.mjs --test-database portfolio --check
```

`--check` es de lectura, exige coincidencia exacta con `DB_NAME` y determina compatibilidad. Ante estructura incompatible detenerse y revisar; no modificar tipos arbitrariamente para eludirlo. Tras revisión, el responsable TEST ejecuta:

```sh
node scripts/migrate-mobile-upload.mjs --test-database portfolio --apply
node scripts/migrate-mobile-upload.mjs --test-database portfolio --check
```

La migración añade `mobile_study_uploads`, añade `users.count_files/date_files` si faltan y amplía campos `titulo/institucion/medico` sólo cuando su capacidad es menor que 400, preservando datos y atributos compatibles. Un contador INT existente nullable con default NULL o 0 es compatible: NULL se interpreta como cero y no se reescriben filas/defaults. Si falta, se añade INT NOT NULL DEFAULT 0. La migración familiar de [su guía](easypanel-ios-family.md) es necesaria para cargar a un familiar; no inventa familiares desde campos enviados por cliente. DDL MySQL no es atómico: una interrupción requiere revisar estado antes de continuar. Docker y Actions no aplican SQL automáticamente.

Readiness efectiva depende de schema y supervisor real; sin ellos la carga no se anuncia en capabilities y la lectura/login continúan. Tras migrar/redeploy, volver a abrir sesión para cargar capabilities.

El preflight también rechaza columnas opcionales que no admitan NULL, PK/FK/defaults incompatibles y engine sin transacciones antes de aplicar DDL. No convierte una estructura incompatible mediante `IF NOT EXISTS` ni reescribe contadores existentes. La adquisición de conexión tras staging tiene límite cinco segundos y el claim previo al ledger treinta segundos, además de la ingesta de 120 segundos.

## Resultado, reintento y recuperación

La clave UUID se mantiene en memoria por cuenta durante un borrador y sus reintentos. El ledger del servidor es durable y está ligado al propietario. Respuesta perdida o abort local no prueban que el servidor haya cancelado: primero consultar el estado, luego reintentar misma carga/misma clave cuando corresponda. Mismo contenido produce el mismo estudio; contenido distinto con la misma clave recibe 409. No reenviar automáticamente tras cerrar completamente iOS si ya no se conoce la clave ni asumir que persiste el borrador.

Si la consulta todavía responde 404 después de una conexión interrumpida, se puede reintentar la misma carga con la misma clave: el coordinador consulta nuevamente antes de enviar. No crear una clave nueva mientras el resultado anterior sea desconocido. Disco lleno o falta de permisos antes de commit responden 503 `UPLOAD_UNAVAILABLE`; revisar volumen/permisos antes de reintentar. Cuota agotada responde 429 `UPLOAD_LIMIT_REACHED` e informa que el límite es diario, no un minuto de espera.

El worker privado integrado con limpieza familiar revisa cargas interrumpidas. Una operación pending con lease vencido limpia promociones no referenciadas de forma segura y pasa a failed `UPLOAD_INTERRUPTED`, reintentable. No publica un estudio nuevo sin sesión vigente. Mientras el resultado es incierto, la app conserva e inmoviliza borrador y adjuntos privados para reintentar la misma carga. No permite readjuntar con nuevas URI mientras está bloqueada. Si se cerró completamente la app y se perdió ese estado local, no prometer reintento automático ni borrador recuperado. La cuota se incrementa una vez por estudio confirmado y usa día `DD-MM-YYYY` del reloj menos tres horas con la zona horaria existente del proceso, igual que moment/config/date.ts. Conservar `TZ` si ya se configuró; el contenedor predeterminado usa UTC y no requiere una variable nueva. Solicitudes iOS serializan el contador; el uploader web histórico no usa ese mismo bloqueo y no se promete cuota global exacta bajo escrituras simultáneas web/iOS.

Archivos privados quedan bajo propietario canónico; imágenes se muestran mediante lector nativo junto al PDF, sin enlace público, compartir ni guardar en Photos. La recuperación debe preservar referencias retenidas/compartidas y no seguir symlinks. El runtime utiliza leases de 60 segundos y reintentos/intervalo de cinco segundos, con lote de hasta 20 operaciones. La limpieza de staging recorre como máximo 20 entradas por pasada conservando cursor: respeta operaciones pending, limpia staging de complete y elimina staging huérfano sólo tras una hora. Estas reglas requieren el worker activo y permisos del volumen; no borrar manualmente staging de una carga en curso.

## Prueba manual y rollback

Instalar IPA con Impactor conservando identificador. Usar documentos ficticios: cámara JPEG, Files PDF/PNG/JPEG, propia/familiar, campos opcionales y fecha válida/incorrecta, permisos denegados/cancelación, progreso y pérdida de red, listado y lectura privada. Confirmar no duplicado tras respuesta perdida y que otra cuenta no accede a bytes/estado. Comprobar logout durante envío, teclado, texto grande, VoiceOver y volumen persistente tras redeploy. La aceptación física queda pendiente hasta confirmación del usuario.

Rollback de imagen no revierte estudios confirmados ni cuota consumida. Conservar volumen/ledger/tablas; detener worker deja recuperaciones pendientes. Volver a imagen compatible para recuperar. No borrar archivos ni estudios para simular rollback y no ejecutar SQL destructivo. Registrar SHA/runs/IPA final en evidencia de entrega; un workflow iniciado no equivale a build validado.

## Entrega verificada

Código validado: `0987400010cb04eecd7a7730a662da97b1377947`. [Backend CI](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35311865310) y [macOS IPA](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35311866655) finalizaron correctamente: backend 121/121, Docker 7/7, móvil 228/228 y Doctor 21/21. No hubo despliegue automático ni SQL en VPS.

[Descargar IPA sin firma](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35311866655/artifacts/10533976512), 12.937.199 bytes, SHA256 `895f256f5375c9364d94dbcbd583b85d4cacdb06729a83f8b07839beb47f0d18`. El artifact conserva siete días de retención; requiere firma local mediante Impactor.

Auditoría independiente del IPA descargado: ZIP íntegro, ejecutable ARM64 de dispositivo sin comando de firma/provision profile, Hermes y origen correcto, compilación real de picker/cámara/visor privado, permiso español sólo de cámara, identificador original e iOS mínimo 16.4. Catálogo generado conserva exactamente los píxeles del icono y metadatos AppIcon compilados coinciden con la entrega familiar anterior. Esto verifica empaquetado y compilación, no reemplaza aceptación física ni confirma el despliegue manual.
