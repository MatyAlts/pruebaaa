# Migración IA a OpenRouter

Solicitud explícita del usuario: sustituir proveedor conservando modelo y completar todas las variables EasyPanel/Actions. Se migraron servicio features y Server Action utilizada por UploadStudyModal, con SDK OpenAI existente, base URL fija `https://openrouter.ai/api/v1`, clave exclusivamente `OPENROUTER_API_KEY` y modelo `openai/gpt-4o-mini`.

Se preservaron prompts, temperatura 0.3, response_format JSON, mapeo de campos y controles de sesión/cuota/contador de la acción. Constructor lazy después de guards; errores crudos no se devuelven ni registran. No hubo llamadas IA pagas, acceso VPS, migraciones productivas ni configuración de secretos reales. Los tests capturan fetch del SDK real: verifican URL, Authorization y payload, sin conexión externa. La acción se transpila en memoria y sustituye únicamente los límites externos sesión/SQL/fecha; no demuestra un login Google real.

## TDD Cycle Evidence

| Task / comportamiento | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 baseline previo | ai-import.test.ts / ai-action.test.ts | Subprocess servicio / acción con boundaries | Servicio 2/2; acción 3/3 antes de edits | No aplica: caracterización de código existente | Baseline ejecutado PASS | Sesión ausente, cuota, DTO y contador | Harness nuevo, sin producción |
| 1.2 clave y SDK servicio | ai-import.test.ts / ai-provider.test.ts | SDK real con fetch capturado en subprocess | 2/2 previo | OCR con nueva clave devolvía missing old key; endpoint real capturado api.openai.com | Guard con nueva clave y luego endpoint/model nuevos pasan | Clave anterior no habilita, configuración ausente, otro OCR/DTO parcial | Constructor multiline y tests Prettier; rerun PASS |
| 1.2 errores servicio | ai-provider.test.ts | SDK real / JSON parser | Tests anteriores PASS | Error 400 filtraba contenido en respuesta y log | Mensaje/log genéricos PASS | JSON inválido no filtra; respuesta vacía rechazada (mensaje OpenRouter tuvo RED propio) | catch sin binding; rerun PASS |
| 1.3 SDK acción | ai-action.test.ts | Acción real transpilada / SDK real | 3/3 previo | Sólo nueva clave provoca Missing credentials en constructor eager | Nueva clave/endpoint/model y constructor lazy PASS 4/4 | Guards sesión/cuota/OCR y clave anterior; DTO parcial con contador 1→2 | Tests formateados, sin reformatear legacy |
| 1.3 errores acción | ai-action.test.ts | SDK real / JSON parser | 4/4 antes del nuevo RED | Error 400 filtraba contenido de proveedor | Error genérico sin contador PASS | JSON inválido/vacío sin update; mensaje vacío OpenRouter RED→GREEN | catch sin binding; rerun 10/10 PASS |
| 2.1 inventario env | docs/easypanel-ios-backend.md | Documentación | rg de referencias código/workflows | No aplica: documentación | Tablas App/MySQL/Actions y placeholders entregados | Required/conditional/default/source/secrets/build/runtime diferenciados | Revisión contra referencias reales |
| 2.2 URL pública build | Dockerfile | Build real / chunks cliente | Build anterior PASS | No test unitario YAML/archivo: cambio declarativo validado por build | Docker real PASS sin claves IA | 3 chunks reales contienen origen configurado; aiKeysConfigured=false | Único ARG público; ninguna credencial ARG |

Desviación concreta del ciclo estricto: después de RED del mensaje missing-key, una sustitución con acento mediante PowerShell/Python no modificó el literal y la ejecución siguió fallando; se añadió el RED de sanitización antes de corregir y confirmar GREEN de ese mensaje. Luego se corrigieron ambos y se ejecutó PASS. No se presenta esa secuencia como Three Laws plenamente conforme. No hubo cambio de prompts por codificación; el acento del mensaje nuevo se expresa con escape Unicode válido. Configuración declarativa y documentación no usan tests tautológicos; su aceptación es build real e inspección de artefactos.

## Validación ejecutada

- `node --test tests/mobile-backend/ai-import.test.ts`: baseline inicial 2/2 PASS.
- `node --test tests/mobile-backend/ai-action.test.ts`: baseline inicial 3/3 PASS; después migración 10/10 PASS.
- `node --test --test-concurrency=1 tests/mobile-backend/ai-action.test.ts tests/mobile-backend/ai-provider.test.ts tests/mobile-backend/ai-import.test.ts`: 17/17 PASS.
- `$env:RUN_MOBILE_MYSQL_TESTS='1'; npm.cmd run test:mobile-backend`: **55/55 PASS, cero skips**, MySQL8.4 dedicado real + HTTP Next local; servidor finalizado antes de TypeScript.
- `docker build --build-arg NEXT_PUBLIC_URL_LINK_SHARE=https://saluteca.matyalts.me -t misaluteca-ios-backend:openrouter-test .`: PASS, compile22.3s, TypeScript, 15/15 prerenders y export image; sin claves IA.
- `docker run --rm --entrypoint node ...`: inspección `/app/.next/static/*.js` recursiva: **3 chunks** con origen público y `aiKeysConfigured=false`.
- `node node_modules/next/dist/bin/next typegen` y `node node_modules/typescript/bin/tsc --noEmit`, posteriores al cierre del servidor HTTP: PASS. TypeScript volvió a pasar tras ajustes de tipos del harness.
- ESLint focalizado en ambos callsites y tres archivos de pruebas IA: **0 errores, 0 warnings**. Detectó inicialmente tres errores del harness nuevo (dos any y nombre module), corregidos con tipos explícitos y actionModule; acción 10/10 volvió a pasar. No se corrigieron errores legacy ajenos.
- `git diff --check` y `openspec.cmd validate use-openrouter-ai --strict`: PASS. No se modificaron workflows; actionlint no requirió repetición.

La guía distingue funciones web fuera del bootstrap TEST mínimo, puerto SQL3306 fijo, variables públicas inline y el único secret manual Actions opcional (hook). Historial de evidencias OpenAI anteriores se conserva. No se recompiló IPA: cliente móvil no cambió.

Pendiente externo: usuario configurar clave privada OpenRouter/runtime en su servicio y desplegar EasyPanel. No se ejecutaron esas acciones ni se afirma respuesta real del proveedor.

## CI del commit publicado

[Backend Actions run 35269060893](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35269060893), disparado automáticamente por push de `main`, terminó **SUCCESS** para SHA exacto `e241859e3c6239ea264932d8c0368ed40f4f1873`.

- Logs de pruebas confirman **55 tests, 55 pass, 0 fail, 0 skipped**, con MySQL dedicado y HTTP local del runner.
- Build Docker sin credenciales: SUCCESS, compilación21.3s, TypeScript y prerender15/15, imagen exportada.
- Salida real del paso final: «Hook no configurado: deployment omitido. Primer deploy corresponde al responsable de EasyPanel.» No se invocó VPS ni se configuraron secretos.

No se disparó otro workflow iOS: esta migración afecta proveedor servidor, documentación y build web; el cliente móvil permanece igual.
