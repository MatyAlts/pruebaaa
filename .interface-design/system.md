# Mi Saluteca — Interface Design System

## Direction
**The Digital Medical Filing Cabinet** — A modern, clean interface that evokes the organized calm of a well-maintained medical office. Professional enough for health data, warm enough for family use.

## Feel
- **Clean** like a modern clinic
- **Organized** like a filing cabinet
- **Warm** like family care
- **Trustworthy** like medical records

## Brand Colors
| Token | Value | Purpose |
|-------|-------|---------|
| `--saluteca-ocean` | `#016390` | Primary brand, headers, CTAs |
| `--saluteca-ocean-light` | `#0284c7` | Gradient endpoints, hover states |
| `--saluteca-ocean-dark` | `#014a6e` | Pressed states, deep accents |
| `--saluteca-sky` | `#7dd3fc` | Light accents, decorative |
| `--saluteca-sky-wash` | `#e0f2fe` | Light backgrounds, info wash |
| `--saluteca-teal` | `#0d9488` | Secondary accent (replaces old green) |

## Semantic Colors
| Token | Value | Purpose |
|-------|-------|---------|
| `--saluteca-success` | `#0d9488` | Success states, confirmations |
| `--saluteca-warning` | `#d97706` | Alerts, allergies |
| `--saluteca-danger` | `#dc2626` | Errors, destructive actions |
| `--saluteca-info` | `#0284c7` | Info banners, OCR progress |

## Depth Strategy
**Layered shadows** (Stripe-inspired). No harsh borders — rgba-based subtle borders with multi-layer box-shadows for elevation.

```css
--shadow-sm: 0 0 0 0.5px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03);
--shadow-md: 0 0 0 0.5px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.03);
```

## Spacing
Base unit: **4px**. All spacing values are multiples. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

## Typography
- **Font**: Inter (400, 500, 600, 700)
- **Headlines**: Weight 600+, tracking -0.02em, tight line-height
- **Body**: Weight 400, tracking normal, relaxed line-height
- **Labels**: Weight 500, works at smaller sizes
- **Data**: Monospace when showing IDs or codes

### Text Hierarchy
1. **Primary** `--text-primary: #0f172a` — Main content
2. **Secondary** `--text-secondary: #475569` — Supporting text
3. **Tertiary** `--text-tertiary: #94a3b8` — Metadata, timestamps
4. **Muted** `--text-muted: #cbd5e1` — Disabled, placeholders

## Border Hierarchy
1. **Subtle** `rgba(15, 23, 42, 0.05)` — Soft separation
2. **Default** `rgba(15, 23, 42, 0.08)` — Standard borders
3. **Strong** `rgba(15, 23, 42, 0.12)` — Emphasis
4. **Stronger** `rgba(15, 23, 42, 0.18)` — Focus rings

## Border Radius
- `--radius-sm: 8px` — Inputs, small buttons
- `--radius-md: 12px` — Cards, buttons, nav items
- `--radius-lg: 16px` — Large cards, containers
- `--radius-xl: 20px` — Modals, overlays

## Key Patterns

### Cards
- Surface: `--surface-0` (white)
- Border: `0.5px solid var(--border-default)`
- Shadow: `var(--shadow-sm)`, hover to `--shadow-md`
- Radius: `var(--radius-lg)`
- Padding: `var(--space-6)` (24px)

### Sidebar
- Same background as main content (`--surface-0`)
- Separated by subtle border, not color difference
- Active nav item: brand gradient with brand shadow

### Buttons
- **Primary**: Brand gradient + brand shadow, hover lifts 1px
- **Outline**: White bg + subtle border, hover shows sky-faint tint
- **Secondary**: Ghost button, transparent bg + default border

### Study Category Colors
Kept as-is: Blood (red), X-ray (blue), MRI (purple), CT (green), Ultrasound (orange), ECG (pink), Other (gray). These are domain-specific and intentional.

## What NOT to Change
- Navigation structure and routes
- Component props and logic
- Bootstrap as the framework base
- The `#016390` brand blue
- Study category color system
- Mobile-first responsive approach
