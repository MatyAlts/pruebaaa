## MODIFIED Requirements

### Requirement: Compilación manual para dispositivo sin firma
El repositorio SHALL permitir iniciar manualmente una compilación macOS Release para `iphoneos`, sin requerir Apple ID, certificados, perfiles de aprovisionamiento ni credenciales Expo en CI. Una ejecución exitosa SHALL publicar un IPA sin firma, junto con commit y versiones de herramientas utilizadas. Cuando Expo sea un workspace npm, el workflow SHALL instalar desde el lockfile único de la raíz y ejecutar los comandos móviles en el contexto de ese workspace.

#### Scenario: Ejecución exitosa
- **WHEN** se inicia manualmente el workflow sobre un commit compatible
- **THEN** se publica un IPA para iPhone físico con JavaScript y recursos incluidos y evidencia de la compilación.

#### Scenario: Instalación desde workspace
- **WHEN** el workflow prepara una compilación manual del IPA después de la migración
- **THEN** usa el lockfile raíz para su caché e instalación, y sus validaciones y prebuild resuelven el paquete Expo sin un lockfile independiente en `mobile/`.

#### Scenario: Falla de compilación
- **WHEN** falla la compilación nativa o la comprobación del artefacto
- **THEN** el workflow informa fallo y no publica el IPA como una entrega válida.
