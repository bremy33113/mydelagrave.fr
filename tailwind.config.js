/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'app-bg': '#0f172a',
                'app-secondary': '#1e293b',
                'glass': 'rgba(30, 41, 59, 0.6)',
                'glass-border': 'rgba(148, 163, 184, 0.1)',
            },
            backdropBlur: {
                'glass': '20px',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }
        },
    },
    plugins: [],
}
