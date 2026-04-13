# Flowable UI 7 - Design System

## Typography
- **Global Font**: INTER
- **Headline Font**: INTER
- **Body Font**: INTER
- **Label Font**: INTER

## Color Palette

| Token | Color (HEX) |
|-------|-------------|
| background | #faf8ff |
| error | #ba1a1a |
| error_container | #ffdad6 |
| inverse_on_surface | #eef0ff |
| inverse_primary | #b2c5ff |
| inverse_surface | #283044 |
| on_background | #131b2e |
| on_error | #ffffff |
| on_error_container | #93000a |
| on_primary | #ffffff |
| on_primary_container | #c4d2ff |
| on_primary_fixed | #001848 |
| on_primary_fixed_variant | #0040a2 |
| on_secondary | #ffffff |
| on_secondary_container | #57657a |
| on_secondary_fixed | #0d1c2e |
| on_secondary_fixed_variant | #3a485b |
| on_surface | #131b2e |
| on_surface_variant | #434654 |
| on_tertiary | #ffffff |
| on_tertiary_container | #ffc6b2 |
| on_tertiary_fixed | #380d00 |
| on_tertiary_fixed_variant | #812800 |
| outline | #737685 |
| outline_variant | #c3c6d6 |
| primary | #003d9b |
| primary_container | #0052cc |
| primary_fixed | #dae2ff |
| primary_fixed_dim | #b2c5ff |
| secondary | #515f74 |
| secondary_container | #d5e3fc |
| secondary_fixed | #d5e3fc |
| secondary_fixed_dim | #b9c7df |
| surface | #faf8ff |
| surface_bright | #faf8ff |
| surface_container | #eaedff |
| surface_container_high | #e2e7ff |
| surface_container_highest | #dae2fd |
| surface_container_low | #f2f3ff |
| surface_container_lowest | #ffffff |
| surface_dim | #d2d9f4 |
| surface_tint | #0c56d0 |
| surface_variant | #dae2fd |
| tertiary | #7b2600 |
| tertiary_container | #a33500 |
| tertiary_fixed | #ffdbcf |
| tertiary_fixed_dim | #ffb59b |

---

# Design System Specification: High-Density Technical Precision

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Blueprint"**
This design system moves away from the "boxy" nature of standard admin templates, opting instead for a sophisticated, editorial approach to technical data. It treats complex information not as a list to be managed, but as a landscape to be navigated. By leveraging high-density layouts, intentional tonal layering, and "Glassmorphism," we create a workspace that feels like a precision instrument—authoritative, high-performance, and calm.

The goal is to eliminate visual noise. We achieve "Trustworthy" and "Efficient" by removing the clutter of traditional borders and replacing them with a structural hierarchy defined by light and depth.

---

## 2. Colors & Surface Logic
The palette is rooted in deep navies and slate grays, providing a stable foundation for the vibrant 'Flowable Blue' (Primary) to guide the user's eye to critical actions.

### Tonal Hierarchy
- **Primary Actions:** Use `primary` (#003d9b) for high-impact CTAs.
- **Surface Nesting:** Use `surface_container_lowest` (#ffffff) for the primary content canvas, placed atop `surface_container_low` (#f2f3ff) for global backgrounds.
- **Status Accents:** 
    - Success: Custom green tokens.
    - Error: `error` (#ba1a1a) with `error_container` (#ffdad6) for subtle alerts.
    - Warning: `tertiary` (#7b2600) for amber-toned caution.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off parts of the UI.
- **Definition through Tone:** Boundaries must be defined solely through background color shifts. A sidebar uses `surface_container`, the main work area uses `surface`, and a floating detail panel uses `surface_container_highest`. 
- **The Glass & Gradient Rule:** For main action buttons or "Hero" stats, use a subtle linear gradient from `primary` (#003d9b) to `primary_container` (#0052cc) at a 135° angle. This adds a "jewel-like" depth that distinguishes the system from flat, generic libraries.

---

## 3. Typography: Data-First Hierarchy
We utilize **Inter** for its exceptional readability in high-density technical environments. The system relies on weight contrast rather than size alone to differentiate between "Metadata" and "Live Data."

- **Display (Large Data Points):** `display-sm` (2.25rem) / SemiBold. Use for high-level KPIs.
- **Headlines (Section Headers):** `headline-sm` (1.5rem) / Medium.
- **Titles (Active Context):** `title-md` (1.125rem) / SemiBold. Used for table headers and card titles.
- **Body (Standard Content):** `body-md` (0.875rem) / Regular.
- **Labels (Technical Meta):** `label-md` (0.75rem) / Bold / All-caps with 0.05em tracking. Use `on_surface_variant` (#434654) to ensure they feel secondary to the actual data.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, mimicking physical sheets of glass and paper.

- **The Layering Principle:** 
    1. **Base:** `surface` (#faf8ff)
    2. **Primary Work Area:** `surface_container_low` (#f2f3ff)
    3. **Interactive Cards:** `surface_container_lowest` (#ffffff)
- **Ambient Shadows:** For floating elements (modals, dropdowns), use a shadow with a 24px blur, 8px Y-offset, and 4% opacity using a tint of `on_surface` (#131b2e).
- **The "Ghost Border" Fallback:** If a technical constraint requires a border, use `outline_variant` (#c3c6d6) at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Navigation sidebars and floating action bars should use `surface_container_low` at 80% opacity with a `20px backdrop-filter: blur`. This integrates the UI components into the background environment.

---

## 5. Components

### Rich Tables & Data Grids
- **Style:** No vertical lines. Horizontal separators use a background shift (`surface_container_high`) on hover.
- **Density:** High. Row height should be exactly 40px for standard density, 32px for compact.
- **Header:** Sticky headers using `surface_container_highest` with `label-md` typography.

### Status Badges (Chips)
- **Style:** Small, pill-shaped (`full` roundedness).
- **Coloring:** Use "Subtle" styling—`primary_container` background with `on_primary_container` text for active states. Avoid high-saturation backgrounds for status unless it's a critical error.

### Action Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `md` (0.375rem) corner radius.
- **Secondary:** Transparent background with the "Ghost Border" and `on_surface` text.
- **Tertiary:** Text-only with `primary` color, used for low-priority actions in dense lists.

### Detail View Tabs
- **Style:** Underline-style with a 3px thick `primary` bar for the active state. The inactive states use `on_surface_variant` text.
- **Layout:** Positioned at the top of master-detail panels to allow quick context switching.

### Code & JSON Blocks
- **Container:** `inverse_surface` (#283044) background.
- **Syntax:** High-contrast monospaced font. Use `primary_fixed` (#dae2ff) for keys and `tertiary_fixed` (#ffdbcf) for values/strings.

---

## 6. Do’s and Don’ts

### Do
- **Use Vertical White Space:** Use the `xl` (0.75rem) and `lg` (0.5rem) spacing scales to separate content groups instead of lines.
- **Prioritize Data:** Ensure labels are always visually quieter (`on_surface_variant`) than the data they describe (`on_surface`).
- **Leverage Asymmetry:** In master-detail layouts, allow the detail panel to occupy a larger, more prominent surface area to reduce cognitive load.

### Don’t
- **Don’t use "Pure Black" (#000):** It breaks the sophisticated navy-slate tonal range. Always use `on_surface`.
- **Don’t use Default Shadows:** Standard "Drop Shadows" make technical dashboards feel dated. Stick to tonal shifts and ambient, low-opacity blurs.
- **Don’t Over-round:** Use the `md` (0.375rem) radius for most components. `xl` and `full` are reserved for specific decorative elements (chips/tags) to maintain a professional, "engineered" feel.
- **Don’t use Dividers:** Never use a 100% opaque 1px line to separate list items. Use a 4px gap or a subtle `surface_container` background color change.
