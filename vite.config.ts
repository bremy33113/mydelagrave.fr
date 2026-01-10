import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// Détecte si on build pour Electron
const isElectron = process.env.ELECTRON === 'true';

export default defineConfig({
    plugins: [
        react(),
        // Ajouter les plugins Electron seulement si ELECTRON=true
        ...(isElectron ? [
            electron([
                {
                    // Main process
                    entry: 'electron/main.ts',
                    vite: {
                        build: {
                            outDir: 'dist-electron',
                            lib: {
                                entry: 'electron/main.ts',
                                formats: ['cjs'],
                                fileName: () => 'main.cjs'
                            },
                            rollupOptions: {
                                external: ['electron']
                            }
                        }
                    }
                },
                {
                    // Preload script
                    entry: 'electron/preload.ts',
                    onstart(options) {
                        options.reload();
                    },
                    vite: {
                        build: {
                            outDir: 'dist-electron',
                            lib: {
                                entry: 'electron/preload.ts',
                                formats: ['cjs'],
                                fileName: () => 'preload.cjs'
                            },
                            rollupOptions: {
                                external: ['electron']
                            }
                        }
                    }
                }
            ]),
            renderer()
        ] : [])
    ],
    base: './',
    server: {
        port: 5173,
        open: !isElectron // Ne pas ouvrir le navigateur si Electron
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Séparer les grosses librairies
                    'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
                    'vendor-map': ['leaflet', 'react-leaflet'],
                    'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                }
            }
        }
    }
})
