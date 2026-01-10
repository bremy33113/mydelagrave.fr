import { app, BrowserWindow, shell } from 'electron';
import path from 'path';

// Chemin vers les fichiers de l'application
const DIST_PATH = path.join(app.getAppPath(), 'dist');
const DIST_ELECTRON_PATH = path.join(app.getAppPath(), 'dist-electron');

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            preload: path.join(DIST_ELECTRON_PATH, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        // Style moderne
        titleBarStyle: 'default',
        backgroundColor: '#0f172a', // slate-900
        show: false, // Ne pas afficher avant ready-to-show
    });

    // Afficher quand prêt pour éviter le flash blanc
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Charger l'application
    if (process.env.VITE_DEV_SERVER_URL) {
        // En développement, charger depuis le serveur Vite
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // Ouvrir les DevTools en développement
        mainWindow.webContents.openDevTools();
    } else {
        // En production, charger le fichier HTML buildé
        mainWindow.loadFile(path.join(DIST_PATH, 'index.html'));
    }

    // Ouvrir les liens externes dans le navigateur par défaut
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
};

// Quand Electron est prêt, créer la fenêtre
app.whenReady().then(() => {
    createWindow();

    // Sur macOS, recréer la fenêtre si on clique sur l'icône du dock
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quitter quand toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
