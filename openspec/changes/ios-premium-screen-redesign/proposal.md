## Why

Las cuatro pantallas de negocio ya funcionan, pero su composición necesita el lenguaje visual de las referencias proporcionadas: jerarquía clara, fondos fríos, tarjetas amplias y acciones nativas reconocibles. El usuario solicita implementar el rediseño completo conservando datos, permisos y operaciones reales.

## What Changes

- Centralizar paleta, tipografía del sistema, espaciado y superficies compartidas, con decoración superior tenue y estados accesibles.
- Rediseñar Inicio, Estudios, Familia y Cuenta, manteniendo carga de estudios, carpetas familiares, detalles, búsqueda, filtros y cierre de sesión.
- Presentar conteos reales, avatar de sesión y selección de paciente coherente mediante controles secundarios compactos.
- Conservar NativeTabs, sus gestos e insets automáticos; configurar únicamente opciones compatibles con la versión instalada.
- Adaptar tarjetas y textos a pantallas pequeñas y texto ampliado; documentar comprobaciones ejecutadas y aceptación visual pendiente.
- Corregir los problemas revelados por las seis capturas físicas posteriores: relleno de gradiente incompleto, acciones antes del título, formularios de carga/alta/edición con presentación anterior y controles excesivos en la carpeta familiar. Extender el lenguaje premium a esos flujos existentes sin alterar su funcionamiento.

## Capabilities

### New Capabilities

- `ios-premium-screens`: presentación funcional y accesible de las cuatro pantallas de negocio conforme a las referencias.

### Modified Capabilities

Ninguna. Las especificaciones principales actuales describen la apertura inicial y empaquetado; las capacidades de negocio existentes permanecen en changes anteriores no archivados. No se alteran sus contratos. La pantalla inicial de prueba de `ios-app-shell` es histórica y este cambio no reintroduce ese estado en las rutas autenticadas.

## Impact

Nueva devolución física de cinco pantallas: extender la misma dirección premium al detalle/filtros, corregir proveedor nativo de safe areas en modales familiares e icono de candado, ofrecer calendario nativo para la fecha y gestos horizontales de pestañas/retorno real. No incluye endpoints de eliminación ni IA, cuyos diseños separados continúan pendientes de aprobación.

Cliente `mobile/`: tema, componentes clínicos, avatar, rutas de pestañas y pantallas de negocio; pruebas Jest existentes y nuevas. Sin migración de framework, cambios de autenticación, SQL, backend ni actualización masiva de dependencias. Expo Router NativeTabs existente se conserva. Las referencias se interpretan como composición de componentes reales, excluyendo marco del teléfono y controles del sistema. La implementación está explícitamente autorizada por el pedido del usuario; la validación visual física queda separada de compilación y pruebas automatizadas.
