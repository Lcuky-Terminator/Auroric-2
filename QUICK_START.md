# Auroric Frontend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Installation
```bash
# Clone or download the project
cd auroric-frontend

# Install dependencies
npm install
# or
pnpm install
```

### 2. Run Development Server
```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` in your browser.

### 3. Explore the Application
- **Home Page** - `http://localhost:3000`
- **Explore** - `http://localhost:3000/explore`
- **Boards** - `http://localhost:3000/boards`
- **Profile** - `http://localhost:3000/profile`

---

## 📁 Project Structure Overview

```
app/              # Next.js pages
├── page.tsx      # Home page
├── layout.tsx    # Root layout
├── globals.css   # Global styles & design system
└── [routes]/     # Other pages

components/       # Reusable React components
├── header.tsx    # Navigation
├── footer.tsx    # Footer
├── pin-card.tsx  # Pin display card
└── ui/           # shadcn/ui components
```

---

## 🎨 Design System Quick Reference

### Colors
```jsx
<div className="bg-background">      {/* Dark background */}
<div className="text-accent">        {/* Gold text */}
<button className="luxury-button">   {/* Gold button */}
```

### Spacing & Layout
```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Centered content container */}
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive 3-column grid */}
</div>
```

### Animations
```jsx
<div className="animate-slideUp">        {/* Slide up */}
<div className="animate-fadeIn">         {/* Fade in */}
<button className="smooth-transition">   {/* Smooth hover */}
```

---

## 🧩 Common Component Patterns

### Using the Pin Card
```jsx
import PinCard from '@/components/pin-card';

const pins = [
  {
    id: '1',
    title: 'My Pin',
    image: 'https://images.unsplash.com/...',
    author: { name: 'John', avatar: 'https://...' },
    likes: 100,
    comments: 5,
    board: 'My Board'
  }
];

export default function Page() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {pins.map(pin => <PinCard key={pin.id} {...pin} />)}
    </div>
  );
}
```

### Page Layout Template
```jsx
'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 w-full py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Your content here */}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
```

### Button Group
```jsx
<div className="flex flex-col sm:flex-row gap-4">
  <button className="luxury-button">Primary</button>
  <button className="luxury-button-outline">Secondary</button>
</div>
```

---

## 🔧 Editing the Design

### Change Primary Color
Edit `app/globals.css`:
```css
--primary: 267 32% 49%;  /* Change this hue value */
```

### Change Accent (Gold) Color
```css
--accent: 45 89% 54%;    /* Adjust this to your color */
```

### Add New Page
1. Create `app/new-page/page.tsx`
2. Add imports:
   ```jsx
   import Header from '@/components/header';
   import Footer from '@/components/footer';
   ```
3. Add link to `components/header.tsx` navigation

### Customize Header Navigation
Edit `components/header.tsx`:
```jsx
<Link href="/your-page" className="text-foreground/70 hover:text-accent smooth-transition">
  Your Page
</Link>
```

---

## 📚 Documentation Files

| File | Read When |
|------|-----------|
| **README.md** | Setting up the project |
| **QUICK_START.md** | (This file) Getting started |
| **DEVELOPMENT_GUIDE.md** | Building features |
| **COMPONENTS_API.md** | Using components |
| **DESIGN_SYSTEM.md** | Understanding design |
| **PROJECT_SUMMARY.md** | Project overview |

---

## 🎯 Common Tasks

### Add a New Pin to Home Page
Edit `app/page.tsx` → `mockPins` array:
```jsx
const mockPins = [
  // ... existing pins ...
  {
    id: 'new',
    title: 'My New Pin',
    image: 'https://images.unsplash.com/...',
    author: { name: 'Designer', avatar: 'https://...' },
    likes: 0,
    comments: 0,
    board: 'My Board',
    isLiked: false
  }
];
```

### Change a Link
Find the link in any page and update the `href`:
```jsx
<Link href="/new-route">Link Text</Link>
```

### Update Footer Links
Edit `components/footer.tsx` → Link sections

### Customize Header
Edit `components/header.tsx` → Navigation section

---

## 🐛 Troubleshooting

### Page not loading?
- Check file name matches route
- Ensure `'use client'` is at top if using hooks
- Check for console errors (F12)

### Styles not applying?
- Clear browser cache
- Restart dev server
- Check class name spelling
- Verify CSS is imported in layout

### Image not showing?
- Verify image URL is publicly accessible
- Check `alt` text is provided
- Try a different image URL

### Animation not working?
- Check animation class spelling
- Verify animation is defined in globals.css
- Check z-index for visibility

---

## 📱 Testing on Mobile

### Using Browser DevTools
1. Press `F12` to open DevTools
2. Click device toggle icon
3. Select mobile device
4. Test responsive design

### Common Breakpoints
- Mobile: 375px
- Tablet: 768px
- Desktop: 1440px

---

## 🚀 Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Deploy in Vercel Dashboard
# 1. Go to vercel.com
# 2. Click "New Project"
# 3. Import GitHub repository
# 4. Deploy!
```

---

## 💡 Pro Tips

### 1. Use Component Props
```jsx
// ✅ Good - reusable
<PinCard {...pin} />

// ❌ Bad - not flexible
<PinCard title={pin.title} image={pin.image} .../>
```

### 2. Use Existing Classes
```jsx
// ✅ Good - uses design system
<button className="luxury-button">Click</button>

// ❌ Bad - custom styles
<button style={{backgroundColor: '#D4AF37'}}>Click</button>
```

### 3. Make Components Responsive
```jsx
// ✅ Good - responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

// ❌ Bad - not responsive
<div className="grid grid-cols-3">
```

### 4. Use TypeScript
```jsx
// ✅ Good - type safe
interface Props {
  title: string;
  count: number;
}

// ❌ Bad - no type safety
function Component(props) { }
```

---

## 🤝 Contributing

### Before Making Changes
1. Create a new branch: `git checkout -b feature/name`
2. Make your changes
3. Test on mobile and desktop
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/name`
6. Create Pull Request

### Code Style
- Use TypeScript
- Follow existing patterns
- Add comments for complex logic
- Test responsive design
- Update documentation

---

## 📖 Learning Next.js

### Key Concepts
- **App Router** - File-based routing in `/app`
- **Server/Client Components** - Use `'use client'` for interactivity
- **Image Component** - Optimized image loading
- **Dynamic Routes** - Use `[param]` for dynamic pages

### Resources
- [Next.js Docs](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

---

## 🎓 Learning Tailwind CSS

### Utility Classes
```jsx
// Spacing
<div className="p-4 m-2 gap-6">

// Responsive
<div className="text-sm md:text-base lg:text-lg">

// Colors
<div className="bg-primary text-accent">

// Hover effects
<button className="hover:bg-accent smooth-transition">
```

### Resources
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Utility-First Approach](https://tailwindcss.com/docs/utility-first)

---

## 🆘 Getting Help

### Check These First
1. **DEVELOPMENT_GUIDE.md** - Comprehensive reference
2. **COMPONENTS_API.md** - Component documentation
3. **Browser Console** - Error messages (F12)
4. **GitHub Issues** - Similar problems

### Common Questions

**Q: How do I change colors?**
A: Edit CSS variables in `app/globals.css`

**Q: How do I add a new page?**
A: Create folder in `/app` with `page.tsx`

**Q: How do I use a component?**
A: Check COMPONENTS_API.md for props and usage

**Q: How do I deploy?**
A: Push to GitHub and deploy with Vercel

---

## ✨ What's Next?

### Current State
- ✅ Frontend is complete
- ✅ All pages work
- ✅ Responsive design ready

### Next Steps
1. Connect to Supabase backend
2. Implement authentication
3. Replace mock data with real data
4. Add image upload
5. Deploy to production

---

## 📝 File Checklist

Before starting development, verify these files exist:

- [x] `app/page.tsx` - Home page
- [x] `app/layout.tsx` - Root layout
- [x] `app/globals.css` - Styles
- [x] `components/header.tsx` - Navigation
- [x] `components/footer.tsx` - Footer
- [x] `components/pin-card.tsx` - Pin component
- [x] `package.json` - Dependencies
- [x] `tailwind.config.ts` - Tailwind config
- [x] `tsconfig.json` - TypeScript config

All present? You're ready to develop! 🚀

---

## 🎉 You're All Set!

Start with the home page and explore the application. Read the documentation files as needed. Happy coding!

**Questions?** Check the documentation files or DEVELOPMENT_GUIDE.md

---

**Version:** 1.0 Complete
**Last Updated:** 2024
**Status:** Ready for Development ✅
