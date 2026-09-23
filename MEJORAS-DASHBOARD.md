# Mejoras Opcionales para el Dashboard

## ✅ Ya Implementado

- Stats cards (Total, Míos, Familia)
- Estudios recientes (últimos 6)
- Botones de acción (Subir, Compartir)

## 💡 Mejoras Opcionales

### 1. Widget de Accesos Rápidos

Agregar después de los stats:

```tsx
{
  /* Quick Actions */
}
<div className="bg-white rounded-3 p-4 border mb-4">
  <h3 className="h6 fw-semibold mb-3">Accesos rápidos</h3>
  <div className="row g-2">
    <div className="col-6 col-md-3">
      <Button
        variant="light"
        className="w-100"
        onClick={() => setShowUploadModal(true)}
      >
        📤 Subir estudio
      </Button>
    </div>
    <div className="col-6 col-md-3">
      <Link href="/app/studies" className="btn btn-light w-100">
        🔍 Buscar estudios
      </Link>
    </div>
    <div className="col-6 col-md-3">
      <Link href="/app/family" className="btn btn-light w-100">
        👨‍👩‍👧‍👦 Ver familia
      </Link>
    </div>
    <div className="col-6 col-md-3">
      <Link href="/app/settings" className="btn btn-light w-100">
        ⚙️ Configuración
      </Link>
    </div>
  </div>
</div>;
```

### 2. Widget de Actividad Reciente

Mostrar últimas acciones:

```tsx
{
  /* Recent Activity */
}
<div className="bg-white rounded-3 p-4 border mb-4">
  <h3 className="h6 fw-semibold mb-3">Actividad reciente</h3>
  <ul className="list-unstyled mb-0">
    <li className="pb-3 mb-3 border-bottom">
      <div className="d-flex gap-2">
        <span>📄</span>
        <div className="flex-grow-1">
          <div className="fw-medium">Subiste un análisis de sangre</div>
          <small className="text-muted">Hace 2 días</small>
        </div>
      </div>
    </li>
    <li className="pb-3 mb-3 border-bottom">
      <div className="d-flex gap-2">
        <span>🔗</span>
        <div className="flex-grow-1">
          <div className="fw-medium">Compartiste una radiografía</div>
          <small className="text-muted">Hace 5 días</small>
        </div>
      </div>
    </li>
  </ul>
</div>;
```

### 3. Widget de Próximos Estudios

Si tenés estudios programados:

```tsx
{
  /* Upcoming */
}
<div className="bg-light rounded-3 p-4 mb-4">
  <div className="d-flex align-items-center gap-2 mb-3">
    <span>📅</span>
    <h3 className="h6 fw-semibold mb-0">Próximos estudios</h3>
  </div>
  <p className="text-muted mb-0">No tenés estudios programados</p>
</div>;
```

### 4. Widget de Alertas/Recordatorios

Para alergias o notas importantes:

```tsx
{
  /* Important Notes */
}
<div className="bg-warning bg-opacity-10 border border-warning rounded-3 p-3 mb-4">
  <div className="d-flex align-items-start gap-2">
    <span>⚠️</span>
    <div>
      <div className="fw-semibold mb-1">Recordatorio</div>
      <small>
        Juan tiene alergia a la Penicilina.
        <a href="/app/family/fam-1" className="ms-1">
          Ver perfil →
        </a>
      </small>
    </div>
  </div>
</div>;
```

### 6. Timeline Visual

Para ver evolución:

```tsx
{
  /* Timeline */
}
<div className="bg-white rounded-3 p-4 border">
  <h3 className="h6 fw-semibold mb-3">Línea de tiempo</h3>

  {/* Timeline items */}
  <div className="position-relative">
    {/* Vertical line */}
    <div
      className="position-absolute top-0 bottom-0 bg-light"
      style={{ left: "15px", width: "2px" }}
    />

    {/* Timeline item */}
    <div className="d-flex gap-3 mb-3 position-relative">
      <div
        className="bg-primary-saluteca rounded-circle flex-shrink-0"
        style={{ width: "32px", height: "32px", zIndex: 1 }}
      />
      <div className="flex-grow-1 pt-1">
        <div className="fw-medium">Análisis de Rutina</div>
        <small className="text-muted">15 dic 2024</small>
      </div>
    </div>

    {/* Más items... */}
  </div>
</div>;
```

### 7. Widget de Salud de Familia

Resumen por familiar:

```tsx
{
  /* Family Health */
}
<div className="bg-white rounded-3 p-4 border">
  <h3 className="h6 fw-semibold mb-3">Estado de familia</h3>

  <div className="d-flex flex-column gap-2">
    <div className="d-flex align-items-center justify-content-between p-2 rounded hover-bg-light">
      <div className="d-flex align-items-center gap-2">
        <div
          className="bg-secondary-saluteca rounded-circle text-white"
          style={{ width: "32px", height: "32px" }}
        >
          JG
        </div>
        <div>
          <div className="fw-medium">Juan González</div>
          <small className="text-muted">1 estudio</small>
        </div>
      </div>
      <Link href="/app/family/fam-1">
        <svg>→</svg>
      </Link>
    </div>
    {/* Más familiares... */}
  </div>
</div>;
```

## 🎯 Prioridad Recomendada

Si querés agregar más:

1. **Alta prioridad:**

   - ✅ Stats cards (ya hecho)
   - Accesos rápidos
   - Widget de alertas (alergias importantes)

2. **Media prioridad:**

   - Salud de familia

3. **Baja prioridad (nice to have):**
   - Actividad reciente
   - Timeline
   - Próximos estudios

## 📱 Consideraciones Mobile

Todos los widgets deben:

- Apilar verticalmente en mobile
- Mantener padding adecuado
- Ser táctiles (botones grandes)
- Cargar rápido

## 🎨 Diseño Consistente

Mantener:

- Border radius 12px para cards
- Padding 1rem (p-4)
- Gap de 0.75rem-1rem entre elementos
- Íconos 24x24px
- Colores SALUTECA
