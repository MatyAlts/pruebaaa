## Purpose

La web comparte enlaces temporales y permite revocarlos; iOS no dispone de endpoints para esas acciones. La paridad requiere conservar autorización y expiración, no enviar documentos sin control.

## ADDED Requirements

### Requirement: Compartir enlace autorizado

El sistema SHALL generar/mostrar/compartir solo enlaces a estudios de la cuenta canónica con destinatario/vínculo válido y sin tokens de sesión en la URL.

#### Scenario: Compartir propio
- **WHEN** se genera enlace de estudio propio/familiar propio y se elige copiar o share sheet
- **THEN** se entrega URL HTTPS funcional compatible lector web y no se envía archivo binario por esa acción.

#### Scenario: Estudio ajeno o cancelar
- **WHEN** se pide estudio ajeno o se cancela share sheet
- **THEN** se rechaza404 sin enlace para el ajeno; cancelar no informa envío completado.

### Requirement: Expiración y revocación compatibles

El sistema SHALL mantener24 h desde primera apertura y bloquear lectura/descarga de links expirados/revocados con gestión accesible solo por su dueño.

#### Scenario: Primera apertura concurrente
- **WHEN** un enlace se abre por primera vez concurrentemente
- **THEN** se registra un único inicio y se muestra estado temporal consistente con24 h, sin reiniciar TTL por accesos posteriores.

#### Scenario: Revocar o vencer
- **WHEN** el dueño revoca un link o vencen24 h
- **THEN** lector web y archivos rechazan el acceso, otros usuarios no pueden administrar ese enlace y UI informa estado real.
