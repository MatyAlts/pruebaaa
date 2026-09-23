## Why

La lectura propia funciona, pero faltan Inicio, búsqueda y filtros equivalentes a web. Filtrar una página local o contar sus filas daría resultados y cifras incorrectos.

## What Changes

- Inicio con recientes/resumen completos autorizados y lista de Estudios con filtros reales servidor.
- Metadata y adjuntos en detalle native, PDFKit existente, estados vacíos/error/refresh/paginación.
- Nuevos endpoints de agregados y sort/filter opt-in preservando v1 idDESC actual.
- Familia/edición/subida/compartir no se muestran hasta sus changes funcionales.

## Capabilities

### New Capabilities

- `ios-home-study-reading`: Inicio con recientes/resumen completos autorizados y lista de Estudios con filtros reales servidor.

### Modified Capabilities

Ninguna. Las specs principales no cubren esta funcionalidad; no modificar cambios previos abiertos.

## Impact

Fuentes observadas: app/app/page.tsx; user-dashboard/home/HomeDashboard/HomeDashboard.tsx; HomeKPIs; HomeRecentStudies; user-dashboard/study/StudiesPageClient.tsx; StudyDetailClient.tsx; mobile/src/StudiesScreen.tsx; src/mobile-server/studies.ts/runtime.ts.

Dependencias funcionales: ios-native-foundation, ios-branded-login; backend actual GET propio.

Planificación solamente; no código, despliegues ni aceptación manual inferida. Dirección visual y mapa completo en docs/ios-pantallas-roadmap.md.
