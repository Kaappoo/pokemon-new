# Design

Poké Cards uses tcgRank's visual system unchanged: the same tokens, type, slab and refusals. Only the subject differs.

**World: the binder at night.** A black field, one safety-orange voice, and type that reads like a scoreboard. The card art supplies all the colour; the chrome around it stays quiet.

## Palette (oklch tokens in `src/styles/app.css`)

| Token | Role |
| --- | --- |
| `--ink` | Page field. Near-black with a hint of blue so orange glows warmer against it. |
| `--surface` / `--surface-raised` | Panels and raised controls. Separation comes from 1px `--line` borders, not shadows. |
| `--paper` / `--paper-dim` | Primary and secondary text (warm whites; dim stays ≥ 4.5:1 on ink). |
| `--orange` | The only accent: primary actions, copy counts, set progress, the slab. |
| `--on-orange` | Text on orange (dark ink, ~7.5:1). |
| `--win` / `--loss` / `--draw` | Semantics only (here: format legality) — never decoration. |

Energy types (Fire, Water…) are **not** coloured. They are labels; the card art already shows them. Charts use the single accent.

Dark only: the use scene is a dim shop with a phone held over a binder.

## Type

One self-hosted family, **Archivo Variable**, using its width axis:

- `.font-display` — stretched to 125%, weight 850: headlines, card names, the wordmark.
- `.font-numerals` — squeezed to 72%, weight 800, tabular: HP, collector numbers, copy counts, set progress, totals.
- Body at normal width. Share images use static Archivo / Archivo Black files bundled for satori.

## Cards

Every card image sits in `.card-frame` (63:88, the printed proportions, with print-like corner radii) via `<CardArt>`. Missing or failed art becomes a typographic placeholder: the number in numerals, the name, and why there's no picture. In grids, cards lift and tilt slightly on hover; a copy count sits on an orange disc at the corner.

## Signature move: the slab

A skewed orange slab (`.slab`) with a thin ember edge. It wipes in with a clip-path (`animate-slab`) behind the collector number on the card page ("006/165"), frames the landing hero, the set and profile headers, the auth screens and the OG share images.

## Motion

- **Focal moment:** the slab wipe behind the collector number (720 ms, expo-out).
- **Continuity:** TanStack Router view transitions — quick blur-out, 340 ms rise-in. The header is excluded so navigation feels anchored.
- **Feedback:** button press scale, tab indicator slide, card lift on hover, set progress bar fill, list stagger capped at 8 items.
- `prefers-reduced-motion` keeps opacity/colour feedback and removes movement.

## Refused

Gradient text, glow shadows, radial "spotlights", eyebrow labels, icon-card grids, glassmorphism as decoration, a colour per energy type. Elevation is neutral black shadow; separation is borders.
