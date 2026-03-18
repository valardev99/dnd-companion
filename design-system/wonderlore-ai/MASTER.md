# Design System Master File — Wonderlore AI

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Wonderlore AI
**Updated:** 2026-03-17
**Category:** Gaming / D&D Companion
**Theme:** Dark Fantasy (World of Warcraft / Diablo inspired)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Gold (Primary) | `#c9a84c` | `--gold` |
| Gold Bright | `#d4b050` | `--gold-bright` |
| Gold Dim | `#a88a3e` | `--gold-dim` |
| Obsidian (Background) | `#0a0a0f` | `--obsidian` |
| Void (Deep BG) | `#050508` | `--void` |
| Stone | `#1a1a24` | `--stone` |
| Stone Light | `#2a2a3a` | `--stone-light` |
| Parchment (Light Text) | `#e8dcc8` | `--parchment` |
| Silver (Muted Text) | `#b8b8c8` | `--silver` |
| Muted | `#888` | `--muted` |
| Crimson | `#dc2626` | `--crimson` |
| Crimson Bright | `#ef4444` | `--crimson-bright` |
| Emerald | `#10b981` | `--emerald` |
| Emerald Bright | `#34d399` | `--emerald-bright` |
| Amber | `#f59e0b` | `--amber` |
| Border Dim | `#3d3520` | `--border-dim` |
| Border Gold | `#c9a84c33` | `--border-gold` |

**Color Philosophy:** Dark, atmospheric, medieval. NO bright whites, NO pastel colors, NO corporate blues. Think dungeon torchlight, ancient gold, weathered stone.

### Typography

- **Heading Font:** Cinzel (serif) — medieval/fantasy headings, titles, labels
- **Body Font:** Crimson Text (serif) — readable body text, descriptions, chat
- **Monospace:** Fira Code — stats, codes, technical elements
- **NO system fonts, NO sans-serif headings**

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');
```

### Borders & Cards

- Warcraft-style metallic card borders with stone/wood textures
- Use `border-image` with fantasy frame graphics where possible
- NO rounded-corner-only cards, NO flat Material Design
- Standard card: `background: var(--stone); border: 1px solid var(--border-dim);`

### Animations & Effects

- Subtle gold glows, particle effects, fade transitions
- NO bouncy/playful animations
- Transitions: 200-300ms ease for interactions
- Gold shimmer on hover for interactive elements
- `prefers-reduced-motion` must be respected

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding |

---

## Mobile Requirements (375px viewport)

### Touch Targets
- **Minimum 44x44px** for all interactive elements (buttons, links, checkboxes)
- Add padding to increase tap area if visual element is smaller

### Font Sizes
- **Body text:** minimum 16px (1rem)
- **Labels/metadata:** minimum 13px (0.8125rem) — only for secondary info
- **Never below 12px** for any visible text

### Layout
- No horizontal scroll — all content must fit within viewport
- Full-width buttons preferred for primary actions
- Modals/overlays must fit within 375px with padding

### Breakpoints
- Mobile: `max-width: 767px`
- Small mobile: `max-width: 359px`
- Tablet: `768px - 1023px`
- Desktop: `1024px+`

---

## Anti-Patterns (Do NOT Use)

- Modern/corporate/SaaS aesthetic
- Bright whites or pastel colors
- Sans-serif headings
- Bouncy/playful animations
- Flat Material Design cards
- Emojis as UI icons (use SVG: Heroicons/Lucide)
- Layout-shifting hover transforms
- Text below 4.5:1 contrast ratio
- Touch targets below 44x44px on mobile

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] Dark fantasy theme maintained (gold, obsidian, stone palette)
- [ ] Cinzel for headings, Crimson Text for body
- [ ] No emojis used as icons (use SVG instead)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (200-300ms)
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Touch targets 44x44px minimum on mobile
- [ ] Body text 16px minimum on mobile
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
