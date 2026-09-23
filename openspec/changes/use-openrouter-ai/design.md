## Context

Servicio src y Server Action legacy son usados por interfaces distintas. La acción mantiene sesión y cuota diaria MySQL; migrar solo el servicio dejaría UploadStudyModal en OpenAI. Baseline servicio 2/2 PASS ejecutado. No existe registro de skills del proyecto. El contexto OpenSpec del shell es histórico y no describe la vertical ya implementada ni el build sin clave.

## Goals / Non-Goals

**Goals:** migración de ambos proveedores y guía basada en referencias reales env.

**Non-Goals:** cambiar permisos, cuota, schema, prompts, modelo subyacente, SDK, UI o cliente iOS; llamadas IA pagas y deployment.

## Decisions

- Reutilizar SDK OpenAI instalado con baseURL fijo https://openrouter.ai/api/v1, apiKey OPENROUTER_API_KEY y slug openai/gpt-4o-mini. No fallback a clave anterior ni nueva dependencia. [Quickstart oficial](https://openrouter.ai/docs/quickstart), [modelo](https://openrouter.ai/openai/gpt-4o-mini).
- Inicializar ambos clientes después de guards existentes; acción conserva consultas, contador y DTO. Capturar fetch del SDK real en subprocess aislado; acción se transpila con TypeScript y mocks explícitos de sesión/SQL/fecha, sin auth ficticia ni llamadas externas.
- Errores genéricos y sin logging de excepción cruda del proveedor: podría contener texto privado o clave. Mantener mensaje específico para respuesta vacía y configuración faltante.
- Inventario env incluye funciones web fuera del bootstrap mínimo como condiciones, no promete habilitarlas en el TEST mínimo. JWT_SECRET admin se documenta sin modificar auth legacy. DB_PORT no soportado.
- NEXT_PUBLIC_URL_LINK_SHARE se inlina durante build: añadir único ARG público en Docker build stage; EasyPanel pasa Environment como buildargs. Nunca declarar ARG de credenciales. [Builder oficial](https://easypanel.io/docs/builders).

## Risks / Trade-offs

- Modelo equivalente no garantiza respuesta idéntica al cambiar routing → conservar contrato y probar SDK sin pago; prueba real opcional por usuario con datos ficticios.
- Clave ausente/saldo/permisos OpenRouter → guía de creación/configuración y fallo genérico; sin fallback.
- PUBLIC variables quedan en binarios → sólo URL pública, reconstrucción al cambiarla.

## Migration Plan

Configurar OPENROUTER_API_KEY runtime EasyPanel antes de activar IA, retirar OPENAI_API_KEY de ese servicio cuando no tenga otros consumidores; deploy inicial sigue a cargo del usuario. Rollback con commit previo y clave del proveedor previo configurada privadamente. No se ejecutan VPS, migraciones ni llamadas IA. TDD RED mínimo por comportamiento, triangulación, aggregate DB real, TS secuencial y Docker build real sin claves.
