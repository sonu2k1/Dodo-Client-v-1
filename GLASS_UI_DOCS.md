# Glass UI Component Library

## 📦 Components

A production-ready glassmorphism component library for React with Tailwind CSS v4.

### Available Components

1. **GlassCard** - Versatile card component with customizable glow effects
2. **GlassButton** - Interactive button with multiple variants and sizes
3. **GlassInput** - Form input with password toggle and error states
4. **GlassModal** - Animated modal with keyboard support

---

## 🎨 Design Specifications

All components follow these glassmorphism principles:

- **Background**: `rgba(255, 255, 255, 0.05)`
- **Backdrop Blur**: `18-24px`
- **Border**: `rgba(255, 255, 255, 0.12)`
- **Border Radius**: `0.75rem - 1rem`
- **Hover Effects**: Soft glow animations with color variants

---

## 📚 Component Documentation

### GlassCard

Reusable glassmorphism card component with hover effects and animations.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Card content |
| `className` | `string` | `''` | Additional CSS classes |
| `hover` | `boolean` | `true` | Enable hover glow animation |
| `glowColor` | `string` | `'blue'` | Glow color: blue, purple, pink, cyan, green |
| `animated` | `boolean` | `false` | Enable entrance animation |
| `onClick` | `function` | - | Click handler |

#### Usage

```jsx
import { GlassCard } from './components/ui';

<GlassCard glowColor="blue" animated className="p-6">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</GlassCard>
```

---

### GlassButton

Interactive button component with multiple variants and glow effects.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Button content |
| `variant` | `string` | `'primary'` | Variant: primary, secondary, outline |
| `size` | `string` | `'md'` | Size: sm, md, lg |
| `glowColor` | `string` | `'blue'` | Glow color: blue, purple, pink, cyan, green |
| `disabled` | `boolean` | `false` | Disabled state |
| `fullWidth` | `boolean` | `false` | Full width button |
| `onClick` | `function` | - | Click handler |
| `type` | `string` | `'button'` | Button type: button, submit, reset |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import { GlassButton } from './components/ui';

<GlassButton 
  variant="primary" 
  size="md" 
  glowColor="blue"
  onClick={handleClick}
>
  Click Me
</GlassButton>
```

---

### GlassInput

Form input component with label, error states, and password visibility toggle.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type: text, email, password, number, etc. |
| `placeholder` | `string` | `''` | Placeholder text |
| `label` | `string` | `''` | Input label |
| `value` | `string` | - | Input value |
| `onChange` | `function` | - | Change handler |
| `error` | `boolean` | `false` | Error state |
| `errorMessage` | `string` | `''` | Error message |
| `disabled` | `boolean` | `false` | Disabled state |
| `glowColor` | `string` | `'blue'` | Glow color on focus |
| `icon` | `ReactNode` | - | Left icon |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import { GlassInput } from './components/ui';
import { Mail } from 'lucide-react';

<GlassInput
  type="email"
  label="Email Address"
  placeholder="your.email@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={<Mail size={20} />}
  glowColor="blue"
/>
```

---

### GlassModal

Animated modal component with keyboard support and body scroll lock.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Modal open state |
| `onClose` | `function` | required | Close handler |
| `children` | `ReactNode` | required | Modal content |
| `title` | `string` | `''` | Modal title |
| `size` | `string` | `'md'` | Size: sm, md, lg, xl, full |
| `closeOnOverlayClick` | `boolean` | `true` | Close on overlay click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `showCloseButton` | `boolean` | `true` | Show close button |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import { GlassModal, GlassButton } from './components/ui';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<>
  <GlassButton onClick={() => setIsOpen(true)}>
    Open Modal
  </GlassButton>

  <GlassModal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Modal Title"
    size="md"
  >
    <p>Modal content goes here</p>
  </GlassModal>
</>
```

---

## 🎯 Features

- ✅ **Production-Ready**: Fully tested and optimized
- ✅ **TypeScript Support**: PropTypes validation included
- ✅ **Accessible**: Keyboard navigation and ARIA support
- ✅ **Responsive**: Works on all screen sizes
- ✅ **Customizable**: Extensive prop options
- ✅ **Animated**: Smooth Framer Motion animations
- ✅ **Themeable**: Multiple color variants

---

## 🚀 Installation

All components are already included in the project. Simply import them:

```jsx
import { GlassCard, GlassButton, GlassInput, GlassModal } from './components/ui';
```

---

## 💡 Examples

### Login Form

```jsx
import { GlassCard, GlassInput, GlassButton } from './components/ui';
import { Mail, Lock } from 'lucide-react';

<GlassCard className="p-8 max-w-md mx-auto">
  <h2 className="text-2xl font-bold mb-6">Login</h2>
  
  <GlassInput
    type="email"
    label="Email"
    placeholder="your.email@example.com"
    icon={<Mail size={20} />}
    glowColor="blue"
  />
  
  <GlassInput
    type="password"
    label="Password"
    placeholder="Enter your password"
    icon={<Lock size={20} />}
    glowColor="purple"
  />
  
  <GlassButton variant="primary" fullWidth glowColor="cyan">
    Sign In
  </GlassButton>
</GlassCard>
```

### Confirmation Modal

```jsx
import { GlassModal, GlassButton } from './components/ui';

<GlassModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirm Action"
  size="sm"
>
  <p className="text-gray-300 mb-6">
    Are you sure you want to proceed?
  </p>
  
  <div className="flex gap-3">
    <GlassButton 
      variant="primary" 
      glowColor="green"
      onClick={handleConfirm}
    >
      Confirm
    </GlassButton>
    <GlassButton 
      variant="outline"
      onClick={() => setShowConfirm(false)}
    >
      Cancel
    </GlassButton>
  </div>
</GlassModal>
```

---

## 🎨 Color Variants

All components support these glow colors:

- `blue` - Cyan blue (#00d4ff)
- `purple` - Vibrant purple (#b400ff)
- `pink` - Hot pink (#ff00e5)
- `cyan` - Bright cyan (#00fff9)
- `green` - Neon green (#00ff88)

---

## 📁 File Structure

```
src/
└── components/
    └── ui/
        ├── GlassCard.jsx
        ├── GlassButton.jsx
        ├── GlassInput.jsx
        ├── GlassModal.jsx
        └── index.js
```

---

## 🔧 Dependencies

- `react` - Core React library
- `framer-motion` - Animation library
- `lucide-react` - Icon library
- `prop-types` - Runtime type checking

---

## 📝 Notes

- All components use Tailwind CSS v4 utilities
- Backdrop blur requires browser support
- Components are optimized for dark backgrounds
- Hover effects work best on desktop devices

---

## 🎯 Best Practices

1. **Consistent Glow Colors**: Use the same glow color for related elements
2. **Proper Spacing**: Use padding classes for internal spacing
3. **Accessibility**: Always provide labels for inputs
4. **Error Handling**: Show error states for form validation
5. **Modal Usage**: Keep modal content concise and focused
