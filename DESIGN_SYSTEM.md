# Auroric Design System

## Brand Identity

**Name**: Auroric
**Tagline**: Discover, Create, Share Inspiration
**Brand Philosophy**: Luxury, Minimalism, Inspiration

## Color System

### Primary Colors
- **Deep Purple** (Primary): `#7C4A8F` / `hsl(267, 32%, 49%)`
  - Dark variant: `#5D3A6F` (267° 13% 6%)
  - Light variant: `#9D6BA8`
  - Used for: Primary buttons, links, highlights

- **Luxury Gold** (Accent): `#D4AF37` / `hsl(45, 89%, 54%)`
  - Light variant: `#E8C547` / `#F4D960`
  - Used for: Calls-to-action, highlights, badges

### Neutral Colors
- **Darkest Background**: `#0F0F0F` (0° 0% 3.9%)
- **Dark Background**: `#1A1A1A` (0° 0% 9%)
- **Surface/Card**: `#1F1F2E` (267° 13% 12%)
- **Border**: `#3A3A4E` (267° 13% 23%)
- **Text Primary**: `#FFFFFF` (0° 0% 100%)
- **Text Secondary**: `#D0D0D0` (0° 0% 82%)

### Semantic Colors
- **Destructive**: `#DC2626` (red-600)
- **Success**: `#10B981` (emerald-500)
- **Warning**: `#F59E0B` (amber-500)
- **Info**: `#3B82F6` (blue-500)

## Typography

### Font Families
- **Headings**: `Playfair Display`, serif (Google Fonts)
  - Weight: 700 (bold)
  - Letter-spacing: -0.5px
  - Usage: H1, H2, H3, H4, H5, H6

- **Body**: `Inter`, sans-serif (Google Fonts)
  - Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
  - Letter-spacing: normal
  - Usage: Paragraphs, buttons, labels

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 48px (3rem) | 700 | 1.1 |
| H2 | 36px (2.25rem) | 700 | 1.2 |
| H3 | 30px (1.875rem) | 700 | 1.3 |
| H4 | 24px (1.5rem) | 700 | 1.4 |
| H5 | 20px (1.25rem) | 700 | 1.5 |
| H6 | 16px (1rem) | 700 | 1.6 |
| Body Large | 18px (1.125rem) | 400-600 | 1.6 |
| Body Default | 16px (1rem) | 400-600 | 1.6 |
| Body Small | 14px (0.875rem) | 400-500 | 1.5 |
| Caption | 12px (0.75rem) | 400-500 | 1.4 |

## Spacing System

Uses Tailwind's default 4px spacing scale:

```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 2.5rem (40px)
3xl: 3rem (48px)
```

Applied via Tailwind classes:
- Padding: `p-4`, `px-6`, `py-2`
- Margin: `m-4`, `mx-auto`, `mb-8`
- Gap: `gap-4`, `gap-x-2`, `gap-y-6`

## Component Patterns

### Buttons

#### Primary Button
```tsx
<button className="luxury-button">
  Click Me
</button>
```
- Background: Gold accent
- Text: Dark foreground
- Hover: Shadow + scale up
- Active: Scale down

#### Outline Button
```tsx
<button className="luxury-button-outline">
  Click Me
</button>
```
- Background: Transparent
- Border: 2px gold
- Text: Gold
- Hover: Light gold background

#### Ghost Button
```tsx
<button className="text-foreground/70 hover:text-foreground smooth-transition">
  Click Me
</button>
```

### Cards & Containers

#### Pin Card
```tsx
<div className="pin-card">
  {/* Content */}
</div>
```
- Background: Card surface with transparency
- Border: Subtle border with transparency
- Border radius: 16px (rounded-2xl)
- Hover: Border color shifts to accent

#### Glass Effect
```tsx
<div className="glass-effect">
  {/* Content */}
</div>
```
- Background: Black with 30% opacity + blur
- Border: Subtle 1px border
- Backdrop: Blur filter (10px)

### Interactive States

All interactive elements follow these states:

- **Default**: Base color, 100% opacity
- **Hover**: Lighter shade, elevated shadow
- **Active**: Pressed/scaled down state
- **Disabled**: 50% opacity, no cursor

## Animation Guidelines

### Smooth Transitions
Applied via `.smooth-transition` class:
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Animations Available
- `animate-fadeIn`: 0.5s fade-in
- `animate-slideUp`: 0.5s slide from bottom
- `animate-slideInLeft`: 0.5s slide from left
- `animate-pulse-gold`: 2s pulsing gold glow

### Usage
```tsx
<div className="animate-slideUp">
  {/* Content animates in */}
</div>
```

## Layout Patterns

### Container
Max width: 1280px (7xl)
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid Layouts
- **Home/Explore**: 3-column masonry on desktop, 2 on tablet, 1 on mobile
- **Boards**: 3-column grid
- **Categories**: 3-column grid

### Spacing
- Section padding: `py-12` to `py-20`
- Inner padding: `px-4` to `px-8`
- Content gap: `gap-6` to `gap-8`

## Responsive Design

### Breakpoints
- **Mobile First**: Base styles for mobile
- **SM (640px)**: `sm:` prefix for tablet
- **MD (768px)**: `md:` prefix for small desktop
- **LG (1024px)**: `lg:` prefix for desktop
- **XL (1280px)**: `xl:` prefix for large desktop

### Mobile Optimization
- Touch targets: Minimum 44px × 44px
- Font sizes: Slightly larger on mobile for readability
- Spacing: Reduced padding on mobile
- Buttons: Full width on mobile, auto on desktop

## Accessibility

### WCAG AA Compliance
- Color contrast ratio: 4.5:1 minimum for text
- Focus states: Visible outline on all interactive elements
- Semantic HTML: Proper heading hierarchy, labels, alt text
- ARIA: Labels for icons, roles for complex components

### Best Practices
- Use semantic HTML elements (button, a, header, main, footer)
- Always include alt text for images
- Use `sr-only` class for screen-reader-only content
- Test with keyboard navigation
- Use proper heading hierarchy (H1 > H2 > H3)

## Icon Usage

### Icon Library: Lucide React
```tsx
import { Heart, Share2, Search } from 'lucide-react'

<Heart className="w-5 h-5" />
```

### Sizes
- 16px: Small icons (badges, captions)
- 20px: Regular icons (buttons, navigation)
- 24px: Large icons (hero sections)

### Colors
- Primary: `text-foreground` or specific color
- Interactive: `text-accent` for hover/active
- Disabled: `text-foreground/40`

## Dark Mode

The entire design system is optimized for dark mode:
- High contrast text on dark backgrounds
- Subtle borders with transparency
- Reduced visual weight for secondary elements
- Strategic use of accent colors for focus

No light mode implementation required—dark mode is the primary design.

## Code Organization

### Component Structure
```tsx
'use client'; // Mark as client component if needed

import React, { useState } from 'react';
import { IconName } from 'lucide-react';

interface ComponentProps {
  // Props definition
}

export default function Component({
  // Destructure props
}: ComponentProps) {
  // Component logic

  return (
    // JSX
  );
}
```

### Naming Conventions
- **Components**: PascalCase (e.g., `PinCard`)
- **Files**: kebab-case (e.g., `pin-card.tsx`)
- **CSS Classes**: snake-case (e.g., `luxury-button`)
- **Variables**: camelCase (e.g., `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_WIDTH`)

## Performance Tips

1. **Use Next.js Image component** for all images
2. **Implement lazy loading** for long lists
3. **Optimize animations** using GPU acceleration
4. **Use CSS classes** instead of inline styles
5. **Minimize component re-renders** with proper state management
6. **Code split** large pages with dynamic imports

---

This design system ensures consistency, accessibility, and a premium user experience across the Auroric platform.
