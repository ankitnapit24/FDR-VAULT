/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F6F8',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F0F2F5',
        },
        border: '#E3E7ED',
        text: {
          primary: '#202938',
          secondary: '#687385',
        },
        aicte: {
          DEFAULT: '#365F91',
          hover: '#2B4C74',
          subtle: '#EBF1F8',
        },
        status: {
          success: '#1B806A',
          'success-bg': '#E6F4EA',
          warning: '#B7791F',
          'warning-bg': '#FEF3D6',
          danger: '#C53030',
          'danger-bg': '#FCE8E6',
          info: '#2B6CB0',
          'info-bg': '#EBF8FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
