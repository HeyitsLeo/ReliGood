# ReliGood Design System

## 1. North Star

**"Reliable Quality, Affordable Good."**

The brand name encodes the promise: **Reli**(able) + (Affordable) **Good**. The design must feel like browsing a curated catalogue printed on quality paper stock — warm, tactile, trustworthy. Every pixel should reinforce that the products are genuine and the prices are fair.

**Three principles:**
1. **Paper, not screen** — warm cream tones and subtle texture replace cold digital white
2. **Calm authority** — deep teal conveys trust; orange sparks action only where needed
3. **Less is structure** — whitespace and tonal shifts define hierarchy, not borders or decoration

---

## 2. Color Palette

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#0D5550` | Brand identity ("Reli"), navigation, trust elements |
| `primary-container` | `#1A7A73` | Hover states, gradients, secondary actions |
| `accent` | `#F56024` | Brand identity ("Good"), CTAs, price highlights |
| `accent-hover` | `#D94F1A` | Accent hover state |
| `tertiary` | `#006674` | Supplementary info (stock status, badges) |

### Surface System (Warm Cream)
| Token | Hex | Role |
|-------|-----|------|
| `surface` | `#F3EFE5` | Page background — the "paper" |
| `surface-container-lowest` | `#FAF8F3` | Cards, elevated content |
| `surface-container-low` | `#EFEADE` | Section backgrounds |
| `surface-container` | `#E8E3D6` | Input fields, inactive chips |
| `surface-container-high` | `#E0DACB` | Borders, dividers |
| `surface-container-highest` | `#D8D1C1` | Pressed states |

### Text
| Token | Hex | Role |
|-------|-----|------|
| `on-surface` | `#1A1C1C` | Primary text (never pure #000) |
| `on-surface-variant` | `#404943` | Secondary text, captions |
| `on-primary` | `#FFFFFF` | Text on primary/accent backgrounds |

### Rules
- **No pure black.** Always `#1A1C1C` for text.
- **No pure white backgrounds.** Always `#F3EFE5` or warmer.
- **No borders for layout.** Use tonal shifts between surface tiers to define sections.
- **Orange is scarce.** Reserve `accent` for the logo "Good", primary CTAs, and price tags only. Overuse kills urgency.

---

## 3. Typography

| Role | Font | Weight | Example |
|------|------|--------|---------|
| Display / Headlines | **Manrope** | 700–800, italic for logo | Hero titles, section headers |
| Body / UI | **Inter** | 400–600 | Descriptions, buttons, labels |

### Scale
- Hero: `text-3xl` mobile → `text-5xl` desktop
- Section header: `text-xl font-bold`
- Card title: `text-sm` to `text-lg`
- Body: `text-sm` / `text-base`
- Caption: `text-xs`

### Rules
- Headlines use Manrope for editorial authority
- Everything else uses Inter for clarity
- Prices always bold, `accent` color, prominent size
- Never use more than 3 font sizes on a single screen

---

## 4. Paper Texture

The background uses a subtle SVG fractal noise overlay to simulate uncoated paper stock:

```css
.paper-texture {
  background-image: url("data:image/svg+xml,...feTurbulence baseFrequency='0.45' numOctaves='2'...opacity='0.03'...");
}
```

- `baseFrequency: 0.45` — soft, fiber-like grain
- `numOctaves: 2` — gentle variation, no pixel noise
- `opacity: 0.03` — felt, not seen
- Tile: `300x300` — no visible seams

**Rule:** The texture must be barely perceptible. If you can see individual grains, it's too strong.

---

## 5. Elevation & Depth

### Tonal Layering (primary depth method)
- **Level 0:** `surface` (#F3EFE5) — page background
- **Level 1:** `surface-container-low` — section wrappers
- **Level 2:** `surface-container-lowest` — cards, content blocks

Depth comes from cream tone shifts, not shadows.

### Ambient Shadow (floating elements only)
```
box-shadow: 0px 8px 24px rgba(13, 85, 80, 0.06)
```
Tinted with primary color for warmth. Used on: sticky headers, FABs, modals.

### Glassmorphism (header, overlays)
```css
background: rgba(243, 239, 229, 0.8);
backdrop-filter: blur(24px);
```

---

## 6. Components

### Logo
- "Reli" in `primary` (#0D5550), "Good" in `accent` (#F56024)
- Manrope, extrabold, italic
- This split-color treatment is the brand signature — never use a single color

### Buttons
| Type | Style | Usage |
|------|-------|-------|
| Primary CTA | `primary-gradient` (135° teal gradient), white text, `rounded-full` | Buy, Add to Cart, Order on WhatsApp |
| Accent CTA | `accent` background, white text, `rounded-full` | Featured actions, hero CTA |
| Secondary | `surface-container` background, `on-surface` text | Filters, secondary actions |
| Ghost | No background, `primary` text | Tertiary links |

### Cards
- `rounded-xl` to `rounded-3xl`
- `surface-container-lowest` background
- No border — tonal lift from background provides edge
- Image occupies top 60%, text below
- Hover: subtle `scale-105` on image

### Category Chips
- Active: `bg-primary text-white`
- Inactive: `surface-container` with `on-surface-variant` text
- Shape: `rounded-full`

### Trust Badges
- Icon in `primary/10` circle
- Primary-colored icon
- Short, confident label below

---

## 7. Spacing & Layout

### Spacing Scale
- Section padding: `px-4` mobile, `px-6` to `px-12` desktop
- Section gaps: `space-y-8`
- Card gaps: `gap-3` to `gap-6`
- Inner padding: `p-3` to `p-6`

### Border Radius
- Page-level containers: `rounded-3xl` / `rounded-4xl`
- Cards: `rounded-xl`
- Buttons & chips: `rounded-full`
- Small elements: `rounded-lg`

### Mobile-First
- Bottom tab bar with safe-area padding
- Single-column layouts, horizontal scrollers
- Touch targets minimum 44px

---

## 8. Interaction

- **Transitions:** `transition-colors` on all interactive elements
- **Hover:** Buttons scale or shift opacity; cards lift image slightly (`group-hover:scale-105`)
- **Active:** `active:scale-[0.98]` for tactile press feedback
- **No animation for animation's sake.** Motion serves function (feedback, direction), never decoration

---

## 9. Do's and Don'ts

### Do
- Use whitespace generously — empty space = premium feel
- Let the warm cream background breathe; not every section needs a container
- Keep the orange/teal ratio at roughly 1:5 — teal dominates, orange punctuates
- Use tonal surface shifts instead of borders

### Don't
- Use pure white (#FFF) or pure black (#000) anywhere
- Add gradients, patterns, or decorative elements beyond the paper texture
- Use more than 2 accent colors on any single screen
- Make the paper texture visible — if someone notices the grain, reduce it
- Use noisy, cartoonish, or heavy textures
