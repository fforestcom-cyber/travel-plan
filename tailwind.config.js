/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          50:  '#FFF0F0',
          100: '#FFD6D6',
          200: '#FFADAD',
          400: '#FF8A80',
          500: '#FF6B6B',   // 主視覺點綴色
          600: '#E85555',
        },
        surface: '#F5F5F7',  // 全域背景
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(0,0,0,0.06)',
        'card-hover': '0 6px 24px 0 rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
