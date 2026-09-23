# Arquitectura Feature-Based + Layers

Esta carpeta contiene el código principal de la aplicación organizado siguiendo una arquitectura **Feature-Based con capas internas**.

## 📁 Estructura

```
src/
├── features/           # Features de negocio (organización vertical)
│   ├── studies/        # Gestión de estudios médicos
│   ├── family/         # Gestión de grupo familiar
│   ├── sharing/        # Compartir estudios (links temporales)
│   └── dashboard/      # Dashboard principal
│
├── shared/             # Código compartido entre features
│   ├── components/     # Componentes UI reutilizables
│   ├── hooks/          # Custom hooks compartidos
│   ├── utils/          # Utilidades generales
│   ├── constants/      # Constantes globales
│   └── types/          # Types globales
│
└── lib/                # Infrastructure layer (servicios externos)
    ├── database/       # Conexión a MySQL
    ├── auth/           # Configuración de NextAuth
    ├── storage/        # File storage y validación
    ├── ai/             # Servicios de IA (OpenAI, OCR)
    └── email/          # Servicio de email
```

## 🎯 Feature Structure

Cada feature sigue la misma estructura interna con capas bien definidas:

```
features/[feature-name]/
├── api/                # Server Actions (Application Layer)
│   ├── *.ts            # Server actions específicos
│   └── index.ts        # Export barrel
│
├── components/         # UI Components (Presentation Layer)
│   └── */              # Cada componente en su carpeta
│
├── hooks/              # Custom Hooks (Presentation Layer)
│   └── *.ts            # Hooks específicos del feature
│
├── services/           # Business Logic (Domain Layer)
│   └── *.service.ts    # Servicios con lógica de negocio
│
├── repositories/       # Data Access (Infrastructure Layer)
│   └── *.repository.ts # Acceso a base de datos
│
├── schemas/            # Validation (Application Layer)
│   └── *.schema.ts     # Zod schemas para validación
│
├── types/              # TypeScript Types (Domain Layer)
│   └── *.types.ts      # Interfaces y types del feature
│
└── utils/              # Feature-specific Utilities
    └── *.utils.ts      # Utilidades específicas
```

## 🔄 Flujo de Datos

### Ejemplo: Upload de un estudio

```
1. UI Component
   └─> UploadStudyModal.tsx

2. Server Action (api/)
   └─> uploadStudy()
       ├─ Valida input con Zod schema
       ├─ Verifica autenticación
       └─> Llama al service

3. Service (services/)
   └─> studyService.uploadStudy()
       ├─ Valida archivo
       ├─ Guarda archivo en storage
       └─> Llama al repository

4. Repository (repositories/)
   └─> studyRepository.create()
       └─ INSERT en MySQL
```

## 📋 Capas y Responsabilidades

### 1. **API Layer** (`api/`)
- Server actions de Next.js
- Validación de entrada (Zod)
- Autenticación/autorización
- Orquestación de services
- Manejo de errores
- ✅ Puede llamar: services, auth
- ❌ No puede llamar: repositories directamente

### 2. **Service Layer** (`services/`)
- Lógica de negocio
- Orquestación de múltiples repositories
- Transformación de datos
- Reglas de negocio complejas
- ✅ Puede llamar: repositories, otros services, lib
- ❌ No puede llamar: componentes, API

### 3. **Repository Layer** (`repositories/`)
- Acceso a base de datos
- Queries SQL
- Mapeo de datos DB → Domain
- Cache layer (opcional)
- ✅ Puede llamar: database connection
- ❌ No puede llamar: services, API

### 4. **Component Layer** (`components/`)
- UI React components
- Lógica de presentación
- Estado local de UI
- ✅ Puede llamar: hooks, server actions (via import)
- ❌ No puede llamar: services, repositories

### 5. **Hooks Layer** (`hooks/`)
- Lógica reutilizable de cliente
- State management del lado cliente
- Side effects (useEffect)
- ✅ Puede llamar: server actions, otros hooks
- ❌ No puede llamar: services, repositories

## 🚀 Convenciones

### Imports

```typescript
// ✅ Correcto: Importar desde el feature
import { getStudies, uploadStudy } from "@/src/features/studies/api";
import { studyService } from "@/src/features/studies/services/study.service";

// ✅ Correcto: Importar shared
import { AppShell } from "@/src/shared/components/layout";
import { formatDate } from "@/src/shared/utils/date.utils";

// ✅ Correcto: Importar lib (infrastructure)
import { pool } from "@/src/lib/database/connection";
import { authOptions } from "@/src/lib/auth/config";

// ❌ Incorrecto: Saltar capas
import { studyRepository } from "@/src/features/studies/repositories/study.repository";
// En server actions NO debés importar repositories directamente, usá services
```

### Naming

- **Components**: PascalCase (e.g., `StudyCard.tsx`)
- **Server Actions**: camelCase con verbo (e.g., `getStudies.ts`, `uploadStudy.ts`)
- **Services**: PascalCase + `Service` (e.g., `StudyService`)
- **Repositories**: PascalCase + `Repository` (e.g., `StudyRepository`)
- **Types**: PascalCase para interfaces (e.g., `Study`, `FamilyMember`)

### File Organization

```typescript
// ✅ Cada componente en su carpeta con barrel export
components/
  StudyCard/
    StudyCard.tsx
    StudyCard.module.css
    index.ts  // export { default } from './StudyCard'

// ✅ Services e repositories en archivos separados
services/
  study.service.ts
  ocr.service.ts

repositories/
  study.repository.ts
```

## 🎨 Cuándo usar shared/

**Regla de oro:** Un componente/hook/util va a `shared/` solo si se usa en **3 o más features**.

**Ejemplos:**

```typescript
// ✅ Va a shared/ (se usa en toda la app)
shared/components/layout/AppShell.tsx
shared/components/ui/Button.tsx
shared/hooks/useDebounce.ts
shared/utils/formatDate.ts

// ❌ NO va a shared/ (específico de studies)
features/studies/components/StudyCard.tsx
features/studies/hooks/useStudies.ts
features/studies/utils/ocr.utils.ts
```

## 🔧 Agregar un Nuevo Feature

1. Crear estructura de carpetas:
   ```bash
   mkdir -p src/features/[feature-name]/{api,components,hooks,services,repositories,schemas,types}
   ```

2. Crear types (`types/[feature].types.ts`)
3. Crear repository (`repositories/[feature].repository.ts`)
4. Crear service (`services/[feature].service.ts`)
5. Crear server actions (`api/*.ts` + `api/index.ts`)
6. Crear components y hooks según necesidad

## 📚 Recursos

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Nota:** Esta arquitectura permite escalar fácilmente agregando nuevos features sin afectar los existentes, y facilita la migración a microservicios en el futuro si es necesario.
