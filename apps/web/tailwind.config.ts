import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── SPG Design System ──────────────────────────────
        bg: {
          DEFAULT: '#0c0c0c',
          secondary: '#1a1a1a',
          card: '#141414',
          hover: '#222222',
        },
        text: {
          DEFAULT: '#f5f5f5',
          secondary: '#a0a0a0',
          muted: '#555555',
        },
        border: {
          DEFAULT: '#2a2a2a',
          hover: '#3a3a3a',
        },
        accent: {
          DEFAULT: '#b4ff3c',
          hover: '#c5ff5c',
          dim: 'rgba(180, 255, 60, 0.15)',
        },
        accent2: '#4AFF8A',
        // ─── Etapa Colors ──────────────────────────────────
        etapa: {
          srt: '#60a5fa',
          litigios_ext: '#a78bfa',
          negociaciones: '#fbbf24',
          litigios_jud: '#f97316',
          acuerdo: '#4ade80',
          sentenciado: '#34d399',
          congelado: '#6b7280',
        },
        // ─── Evento Colors ─────────────────────────────────
        evento: {
          homologacion: '#FF6B6B',
          revision_medica: '#4ECDC4',
          cumpleanos: '#FFE66D',
          reunion: '#95E1D3',
          entrevista: '#C7CEEA',
          audiencia: '#FF8B94',
          sentencia: '#FFBE0B',
          otra: '#a0a0a0',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '1', letterSpacing: '0.02em' }],
        'display-lg': ['32px', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-md': ['24px', { lineHeight: '1.2', letterSpacing: '0.02em' }],
        'display-sm': ['18px', { lineHeight: '1.3', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(180, 255, 60, 0.2)',
        'glow-sm': '0 0 10px rgba(180, 255, 60, 0.15)',
        card: '0 2px 8px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
