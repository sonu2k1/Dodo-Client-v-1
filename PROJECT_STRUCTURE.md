# Dodo Point Client Concierge - Project Structure

## 📁 Root Directory
```
dodo-point-client-concierge/
├── public/                 # Static assets
├── src/                    # Source code
│   ├── assets/            # Images, fonts, icons
│   ├── components/        # Reusable React components
│   │   ├── common/       # Shared UI components
│   │   ├── layout/       # Layout components (Header, Footer, Sidebar)
│   │   └── features/     # Feature-specific components
│   ├── pages/            # Page components (routes)
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── services/         # API services
│   ├── store/            # State management (if needed)
│   ├── styles/           # Additional styles
│   ├── App.jsx           # Main App component
│   ├── App.css           # App-specific styles
│   ├── index.css         # Global styles + Tailwind
│   └── main.jsx          # Entry point
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite configuration
└── README.md
```

## 🎨 Design System

### Color Palette
- **Background**: Pure Black (#000000)
- **Neon Accents**:
  - Blue: #00d4ff
  - Purple: #b400ff
  - Pink: #ff00e5
  - Cyan: #00fff9
  - Green: #00ff88

### Glass Effects
- **Light Glass**: `rgba(255, 255, 255, 0.05)` with 12px blur
- **Medium Glass**: `rgba(255, 255, 255, 0.1)` with 12px blur
- **Heavy Glass**: Gradient overlay with 24px blur

### Utility Classes

#### Glass Cards
```jsx
<div className="glass-card">Light glass effect</div>
<div className="glass-card-medium">Medium glass effect</div>
<div className="glass-card-heavy">Heavy glass effect</div>
```

#### Neon Glows
```jsx
<div className="glow-blue">Blue neon glow</div>
<div className="glow-purple">Purple neon glow</div>
<div className="glow-pink">Pink neon glow</div>
<div className="glow-cyan">Cyan neon glow</div>
<div className="glow-green">Green neon glow</div>
```

#### Animated Border
```jsx
<div className="glow-border">Animated rainbow border</div>
```

#### Buttons
```jsx
<button className="btn-glass">Glass Button</button>
<button className="btn-glass-primary">Primary Glass Button</button>
```

#### Gradient Text
```jsx
<h1 className="text-gradient">Gradient Text</h1>
<h1 className="text-gradient-neon">Neon Gradient Text</h1>
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend (To be implemented)
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB
- **Cache**: Redis
- **AI**: Google Gemini API (gemini-1.5-pro)
- **Payments**: Razorpay or Stripe

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📦 Dependencies

### Core
- react
- react-dom

### Styling & Animation
- tailwindcss
- postcss
- autoprefixer
- framer-motion

### Icons
- lucide-react

## 🎯 Next Steps

1. **Component Library**: Create reusable components in `/src/components/`
2. **Routing**: Set up React Router for navigation
3. **Backend**: Initialize Node.js + Express server
4. **Database**: Configure MongoDB connection
5. **Authentication**: Implement user auth system
6. **API Integration**: Connect Gemini AI API
7. **Payment Gateway**: Integrate Razorpay/Stripe

## 📝 Notes

- All components follow glassmorphism design principles
- Pure black background (#000000) is enforced globally
- Neon glow effects are applied strategically for premium feel
- Animations use Framer Motion for smooth, performant transitions
- Code is production-ready with proper error handling and optimization
