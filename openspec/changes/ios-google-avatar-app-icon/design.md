## Context

`lib/auth.ts` guarda `profile.picture` en `users.image`; `src/mobile-server/mysql-auth-store.ts` devuelve `Identity.image`, y `mobile/src/session.ts` ya admite `User.image`. Cuenta actualmente renderiza solamente la inicial. No falta un endpoint ni un permiso Google. La inspección no utilizó URLs ni datos de cuentas reales.

`app/favicon.ico` contiene un único frame RGBA de 238×229: carpeta azul, círculo verde y corazón azul. `public/images/Logo_Saluteca_AzulNew.png` y su ICO tienen el mismo tamaño; el recurso de 1528×327 corresponde al wordmark, no demuestra un símbolo vectorial disponible. Expo apunta a `mobile/assets/icon.png`; la identidad de bundle y el pipeline IPA existente se conservan. No hay registro de skills de proyecto en `.agents/SKILLS.md` ni `.atl/skill-registry.md`.

## Goals / Non-Goals

**Goals:** aprovechar la foto ya entregada y sustituir el icono scaffold con fidelidad a la identidad existente, manteniendo el perfil disponible sin red.

**Non-Goals:** editar la identidad Google, incorporar selección de avatar propio, cambiar OAuth/PKCE, persistir fotos médicas, diseñar una marca nueva, añadir proxy de imágenes o cambiar firma/distribución.

## Decisions

1. **Avatar nativo con respaldo estable.** Componente con tamaño fijo, recorte redondeado y estado asociado a `user.id` más URL. Restablecer error/carga cuando cambie esa clave; callbacks de una carga anterior no afectan la nueva. Reutilizar respaldo actual y tratar el avatar como decorativo al existir nombre accesible al lado. Se descarta bloquear Cuenta por un error de imagen.
2. **Origen Google acotado, sin secreto.** Usar `User.image` sin reconstruir ni modificar la URL. Propuesta inicial: HTTPS, longitud máxima 2048, sin userinfo, puertos no estándar ni fragmento; host `googleusercontent.com` o subdominio validado por límite de etiqueta `.googleusercontent.com`. Esta lista es una decisión propuesta, no un host observado en datos personales. Si una instalación real entrega otro origen, mantener respaldo y revisar explícitamente el permiso antes de ampliarlo. El componente de imagen no recibe cabeceras de sesión. Se descarta proxy servidor por introducir superficie SSRF y transporte autenticado por mezclar credenciales API con un tercero.
3. **Símbolo original, conversión determinista.** Convertir el frame original del favicon de 238×229 a PNG RGB 1024×1024 sobre blanco, mediante resampling de calidad, proporción intacta y margen proporcional. El archivo final cumple las dimensiones de packaging, pero el escalado no recupera detalle ausente de la fuente pequeña. Mantener el original como referencia y el comando reproducible junto al recurso final. No dibujar una marca nueva ni usar generación IA. Revisar contornos y legibilidad a tamaño real de icono instalado; una fuente de mayor resolución o vectorización fiel es opcional sólo si la revisión demuestra calidad insuficiente, sin convertirla en requisito previo de esta solicitud ni rediseñar el símbolo.
4. **Packaging real.** Expo genera el catálogo iOS desde el PNG; inspeccionar Info.plist y el catálogo compilado con herramientas de macOS, y comparar un icono renderizado o extraído cuando el formato permita hacerlo. Fuente y configuración no sustituyen la verificación del IPA ni la instalación física. No se amplía el contrato del verificador genérico con una regla de branding que rompería fixtures históricos.

## Risks / Trade-offs

- [URL Google vencida o red ausente] → respaldo visible; una nueva sesión ya actualiza la foto por el flujo existente, sin forzar logout desde la UI.
- [URL fuera de la lista] → respaldo y revisión explícita del host; no guardar URL privada en evidencia.
- [Caché de icono iOS] → instalar build nuevo y registrar comprobación física por separado; no cambiar bundle para invalidar caché.
- [Única referencia pequeña] → conversión fiel con resampling de calidad y revisión visual a tamaño real; reconocer el límite raster y buscar fuente de mayor resolución sólo si resulta necesario. El wordmark no reemplaza la carpeta.
- [Usuario reconoce avatar como información personal] → no registrar imágenes o URLs en Git, no afirmar limpieza de caché persistente que la biblioteca nativa no garantice.

## Migration Plan

Aplicar solamente en mobile y recursos de marca; ejecutar suites focalizadas, checks de Expo y build macOS; publicar un IPA candidato. No necesita deploy backend. Rollback revierte componente/icono al commit anterior, sin cambios de datos ni sesiones. Registrar aceptación física de avatar y símbolo sin capturas con datos personales en el repositorio.
