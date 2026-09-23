# SALUTECA

**Tu historial médico, siempre contigo**

Sistema de gestión de estudios médicos personales y familiares. Organiza, comparte y accede a tus estudios médicos de forma segura desde cualquier lugar.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentación

### Para Empezar
- **[ENTREGA.md](ENTREGA.md)** - **EMPIEZA AQUÍ** - Resumen ejecutivo y estado del proyecto
- **[TESTING-GUIDE.md](TESTING-GUIDE.md)** - Guía paso a paso para testear todas las features

### Para Desarrollar
- **[README-DEV.md](README-DEV.md)** - Guía completa de desarrollo y próximos pasos
- **[CLAUDE.md](CLAUDE.md)** - Documentación técnica para Claude Code
- **[RESUMEN-PROYECTO.md](RESUMEN-PROYECTO.md)** - Overview completo del proyecto

---

## ✨ Features

### ✅ Implementado (Frontend 100%)
- 🔐 Login con Google (UI ready)
- 📁 Gestión de estudios médicos
- 👨‍👩‍👧‍👦 Grupo familiar
- 🔍 Búsqueda y filtros
- 💚 **Compartir por WhatsApp** (funcional)
- 📊 KPIs y métricas
- 🎨 7 categorías de estudios con colores
- 📱 Responsive design

### 🔄 Pendiente (Backend)
- 🗄️ Base de datos (MySQL + Prisma)
- 🔑 Autenticación real (NextAuth v5)
- ☁️ File upload (S3/R2)
- 🔗 API endpoints
- 🔒 Share links con tokens reales

---

## 🎨 Stack Tecnológico

**Frontend (Implementado):**
- Next.js 16.1.1 (App Router)
- React 19 + TypeScript
- Bootstrap 5.3.8 + React Bootstrap
- Tailwind CSS v4

**Backend (Recomendado):**
- MySQL + Prisma ORM
- NextAuth v5 (Google OAuth)
- Cloudflare R2 o AWS S3
- Next.js Route Handlers

---

## 📁 Estructura del Proyecto

```
saluteca-web/
├── app/                    # Next.js App Router
│   ├── login/             # Login screen
│   ├── app/               # Protected routes
│   │   ├── page.tsx      # Home
│   │   ├── studies/      # Mis Estudios
│   │   ├── family/       # Grupo Familiar
│   │   └── settings/     # Configuración
│   └── s/[token]/        # Vista compartida pública
├── components/
│   ├── layout/           # AppShell, Sidebar, Topbar
│   └── modals/           # Upload, Share, AddFamily
├── types/                # TypeScript definitions
├── lib/                  # Mock data + helpers
└── docs/                 # Documentación (*.md)
```

---

## 🧪 Testing

Ver [TESTING-GUIDE.md](TESTING-GUIDE.md) para testing completo.

**Quick test:**
```bash
npm run dev
```

**Rutas disponibles:**
- `/login` - Pantalla de login
- `/app` - Home con estudios recientes
- `/app/studies` - Todos los estudios (prueba búsqueda)
- `/app/family` - Lista de familiares
- `/app/family/fam-1` - Detalle de Juan (8 años)
- `/s/abc123xyz789` - Estudio compartido público

---

## 🎯 Próximos Pasos

1. **Testing** - Revisar todas las pantallas (ver [TESTING-GUIDE.md](TESTING-GUIDE.md))
2. **Backend Setup** - Seguir [README-DEV.md](README-DEV.md) sección "Próximos Pasos"
3. **Database** - MySQL + Prisma + modelos
4. **Auth** - NextAuth v5 con Google OAuth
5. **Storage** - Cloudflare R2 o AWS S3
6. **Integration** - Conectar frontend con APIs

---

## 📖 Guía de Archivos de Documentación

| Archivo | Propósito | Para Quién |
|---------|-----------|------------|
| [ENTREGA.md](ENTREGA.md) | Resumen ejecutivo + estado | **Empieza aquí** |
| [TESTING-GUIDE.md](TESTING-GUIDE.md) | Cómo testear todo | QA / Testing |
| [README-DEV.md](README-DEV.md) | Guía de desarrollo | Developers |
| [CLAUDE.md](CLAUDE.md) | Docs técnicas | Claude Code |
| [RESUMEN-PROYECTO.md](RESUMEN-PROYECTO.md) | Overview completo | Product / Leads |

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev          # Dev server

# Build
npm run build        # Production build
npm start            # Production server

# Linting
npm run lint         # ESLint

# Fresh install
rm -rf node_modules package-lock.json
npm install
```

---

## 🎨 Branding

**Colores:**
- Primary: `#016390` (azul)
- Secondary: `#7ABB85` (verde)
- Black: `#000000` (botones)

**Tipografía:**
- Inter (400, 500, 600, 700)

**Logo:**
- Carpeta/documento con lupa
- "SALUTECA" en caps

---

## 📞 Soporte

Para preguntas o issues:
1. Revisar la documentación correspondiente arriba
2. Ver código en `lib/mockData.ts` para ejemplos
3. Todos los tipos en `types/index.ts`

---

## 🏆 Status

| Component | Status |
|-----------|--------|
| Frontend | ✅ 100% |
| Backend | ⏳ 0% |
| Design | ✅ 100% |
| Testing | ✅ Ready |
| Docs | ✅ Complete |

---

## 📄 Licencia

Private project - SALUTECA

---

**Built with ❤️ using Next.js 16 + React 19 + TypeScript**
