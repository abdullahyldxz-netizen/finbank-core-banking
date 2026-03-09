/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                deepblue: {
                    50: '#ecf3fc',
                    100: '#dae8f9',
                    200: '#b4d1f2',
                    300: '#8fb9ea',
                    400: '#689dde',
                    500: '#4383d4',
                    600: '#2c6cb9',
                    700: '#1f5190',
                    800: '#143867',
                    900: '#0c2240',
                    950: '#071325',
                },
                deepgreen: {
                    50: '#eefcf4',
                    100: '#ddfaea',
                    200: '#bdf5d6',
                    300: '#9ceff1',
                    400: '#7debac',
                    500: '#5be595',
                    600: '#3edc80',
                    700: '#23b562',
                    800: '#198547',
                    900: '#10562e',
                    950: '#082f19',
                },
                glass: {
                    border: 'rgba(255, 255, 255, 0.1)',
                    bg: 'rgba(255, 255, 255, 0.05)',
                }
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(228,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            backdropBlur: {
                'glass': '12px',
            }
        },
    },
    plugins: [],
}
