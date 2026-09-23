# Evidencia backend: eliminación y asistencia IA

## Aprobación y baseline

Usuario aprobó ambos diseños TEST: dueño/Bearer/revocación/outbox, OCR local/texto-only/consentimiento/cuota común/reservas/requestId y migraciones manuales. No se ejecutó SQL en VPS ni llamadas pagadas; proveedor interceptado o inyectado en tests.

Baseline local previo: **121 tests**, **84 PASS**, **37 SKIP**, **0 FAIL**. Docker CLI existe pero Docker Desktop/daemon no están instalados/disponibles; esos skips son integración pendiente, no pruebas aprobadas. CI MySQL inicial `35367588068` ejecutó el escenario SQL real de la primera versión y pasó sin skips. La fuente final y triangulación ampliada requieren un nuevo CI; el orquestador agrega esa evidencia de entrega.

## Ciclos ejecutados y límites

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| DELETE validación | `delete-analysis.test.ts` | Unit | 84/121, 37 skips declarados | Módulo inexistente ejecutado | PASS | Confirmación/UUID/paths cliente | Printer TS y rerun PASS |
| DELETE transacción | `delete-analysis.test.ts`, `management.integration.test.ts` | SQL/FS | Baseline anterior | **Incompleto: transacción escrita junto al validator antes del test de su comportamiento** | Unit PASS, SQL inicial CI PASS | Dueño/revocado/links/todos adjuntos/rollback/retry/conflicto | PASS local; SQL final pendiente CI |
| HTTP móvil | `delete-analysis.test.ts` | HTTP | Tests previos sin fallas | DELETE devolvía 405, ejecutado | PASS | Identidad canónica/readiness/análisis | PASS |
| Reserva/IA | `delete-analysis.test.ts`, `management.integration.test.ts` | Unit/SQL | Baseline anterior | `submit` inexistente, ejecutado | PASS; SQL inicial CI PASS | Duplicado/cuota/error JSON/reserva incierta/concurrencia | PASS local; SQL final pendiente CI |
| Cuota web común | `ai-action.test.ts` | Adapter | 10/10 previos | Engine compartido no llamado, ejecutado | 11/11 PASS | Sin sesión/clave/texto/cuota; DTO/proveedor/errores | PASS |
| Cuota crossday/config | `delete-analysis.test.ts` | Unit | Verde previo | Helper ausente y límite unsafe consultaba SQL, ejecutados | PASS | NULL/día anterior/día posterior/entero unsafe | PASS |
| Cleanup legado | `delete-analysis.test.ts`, `management.integration.test.ts` | FS/SQL | Verde previo | Helper ausente, ejecutado | PASS | Basename propio/no symlink/no escape/no dueño ajeno/sharedrefs/worker real | PASS local; SQL final pendiente CI |
| Preflight | `management-schema.test.ts` | Schema | Baseline sin fallas | Reviewer ejecutó RED específico | 11/11 PASS | PK/FK/defaults/índices/fullkeys/partial/cuota | PASS |

La falta del RED comportamental inicial de la transacción DELETE es una desviación real de TDD estricto. Los tests posteriores y CI de integración aportan verificación de comportamiento; **no sustituyen ni reconstruyen retrospectivamente ese paso**.

Verificaciones locales: dominio **13/13**, esquema **11/11**, adapter web **11/11**; TypeScript y build Next reales pasaron. El caso adicional ejecutó RED/GREEN para que un preflight opcional incompatible o no disponible oculte sólo esa capability; no debe bloquear lectura/carga manual. El CLI sigue rechazando esquemas incompatibles. Tests finales completos/imagen Docker y aceptación iPhone se registran por separado: compilar o mockear proveedor no prueba OCR/gestos/calendario ni eliminación física en la VPS.

## Correcci?n de integraci?n real

El run `35368958008` sobre `1e854f8` ejecut? 147 tests reales: 141 PASS, 6 FAIL, 0 SKIP. Cinco fallas fueron configuraci?n nueva del service MySQL (faltaba crear `misaluteca_mobile_test`); la sexta fue preflight nuevo que rechazaba el `NO ACTION` de las FK existentes del bootstrap. Se configur? la base dedicada y se acept? ?nicamente `RESTRICT` o `NO ACTION`, equivalentes restrictivos inmediatos en InnoDB, conservando validaciones de propietario, PK, ?ndices y rechazo de cascadas indebidas. El reviewer ejecut? RED espec?fico y GREEN 12/12 del esquema. El run posterior `35369475168`, fuente `5eac4c7`, aprob? el paso de la suite completa MySQL; imagen y smoke se registran al terminar.

Tambi?n hubo una desviaci?n inicial de cronolog?a TDD en limpieza: se implement? la limpieza positiva reutilizando el worker previo tras un RED de esquema ausente, antes de ejecutar el test comportamental de todos los adjuntos. La triangulaci?n SQL/FS posterior verifica comportamiento, pero no corrige ese orden hist?rico. Por ello las tareas de ciclo estricto DELETE 1.2 y 1.3 siguen pendientes, aunque su implementaci?n y verificaci?n de comportamiento est?n entregadas.

## Entrega verificada

Run final [35370137665](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35370137665), fuente `fedd0dd`: **148 tests / 148 PASS / 0 FAIL / 0 SKIP** con MySQL 8 real desechable. La imagen Docker de producci?n compil? sin credenciales de IA; el supervisor real arranc? y atendi? HTTP **401** can?nico sin Bearer en `/api/mobile/v1/me`, puerto **3000** (16:47:02 UTC). El smoke previo fall? porque omit?a las variables del MySQL de prueba que el preflight existente requiere; se corrigi? solamente ese fixture de CI con red Linux host y credenciales ficticias del service. No se cambi? el puerto ni la l?gica de negocio para obtener el resultado.

Suite de esquema final **12/12**, dominio **13/13**, adapter web **11/11**. Las tareas comportamentales est?n verificadas por tests SQL/FS/HTTP, pero DELETE 1.2/1.3 permanecen sin marcar por la desviaci?n inicial de cronolog?a estricta descrita arriba. Prueba f?sica iPhone y limpieza f?sica en VPS pendientes. Este run scope backend omiti? intencionalmente el job nativo; la evidencia macOS/OCR se entrega separadamente por el orquestador.
