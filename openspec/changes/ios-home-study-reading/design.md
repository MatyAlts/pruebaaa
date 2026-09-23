## Context

Fuentes inspeccionadas: app/app/page.tsx; user-dashboard/home/HomeDashboard/HomeDashboard.tsx; HomeKPIs; HomeRecentStudies; user-dashboard/study/StudiesPageClient.tsx; StudyDetailClient.tsx; mobile/src/StudiesScreen.tsx; src/mobile-server/studies.ts/runtime.ts.

La implementación actual y el reporte Google del usuario se distinguen de aceptación visual futura. Ver proposal.md y roadmap. Dependencias: ios-native-foundation, ios-branded-login; backend actual GET propio.

## Goals / Non-Goals

**Goals:** experiencia nativa funcional con identidad web, contratos y estados verificables.

**Non-Goals:** portar Bootstrap/Server Actions a RN, modificar la web, datos simulados, subir mínimo iOS, cambiar protocolos Google o desplegar VPS durante este change sin autorización específica.

## Decisions

GET /api/mobile/v1/studies/summary devuelve propiosTotal y recientes limitados desde SQL owner-filter, no primera página; campos familiares null/no-disponible hasta familia implementada, nunca cero inventado. GET studies añade q(title/description), medico, institution, month, year y sort=study-date-desc explícitos, defaults anteriores limit/idDESC/cursor numérico intactos. Nuevo cursor compuesto validado para modo explícito incluye fecha normalizada e id estable y fingerprint filtros; DD-MM-YYYY legacy se parsea en SQL/adapter con invalid/ausente al final y idDESC tie-break, fecha sin timezone mutation; no SQLinterpolado. q≤200, medico/institution≤400, mes1..12 y año4dígitos válidos; rechazar parámetros/cursor inválidos400. Hasta familia, scope=self y ningún familyMemberId bypass; familia extiende contrato más adelante con review. Total/recientes reales; categorías CSS conservadas sin classifier nuevo ya que no se observó clasificación en StudyRow. Scrolllista virtualizada y filtros sheet accesible; último request define estado, viejos filtros no sobrescriben nuevos. Detalle use dto real no fileKey y PDFKit; imágenes/otros formatos muestran estado explícito hasta change de formatos, sin botón inexistente.

Dirección: archivador médico calmado; tokens actuales web y componentes nativos, lenguaje español y spacing4pt. Consultar las cuatro salidas de interface-design (Domain, Color world, Signature, Defaults) en docs/ios-pantallas-roadmap.md. No convertir todas las tarjetas en glass: documentos sobre papel/superficies sólidas. Adaptar sombras suaves/radios16pt y Inter a Dynamic Type/contraste, conservando semántica de campos.

## Risks / Trade-offs

Nuevos agregados pueden filtrar datos familiares/ajenos → consultas own nonfamily y HTTP/MySQL de dosusuarios. sort puede romper IPA anterior → opt-in distinto del default actual. Fuera de red mostrar unavailable/retry, no empty inventado ni persistencia médica. Backend y frontend del change juntos; publicar flags solo tras contracts operativos.

## Migration Plan

Implementar únicamente tras solicitud apply. Baseline y RED mínimo/GREEN/triangulación antes de cada comportamiento; validaciones declarativas con doctor/types/build, sin tests tautológicos. Publicar UI/contrato de forma compatible, habilitar capabilities después de endpoints/pantallas reales; rollback a IPA/commit previo y backend compat preservada. Mantener pruebas y archivos de otros changes. Registrar build/macOS y aceptación física separadas, sin marcar task manual completada por mocks.
