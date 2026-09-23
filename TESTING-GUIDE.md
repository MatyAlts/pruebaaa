# SALUTECA - Guía de Testing

## ✅ Build Status

```
✓ Compilado exitosamente
✓ TypeScript sin errores
✓ 9 rutas generadas
✓ 0 warnings
```

## 🧪 Cómo Testear

### 1. Iniciar el servidor

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### 2. Flujo Completo de Testing

#### A. Login
**URL:** http://localhost:3000/login

**Qué testear:**
- ✅ Split screen design (form izquierda, features derecha)
- ✅ Logo SALUTECA
- ✅ Botón "Continuar con Google" con ícono
- ✅ Features list (Acceso instantáneo, Gestiona familia, Comparte seguro)
- ✅ Footer con links a Términos y Privacidad
- ✅ Responsive: en mobile solo se ve el form

**Mock behavior:**
- Click en Google → solo muestra console.log (auth no implementado)

---

#### B. Home / Inicio
**URL:** http://localhost:3000/app

**Qué testear:**
- ✅ Sidebar con logo SALUTECA + navegación
- ✅ Item "Inicio" activo (azul)
- ✅ Avatar "MG" abajo
- ✅ Topbar con título "Inicio"
- ✅ Botón "Subir Estudio" arriba derecha
- ✅ Grid con últimos 6 estudios
- ✅ Cards con category pills de colores
- ✅ Botón "Compartir" funcional (abre modal) ← **NUEVO**
- ✅ Link "Ver todos →"

**Estudios que deberías ver:**
1. Análisis de Rutina (Sangre) - 15 dic 2024
2. Radiografía de Tórax - 20 nov 2024
3. Juan González - Análisis (Sangre) - 5 oct 2024
4. Roberto - Control Glucemia - 10 dic 2024
5. ECG de Esfuerzo - 12 sept 2024
6. Elena - Ecografía Abdominal - 15 nov 2024

**Interacciones:**
- ✅ Click "Subir Estudio" → abre modal
- ✅ Click "Compartir" en un estudio → abre ShareModal con WhatsApp ← **NUEVO**
- ✅ Hover en cards → sube 2px + shadow
- ✅ Click "Ver todos" → va a /app/studies

---

#### C. Mis Estudios
**URL:** http://localhost:3000/app/studies

**Qué testear:**
- ✅ Barra de búsqueda funcional
- ✅ Dropdown "Todos los tipos" funcional
- ✅ Contador "8 estudios encontrados"
- ✅ Grid completo con todos los estudios

**Búsqueda:**
- Escribí "sangre" → deberías ver 3 estudios
- Escribí "juan" → deberías ver 1 estudio
- Escribí "radiografía" → deberías ver 2 estudios

**Filtros:**
- Seleccioná "Análisis de Sangre" → 3 estudios
- Seleccioná "Radiografía" → 2 estudios
- Seleccioná "Ecografía" → 1 estudio

**Combinar búsqueda + filtro:**
- Filtro: "Análisis de Sangre"
- Búsqueda: "juan"
- Resultado: 1 estudio (Juan - oct 2024)

**Empty state:**
- Búsqueda: "xyz123" → "No hay estudios"
- Botón "Limpiar filtros" → vuelve a mostrar todos

---

#### D. Grupo Familiar
**URL:** http://localhost:3000/app/family

**Qué testear:**
- ✅ 4 cards de familiares
- ✅ Avatares con iniciales (JG, AG, RG, EM)
- ✅ Relaciones correctas (Hijo/a, Pareja, Padre/Madre)
- ✅ Edades mostradas
- ✅ Badge naranja de alergias en Juan y Elena
- ✅ KPIs: Total estudios + Último estudio
- ✅ Botón "Ver estudios" en cada card

**Familiares que deberías ver:**
1. **Juan González**
   - Hijo/a • 8 años
   - ⚠️ Alergia: Penicilina
   - Total estudios: 1
   - Último: 5 oct 2024

2. **Ana González**
   - Hijo/a • 5 años
   - Total estudios: 1
   - Último: 10 jul 2024

3. **Roberto González**
   - Pareja • 39 años
   - Total estudios: 1
   - Último: 10 dic 2024

4. **Elena Martínez**
   - Padre/Madre • 65 años
   - Total estudios: 1
   - Último: 15 nov 2024

**Interacciones:**
- ✅ Click "Agregar Familiar" → abre modal
- ✅ Click "Ver estudios" → va a detalle del familiar

---

#### E. Detalle de Familiar
**URL:** http://localhost:3000/app/family/fam-1

**Qué testear:**
- ✅ Avatar grande con iniciales "JG"
- ✅ Nombre "Juan González"
- ✅ Relación "Hijo/a • 8 años"
- ✅ 2 KPI cards (Total: 1, Último: 5 oct 2024)
- ✅ Banner naranja de alergia PROMINENTE
- ✅ Grid con estudios de Juan (1 estudio)
- ✅ Botón "Volver" + "Subir Estudio"

**Texto del banner de alergia:**
```
⚠️ Alergia: Penicilina
Tener en cuenta al prescribir medicamentos
```

**Otros familiares para testear:**
- `/app/family/fam-2` - Ana (1 estudio)
- `/app/family/fam-3` - Roberto (1 estudio, sin alergias pero con nota "Diabético tipo 2")
- `/app/family/fam-4` - Elena (1 estudio, con nota "Hipertensión controlada")

**Familiar inexistente:**
- `/app/family/xyz` → "Familiar no encontrado" + botón volver

---

#### F. Configuración
**URL:** http://localhost:3000/app/settings

**Qué testear:**
- ✅ Avatar grande "MG"
- ✅ Form con nombre + email (email disabled)
- ✅ Texto "El email no se puede cambiar (vinculado con Google)"
- ✅ Security section con badge verde "Activo"
- ✅ "Zona peligrosa" con border rojo
- ✅ Sidebar derecha con info + recursos

**Secciones:**
1. **Perfil**
   - Avatar MG
   - Input: María González
   - Input: maria.gonzalez@gmail.com (disabled)

2. **Seguridad y privacidad**
   - Google OAuth: ✅ Activo
   - Enlaces compartidos activos

3. **Zona peligrosa** (rojo)
   - Eliminar cuenta

**Sidebar:**
- "Acerca de SALUTECA"
- Links: Centro de ayuda, Política de privacidad, Términos

---

#### G. Vista Compartida Pública
**URL:** http://localhost:3000/s/abc123xyz789

**Qué testear:**
- ✅ Header público con logo SALUTECA
- ✅ "Estudio compartido"
- ✅ Warning amarillo si expira pronto
- ✅ Card con datos del estudio
- ✅ Category pill "Análisis de Sangre"
- ✅ Botón "Descargar estudio" (mock)
- ✅ Footer con info de expiración
- ✅ CTA "Crear cuenta en SALUTECA"

**Estudios compartidos disponibles:**
1. `abc123xyz789` → Análisis de Rutina (15 dic 2024)
2. `def456uvw012` → Radiografía de Tórax (20 nov 2024)

**Token inválido:**
- `/s/xyz` → "Link no válido"

---

## 🎨 Modales para Testear

### 1. Upload Study Modal
**Trigger:** Botón "Subir Estudio" en cualquier pantalla

**Qué testear:**
- ✅ Drag & drop area (click para seleccionar)
- ✅ Al seleccionar archivo: muestra nombre + tamaño
- ✅ Dropdown categorías (7 opciones)
- ✅ Date picker (max: hoy)
- ✅ Input título (opcional)
- ✅ Dropdown "Para quién es este estudio" (self + 4 familiares)
- ✅ Textarea notas (opcional)
- ✅ Botón "Subir estudio" disabled hasta que haya archivo + categoría + fecha
- ✅ Loading state: spinner + "Subiendo..."
- ✅ Console.log al submit (mock)

**Flujo:**
1. Click "Subir Estudio"
2. Click en drag & drop area
3. Seleccionar archivo (cualquier PDF/JPG/PNG)
4. Seleccionar categoría: "Análisis de Sangre"
5. Fecha: hoy
6. Título: (opcional)
7. Para: "Juan González"
8. Notas: (opcional)
9. Click "Subir estudio"
10. Esperar 1.5 seg (loading)
11. Modal se cierra
12. Ver console.log con datos

---

### 2. Share Modal ← **NUEVO - FUNCIONAL**
**Trigger:** Botón "Compartir" en cualquier card de estudio

**Qué testear:**
- ✅ Paso 1: Seleccionar expiración (1-30 días)
- ✅ Info box "Seguro y privado"
- ✅ Botón "Generar link de compartir"
- ✅ Paso 2: Link generado (success feedback verde)
- ✅ Input readonly con link
- ✅ Botón "Copiar" → cambia a "Copiado ✓"
- ✅ **Botón verde "Compartir por WhatsApp" con ícono**
- ✅ Info box con tiempo de expiración

**Flujo completo:**
1. En Home, click "Compartir" en "Análisis de Rutina"
2. Modal se abre
3. Seleccionar "7 días"
4. Click "Generar link de compartir"
5. Ver mensaje verde "Link generado exitosamente"
6. Click "Copiar" → debería copiar al clipboard
7. **Click "Compartir por WhatsApp" → abre WhatsApp con texto pre-cargado** ✅
8. Verificar en WhatsApp Web/Desktop que el mensaje dice:
   ```
   Te comparto mi estudio médico en SALUTECA (acceso temporal): http://localhost:3000/s/[token]
   ```

**WhatsApp Integration:**
- ✅ Se abre en nueva pestaña
- ✅ URL: `https://wa.me/?text=...`
- ✅ Texto URL-encoded
- ✅ Funciona sin API de WhatsApp Business
- ✅ Compatible con WhatsApp Web/Desktop/Mobile

---

### 3. Add Family Member Modal
**Trigger:** Botón "Agregar Familiar" en /app/family

**Qué testear:**
- ✅ Input nombre (required, autofocus)
- ✅ Dropdown relación (Padre/Madre, Hijo/a, Pareja, Hermano/a, Otro)
- ✅ Date picker fecha nacimiento (opcional, max: hoy)
- ✅ Input alergias (opcional)
- ✅ Textarea notas (opcional)
- ✅ Info box "Privacidad"
- ✅ Botón disabled hasta que haya nombre + relación
- ✅ Loading state: spinner + "Guardando..."

**Flujo:**
1. Click "Agregar Familiar"
2. Nombre: "Pedro González"
3. Relación: "Hermano/a"
4. Fecha nac: 1990-05-15
5. Alergias: "Maní"
6. Notas: "Asmático"
7. Click "Agregar familiar"
8. Esperar 1 seg (loading)
9. Modal se cierra
10. Ver console.log con datos

---

## 🎯 Checklist de Features

### Design System
- [x] Colores SALUTECA aplicados
- [x] Fuente Inter cargada
- [x] Logo en sidebar
- [x] Botones customizados
- [x] Category pills con colores
- [x] Cards con hover effect
- [x] Empty states con iconos

### Navegación
- [x] Sidebar fijo con 4 items
- [x] Active state en sidebar
- [x] Avatar de usuario
- [x] Topbar con título dinámico
- [x] Breadcrumbs implícitos (títulos)

### Data Display
- [x] Cards de estudios
- [x] Pills de categorías
- [x] Fechas formateadas
- [x] KPIs numéricos
- [x] Badges de alergias
- [x] Empty states

### Interacciones
- [x] Búsqueda en tiempo real
- [x] Filtro por categoría
- [x] Modales funcionales ← **3 modales listos**
- [x] WhatsApp share ← **NUEVO: Funcional**
- [x] Clipboard copy
- [x] Loading states
- [x] Hover effects

### Responsive
- [x] Mobile sidebar (collapsed)
- [x] Grid adapta a pantalla (col-md-6 col-lg-4)
- [x] Forms responsive
- [x] Modales mobile-friendly

---

## 🐛 Known Issues (Mock Limitations)

1. **Auth no implementado** - Click en "Continuar con Google" solo hace console.log
2. **Rutas no protegidas** - Todas las rutas de /app son públicas
3. **Modales no persisten** - Los datos se pierden al cerrar
4. **File upload es mock** - No sube archivos realmente
5. **Share links son hardcoded** - Solo funcionan abc123xyz789 y def456uvw012
6. **Botón "Ver" no hace nada** - Visor de estudios no implementado

Todo esto es **esperado** porque es el frontend mock. Se resolverá al implementar el backend.

---

## 📊 Coverage de Pantallas

| Pantalla | Status | Mock Data | Modales |
|----------|--------|-----------|---------|
| Login | ✅ 100% | N/A | - |
| Home | ✅ 100% | ✅ | Upload, Share |
| Mis Estudios | ✅ 100% | ✅ | Upload, Share |
| Grupo Familiar | ✅ 100% | ✅ | Add Member |
| Detalle Familiar | ✅ 100% | ✅ | Upload, Share |
| Configuración | ✅ 100% | ✅ | - |
| Vista Compartida | ✅ 100% | ✅ | - |

**Total:** 7/7 pantallas ✅

---

## 🚀 Próximos Pasos

Una vez que hayas testeado todo:

1. **Reportar bugs** (si encontrás alguno)
2. **Feedback de UX** - ¿algo confuso? ¿falta algo?
3. **Backend planning** - ver README-DEV.md
4. **Deployment** - build para producción (`npm run build`)

---

## 💡 Tips de Testing

**Para testing exhaustivo:**
```bash
# 1. Fresh install
rm -rf node_modules package-lock.json
npm install

# 2. Build
npm run build

# 3. Dev mode
npm run dev

# 4. Abrir en múltiples navegadores
- Chrome
- Firefox
- Safari
- Mobile (Chrome DevTools)
```

**Para ver console.logs de los modales:**
- Abrí DevTools (F12)
- Tab "Console"
- Los modales hacen console.log al submitear

**Para testear WhatsApp:**
- Necesitás tener WhatsApp Web abierto O la app de WhatsApp instalada
- El botón abrirá la URL `wa.me` que redirige automáticamente
- En mobile, abrirá la app directamente
- En desktop, puede abrir WhatsApp Web si está logueado

---

¡Listo para testear! 🎉
