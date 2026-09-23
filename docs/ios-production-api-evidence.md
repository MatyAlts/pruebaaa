# Lectura móvil y puente de conexión: evidencia

Fecha local: 17/09/2026. Change `ios-home-study-reading`, tareas backend 1.1–1.3.

## Contrato revisado antes de consultas

El coordinador revisó antes de edits el contrato `GET /api/mobile/v1/studies/summary`: `scope:self`, `propiosTotal` desde COUNT SQL de todo el historial propio, `familiaresTotal:null`, `total:null`, cinco `recientes` máximo y `filterOptions:{medicos,institutions,years}`, cada conjunto limitado a 100 opciones. No se inventan cifras familiares. Todas las consultas filtran usuario autenticado e `id_familiar IS NULL`.

`GET studies` conserva `{items,nextCursor}`, default límite20/máximo50 y cursor numérico/idDESC sin sort. Filtros SQL: `q` título OR descripción, máximo200 caracteres crudos; médico/institución exactos máximo400; mes1–12; año1000–9999; `scope=self`. Búsqueda literal con parámetros, sin comodines interpolados ni filtrado de una página local.

`sort=study-date-desc` usa cursor JSON base64url≤512 con versión1, fingerprint SHA256 usuario/filtros, fecha civil normalizada e ID. Cursor incompatible con cuenta/filtros o inválido devuelve400. Fechas DD-MM-YYYY se validan civilmente con mes/último día válido incluyendo bisiestos; orden fechaDESC/idDESC e inválidas al final. Campo original intacto, sin desplazamiento UTC. Capabilities nuevas `studiesSummary/studiesSearch` se exponen con dependencias implementadas; sin familia/escritura/sharing. No-store y errores SQL genéricos conservados.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 baseline | studies/http/mysql.integration | Unidad + MySQL/Next HTTP | 12/12 y1/1 real | No aplica | Confirmado antes de producción | Reader/auth/PDF legacy | No aplica |
| 1.2 summary | reading-production.test.ts | MySQL real | Baseline | Módulo nuevo ausente | 1/1 | 22 propios fuera primera página, usuario18=1, usuario99=0, familiar excluido | Formato/rerun |
| 1.2 filtros | reading-production.test.ts | MySQL real | Summary verde | ID22 en lugar de1 | 2/2 | Título/description, cuatro filtros, otra cuenta, mes inválido | SQL helper/rerun |
| 1.3 cursor/date | reading-production.test.ts | MySQL real | 2/2 | IDs6..1 contrario a orden fecha | 3/3 | Iguales, bisiesto, 31febrero inválido, inválidos, fingerprint usuario/filtro, cursor vacío/malformado, qcrudo>200, sort inválido | Formato/rerun3/3 |
| Rutas/capabilities | http.test.ts/mysql.integration.test.ts | HTTP puro + Next/MySQL | 12/12 y baseline real | Summary500; luego capability ausente | 13/13;7/7 | Bearer, fallo summary sin cero, Next summary/filtros/cursor/400 | Formato/rerun |
| Consentimiento visual | authorize-presentation.test.ts | RenderHTML | Baseline auth/HTTP | Helper ausente | 1/1 | Segundo caso cuenta/request/CSRF/nonce hostiles escapados | Formato/rerun2/2 |

RED ejecutado antes de cada comportamiento, GREEN antes del siguiente. Triangulación después de GREEN. El caso defensivo agrupa entradas malformadas y produjo RED por cursor vacío; validación cursor/tamaño crudo generalizada y GREEN de todas las entradas. No se atribuye RED aislado a cada entrada.

## Verificación

- `RUN_MOBILE_MYSQL_TESTS=1 npm run test:mobile-backend`: **62/62 pass, 0 fail, 0 skip**, MySQL8.4.11 loopback/tmpfs dedicado y Next real puerto33317. Sin datos reales/VPS.
- Tras formato y casos defensivos: focal SQL/HTTP/reader/presentación **18/18,0skip**; HTTP tras error summary **7/7**.
- `next typegen`, `tsc --noEmit` secuencial: pass. TSC simultáneo con servidor dev inicialmente vio tipos temporales ausentes; rerun después de servidor completado pasó, sin borrar fuentes.
- ESLint focal de diez archivos modificados: pass. Ninguna exclusión nueva.
- DB primer handshake falló durante reinicio del servidor temporal de inicialización; logs confirmaron preparación transitoria. Baseline real pasó tras readiness antes de producción.

## Puente Google presentado como producción

GET `app/mobile/authorize/route.ts` conserva sesión, bindBrowser, formularioPOST/requestId/CSRF, callback y cambio de cuenta. Card responsive, marca, controles48px, enlaces legales y escaping dinámico. CSS local con nonce aleatorio por respuesta y CSP default-src none; sin scripts/red de fuentes/unsafe-inline. POST, tokens, cookies, state, PKCE y consentimiento permanecen intactos. Esta presentación del backend se añadió por las capturas y autorización del coordinador; no es rediseño auth. No hay clave secreta móvil.

## Confirmación CI publicada

El [run backend 35300376140](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35300376140), commit `ab440fd75210bc4bffd6fc3a59ddde54179771d7`, finalizó **success** el 18/09/2026 a las 02:45:10 UTC. Logs: **62 tests, 62 pass, 0 fail, 0 skipped** con MySQL dedicado y HTTP real; instalación web aislada, build Docker sin credenciales con exportación completa, imagen sin `mobile/`, Expo ni React Native y arranque de la imagen final sirviendo exactamente `public/maintenance.html` pasaron. Hook no configurado: deployment omitido; no hubo deploy en VPS.

## Pendiente

No deploy EasyPanel/migración producción. Backend actualizado debe desplegarse para capabilities nuevas. No inferir aceptación visual del HTML/UI nativa desde tests puros. IPA/macOS y prueba física son seguimiento del coordinador; tarea2.1 permanece pendiente. Familia/escrituras/sharing/OCR fuera de esta lectura.
