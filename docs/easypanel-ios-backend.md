# Backend de prueba iOS en EasyPanel

Destino propuesto: `https://saluteca.matyalts.me`. DNS, TLS, Google y primer despliegue los configura el responsable del VPS; no se han comprobado todavía. Este entorno debe tener una base MySQL y archivos de prueba separados de `misaluteca.com`.

1. Crear proyecto y servicio MySQL 8.4 dedicado, sin puerto público. Crear una base vacía de prueba y usuario limitado a esa base. La conexión interna usa puerto 3306: el pool web actual no lee `DB_PORT`.
2. Para base **nueva, vacía y dedicada TEST**, revisar y ejecutar primero `database/mobile-test-bootstrap.sql`: users/estudios/estudios_archivos, sin datos. Soporta identidad Google y esta vertical de lectura, probado en MySQL8.4; no promete upload/family/OCR ni bootstrap completo web. Reejecutarlo sobre tablas existentes falla intencionalmente. Si se usa estructura preexistente, verificar DDL compatible: users.id INT firmado y columnas Google; no ejecutar scripts antiguos a ciegas ni importar datos productivos.
3. Revisar y aplicar `database/mobile-auth.sql` solamente en la base dedicada. No modifica `users` ni estudios. Confirmar tablas/índices y usuario SQL autorizado. No hay migraciones automáticas en Actions.
4. Crear un único servicio **App** desde repo privado `MatyAlts/MiSaluteca-ios`, branch `main`, contexto raíz, builder Dockerfile y archivo `Dockerfile`. Este contenedor sirve tanto las páginas frontend como las rutas backend `/api/*`; no hace falta un Dockerfile separado. Dar a EasyPanel acceso de lectura GitHub con deploy key/token guardado en el panel. Configurar el puerto HTTP interno del servicio en `3000`. Los puertos `80/443` son del proxy público de EasyPanel, no del contenedor.
5. Configurar **Environment** del servicio App con el inventario siguiente. No commitear valores secretos ni declararlos como Docker ARG. IA no necesita clave para build ni lectura iOS; `OPENROUTER_API_KEY` solo si se habilita la función web IA. Ambos flujos IA usan `openai/gpt-4o-mini` por OpenRouter; `OPENAI_API_KEY` ya no habilita análisis.
6. Crear y montar un volumen persistente exclusivo en `/app/uploads`, accesible al usuario `node` (UID/GID 1000). El Dockerfile declara esta ruta como `VOLUME`, pero EasyPanel debe conservar un volumen nombrado en ese mount: sin el volumen del panel, cada rebuild crea un filesystem nuevo y borra los archivos. Cargar PDFs ficticios y registros del mismo usuario de prueba con rutas relativas. No copiar archivos médicos de producción. Configurar dominio en EasyPanel y DNS hacia VPS; habilitar TLS y comprobar certificado.
7. En Google Cloud configurar cliente OAuth web y redirect autorizado exacto `https://saluteca.matyalts.me/api/auth/callback/google`; añadir usuarios de prueba al consent screen cuando corresponda. La app usa sesión Google en navegador y callback privado `com.matyalts.misaluteca://auth/callback`; no guarda client secret Google en IPA. Confirmar que Impactor conserva identifier/scheme.
8. Ejecutar primer deploy manual. Comprobar `/api/mobile/v1/me` sin Bearer devuelve 401 JSON y `Cache-Control: no-store`. Esto prueba disponibilidad de API, **no** verifica DB ni Google: comprobar también login web y vertical completa con usuario de prueba antes de aceptación.

`MOBILE_TRUST_PROXY_HEADERS` queda `false` por defecto. Solo activar `true` tras verificar que el proxy de EasyPanel sobrescribe X-Forwarded-For e impide acceso directo al backend; no está verificado aquí. Sin proxy confiable la cuota se comparte por identidad de red desconocida (10 intentos/minuto por acción). Configurar limpieza operativa de filas vencidas de intentos/rates y sesiones expiradas respetando la historia refresh de familias activas.

Después del primer deploy, guardar el Deployment Trigger URL **como GitHub Secret** `EASYPANEL_DEPLOY_WEBHOOK`. Es una credencial: no pegarlo en código/logs. Desactivar autodeploy independiente de EasyPanel si Actions controla los checks. El workflow separado `backend-easypanel.yml` prueba y construye antes de invocar el hook; falta de secret omite deployment. EasyPanel descarga la última revisión de `main`, el hook no garantiza despliegue del SHA validado si hay cambios posteriores. La cola evita cancelar un despliegue en curso. IPA workflow solo compila móvil y no despliega API.

Rollback: deshabilitar trigger/backend móvil, revocar familias móviles del entorno de prueba y volver a imagen/commit anterior; conservar volumen y tablas de negocio. No borrar usuarios/estudios ni tokens de sesión web. No se ejecutó ningún deployment ni migración VPS durante esta implementación.

Referencias oficiales: [EasyPanel Dockerfile builder](https://easypanel.io/docs/builders), [App service y Deployment Trigger](https://easypanel.io/docs/services/app).

## Variables del servicio App en EasyPanel

En **App → Environment**, pegar el bloque y reemplazar cada placeholder privadamente antes del deploy. Los valores son exclusivos del entorno TEST. EasyPanel también pasa Environment como build arguments; el Dockerfile declara únicamente el argumento **público** `NEXT_PUBLIC_URL_LINK_SHARE`. Las demás variables secretas son consumidas en runtime y no se declaran como ARG. [Comportamiento oficial del builder](https://easypanel.io/docs/builders).

| Variable | Obligatoria / default real | Dónde y cuándo | Valor y origen |
|---|---|---|---|
| `DB_HOST` | Sí; sin default configurado | App, runtime | Host DNS interno del servicio MySQL indicado por EasyPanel; no URL HTTPS |
| `DB_NAME` | Sí; sin default configurado | App, runtime | Base TEST creada en MySQL, ejemplo `misaluteca_ios_test` |
| `DB_USER` | Sí; sin default configurado | App, runtime | Usuario SQL limitado a esa base; distinto de root |
| `DB_PASSWORD` | Sí; secreto | App, runtime | Contraseña privada del usuario SQL anterior |
| `NEXTAUTH_URL` | Sí para callback HTTPS correcto | App, runtime | `https://saluteca.matyalts.me`; origen público del backend TEST |
| `NEXTAUTH_SECRET` | Sí en producción; secreto | App, runtime | Generar un valor aleatorio propio; mismo valor entre réplicas y redeploys |
| `GOOGLE_CLIENT_ID` | Sí para login Google; código default `""` falla login | App, runtime | Client ID de OAuth **Web application** en Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Sí para login Google; secreto | App, runtime | Client secret del mismo cliente OAuth web |
| `MOBILE_ORIGIN` | Sí para API/puente móvil | App, runtime | `https://saluteca.matyalts.me`, mismo origen HTTPS que NextAuth, sin query/fragment/path |
| `MOBILE_ALLOW_EXPO_GO` | Opcional; default false | App, runtime | `true` solo durante pruebas con Expo Go; acepta callbacks `exp://host/--/auth/callback`. Desactivar en producción y builds nativas |
| `DIRECTORY_UPLOADS` | Opcional, default `./uploads`; fijar en Docker | App, runtime | `/app/uploads`; volumen persistente con UID/GID 1000 |
| `MOBILE_TRUST_PROXY_HEADERS` | Opcional, default false; solo literal `true` activa | App, runtime | `false` hasta validar que proxy sobrescribe XFF y backend no es accesible directamente |
| `OPENROUTER_API_KEY` | Condicional: análisis IA web; secreto; sin fallback | App, runtime únicamente | Crear API key en OpenRouter, con permisos/saldo para `openai/gpt-4o-mini` |
| `LIMIT_UPLOAD` | Condicional: uploader web; default `20` | App, runtime | Límite diario de subidas por usuario según ruta upload; entero positivo, ejemplo `20` |
| `LIMIT_ANALYZE` | Condicional: acción IA web; **sin default** | App, runtime | Cuota diaria en acción legacy; entero positivo, ejemplo `10`. Ausente se parsea NaN y no limita: definir si se habilita esa función |
| `JWT_SECRET` | Condicional: admin legacy; secreto | App, runtime | Aleatorio independiente. Código tiene fallback fijo inseguro: configurar si admin se habilita. No se modificó esa autenticación |
| `NEXT_PUBLIC_URL_LINK_SHARE` | Opcional, default origen del navegador | App, **build público** | `https://saluteca.matyalts.me`; modal genera enlaces desde esa URL. Reconstruir al cambiarla; runtime solo no modifica JS compilado |
| `NODE_ENV` | Automático Docker: `production` | Docker runtime | No configurar manualmente en EasyPanel |
| `PORT` | Automático Docker: `3000` | Docker runtime | Configurar puerto del servicio EasyPanel a 3000; no cambiar variable para este Dockerfile |
| `HOSTNAME` | Automático Docker: `0.0.0.0` | Docker runtime | Escucha interna; no es el dominio público |
| `NEXT_TELEMETRY_DISABLED` | Automático Docker: `1` | Docker build/runtime | Desactiva telemetría Next; no secreto |

`DB_PORT` **no está soportado por los pools actuales**: MySQL debe ser accesible internamente en 3306. No agregarlo pensando que cambia la conexión. Las variables de funciones web condicionales no vuelven compatible el bootstrap SQL mínimo con upload/admin/familia/IA: esas funciones requieren su esquema existente completo y revisión aparte.

```dotenv
DB_HOST=REEMPLAZAR_HOST_INTERNO_MYSQL
DB_NAME=misaluteca_ios_test
DB_USER=REEMPLAZAR_USUARIO_SQL_TEST
DB_PASSWORD=REEMPLAZAR_PASSWORD_SQL_TEST
NEXTAUTH_URL=https://saluteca.matyalts.me
NEXTAUTH_SECRET=REEMPLAZAR_SECRETO_ALEATORIO
GOOGLE_CLIENT_ID=REEMPLAZAR_CLIENT_ID_GOOGLE_WEB
GOOGLE_CLIENT_SECRET=REEMPLAZAR_CLIENT_SECRET_GOOGLE_WEB
MOBILE_ORIGIN=https://saluteca.matyalts.me
MOBILE_ALLOW_EXPO_GO=true
DIRECTORY_UPLOADS=/app/uploads
MOBILE_TRUST_PROXY_HEADERS=false
NEXT_PUBLIC_URL_LINK_SHARE=https://saluteca.matyalts.me
```

Si se habilitan funciones web con esquema compatible, agregar solo las necesarias:

```dotenv
OPENROUTER_API_KEY=REEMPLAZAR_CLAVE_OPENROUTER
LIMIT_ANALYZE=10
LIMIT_UPLOAD=20
JWT_SECRET=REEMPLAZAR_OTRO_SECRETO_ALEATORIO
```

Generar secretos localmente con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`; copiar el resultado directamente al panel. Ejecutar nuevamente para `JWT_SECRET` si corresponde. No pegarlos en conversación, repo, Actions logs ni argumentos de Docker.

Google Cloud: crear OAuth Web application, registrar JavaScript origin `https://saluteca.matyalts.me` y redirect URI exacto `https://saluteca.matyalts.me/api/auth/callback/google`; configurar consent screen y usuarios TEST. El callback del iPhone es el esquema privado existente, no otra URL para registrar en ese cliente web.

OpenRouter: crear clave en [API Keys](https://openrouter.ai/settings/keys), verificar saldo/permisos en la cuenta y guardar exclusivamente en Environment App. Endpoint y modelo están fijados en código, no requieren `OPENROUTER_BASE_URL` ni `OPENROUTER_MODEL`. [SDK compatible oficial](https://openrouter.ai/docs/quickstart), [modelo GPT-4o mini](https://openrouter.ai/openai/gpt-4o-mini). No se ejecutaron llamadas pagas; validación real posterior debe usar texto ficticio. Retirar `OPENAI_API_KEY` de este servicio tras migración si no tiene otros consumidores externos.

## Variables del servicio MySQL

Estas pertenecen al servicio **MySQL**, no al Environment App. Si EasyPanel administra credenciales/base mediante su formulario, usar los campos equivalentes del panel; no duplicarlas en App como `MYSQL_*`.

| Variable del contenedor MySQL | Obligatoria / condición | Valor de ejemplo / origen |
|---|---|---|
| `MYSQL_DATABASE` | Base inicial del entorno nuevo | `misaluteca_ios_test`, coincide con App `DB_NAME` |
| `MYSQL_USER` | Usuario inicial de App si se usa provisión por image env | Nombre dedicado TEST, coincide con `DB_USER`; no root |
| `MYSQL_PASSWORD` | Secreto si se define `MYSQL_USER` | Contraseña privada, coincide con `DB_PASSWORD` |
| `MYSQL_ROOT_PASSWORD` | Secreto de administración al inicializar esta imagen | Aleatorio exclusivo MySQL; **no** usar como contraseña App |

Las variables de inicialización de la imagen no cambian usuarios/contraseñas en un volumen MySQL ya inicializado. Administrar cambios SQL explícitamente con acceso privado. Aplicar bootstrap y migración tras revisar scripts, solo en DB TEST nueva; nunca abrir puerto público 3306 ni copiar datos productivos.

## Variables y secretos de GitHub Actions

Repo → **Settings → Secrets and variables → Actions → New repository secret** para el único secret manual opcional. No hace falta duplicar credenciales SQL, Google, NextAuth, OpenRouter ni Apple en GitHub.

| Nombre | Clase / dónde configurar | Obligatoria / valor |
|---|---|---|
| `EASYPANEL_DEPLOY_WEBHOOK` | Repository **Secret** manual, backend workflow | Opcional hasta primer deploy: URL HTTPS privada Deployment Trigger de EasyPanel; ausente omite deploy |
| `DEPLOY_HOOK` | Env interno del paso backend | Automático desde el secret anterior; no crear otro secret ni repository variable |
| `api_base_url` | Input de **Run workflow → iOS unsigned IPA** | Obligatorio; default público `https://saluteca.matyalts.me`; cambiar si el entorno usa otro dominio |
| `EXPO_PUBLIC_API_BASE_URL` | Env del job iOS | Automático desde input anterior; queda en IPA, exclusivamente URL pública, nunca clave/token |
| `RUN_MOBILE_MYSQL_TESTS` | Env interno backend workflow | Fijo `1`, activa pruebas DB TEST; no configurar manualmente |
| `MYSQL_DATABASE` | Env del servicio MySQL efímero CI | Fijo `misaluteca_mobile_test`, no DB VPS |
| `MYSQL_ROOT_PASSWORD` | Env del servicio MySQL efímero CI | Password fixture `isolated-test-password`, pública y exclusiva DB desechable CI; no reutilizar en VPS |
| `CI` | Env interno job iOS | Fijo `1`, no configurar manualmente |
| `DEVELOPER_DIR` | Env interno job iOS | Xcode fijado `/Applications/Xcode_26.4.1.app/Contents/Developer`, no credencial Apple |
| `GITHUB_TOKEN` | Token efímero automático GitHub | Permisos `contents: read`; checkout/upload usan contexto de Actions, no crear PAT |
| `GITHUB_SHA`, `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, `GITHUB_RUN_ID` | Variables automáticas runner | Manifest y enlaces de ejecución; no configurar |
| `ImageOS`, `ImageVersion` | Variables automáticas imagen macOS | Diagnóstico del runner; no configurar |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MOBILE_ORIGIN`, `DIRECTORY_UPLOADS` | Fixtures internas del test HTTP, no Environment del workflow | El harness sobrescribe conexiones a loopback DB dedicada y credenciales ficticias; no pide secrets de VPS ni Google real |
| `DB_PORT`, `OPENAI_API_KEY` | Fixtures históricas internas del test HTTP | `33316` no es leído por los pools web (usan binding 3306); clave ficticia anterior no habilita IA. No configurarlas en VPS ni como secrets Actions |
| `IOS_BUNDLE_IDENTIFIER` | Override local opcional de app.config | Default `com.matyalts.misaluteca`; workflow actual no expone input ni lo configura. Conservar para callback móvil |

No se necesitan repository Variables manuales con estos workflows. Backend CI construye sin claves IA ni enlaces override: web usa origen del navegador por defecto. EasyPanel recompila con su Environment y ARG público de enlaces. Cambiar backend/OpenRouter no requiere generar otro IPA; cambiar `api_base_url` sí requiere nueva compilación iOS. Mantener Apple ID y firma local exclusivamente en Impactor.

## Primer estudio ficticio

Tras primer login Google autorizado, buscar `users.id` del email de prueba (no aceptar id enviado por app). Crear un PDF válido con texto «Prueba sin datos personales» mediante Imprimir/Guardar PDF localmente; subirlo al volumen como `/app/uploads/pruebas/ejemplo.pdf`. El usuario node debe poder leerlo. No usar el uploader web para demostrar paridad del bootstrap mínimo. Ejecutar SQL **solamente en base TEST** reemplazando email de prueba y tamaño real en bytes:

```sql
INSERT INTO estudios
(uuid,id_usuario,email_usuario,titulo,fecha,medico,institucion,file_key,file_name,mime_type,file_size)
SELECT UUID(),id,email,'Documento ficticio','17-09-2026','Profesional de prueba','Institución de prueba',
'pruebas/ejemplo.pdf','ejemplo.pdf','application/pdf',1234
FROM users WHERE email='REEMPLAZAR_EMAIL_PRUEBA' LIMIT 1;
```

La entrada usa el identificador de archivo `legacy` y debe aparecer solo para esa cuenta. Una segunda cuenta Google debe recibir su lista vacía y 404 al intentar ese detalle/PDF. Eliminar únicamente la fixture cuando termina aceptación. El SQL bootstrap y fixture deben ser revisados por el responsable antes de aplicarlos en VPS.
