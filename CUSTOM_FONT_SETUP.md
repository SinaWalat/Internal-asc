# Custom Font Setup Instructions

## Steps to Add Your Custom Font:

### 1. Upload Your Font Files
Place your font files in `src/app/fonts/` directory. Supported formats:
- `.woff2` (recommended for best performance)
- `.woff`
- `.ttf`
- `.otf`

Example structure:
```
src/app/fonts/
  ├── YourFont-Regular.woff2
  ├── YourFont-Bold.woff2
  └── YourFont-Italic.woff2 (optional)
```

### 2. Update Font Configuration
Edit `src/app/fonts.ts` and update the font file paths:

```typescript
export const customFont = localFont({
  src: [
    {
      path: './fonts/YourFont-Regular.woff2',  // ← Update this path
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/YourFont-Bold.woff2',     // ← Update this path
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-custom',
  display: 'swap',
})
```

### 3. Enable the Font in Layout
Edit `src/app/layout.tsx`:

1. Uncomment the import line:
```typescript
import { customFont } from './fonts';
```

2. Update the body className:
```typescript
<body className={`${customFont.variable} font-sans antialiased`} suppressHydrationWarning>
```

### 4. Done!
Your custom font is now applied to the entire application. The font will be used for:
- Body text
- Headlines
- All UI components

---

## Current Status:
✅ Font folder created: `src/app/fonts/`
✅ Font configuration file created: `src/app/fonts.ts`
✅ Tailwind config updated
⏳ **Waiting for you to upload your font files**

Once you upload your fonts, just follow steps 2-3 above!
