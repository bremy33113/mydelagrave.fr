// Preload script - s'exécute avant le rendu de la page
// Peut exposer des APIs Node.js sécurisées au renderer

import { contextBridge } from 'electron';

// Exposer des informations sur la plateforme
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,
});

// Log pour debug
console.log('Preload script loaded - MyDelagrave Electron');
