# Corrección puntual de rutas de carga web

Fecha: 18-09-2026. Después del nuevo reporte `EACCES mkdir /app/app`, se corrigió exclusivamente el adaptador de filesystem. No se ejecutaron SQL, deploy, cambios de permisos ni llamadas IA en la VPS.

El uploader activo y `StudyService` concatenaban cwd con un directorio absoluto mediante `join`: `/app` más `/app/uploads` resultaba en `/app/app/uploads`, fuera del volumen configurado. El helper común `uploadRoot` usa `resolve(DIRECTORY_UPLOADS || './uploads')`; guardar y eliminar utilizan la misma raíz resuelta. Los nombres y claves relativas `ID_USUARIO/archivo.pdf` permanecen iguales. No cambian sesión, autorización, SQL, cuotas, campos ni variables.

## Safety net y pruebas

Safety net ejecutado antes de cambiar producción: reader/PDF **9/9 PASS**, con tres escenarios SQL omitidos por no activar MySQL en esa corrida focal. No se presenta como suite SQL completa. No existían pruebas focales previas de estas rutas de almacenamiento.

El test transpila y ejecuta el POST real de `app/api/upload-study/route.ts` y los métodos públicos de `StudyService`, usando fixtures de sesión/SQL/validación y archivos PDF ficticios con filesystem real. Verifica respuesta, estudio y propietario, clave guardada, nombre original, bytes escritos y ausencia después de eliminar. Los directorios temporales quedan confinados a tmp y se limpian tras cada caso.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| POST web | `tests/mobile-backend/web-upload-root.test.ts` | Route/filesystem | 9/9; 3 SQL omitidos | 500 por mkdir con cwd duplicado, ejecutado | PDF real en raíz absoluta, ejecutado | Raíz relativa y default sin variable | PASS; rerun 7/7 |
| Guardado service | `tests/mobile-backend/web-upload-root.test.ts` | Service/filesystem | 9/9; 3 SQL omitidos | success=false por destino absoluto duplicado, ejecutado | Bytes y clave de propietario correctos, ejecutado | Raíz relativa | PASS; rerun 7/7 |
| Eliminación service | `tests/mobile-backend/web-upload-root.test.ts` | Service/filesystem | 9/9; 3 SQL omitidos | Archivo retenido tras delete por unlink en destino duplicado, ejecutado | Archivo real ausente en raíz configurada, ejecutado | Raíz relativa | PASS; rerun 7/7 |

Cada RED fue ejecutado antes de corregir su punto de producción y su GREEN se confirmó antes del incremento siguiente. Las seis combinaciones absoluto/relativo pasan; un séptimo caso verifica el fallback `./uploads`. Revisión independiente: PASS, sin cambios de identidad, esquema, cuotas o dependencias.

TypeScript final PASS. ESLint del helper y test nuevo PASS con `--max-warnings 0`; los dos archivos existentes no tienen errores y conservan un warning previo de variable `e` no usada en el uploader. Se corrigió únicamente el nombre de una variable del nuevo arnés para cumplir una regla Next de lint; el refactor volvió a ejecutar 7/7 PASS. `git diff --check` PASS.

La carga manual en el servicio desplegado queda pendiente después de redeploy del responsable. Este ajuste no aplica la reparación de esquema/cuotas antes pospuesta y no afirma que el bootstrap habilite toda la web. La lectura iOS y el worker ya resuelven la raíz privada desde el mismo directorio configurado; no necesitan otra variable ni nuevo IPA.

## Verificación integrada y CI

La ejecución independiente local con MySQL 8.4 dedicado y Next HTTP pasó **80/80, cero fallos u omitidos**, incluyendo los siete casos reales de filesystem. [Backend CI 35307568778](https://github.com/MatyAlts/MiSaluteca-ios/actions/runs/35307568778) terminó **SUCCESS** sobre `453eceff455e77f5ea71ed03ba45d350ca64fbed`: logs reales confirman **80/80** y **5/5** pruebas contra la imagen final de Docker, incluido `PORT=80` conservando el listener 3000. Build, aislamiento sin mobile/Expo/React Native y respuesta idéntica de `/maintenance.html`: PASS. Imagen CI `sha256:a7f1d32379dc4986ba722eb4eabc0ed8912efb9b5b1f10a239809848eaa439b9`.

El hook no estaba configurado y el workflow registró deployment omitido. Estas verificaciones no sustituyen la carga manual posterior al redeploy del usuario ni ejecutaron SQL en su VPS.
