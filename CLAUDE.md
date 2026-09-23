# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Para establecer o guardar la hora usa la funcion dateNowWithMinutes dentro de config/date.ts

## Project Overview

**MI SALUTECA** - Sistema de gestión de estudios médicos personales y familiares.

Next.js 16.1.1 application con React 19, TypeScript, Bootstrap 5.3.8 y Tailwind CSS v4. Arquitectura App Router con backend MySQL.

**Nombre de la app:** Mi Saluteca

## Commands

```bash
npm run dev           # Start dev server at http://localhost:3000
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
```

## Branding MI SALUTECA

**Colores:**

- Primary: `#016390` (azul)
- Secondary: `#7ABB85` (verde)
- Gray: `#919191`
- Black: `#000000`
- White: `#FFFFFF`

**Tipografía:**

- UI Font: Inter (400, 500, 600, 700)
- Loaded via `next/font/google`

**Logo:**

- Isotipo: carpeta/documento con lupa (Cloudinary URL)
- Wordmark: "Mi Saluteca" con gradiente azul
- Favicon: Mismo isotipo configurado en metadata

## Architecture

**Framework:** Next.js 16 App Router (file-based routing)

**Styling:**

- Bootstrap 5.3.8 con React Bootstrap components (principal)
- Tailwind CSS v4 via PostCSS (complementario)
- Custom CSS classes en [app/globals.css](app/globals.css)

**Data Layer:**

- Tipos en [types/index.ts](types/index.ts)
- Helper functions en [lib/formatters.ts](lib/formatters.ts)
- Backend: MySQL + S3/R2 para almacenamiento de archivos

**Path Alias:**

- `@/*` maps to root directory

## Project Structure

```
app/
├── layout.tsx                    # Root layout (Inter font, metadata, favicon)
├── page.tsx                      # Root redirect to /app
├── globals.css                   # Global styles + MI SALUTECA design system
├── app/                          # Protected app routes
│   ├── layout.tsx                # App layout wrapper
│   ├── page.tsx                  # Home/Dashboard with KPIs + recent studies
│   ├── studies/
│   │   ├── page.tsx              # All studies (search + filter)
│   │   └── [id]/page.tsx         # Study detail with preview
│   ├── family/
│   │   ├── page.tsx              # Family members list
│   │   └── [id]/page.tsx         # Family member detail + studies
│   └── settings/page.tsx         # User settings
└── s/[token]/page.tsx            # Public shared study view

components/
├── layout/
│   ├── AppShell.tsx              # Main app container (Sidebar + Topbar + content)
│   ├── Sidebar.tsx               # Navigation sidebar with "Mi Saluteca" logo
│   └── Topbar.tsx                # Top bar with title + actions
└── modals/
    ├── UploadStudyModal.tsx      # Upload study form (file + metadata)
    ├── AddFamilyMemberModal.tsx  # Add family member form
    ├── ShareModal.tsx            # Generate share link + WhatsApp integration
    ├── ViewStudyModal.tsx        # Quick study preview modal
    └── SharedLinksModal.tsx      # Manage shared links

types/
└── index.ts                      # TypeScript interfaces and enums

lib/
└── formatters.ts                 # Helper functions (formatDate, formatFileSize, formatRelativeTime)
```

## Key Features

**1. Grupo Familiar:**

- Crear perfiles de familiares
- Relaciones: parent, child, spouse, sibling, other
- Campos: nombre, relación, fecha nacimiento, alergias, notas
- KPIs: total estudios, último estudio

**2. Compartir (WhatsApp Integration):**

- Generar link temporal único con UUID
- Expiración: 24 horas después del PRIMER ACCESO
- Botón directo "Compartir por WhatsApp" usando `https://wa.me/?text=`
- Copiar link al portapapeles
- Links revocables desde Settings → Enlaces compartidos
- Vista pública sin autenticación en `/s/[token]`

**3. Upload de Estudios:**

- Archivo PDF/JPG/PNG
- Campos obligatorios: archivo, fecha
- Campos opcionales: título, descripción, institución, conclusión
- Asignar a usuario o familiar
- Análisis automático con IA para extraer información del documento

## Component Patterns

**Modales:**

- Usar React Bootstrap `Modal` component
- Form validation básica en el estado
- Loading states con spinner
- Success feedback antes de cerrar

**Cards de Estudios:**

- Fecha
- Título (o fallback a "Estudio médico")
- Nombre familiar (si aplica)
- Descripción truncada (2 líneas)
- **Separador visual:** borderTop: 1px solid #E5E5E5 con pt-3 antes de botones
- Botones "Ver" y "Compartir"

**Cards de Familiares:**

- Avatar circular con iniciales
- Nombre + relación + edad
- KPIs: Total estudios + Último estudio
- **Separador visual:** borderBottom antes del botón "Ver estudios"
- Notas si existen

**Empty States:**

- Icono SVG circular gris
- Título + descripción
- CTA button

## Helper Functions

Funciones helper disponibles en [lib/formatters.ts](lib/formatters.ts):

- `formatDate(date)` - Formatea fechas al formato español (ej: "15 dic 2024")
- `formatFileSize(bytes)` - Convierte bytes a formato legible (ej: "2.5 MB")
- `formatRelativeTime(date)` - Muestra tiempo relativo (ej: "Hace 2 días")

## Backend Implementation

El backend está implementado con:

1. MySQL database para almacenamiento de datos
2. S3/R2 para almacenamiento de archivos médicos
3. Share links con tokens únicos + expiración 24h después del primer acceso
4. API routes para CRUD de estudios, familiares y links compartidos

## Custom CSS Classes

Definidas en [app/globals.css](app/globals.css):

- `.btn-primary-saluteca` - botón negro principal
- `.btn-outline-saluteca` - botón outline azul
- `.btn-secondary-saluteca` - botón secundario
- `.card-saluteca` - card con hover effect (translateY -2px + shadow)
- `.empty-state`, `.empty-state-icon`, `.empty-state-title`, `.empty-state-description` - estados vacíos
- `.hover-bg-light` - hover gris claro
- `.text-primary-saluteca`, `.text-muted-saluteca`, `.bg-secondary-saluteca` - colores de texto/fondo

## Important Design Decisions

1. **Autenticación:** App redirige directo a `/app` (autenticación OAuth pendiente de implementar)
2. **Separador en cards:** Todas las cards de estudios y familiares tienen borderTop/borderBottom antes de botones para consistencia visual
3. **Expiración de links:** Links compartidos expiran 24h después del primer acceso (implementado en backend)
4. **Recursos legales:** Removidos de Settings (pendiente definir ubicación: footer, modal o página separada)
5. **Nombre de la app:** "Mi Saluteca" en sidebar y metadata
