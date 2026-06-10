# 🎨 Hover Colors - Quick Reference

## CSS Variables

```css
--hover-surface     /* Row/item hover (lighter than surface) */
--hover-elevated    /* Button/dropdown hover (lighter than elevated) */
--hover-accent      /* Primary action hover (lighter accent) */
--hover-border      /* Border focus/hover (lighter than border) */
```

---

## Tailwind Classes

```tsx
hover:bg-hover-surface
hover:bg-hover-elevated
hover:bg-hover-accent
hover:border-hover-border
```

---

## Common Patterns

### Transaction Row
```tsx
"bg-surface hover:bg-hover-surface transition-colors"
```

### Button (Primary)
```tsx
"bg-accent hover:bg-hover-accent transition-colors"
```

### Button (Secondary)
```tsx
"bg-elevated hover:bg-hover-elevated transition-colors"
```

### Card Border
```tsx
"border-border hover:border-hover-border transition-all"
```

### Dropdown Item
```tsx
"hover:bg-hover-surface transition-colors"
```

### Input Focus
```tsx
"border-border focus:border-hover-accent transition-colors"
```

---

## All Theme Values

| Theme | Surface | Elevated | Accent | Border |
|-------|---------|----------|--------|--------|
| **Nordic Midnight** | `#1E293B` | `#334155` | `#60A5FA` | `#475569` |
| **GitHub Dark** | `#1C2128` | `#2D333B` | `#58A6FF` | `#444C56` |
| **Midnight Obsidian** | `#171717` | `#1F1F1F` | `#FB7185` | `#404040` |
| **Minimalist Light** | `#F1F5F9` | `#E2E8F0` | `#334155` | `#CBD5E1` |
| **Retro Sepia** | `#EADEC9` | `#DFD0B8` | `#C2410C` | `#D4C4AF` |
| **Emerald Wealth** | `#132E27` | `#1F3F35` | `#34D399` | `#2D5246` |
| **Midnight Sapphire** | `#1C2541` | `#2C3A63` | `#33F3FF` | `#3A4668` |
| **Aureum Gold** | `#292524` | `#3C3835` | `#FCD34D` | `#57534E` |
| **Swiss Banking** | `#F5F2EB` | `#E9E3D8` | `#B03D3D` | `#D8D0C1` |

---

## Transition Durations

```tsx
duration-150  // Most UI (buttons, rows, items)
duration-200  // Cards, larger elements
duration-300  // Page/modal transitions
```

---

## Complete Example

```tsx
<div className={cn(
  // Base styles
  "bg-surface border border-border rounded-lg p-4",
  
  // Hover states
  "hover:bg-hover-surface hover:border-hover-border",
  
  // Transition
  "transition-all duration-150",
  
  // Optional
  "cursor-pointer"
)}>
  <button className={cn(
    "bg-accent text-white px-4 py-2 rounded-md",
    "hover:bg-hover-accent",
    "transition-colors duration-200"
  )}>
    Click Me
  </button>
</div>
```

---

## Usage Tips

✅ **DO:**
- Always add `transition-colors` or `transition-all`
- Use `duration-150` for most hover effects
- Test in both light and dark themes

❌ **DON'T:**
- Use hardcoded colors (`hover:bg-gray-800`)
- Skip transitions (looks abrupt)
- Mix hover-surface with elevated base

---

## Customize

**Edit theme preset:**
```typescript
// frontend/src/lib/utils/theme.ts
variables: {
  "hover-surface": "#YOUR_COLOR",
  "hover-elevated": "#YOUR_COLOR",
  "hover-accent": "#YOUR_COLOR",
  "hover-border": "#YOUR_COLOR",
}
```

**Runtime override:**
```typescript
applyTheme("github-dark", {
  "hover-surface": "#2D333B",
});
```

---

*Full docs: COLOR-CUSTOMIZATION-GUIDE.md*
