# Auroric Components API Reference

## Core Components

### Header Component
**File:** `components/header.tsx`

#### Usage
```jsx
import Header from '@/components/header';

export default function Page() {
  return (
    <>
      <Header />
      {/* Page content */}
    </>
  );
}
```

#### Features
- Sticky navigation bar
- Logo with gradient background
- Desktop navigation menu
- Search bar (hidden on mobile)
- Action buttons (notifications, messages, profile)
- Responsive mobile hamburger menu
- Auto close menu on link click

#### Customization
- Modify navigation links in the `<nav>` section
- Change logo text in the branding section
- Adjust search placeholder in input field

---

### Pin Card Component
**File:** `components/pin-card.tsx`

#### Props
```typescript
interface PinCardProps {
  id: string;              // Unique pin identifier
  title: string;           // Pin title
  description?: string;    // Optional description
  image: string;          // Image URL
  author: {
    name: string;         // Author name
    avatar: string;       // Avatar URL
  };
  likes: number;          // Like count
  comments: number;       // Comment count
  board?: string;         // Optional board name
  isLiked?: boolean;      // Initial like state (default: false)
}
```

#### Usage
```jsx
import PinCard from '@/components/pin-card';

const pin = {
  id: '1',
  title: 'Modern Interior Design',
  description: 'Beautiful minimalist living room',
  image: 'https://images.unsplash.com/...',
  author: { 
    name: 'John Designer', 
    avatar: 'https://...' 
  },
  likes: 234,
  comments: 12,
  board: 'Interior Design',
  isLiked: false
};

export default function Page() {
  return <PinCard {...pin} />;
}
```

#### Features
- Image with hover zoom effect
- Interactive like button with count update
- Share and menu buttons
- Author information display
- Board tag with emoji
- Comment and share stats
- Fully interactive state management

---

### Footer Component
**File:** `components/footer.tsx`

#### Usage
```jsx
import Footer from '@/components/footer';

export default function Page() {
  return (
    <>
      {/* Page content */}
      <Footer />
    </>
  );
}
```

#### Features
- Brand section with logo
- Explore links (Pins, Boards, Trending, Categories)
- Community links (Profile, Create, Search, Settings)
- Legal links (Privacy, Terms, Contact)
- Social media links
- Auto-calculated copyright year
- Fully responsive grid layout

#### Customization
- Update links in the respective sections
- Add/remove social media links
- Change brand description

---

### Button Component
**File:** `components/button.tsx`

#### Props
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

#### Usage
```jsx
import Button from '@/components/button';

export default function Page() {
  return (
    <>
      <Button variant="default">Primary Button</Button>
      <Button variant="outline">Secondary Button</Button>
      <Button variant="ghost" size="sm">Small Ghost</Button>
    </>
  );
}
```

#### Variants
- `default` - Solid gold background
- `outline` - Gold border only
- `ghost` - Transparent background
- `secondary` - Purple background

#### Sizes
- `sm` - Small padding
- `md` - Medium padding (default)
- `lg` - Large padding

---

### Badge Component
**File:** `components/badge.tsx`

#### Props
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'accent';
  className?: string;
}
```

#### Usage
```jsx
import Badge from '@/components/badge';

export default function Page() {
  return (
    <>
      <Badge>New</Badge>
      <Badge variant="accent">Featured</Badge>
      <Badge variant="outline">Trending</Badge>
    </>
  );
}
```

---

### Modal Component
**File:** `components/modal.tsx`

#### Props
```typescript
interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

#### Usage
```jsx
import Modal from '@/components/modal';
import { useState } from 'react';

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal 
        isOpen={isOpen} 
        title="Confirm Action"
        onClose={() => setIsOpen(false)}
      >
        <p>Are you sure you want to proceed?</p>
      </Modal>
    </>
  );
}
```

---

### Skeleton Component
**File:** `components/skeleton.tsx`

#### Usage
```jsx
import Skeleton from '@/components/skeleton';

export default function Page() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <Skeleton className="w-full h-80" />
      <Skeleton className="w-full h-80" />
      <Skeleton className="w-full h-80" />
    </div>
  );
}
```

#### Features
- Animated skeleton loaders
- Customizable width and height
- Perfect for loading states
- Uses `.animate-pulse` for smooth animation

---

### Toast Component
**File:** `components/toast.tsx`

#### Props
```typescript
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // milliseconds
  onClose?: () => void;
}
```

#### Usage
```jsx
import Toast from '@/components/toast';
import { useState } from 'react';

export default function Page() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <button onClick={() => showToast('Pin saved!')}>
        Save Pin
      </button>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
```

---

### Follow Button Component
**File:** `components/follow-button.tsx`

#### Props
```typescript
interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}
```

#### Usage
```jsx
import FollowButton from '@/components/follow-button';

export default function UserProfile() {
  return (
    <FollowButton 
      userId="user123"
      isFollowing={false}
      onFollowChange={(following) => console.log(following)}
    />
  );
}
```

---

## CSS Utility Classes

### Layout Utilities
```css
/* Container */
.max-w-7xl          /* Max width content container */
.mx-auto            /* Center container */

/* Spacing */
.px-4 sm:px-6 lg:px-8  /* Responsive padding */
.gap-6              /* Grid/flex gap */
.mt-20              /* Margin top */

/* Responsive */
.hidden md:flex      /* Hide on mobile, show on desktop */
.grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  /* Responsive columns */
```

### Component Classes
```css
/* Buttons */
.luxury-button           /* Primary gold button */
.luxury-button-outline   /* Outlined button */

/* Cards */
.pin-card               /* Pin card container */

/* Effects */
.glass-effect           /* Frosted glass */
.gold-border            /* Gold border */
.gold-shadow            /* Gold glow */
.smooth-transition      /* 0.3s transition all */

/* Text */
.gradient-gold          /* Gold gradient text */
.gradient-purple        /* Purple gradient text */
.text-balance           /* Optimal line breaks */
```

### Animation Classes
```css
.animate-fadeIn         /* Fade in animation */
.animate-slideUp        /* Slide up from bottom */
.animate-slideInLeft    /* Slide in from left */
.animate-slideDown      /* Slide down from top */
.animate-pulse-gold     /* Gold glow pulse */
```

---

## Tailwind Color Classes

### Backgrounds
```jsx
// Primary colors
<div className="bg-background">       {/* Dark background */}
<div className="bg-card">             {/* Card background */}
<div className="bg-primary">          {/* Purple */}
<div className="bg-accent">           {/* Gold */}

// With opacity
<div className="bg-black/30">         {/* 30% opacity black */}
<div className="bg-card/50">          {/* 50% opacity card */}
```

### Text Colors
```jsx
<p className="text-foreground">       {/* White text */}
<p className="text-foreground/80">    {/* 80% opacity */}
<p className="text-accent">           {/* Gold text */}
<p className="text-destructive">      {/* Red for errors */}
```

### Border Colors
```jsx
<div className="border border-border">        {/* Default border */}
<div className="border border-accent">       {/* Gold border */}
<div className="border-2 border-primary">    {/* Purple border */}
```

---

## Common Patterns

### Pin Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
  {pins.map((pin) => (
    <div key={pin.id} className="animate-slideUp">
      <PinCard {...pin} />
    </div>
  ))}
</div>
```

### Page Container
```jsx
<main className="flex-1 w-full py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</main>
```

### Button Group
```jsx
<div className="flex flex-col sm:flex-row gap-4">
  <button className="luxury-button">Action 1</button>
  <button className="luxury-button-outline">Action 2</button>
</div>
```

### Card Section
```jsx
<div className="pin-card p-6">
  <h3 className="text-2xl font-bold mb-4">Title</h3>
  <p className="text-foreground/80">Content</p>
</div>
```

---

## State Management

### Using useState for Interactions
```jsx
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <button 
      onClick={() => {
        setLiked(!liked);
        setCount(liked ? count - 1 : count + 1);
      }}
      className="smooth-transition"
    >
      {liked ? '❤️' : '🤍'} {count}
    </button>
  );
}
```

---

## Icons (from lucide-react)

### Common Icons Used
```jsx
import { 
  Heart, 
  Share2, 
  MessageCircle,
  Search,
  Menu,
  X,
  Bell,
  Plus,
  Sparkles,
  Grid,
  List,
  Filter,
  MoreHorizontal
} from 'lucide-react';

// Usage
<Heart className="w-5 h-5 text-accent" />
```

---

## Performance Tips

1. **Use `dynamic` imports for heavy components:**
   ```jsx
   const PinCard = dynamic(() => import('@/components/pin-card'));
   ```

2. **Lazy load images:**
   ```jsx
   <Image 
     src={image} 
     alt={title}
     loading="lazy"
     priority={false}
   />
   ```

3. **Memoize components:**
   ```jsx
   export default React.memo(PinCard);
   ```

4. **Use proper image sizing:**
   ```jsx
   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
   ```

---

## Version History

- **v1.0** - Initial frontend complete with all core components and pages

---

For more information, see DEVELOPMENT_GUIDE.md
