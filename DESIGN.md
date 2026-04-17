# Design System: ZEBRA INK — 黑白分明，运维有道

## 1. Overview & Creative North Star

**"ZEBRA INK"** — Pure monochrome contrast with a surgical teal signal.

Like zebra stripes: maximum legibility, zero ambiguity. This system draws from the zebra metaphor — not as decoration, but as a design principle: **high contrast equals high clarity**. In the ops world, every pixel must earn its place.

### Core Palette

| Token             | Light     | Dark      | Purpose                                 |
| ----------------- | --------- | --------- | --------------------------------------- |
| `--zb-accent`     | `#14B8A6` | `#14B8A6` | Primary signal — teal "alive/go/active" |
| `--zb-accent-dim` | `#0D9488` | `#0D9488` | Pressed/hover state                     |
| `--zb-accent2`    | `#2DD4BF` | `#2DD4BF` | Highlights, gradients                   |
| `--zb-bg`         | `#F8F8F8` | `#09090B` | Page background                         |
| `--zb-surface`    | `#FFFFFF` | `#0F0F11` | Card/panel surface                      |
| `--zb-surface2`   | `#F3F3F3` | `#141416` | Secondary surface                       |
| `--zb-text-1`     | `#0A0A0A` | `#FAFAFA` | Primary text                            |
| `--zb-text-2`     | `#525252` | `#71717A` | Secondary text                          |
| `--zb-text-3`     | `#A3A3A3` | `#3F3F46` | Tertiary/muted text                     |

### Semantic Colors

| Purpose | Color     | Usage                                 |
| ------- | --------- | ------------------------------------- |
| Success | `#10B981` | Emerald — deploy OK, healthy          |
| Warning | `#F59E0B` | Amber — degraded, attention           |
| Danger  | `#EF4444` | Red — failure, critical               |
| Info    | `#6366F1` | Indigo — informational, deploy counts |

### Design Principles

1. **Black & White First** — Color is signal, not decoration. Monochrome surfaces provide structure.
2. **Teal = Alive** — The single accent communicates "active, online, operational."
3. **Precision over Personality** — Tight radii (3px/5px/8px), no rounded-full except avatars.
4. **Zebra Stripes** — Subtle diagonal stripe patterns (`--zb-stripe`) as brand signature in backgrounds.
5. **Data Density** — JetBrains Mono for numbers/data, Outfit for body text. Tabular nums everywhere.

## 2. Typography

| Role         | Font           | Weight  | Size    | Tracking    |
| ------------ | -------------- | ------- | ------- | ----------- |
| Display      | Outfit         | 700     | 20-36px | -0.02em     |
| Body         | Outfit         | 400-500 | 13.5px  | 0           |
| Labels       | JetBrains Mono | 600     | 10-11px | 0.06-0.14em |
| Data/Numbers | JetBrains Mono | 500-700 | 11-36px | -0.02em     |
| Code         | JetBrains Mono | 400     | 12-13px | 0           |

Chinese fallback: `PingFang SC` → `Noto Sans SC` → `system-ui`

## 3. Surfaces & Elevation

Use tonal layering, not box-shadow depth:

- `--zb-bg` → base canvas
- `--zb-surface` → primary cards
- `--zb-surface2` → inset/nested areas, table headers

Borders: 1px `--zb-border` (8% opacity light, 6% dark). No heavy outlines.

Shadows reserved for floating elements (dropdowns, modals): very subtle, mostly blur.

## 4. Signature Elements

- **Zebra Stripe Pattern**: `--zb-stripe` — 135° diagonal, 3px transparent / 3px teal-tinted repeating gradient.
- **Accent Top Bar**: 2px gradient line on card hover — `transparent → teal → transparent`.
- **Active Sidebar Indicator**: 3px right-edge bar with teal glow shadow.
- **Status Dots**: 6px circles with matching 2px glow rings.
- **Logo Block**: Rounded 3px square, teal gradient background, "ZB" in JetBrains Mono.

## 5. Do's & Don'ts

### Do

- Use pure zinc-neutral surfaces (no warm/cool tint)
- Use `--zb-stripe` on hero sections and empty states
- Use `letter-spacing: 0.1em+` on uppercase labels
- Use `color-mix()` for semantic stat icon backgrounds

### Don't

- Use orange or amber as primary accent (legacy "Carbon Amber" deprecated)
- Use `border-radius` > 8px on anything except modals
- Use blue as primary — teal is the brand signal
- Use heavy drop shadows — tonal layering only
