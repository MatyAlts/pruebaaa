## Purpose

La cuenta móvil solo identifica al usuario y permite logout. La web muestra perfil Google, privacidad, enlaces y eliminación permanente: se necesitan ajustes iOS equivalentes con borrado real seguro.

## ADDED Requirements

### Requirement: Cuenta personal equivalente

La app SHALL mostrar perfil Google readonly y secciones legales/privacidad/enlaces/acerca de con acciones existentes reales y logout seguro.

#### Scenario: Perfil y enlaces
- **WHEN** se abre Cuenta con sesión canónica y enlacescapability
- **THEN** nombre/email y links reales se muestran sin edición de datos Google y se puede cerrar sesión.

#### Scenario: Red fallida o logout
- **WHEN** falla carga de links o se cierra sesión con requests pendientes
- **THEN** se muestra error/reintento sin enlaces inventados y ningún resultado tardío reexpone perfil/datos.

### Requirement: Eliminar cuenta explícitamente

El sistema SHALL requerir identidad recientemente autenticada y confirmación misaluteca para eliminar solo cuenta propia/datos/enlaces, revocar sesiones e informar estado real sin prometer eliminación de copias externas.

#### Scenario: Confirmación válida
- **WHEN** la cuenta se reautentica dentro ventana aprobada y confirma eliminación
- **THEN** tras commit no se autorizan tokens anteriores ni enlaces/archivos de esa cuenta, UI borra privado y muestra resultado, cleanup controlado continúa si pendiente.

#### Scenario: Cancelar, identidad ajena o resultado ambiguo
- **WHEN** se cancela, cambia cuenta durante reauth o no se conoce resultado por red
- **THEN** no se elimina otra cuenta ni se anuncia éxito sin confirmación; UI limpia privado ante ambigüedad y explica cómo verificar/reingresar.
