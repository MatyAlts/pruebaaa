## 1. Proveedor

- [x] 1.1 Registrar safety net 2 pruebas servicio y baseline ejecutable acción con mocks sesión/SQL antes de edits; verificar rechazos existentes y DTO/cuota.
- [x] 1.2 Migrar servicio mediante RED petición SDK OpenRouter, mínimo GREEN y triangulación clave ausente/anterior, OCR vacío, DTO y errores sin secretos; verificar runner real sin red externa.
- [x] 1.3 Migrar acción mediante RED equivalente y GREEN, preservando sesión/cuota/contador/prompts/DTO; triangulación rechazo y fallos sin incrementar contador.

## 2. Entorno y validación

- [x] 2.1 Completar guía env EasyPanel/MySQL/Actions y placeholders, verificada contra rg de código/workflows; documentar OpenRouter solo runtime y funciones web fuera bootstrap.
- [x] 2.2 Declarar ARG exclusivamente público NEXT_PUBLIC_URL_LINK_SHARE y validar build Docker sin claves más origen presente en chunks cliente reales.
- [x] 2.3 Ejecutar aggregate backend con MySQL dedicado real, typegen/TS secuencial, diffcheck y OpenSpec strict; guardar evidencia TDD y resultados sin afirmar deployment o llamadas IA.
