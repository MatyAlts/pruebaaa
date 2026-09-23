# ios-unsigned-build Specification

## Purpose

Producir un artefacto iOS verificable para dispositivo físico mediante GitHub Actions y distinguir su compilación de la firma e instalación local.

## Requirements

### Requirement: Compilación manual para dispositivo sin firma
El repositorio SHALL permitir iniciar manualmente una compilación macOS Release para `iphoneos`, sin requerir Apple ID, certificados, perfiles de aprovisionamiento ni credenciales Expo en CI. Una ejecución exitosa SHALL publicar un IPA sin firma, junto con commit y versiones de herramientas utilizadas.

#### Scenario: Ejecución exitosa
- **WHEN** se inicia manualmente el workflow sobre un commit compatible
- **THEN** se publica un IPA para iPhone físico con JavaScript y recursos incluidos y evidencia de la compilación.

#### Scenario: Falla de compilación
- **WHEN** falla la compilación nativa o la comprobación del artefacto
- **THEN** el workflow informa fallo y no publica el IPA como una entrega válida.

### Requirement: Rechazo de artefactos incompatibles
La comprobación previa a publicación SHALL exigir un ZIP legible con exactamente una aplicación bajo `Payload/*.app`, metadatos de plataforma de dispositivo, ejecutable declarado existente y bundle JavaScript incluido. SHALL rechazar productos de simulador, estructura inválida o contenido incompleto, con diagnóstico específico.

#### Scenario: Aplicación válida para dispositivo
- **WHEN** el paquete contiene una aplicación Release `iphoneos` completa bajo `Payload/`
- **THEN** la comprobación acepta el IPA como candidato para firma local, sin afirmar que ya puede instalarse.

#### Scenario: Simulador ARM
- **WHEN** el producto declara plataforma de simulador aunque su ejecutable sea ARM64
- **THEN** la comprobación lo rechaza como incompatible con iPhone físico.

#### Scenario: ZIP o estructura inválida
- **WHEN** el archivo no es un ZIP válido o falta la aplicación bajo `Payload/`
- **THEN** la comprobación falla con un diagnóstico de formato o estructura.

#### Scenario: Recursos incompletos
- **WHEN** falta el ejecutable declarado o el bundle JavaScript de la aplicación
- **THEN** la comprobación falla e impide publicar una entrega válida.

### Requirement: Firma local y evidencia de dispositivo separadas
Las instrucciones SHALL explicar descarga, firma e instalación local mediante Impactor con Personal Team, la renovación de la firma gratuita aproximadamente cada siete días y la diferencia entre IPA sin firma e instalación válida. La validación en iPhone SHALL registrarse separadamente de los checks de CI.

#### Scenario: Instalación personal
- **WHEN** el usuario sigue las instrucciones con un iPhone compatible y cuenta gratuita
- **THEN** dispone del procedimiento para firmar e instalar localmente y verificar apertura sin Metro; ninguna credencial Apple se solicita en GitHub Actions.

#### Scenario: Prueba física pendiente
- **WHEN** CI genera el IPA pero todavía no existe evidencia de instalación en un iPhone
- **THEN** el resultado identifica la prueba física como pendiente y no declara validado el circuito completo.
