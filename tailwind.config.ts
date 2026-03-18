import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GitHub-like dark theme
        github: {
          bg: '#0D1117',
          surface: '#161B22',
          elevated: '#21262D',
          border: '#30363D',
          'border-muted': '#21262D',
          text: '#C9D1D9',
          'text-secondary': '#8B949E',
          'text-muted': '#484F58',
        },
        // Brand accent colors
        accent: {
          pink: '#ff5e84',
          blue: '#3e8bff',
          green: '#59f4b2',
          orange: '#ff8e26',
        },
        // Legacy slate compatibility with new values
        slate: {
          750: '#21262D',
          800: '#161B22',
          850: '#0D1117',
          900: '#0D1117',
          950: '#010409',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #ff5e84 0%, #3e8bff 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #ff5e84 0%, #59f4b2 100%)',
        'gradient-tertiary': 'linear-gradient(135deg, #ff5e84 0%, #ff8e26 100%)',
      },
      boxShadow: {
        'glow-pink': '0 0 20px rgba(255, 94, 132, 0.3), 0 0 40px rgba(255, 94, 132, 0.1)',
        'glow-blue': '0 0 20px rgba(62, 139, 255, 0.3), 0 0 40px rgba(62, 139, 255, 0.1)',
        'glow-green': '0 0 20px rgba(89, 244, 178, 0.3), 0 0 40px rgba(89, 244, 178, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
