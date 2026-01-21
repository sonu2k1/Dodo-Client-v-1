/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pure black background
        'dark': '#000000',
        // Neon accent colors for glassmorphism
        'neon': {
          blue: '#00d4ff',
          purple: '#b400ff',
          pink: '#ff00e5',
          cyan: '#00fff9',
          green: '#00ff88',
        },
        // Glass overlay colors
        'glass': {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
        'glass-heavy': '24px',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
        'neon-purple': '0 0 20px rgba(180, 0, 255, 0.5), 0 0 40px rgba(180, 0, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 0, 229, 0.5), 0 0 40px rgba(255, 0, 229, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 255, 249, 0.5), 0 0 40px rgba(0, 255, 249, 0.3)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
        'glass': '0 8px 32px 0 rgba(255, 255, 255, 0.1)',
        'glass-lg': '0 12px 48px 0 rgba(255, 255, 255, 0.15)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.18)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.8), 0 0 60px rgba(0, 212, 255, 0.5)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
