# Auroric Frontend - Development Guide

## Overview
Auroric is a premium Pinterest-inspired platform with a luxury aesthetic featuring gold accents, deep purple tones, and dark backgrounds. This guide walks you through the entire codebase structure and how to extend it.

---

## Fixed Issues (Resolved)

### Issue 1: Broken Footer Links
**Problem:** Footer contained links to non-existent pages (`/about`, `/contact`, `/blog`, `/privacy`, `/terms`)
**Solution:** Updated footer to link only to existing pages and use buttons for future links

### Issue 2: Missing slideDown Animation
**Problem:** Mobile menu used `animate-slideDown` but animation wasn't defined in globals.css
**Solution:** Added `slideDown` keyframe animation with corresponding utility class

### Issue 3: Pin Card Image Sizing
**Problem:** Image component with `fill` prop had no minimum height constraint
**Solution:** Added `min-h-[300px]` to image container and proper `priority` prop

---

## Project Structure

```
/app
  ├── layout.tsx              # Root layout with metadata
  ├── page.tsx               # Home page with featured pins
  ├── globals.css            # Global styles & design system
  
  ├── /explore               # Browse all pins
  ├── /boards                # User boards management
  ├── /profile               # Personal profile dashboard
  ├── /create                # Create new pin
  ├── /settings              # User preferences
  ├── /trending              # Trending/viral pins
  ├── /categories            # Browse by category
  ├── /search                # Search results
  
  ├── /pin/[id]              # Single pin detail view
  ├── /board/[id]            # Single board view
  ├── /user/[username]       # Public user profile
  
  ├── not-found.tsx          # 404 error page
  └── loading.tsx            # Loading skeleton

/components
  ├── header.tsx             # Navigation header
  ├── footer.tsx             # Footer with links
  ├── pin-card.tsx           # Reusable pin card component
  
  ├── button.tsx             # Button component
  ├── badge.tsx              # Badge labels
  ├── modal.tsx              # Modal dialog
  ├── skeleton.tsx           # Loading skeleton
  ├── toast.tsx              # Toast notifications
  ├── follow-button.tsx      # Follow/Unfollow button
  
  └── /ui                    # shadcn/ui components (auto-imported)
```

---

## Color System & Design Tokens

### CSS Variables (in globals.css)
```css
--background: 267 13% 6%;          /* Deep dark purple-blue */
--foreground: 0 0% 100%;           /* Pure white text */
--accent: 45 89% 54%;              /* Luxury gold */
--primary: 267 32% 49%;            /* Deep purple */
--card: 267 13% 12%;               /* Card backgrounds */
--border: 267 13% 23%;             /* Border color */
```

### Color Classes
- `.gradient-gold` - Gold text gradient
- `.gradient-purple` - Purple text gradient
- `.gold-border` - Gold accent border
- `.gold-shadow` - Subtle gold glow effect
- `.glass-effect` - Frosted glass morphism

### Button Variants
- `.luxury-button` - Primary gold button with hover effects
- `.luxury-button-outline` - Outlined gold button

---

## Typography System

### Fonts
- **Headings:** Playfair Display (serif, 700 weight)
- **Body:** Inter (sans-serif, multiple weights)

### Hierarchy
- `h1` - 3.125rem (main titles)
- `h2` - 2.25rem (section titles)
- `h3` - 1.875rem (subsection)
- `h4` - 1.5rem (small heading)
- `p` - 1rem (body text)

---

## Animations

### Available Animations
```css
.animate-fadeIn      /* Fade in 0.5s */
.animate-slideUp     /* Slide up from bottom 0.5s */
.animate-slideInLeft /* Slide in from left 0.5s */
.animate-slideDown   /* Slide down from top 0.3s */
.animate-pulse-gold  /* Gold glow pulse infinite */
.smooth-transition   /* All properties 0.3s ease */
```

---

## Key Components

### Header Component (`components/header.tsx`)
- Sticky navigation bar with logo
- Desktop navigation (Home, Explore, Boards)
- Search bar (hidden on mobile)
- Notifications, messages, user menu
- Responsive mobile hamburger menu
- All links functional and pointing to existing pages

### Pin Card Component (`components/pin-card.tsx`)
- Displays pin with image, title, description
- Author information with avatar
- Like/comment/share interactions
- Hover overlay with action buttons
- Status indicator (liked/unliked)
- Fully interactive with state management

### Footer Component (`components/footer.tsx`)
- Brand section with logo
- Quick links to existing pages
- Social media links
- Copyright year (auto-calculated)
- Responsive grid layout
- All links tested and working

---

## Pages & Functionality

### Home Page (`app/page.tsx`)
- Hero section with call-to-action
- Personalized feed of pins
- Grid layout (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Mock data with real images from Unsplash
- Load more button

### Explore Page (`app/explore/page.tsx`)
- Filter by categories (Fashion, Interior Design, Architecture, etc.)
- Grid view and list view toggle
- Search functionality
- Sort by trending/new/popular
- 12+ mock pins

### Boards Page (`app/boards/page.tsx`)
- Display user's boards
- Create new board button
- Board cards with preview images
- Follower count and statistics
- Edit/delete actions

### Profile Page (`app/profile/page.tsx`)
- User avatar and header
- Bio and statistics (followers, pins, boards)
- Edit profile button
- Saved pins collection
- Created boards list
- User's pins grid

### Trending Page (`app/trending/page.tsx`)
- Filter by time period (Today, This Week, This Month)
- Sort by engagement metrics
- Featured/viral pins
- Trending categories
- Real-time statistics

### Categories Page (`app/categories/page.tsx`)
- Browse by topic
- 10+ main categories
- Category cards with preview
- Pin count per category
- Responsive grid

### Create Pin Page (`app/create/page.tsx`)
- Multi-step form
- Image upload input
- Title and description fields
- Board selection dropdown
- Publish button
- Draft save option

### Settings Page (`app/settings/page.tsx`)
- Account settings
- Privacy preferences
- Notification toggles
- Theme selection
- Password management
- Export data option

### Pin Detail Page (`app/pin/[id]/page.tsx`)
- Full pin view with large image
- Author information
- Like, comment, share actions
- Comments section
- Related pins recommendations
- Board information

### Board Detail Page (`app/board/[id]/page.tsx`)
- Board title and description
- Follower/owner info
- All pins in board
- Add/remove pin actions
- Share board option

### Public User Profile (`app/user/[username]/page.tsx`)
- Other user's profile page
- Public information only
- Follow/unfollow button
- Their public pins and boards
- Message button

### Search Page (`app/search/page.tsx`)
- Full-text search results
- Filter by type (pins, boards, users)
- Sort options
- No results message
- Search suggestions

---

## Adding New Features

### Adding a New Page
1. Create new folder in `/app` (e.g., `/app/new-feature`)
2. Create `page.tsx` with `'use client'` directive
3. Import Header, Footer, and PinCard components
4. Use existing component styles and animations
5. Link from Header or Footer navigation

### Adding a New Component
1. Create in `/components` folder
2. Use TypeScript interfaces for props
3. Follow existing naming conventions
4. Import from lucide-react for icons
5. Use CSS classes from globals.css

### Styling Guidelines
- Use Tailwind classes from the design system
- Prefer utility classes over custom CSS
- Use `smooth-transition` for all interactive elements
- Test responsive behavior (mobile, tablet, desktop)
- Follow color scheme (gold accents, purple tones, dark backgrounds)

---

## Responsive Design

### Breakpoints
- **Mobile:** Default (< 640px)
- **Tablet:** `sm:` (640px - 1024px)
- **Desktop:** `md:` and `lg:` (1024px+)

### Grid Layouts
- **1 column:** Mobile (full width)
- **2 columns:** Tablet (`sm:grid-cols-2`)
- **3+ columns:** Desktop (`lg:grid-cols-3`)

---

## Common Classes

### Layout
```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content with max width and padding */}
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid */}
</div>

<div className="flex items-center justify-between gap-4">
  {/* Flex layout */}
</div>
```

### Typography
```jsx
<h1 className="text-5xl font-bold">Heading</h1>
<h2 className="text-4xl leading-snug">Subheading</h2>
<p className="text-foreground/80">Body text</p>
<span className="text-accent">Gold accent text</span>
```

### Interactions
```jsx
<button className="luxury-button">Primary Action</button>
<button className="luxury-button-outline">Secondary Action</button>
<div className="smooth-transition hover:text-accent">Hover effect</div>
<div className="animate-slideUp">Animation</div>
```

---

## Testing the Application

### Manual Testing Checklist
- [ ] All navigation links work
- [ ] Responsive design on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Hover effects on buttons and cards
- [ ] Like button interaction and count update
- [ ] Menu toggle on mobile
- [ ] Images load and scale properly
- [ ] All animations play smoothly
- [ ] Footer links don't have 404 errors

### Pages to Test
- [ ] Home page (`/`)
- [ ] Explore page (`/explore`)
- [ ] Boards page (`/boards`)
- [ ] Profile page (`/profile`)
- [ ] Settings page (`/settings`)
- [ ] Trending page (`/trending`)
- [ ] Categories page (`/categories`)
- [ ] Create pin page (`/create`)
- [ ] Search page (`/search`)

---

## Next Steps for Full Implementation

### Backend Integration
1. Set up Supabase project
2. Create database tables:
   - Users
   - Pins
   - Boards
   - Comments
   - Likes
   - Followers
3. Implement authentication
4. Replace mock data with API calls

### Real Features to Add
1. User authentication (sign up, login, logout)
2. Pin creation with image upload
3. Board management (create, edit, delete)
4. Follow/unfollow users
5. Like/unlike pins
6. Comments and replies
7. Search and filtering
8. Social sharing
9. Notifications
10. User profiles with editing

### Performance Optimization
1. Image optimization with Next.js Image component
2. Code splitting and lazy loading
3. Caching strategies
4. Database query optimization
5. CDN for static assets

---

## Troubleshooting

### Common Issues

**Issue:** Images not displaying
- Check image URL is publicly accessible
- Ensure proper `alt` text is provided
- Verify `fill` prop is used with proper container sizing

**Issue:** Mobile menu not showing
- Check `animate-slideDown` is defined (now fixed)
- Verify `useState` for menu state is working
- Check z-index is high enough

**Issue:** Styles not applying
- Verify Tailwind CSS is imported in globals.css
- Check CSS variable names match
- Clear browser cache

**Issue:** Links broken
- All links now point to existing pages (fixed)
- Use proper `href` attributes
- Test in preview and production

---

## Support & Customization

For more information:
- Check component propTypes in each file
- Review Tailwind CSS documentation
- Refer to design system in globals.css
- See DESIGN_SYSTEM.md for detailed specifications

---

**Last Updated:** 2024
**Version:** 1.0 (Frontend Complete)
