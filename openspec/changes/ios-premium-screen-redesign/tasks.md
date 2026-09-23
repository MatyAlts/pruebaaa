## 1. Sistema visual y Inicio

- [x] 1.1 Registrar baseline de pruebas relevantes; implementar con RED/GREEN/triangulación tokens, fuente del sistema, gradiente, superficies y decoración compartida, verificando estados/accessibilidad y fallback con pruebas ejecutadas.
- [x] 1.2 Implementar Inicio con avatar real, carga existente, resumen adaptable, recientes compartidos y Ver todos; verificar consultas, conteos no derivados de filas/personas, destinos, vacío/error y texto ampliado mediante pruebas focalizadas.

## 2. Pantallas de negocio y navegación

- [x] 2.1 Rediseñar Estudios y selección compacta de alcance/paciente, búsqueda con limpieza y filtros secundarios; verificar coherencia consultas/etiquetas/resultados, detalle, paginación, preservación de paciente y acceso a carga con RED/GREEN/triangulación.
- [x] 2.2 Rediseñar Familia con acción de alta, tarjeta informativa y carpetas reales; verificar conteo, apertura, alta/edición/confirmaciones conservadas y estados de consulta con pruebas existentes y nuevas.
- [x] 2.3 Rediseñar Cuenta con identidad actual, avatar, tarjeta de sesión y logout real; verificar proveedor ausente no inventado, ausencia de edición ficticia, progreso/error y limpieza mediante pruebas focalizadas.
- [x] 2.4 Ajustar únicamente opciones compatibles de NativeTabs y preferencias de accesibilidad; verificar pestañas por capacidades, SF Symbols, insets sin duplicación y reducir transparencia/movimiento con pruebas y revisión de API instalada.

## 3. Verificación y entrega

- [x] 3.1 Ejecutar tipado, lint móvil y suite relevante/completa disponible, corregir regresiones introducidas y documentar resultados y evidencia TDD por tarea sin afirmar ejecución visual; validar change mediante OpenSpec estricto.
- [x] 3.2 Entregar guía concreta de prueba, archivos/dependencias/diferencias inevitables y límites del entorno; verificar presencia de checklist de cuatro pantallas, carga, familia, búsqueda/filtros, logout, textos largos y último ítem visible.
- [ ] 3.3 Comparar nuevamente las cuatro pantallas y flujos auxiliares en iPhone o simulador iOS con referencias y comprobar gradiente completo, jerarquía de encabezados, modales seguros, VoiceOver, texto ampliado, preferencias y operaciones TEST; las seis capturas físicas del usuario detectaron fallos y no constituyen aceptación pasada.

## 4. Correcciones de la prueba física

- [x] 4.1 Corregir geometría y cobertura del gradiente compartido con fallback azul e identificadores por instancia, y mantener scroll/lista como primer descendiente nativo antes de decoración en las cuatro pestañas; verificar con baseline, RED/GREEN/triangulación de medidas y múltiples botones, orden nativo/capas e insets automáticos, dejando renderer físico a 3.3.
- [x] 4.2 Presentar encabezado de Estudios antes de acción de carga y ofrecer acceso discreto; verificar orden, apertura real y selección/búsqueda/filtros conservados mediante pruebas focalizadas.
- [x] 4.3 Rediseñar UploadScreen con encabezado compacto, selección y campos/acciones premium, teclado y un solo responsable de safe area en rutas independientes/anidadas; verificar contratos y los estados existentes de permisos, bloqueo, cancelación/reconciliación y envíos mediante RED/GREEN y regresión.
- [x] 4.4 Rediseñar formularios de alta/edición y carpeta familiar con toolbar y acciones secundarias compactas; verificar operaciones/confirmación destructiva, foco/teclado y áreas seguras sin perder rutas mediante pruebas focalizadas.
- [x] 4.5 Ejecutar suite/tipado/lint/export relevantes después de correcciones, registrar evidencia TDD y actualizar guía con fallo físico previo y límites reales; verificar change estricto sin marcar aceptación física antes de nueva prueba.

## 6. Detalle, calendario y navegación tras nueva devolución física

- [x] 6.1 Registrar baseline y RED/GREEN de Provider raízmodal/SafeAreaView único, carga anidada y candado con aspecto estable; triangular alta/edición/texto ampliado sin padding duplicado.
- [x] 6.2 RED/GREEN detalle y filtros premium preservando estado/consultas/adjuntos reales, carga/error/retry, VoiceOver y fuente sistema.
- [x] 6.3 Verificar @expo/ui instalado57.0.19 y promover misma versión sin actualización; RED/GREEN calendario nativo DD-MM-YYYY, confirmación/cancelación y día sin desplazamiento timezone.
- [x] 6.4 RED/GREEN gestos horizontales entre NativeTabs con exclusión real de controles y prioridad vertical/modal/borde; triangular pestañas disponibles y estado conservado.
- [x] 6.5 RED/GREEN detalle, carga y carpeta/alta/edición familiar en stack nativo existente con gesto real de retorno, guardia de operación/borrador y confirmación ligada a identidad y revisión, identidad/sesión y listas/filtros/paciente preservados; sin datos clínicos en params/logs.
- [x] 6.6 Ejecutar regresión/tipado/lint/export/build pertinentes y actualizar evidencia/guía sin afirmar fidelidad física; dejar 3.3 pendiente hasta probar nuevo IPA/calendario/gestos/modales.
