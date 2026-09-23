# 🚀 Quick Start - Nueva Arquitectura

## ✅ Migración Completada

La arquitectura Feature-Based ha sido implementada exitosamente. Aquí está todo lo que necesitás saber para empezar.

---

## 📦 Instalación

Si es la primera vez que ejecutás el proyecto después de la migración:

```bash
# Instalar dependencias (si no lo hiciste)
npm install

# Zod ya está instalado (usado para validación)
```

---

## 🧪 Verificar que Todo Funciona

### 1. **Lint Check**
```bash
npm run lint
```

**Resultado esperado:**
- ✅ **0 errores críticos**
- ⚠️ 23 warnings (no críticos, relacionados con next/image y unused imports)

### 2. **Build Check**
```bash
npm run build
```

Verifica que el proyecto compile sin errores.

### 3. **Dev Server**
```bash
npm run dev
```

Abre http://localhost:3000 y verifica que:
- ✅ La app carga correctamente
- ✅ Puedes navegar entre páginas
- ✅ Los server actions funcionan

---

## 📖 Cómo Usar la Nueva Arquitectura

### Importar Server Actions

**Antes:**
```typescript
import { getStudies } from "@/user-dashboard/server-actions/get-studies";
```

**Ahora:**
```typescript
import { getStudies } from "@/src/features/studies/api";
```

### Importar Componentes Compartidos

**Antes:**
```typescript
import AppShell from "@/components/layout/AppShell";
```

**Ahora:**
```typescript
import AppShell from "@/src/shared/components/layout/AppShell";
```

### Importar Infrastructure

**Antes:**
```typescript
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/database";
```

**Ahora:**
```typescript
import { authOptions } from "@/src/lib/auth/config";
import { pool } from "@/src/lib/database/connection";
```

---

## 🎯 Agregar un Nuevo Server Action

### Ejemplo: Agregar "Favorite Study"

**1. Crear el Repository Method**
```typescript
// src/features/studies/repositories/study.repository.ts
async toggleFavorite(studyId: string, userId: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE estudios SET is_favorite = !is_favorite WHERE id = ? AND id_usuario = ?`,
    [studyId, userId]
  );
  return result.affectedRows > 0;
}
```

**2. Crear el Service Method**
```typescript
// src/features/studies/services/study.service.ts
async toggleFavorite(studyId: string, userId: string) {
  return await studyRepository.toggleFavorite(studyId, userId);
}
```

**3. Crear el Server Action**
```typescript
// src/features/studies/api/toggle-favorite.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { studyService } from "../services/study.service";

export async function toggleFavoriteStudy(studyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return { success: false, message: "No autenticado" };
  }

  const result = await studyService.toggleFavorite(studyId, session.user.userId);
  return { success: result, message: result ? "Favorito actualizado" : "Error" };
}
```

**4. Exportar en index.ts**
```typescript
// src/features/studies/api/index.ts
export * from "./toggle-favorite";
```

**5. Usar en un Componente**
```typescript
import { toggleFavoriteStudy } from "@/src/features/studies/api";

async function handleToggleFavorite() {
  const result = await toggleFavoriteStudy(studyId);
  if (result.success) {
    toast.success(result.message);
  }
}
```

---

## 🧩 Estructura de un Feature Completo

```
src/features/[mi-feature]/
├── api/
│   ├── get-[resource].ts          # Obtener datos
│   ├── create-[resource].ts       # Crear
│   ├── update-[resource].ts       # Actualizar
│   ├── delete-[resource].ts       # Eliminar
│   └── index.ts                   # Export barrel
│
├── services/
│   └── [feature].service.ts       # Lógica de negocio
│
├── repositories/
│   └── [feature].repository.ts    # Acceso a datos
│
├── schemas/
│   └── [feature].schema.ts        # Validación Zod
│
├── types/
│   └── [feature].types.ts         # Interfaces TS
│
└── components/                     # Componentes UI (opcional)
    └── [ComponentName]/
        ├── [ComponentName].tsx
        ├── [ComponentName].module.css
        └── index.ts
```

---

## 🔍 Debugging

### Ver Queries SQL en Consola

Los repositories ya tienen `console.error` en los catch blocks. Para ver queries exitosas:

```typescript
// En cualquier repository
async findByUserId(userId: string) {
  console.log('Ejecutando query:', userId); // Debug
  const [rows] = await pool.execute(...);
  console.log('Resultados:', rows.length); // Debug
  return rows;
}
```

### Verificar Server Actions

Las server actions logean errores automáticamente:

```typescript
try {
  // ... código
} catch (error) {
  console.error("Error en [action] action:", error);
  return { success: false, message: "Error" };
}
```

---

## 📝 Convenciones de Código

### Naming Conventions

| Tipo | Ejemplo | Convención |
|------|---------|------------|
| Server Action | `getStudies.ts` | camelCase con verbo |
| Service | `StudyService` | PascalCase + Service |
| Repository | `StudyRepository` | PascalCase + Repository |
| Component | `StudyCard.tsx` | PascalCase |
| Type/Interface | `Study`, `FamilyMember` | PascalCase |
| Schema | `uploadStudySchema` | camelCase + Schema |

### Import Order

```typescript
// 1. React/Next imports
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// 2. Infrastructure (lib)
import { authOptions } from "@/src/lib/auth/config";

// 3. Features (api/services)
import { getStudies } from "@/src/features/studies/api";

// 4. Shared (components/utils)
import { AppShell } from "@/src/shared/components/layout";

// 5. Local imports
import StudyCard from "./StudyCard";
```

---

## 🎨 Componentes Reutilizables

### Cuándo Crear en shared/

Solo si se usa en **3+ features diferentes**:

```typescript
// ✅ Va a shared/ (usado en toda la app)
shared/components/layout/AppShell.tsx
shared/components/ui/Button.tsx

// ❌ NO va a shared/ (solo en studies)
features/studies/components/StudyCard.tsx
```

---

## 🚨 Errores Comunes

### Error: "Module not found"

**Causa:** Path alias incorrecto

**Solución:**
```typescript
// ❌ Incorrecto
import { getStudies } from "@/features/studies/api";

// ✅ Correcto
import { getStudies } from "@/src/features/studies/api";
```

### Error: "Cannot use namespace 'X' as a type"

**Causa:** Importar desde barrel export sin re-export correcto

**Solución:** Verificar que `index.ts` tenga `export *` o `export { ... }`

---

## 📚 Recursos

### Documentación Interna
- 📖 **[src/README.md](src/README.md)** - Arquitectura completa
- 📄 **[MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md)** - Resumen de migración
- 🚀 **[QUICK-START.md](QUICK-START.md)** - Esta guía

### Referencias Externas
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Zod Documentation](https://zod.dev/)

---

## ✅ Checklist de Verificación

Antes de commit/deploy:

- [ ] `npm run lint` - 0 errores críticos
- [ ] `npm run build` - Build exitoso
- [ ] Server actions funcionan (probar upload, delete, etc.)
- [ ] Navegación entre páginas funciona
- [ ] Auth funciona correctamente

---

## 🎉 Todo Listo!

La arquitectura está implementada y funcionando. Podés empezar a:

1. ✅ Desarrollar nuevas features siguiendo el patrón establecido
2. ✅ Agregar tests unitarios para services y repositories
3. ✅ Migrar componentes UI de `user-dashboard/` a features (opcional)
4. ✅ Escalar la aplicación sin preocuparte por la arquitectura

**Happy coding! 🚀**
