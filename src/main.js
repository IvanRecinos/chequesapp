const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const {
  obtenerConfiguraciones,
  guardarConfiguracionBanco,
  guardarHistorialCheque,
  obtenerHistorial,
  actualizarHistorial,
  buscarHistorial,
  eliminarChequePorId,
  obtenerChequePorId,
  obtenerBancos,
} = require('./db/db');
const { imprimirCheque, imprimirPrueba } = require('./util/imprimir');

const appVersion = app.getVersion();

let mainWindow;
let configWindow;
let historialWindow;
let acercaWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    icon: path.join(__dirname, 'assets', 'cheques.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'html', 'index.html'));

  const menu = Menu.buildFromTemplate([
    {
      label: 'Menú',
      submenu: [
        {
          label: 'Nueva disposición de cheque',
          click: () => {
            if (mainWindow) mainWindow.close();
            openConfigWindow();
          },
        },
        { label: 'Historial', click: () => openHistorialWindow() },
        { type: 'separator' },
        {
          label: 'Buscar actualizaciones',
          click: () => {
            autoUpdater.checkForUpdates();
          },
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' },
      ],
    },
    {
      label: 'Acerca de',
      submenu: [
        {
          label: `Versión: ${appVersion}`,
          enabled: false,
        },
        {
          label: 'Aplicación creada por WebDevelopmentGT',
          enabled: false,
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openConfigWindow() {
  configWindow = new BrowserWindow({
    width: 800,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  configWindow.loadFile(path.join(__dirname, 'html', 'configCheque.html'));

  configWindow.on('closed', () => {
    configWindow = null;
    if (!mainWindow) createMainWindow();
  });
}

function openHistorialWindow() {
  if (historialWindow) {
    historialWindow.focus();
    return;
  }
  historialWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  historialWindow.loadFile(path.join(__dirname, 'html', 'historial.html'));

  historialWindow.on('closed', () => {
    historialWindow = null;
  });
}

function openAcercaWindow() {
  if (acercaWindow) {
    acercaWindow.focus();
    return;
  }
  acercaWindow = new BrowserWindow({
    width: 500,
    height: 400,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  acercaWindow.loadFile(path.join(__dirname, 'html', 'acerca.html'));

  acercaWindow.on('closed', () => {
    acercaWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// AutoUpdater events
autoUpdater.on('checking-for-update', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Chequeando actualizaciones',
    message: 'Buscando actualizaciones...',
  });
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización disponible',
    message: 'Hay una nueva actualización, se descargará ahora.',
  });
});

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Sin actualizaciones',
    message: 'No hay actualizaciones actuales.',
  });
});

autoUpdater.on('error', (err) => {
  dialog.showErrorBox(
    'Error al buscar actualizaciones',
    err == null ? 'Error desconocido' : (err.stack || err).toString()
  );
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Velocidad: ${Math.round(
    progressObj.bytesPerSecond / 1024
  )} KB/s - Descargado ${Math.round(progressObj.percent)}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(log_message);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Actualización lista',
      message:
        'Actualización descargada, la aplicación se reiniciará para aplicar la actualización.',
    })
    .then(() => {
      autoUpdater.quitAndInstall();
    });
});

// IPC Handlers

ipcMain.handle('guardar-configuracion', (event, config) => {
  const result = guardarConfiguracionBanco(config);
  if (configWindow) configWindow.close();
  if (!mainWindow) createMainWindow();
  return result;
});

ipcMain.handle('obtener-bancos', () => {
  const bancos = obtenerBancos();
  return bancos.map((b) => b.nombreBanco);
});

ipcMain.handle('guardar-cheque', (event, cheque) => {
  if (!cheque.fechaGuardado) cheque.fechaGuardado = new Date().toISOString();
  return guardarHistorialCheque(cheque);
});

ipcMain.handle('obtener-historial', () => {
  return obtenerHistorial();
});

ipcMain.handle('actualizar-historial', (event, datos) => {
  return actualizarHistorial(datos);
});

ipcMain.handle('obtener-beneficiarios', () => {
  const historial = obtenerHistorial();
  const nombresUnicos = [...new Set(historial.map((c) => c.beneficiario))];
  return nombresUnicos;
});

ipcMain.handle('imprimir-cheque', async (event, datos) => {
  try {
    const bancos = obtenerConfiguraciones();
    const bancoConfig = bancos.find((b) => b.nombreBanco === datos.banco);
    if (!bancoConfig)
      throw new Error('No se encontró configuración para el banco seleccionado');

    const lugarYFecha = `${datos.lugar || 'Guatemala'}, ${datos.fecha}`;

    const datosImpresion = {
      noCheque: datos.noCheque,
      beneficiario: datos.beneficiario,
      monto: datos.monto,
      montoLetras: datos.montoLetras,
      lugarYFecha,
      bancoConfig,
    };

    await imprimirCheque(datosImpresion);
    return true;
  } catch (error) {
    console.error('Error al imprimir cheque:', error);
    throw error;
  }
});

ipcMain.handle('imprimir-prueba', async (event, config) => {
  try {
    await imprimirPrueba(config);
    return true;
  } catch (error) {
    console.error('Error al imprimir prueba:', error);
    throw error;
  }
});

ipcMain.handle('buscar-historial', (event, filtros) => {
  try {
    return buscarHistorial(filtros);
  } catch (error) {
    console.error('Error al buscar historial:', error);
    return [];
  }
});

ipcMain.handle('buscar-por-banco', (event, banco) => {
  const historial = obtenerHistorial();
  return historial.filter((c) => c.banco === banco);
});

ipcMain.handle('buscar-por-cliente', (event, cliente) => {
  const historial = obtenerHistorial();
  return historial.filter((c) => c.beneficiario === cliente);
});

ipcMain.handle('buscar-por-rango', (event, { desde, hasta }) => {
  const historial = obtenerHistorial();

  const inicio = new Date(desde);
  const fin = new Date(hasta);
  fin.setHours(23, 59, 59, 999);

  return historial.filter((c) => {
    const fecha = new Date(c.fechaGuardado || c.fecha || c.fechaImpresion);
    return fecha >= inicio && fecha <= fin;
  });
});

ipcMain.handle('eliminar-cheque', (event, id) => {
  return eliminarChequePorId(id);
});

ipcMain.handle('editar-cheque', (event, id) => {
  return obtenerChequePorId(id);
});
