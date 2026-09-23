## Purpose

Permitir el análisis de texto OCR existente con el mismo modelo a través de OpenRouter, con configuración explícita y sin exponer credenciales.

## ADDED Requirements

### Requirement: Análisis mediante OpenRouter

El sistema SHALL usar exclusivamente OPENROUTER_API_KEY y openai/gpt-4o-mini mediante OpenRouter en ambos flujos existentes, preservando prompts, temperatura 0.3, formato JSON, DTO y controles de sesión/cuota.

#### Scenario: Respuesta válida
- **WHEN** existe clave OpenRouter, texto válido y se satisfacen los controles del flujo
- **THEN** se envía la petición al endpoint HTTPS OpenRouter con el modelo indicado y se entrega el DTO existente.

#### Scenario: Clave anterior insuficiente
- **WHEN** solo existe OPENAI_API_KEY
- **THEN** el análisis indica que falta OPENROUTER_API_KEY sin enviar peticiones externas.

#### Scenario: Texto vacío o usuario no autorizado
- **WHEN** falla una validación existente de texto, sesión o cuota
- **THEN** se conserva su rechazo sin llamar al proveedor ni actualizar el contador.

### Requirement: Fallos del proveedor seguros

El sistema SHALL rechazar respuestas vacías, JSON inválido y errores del proveedor sin revelar credenciales, texto OCR ni respuesta privada en mensajes o logs.

#### Scenario: Error contiene secreto
- **WHEN** el proveedor responde un error que contiene una clave o texto privado
- **THEN** la respuesta y los logs mantienen un mensaje genérico sin ese contenido.

#### Scenario: Respuesta vacía o inválida
- **WHEN** no existe contenido o no se puede parsear JSON
- **THEN** el análisis devuelve fallo y la acción no incrementa el contador.

### Requirement: Entorno de despliegue explícito

La guía SHALL identificar cada variable consumida por app, MySQL y workflows, su obligatoriedad, valor público o secreto, lugar de configuración y valores por defecto; el build SHALL funcionar sin credenciales IA y compilar el origen público de enlaces cuando se configure.

#### Scenario: Configuración de prueba
- **WHEN** se sigue el inventario EasyPanel y Actions
- **THEN** las credenciales del backend se configuran en runtime, OPENROUTER_API_KEY no se incorpora a IPA ni Docker ARG, y el único secret Actions solicitado es el hook opcional.

#### Scenario: Build con origen público
- **WHEN** se construye Docker con NEXT_PUBLIC_URL_LINK_SHARE configurado
- **THEN** ese origen está incluido en el cliente web compilado y el build no exige clave IA.
