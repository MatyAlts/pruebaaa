## Purpose

El acceso iOS actual es un botón genérico dentro de una pantalla de prueba. El usuario pide la misma identidad y composición del acceso Google web con una pantalla iOS propia.

## ADDED Requirements

### Requirement: Login con marca web

El puente web de autorización existente SHALL usar identidad visual Mi Saluteca y un layout responsive legible sin modificar validaciones, formularios ni protocolo de autenticación.

La pantalla SHALL mantener identidad actual Mi Saluteca y acceso Google del modal web, con enlaces legales reales y sin texto de prueba.

#### Scenario: Primer ingreso
- **WHEN** se abre la app sin sesión
- **THEN** se muestra logo, CTA Google y términos/privacidad accesibles, sin formularios de contraseña ni tabs privadas.

#### Scenario: Legales
- **WHEN** se pulsa Términos o Política de Privacidad
- **THEN** se abre la página HTTPS correspondiente sin credenciales en URL.

### Requirement: Transiciones de sesión comprensibles

La pantalla SHALL reutilizar el flujo Google externo existente y distinguir restauración, éxito, cancelación, falta de red y error sin crear sesión parcial.

#### Scenario: Éxito
- **WHEN** Google/PKCE existente devuelve identidad válida
- **THEN** se navega al destino funcional disponible y el CTA no permite intercambios duplicados.

#### Scenario: Cancelar o fallar
- **WHEN** se cancela Google o el servidor/red falla
- **THEN** se mantiene pantalla local legible, se informa condición apropiada y se ofrece reintento sin contenido privado.
