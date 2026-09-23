# SALUTECA - Development Guide

## Estado Actual

✅ **Frontend completo con datos mock**

- Todas las pantallas implementadas
- Diseño responsive con Bootstrap 5
- Modales funcionales
- Integración WhatsApp lista

🔄 **Pendiente: Backend**

- Base de datos (MySQL + Prisma)
- Autenticación (NextAuth v5 + Google)
- File upload (S3/R2)
- API endpoints

## Quick Start

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Rutas Disponibles

**Públicas:**

- `/` → Redirige a `/login`
- `/login` → Pantalla de login (Google OAuth mock)
- `/s/abc123xyz789` → Vista compartida de estudio (ejemplo con mock)

**App (requieren login en producción):**

- `/app` → Inicio con estudios recientes
- `/app/studies` → Todos los estudios (búsqueda + filtros)
- `/app/family` → Lista de familiares
- `/app/family/fam-1` → Detalle de familiar + sus estudios
- `/app/settings` → Configuración de usuario

## Testing con Datos Mock

Los datos mock están en `lib/mockData.ts`:

**Usuarios:**

- María González (mockUser)

**Familiares:**

- Juan González (8 años, hijo) - ID: `fam-1`
- Ana González (5 años, hija) - ID: `fam-2`
- Roberto González (39 años, esposo) - ID: `fam-3`
- Elena Martínez (65 años, madre) - ID: `fam-4`

**Estudios:**

- 8 estudios de ejemplo distribuidos entre usuario y familiares
- Diferentes fechas y descripciones

**Share Links:**

- Token `abc123xyz789` → estudio ID `study-1`
- Token `def456uvw012` → estudio ID `study-2`

## Modales

Los 3 modales están implementados pero **no conectados** a las páginas aún:

```tsx
import UploadStudyModal from "@/components/modals/UploadStudyModal";
import AddFamilyMemberModal from "@/components/modals/AddFamilyMemberModal";
import ShareModal from "@/components/modals/ShareModal";

// Usar con estado local:
const [showModal, setShowModal] = useState(false);

<UploadStudyModal show={showModal} onHide={() => setShowModal(false)} />;
```

**Para conectarlos:** Reemplazar los `console.log` en cada modal con llamadas a API.

## WhatsApp Share

Implementación lista en `ShareModal.tsx`:

```ts
const shareViaWhatsApp = () => {
  const text = encodeURIComponent(
    `Te comparto mi estudio médico en SALUTECA: ${shareLink}`
  );
  window.open(`https://wa.me/?text=${text}`, "_blank");
};
```

No requiere API de WhatsApp Business. Funciona con cualquier link.

## Próximos Pasos

### 1. Backend Setup

```bash
# Instalar Prisma
npm install prisma @prisma/client

# Inicializar Prisma
npx prisma init

# Crear schema en prisma/schema.prisma basado en types/index.ts
```

Modelos sugeridos:

- User
- FamilyMember
- Study
- StudyShareLink

### 2. NextAuth Setup

```bash
npm install next-auth@beta
```

Crear `app/api/auth/[...nextauth]/route.ts` con Google Provider.

### 3. File Upload

**Opción recomendada: Cloudflare R2**

- Compatible con S3
- Más barato que AWS S3
- Generar signed URLs para acceso temporal

**Opción alternativa: AWS S3**

- Usar AWS SDK v3
- Bucket privado + signed URLs

En la DB solo guardar:

- `fileKey` (path en S3/R2)
- `fileName` (nombre original)
- `mimeType`
- `size`
- `checksum` (opcional, para integridad)

### 4. API Routes

Crear en `app/api/`:

```
api/
├── studies/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/route.ts      # GET, PATCH, DELETE
├── family/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/route.ts      # GET, PATCH, DELETE
└── shares/
    ├── route.ts           # POST (create), GET (list)
    ├── [id]/route.ts      # DELETE (revoke)
    └── [token]/route.ts   # GET (resolve token)
```

### 5. Conectar Frontend

Reemplazar imports de `mockData.ts` con:

- `fetch('/api/studies')`
- React Query o SWR para caching
- Loading states
- Error handling

## Design System

Todo el branding SALUTECA está en `app/globals.css`:

**Variables CSS:**

```css
--saluteca-primary: #016390
--saluteca-secondary: #7ABB85
--saluteca-gray: #919191
```

**Botones:**

```tsx
<Button className="btn-primary-saluteca">Primary</Button>
<Button className="btn-outline-saluteca">Outline</Button>
```

## TypeScript Types

Ver `types/index.ts` para todos los tipos e interfaces.

Ejemplo:

```ts
import type { Study, FamilyMember } from "@/types";
```

## Notas Importantes

- **No hay autenticación real** - todas las rutas son públicas
- **No hay persistencia** - los datos se resetean al recargar
- **File uploads son mock** - solo se muestra el nombre del archivo
- **Share links son mock** - tokens hardcodeados

Todo esto se resolverá al implementar el backend.

## Estructura de Carpetas

```
saluteca-web/
├── app/                    # Next.js App Router
├── components/             # Componentes React
├── lib/                    # Utilidades y mock data
├── types/                  # TypeScript types
├── public/                 # Assets estáticos
└── CLAUDE.md              # Documentación para Claude
```

## Recursos

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Bootstrap](https://react-bootstrap.github.io/)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://authjs.dev/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
