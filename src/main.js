const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const db = require('./db/db');
const { imprimirCheque, imprimirPrueba } = require('./util/imprimir');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const appVersion = app.getVersion();

let mainWindow;
let configWindow;
let historialWindow;
let acercaWindow;
let migrarWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    icon: path.join(__dirname, 'assets', 'cheques.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'html', 'index.html'));

  const menu = Menu.buildFromTemplate([
    {
      label: 'Menú',
      submenu: [
        {
          label: 'Nueva disposición de cheque', click: () => {
            if (mainWindow) mainWindow.close();
            openConfigWindow();
          }
        },
        { label: 'Historial', click: () => openHistorialWindow() },
        { label: 'Migrar datos', click: () => openMigrarWindow() },
        { type: 'separator' },
        {
          label: 'Buscar actualizaciones',
          click: () => {
            autoUpdater.checkForUpdates();
          }
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' }
      ]
    },
    {
      label: 'Acerca de',
      submenu: [
        {
          label: `Versión: ${appVersion}`,
          enabled: false
        },
        {
          label: 'Aplicación creada por WebDevelopmentGT',
          enabled: false
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openMigrarWindow() {
  if (migrarWindow) {
    migrarWindow.focus();
    return;
  }

  migrarWindow = new BrowserWindow({
    width: 480,
    height: 460,
    resizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  migrarWindow.loadFile(path.join(__dirname, 'html', 'migrar.html'));

  migrarWindow.on('closed', () => {
    migrarWindow = null;
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
    }
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
    }
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
    }
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
    message: 'Buscando actualizaciones...'
  });
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización disponible',
    message: 'Hay una nueva actualización, se descargará ahora.'
  });
});

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Sin actualizaciones',
    message: 'No hay actualizaciones actuales.'
  });
});

autoUpdater.on('error', (err) => {
  dialog.showErrorBox('Error al buscar actualizaciones', err == null ? "Error desconocido" : (err.stack || err).toString());
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Velocidad: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s - Descargado ${Math.round(progressObj.percent)}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(log_message);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización lista',
    message: 'Actualización descargada, la aplicación se reiniciará para aplicar la actualización.'
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

// IPC Handlers

ipcMain.handle('guardar-configuracion', async (event, config) => {
  const result = await db.guardarConfiguracionBanco(config);
  if (configWindow) configWindow.close();
  if (!mainWindow) createMainWindow();
  return result;
});

ipcMain.handle('obtener-bancos', async () => {
  const bancos = await db.obtenerBancos();
  return bancos.map(b => b.nombreBanco);
});

ipcMain.handle('guardar-cheque', async (event, cheque) => {
  if (!cheque.fechaGuardado) cheque.fechaGuardado = new Date().toISOString();
  return await db.guardarHistorialCheque(cheque);
});

ipcMain.handle('obtener-historial', async () => {
  return await db.obtenerHistorial();
});

ipcMain.handle('actualizar-historial', async (event, datos) => {
  return await db.actualizarHistorial(datos);
});

ipcMain.handle('obtener-beneficiarios', async () => {
  const historial = await db.obtenerHistorial();
  const nombresUnicos = [...new Set(historial.map(c => c.beneficiario))];
  return nombresUnicos;
});

ipcMain.handle('imprimir-cheque', async (event, datos) => {
  try {
    const bancos = await db.obtenerConfiguraciones();
    const bancoConfig = bancos.find(b => b.nombreBanco === datos.banco);
    if (!bancoConfig) throw new Error('No se encontró configuración para el banco seleccionado');

    const lugarYFecha = `${datos.lugar || 'Guatemala'}, ${datos.fecha}`;

    const datosImpresion = {
      noCheque: datos.noCheque,
      beneficiario: datos.beneficiario,
      monto: datos.monto,
      montoLetras: datos.montoLetras,
      lugarYFecha,
      bancoConfig
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

ipcMain.handle('buscar-historial', async (event, filtros) => {
  try {
    return await db.buscarHistorial(filtros);
  } catch (error) {
    console.error('Error al buscar historial:', error);
    return [];
  }
});

ipcMain.handle('buscar-por-banco', async (event, banco) => {
  const historial = await db.obtenerHistorial();
  return historial.filter(c => c.banco === banco);
});

ipcMain.handle('buscar-por-cliente', async (event, cliente) => {
  const historial = await db.obtenerHistorial();
  return historial.filter(c => c.beneficiario === cliente);
});

ipcMain.handle('buscar-por-rango', async (event, { desde, hasta }) => {
  const historial = await db.obtenerHistorial();

  const inicio = new Date(desde);
  const fin = new Date(hasta);
  fin.setHours(23, 59, 59, 999);

  return historial.filter(c => {
    const fecha = new Date(c.fechaGuardado || c.fecha || c.fechaImpresion);
    return fecha >= inicio && fecha <= fin;
  });
});

ipcMain.handle('eliminar-cheque', async (event, id) => {
  return await db.eliminarChequePorId(id);
});

ipcMain.handle('editar-cheque', async (event, id) => {
  const cheque = await db.obtenerChequePorId(id);
  return cheque;
});

ipcMain.handle('migrar-bancos', (e, rutaJson) => {
  const datos = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
  const insert = db.prepare(`
    INSERT OR IGNORE INTO bancos (
      nombreBanco, beneficiarioX, beneficiarioY,
      montoX, montoY, montoLetrasX, montoLetrasY,
      fechaX, fechaY
    ) VALUES (
      @nombreBanco, @beneficiarioX, @beneficiarioY,
      @montoX, @montoY, @montoLetrasX, @montoLetrasY,
      @fechaX, @fechaY
    )
  `);
  const tx = db.transaction(arr => arr.forEach(b => insert.run(b)));
  tx(datos);
  return true;
});

ipcMain.handle('migrar-historial', (e, rutaJson) => {
  const datos = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
  const insert = db.prepare(`
    INSERT INTO historial (
      noCheque, beneficiario, monto, montoLetras,
      lugar, fecha, banco, fechaGuardado
    ) VALUES (
      @noCheque, @beneficiario, @monto, @montoLetras,
      @lugar, @fecha, @banco, @fechaGuardado
    )
  `);
  const tx = db.transaction(arr => arr.forEach(h => {
    if (!h.fechaGuardado) h.fechaGuardado = new Date().toISOString();
    insert.run(h);
  }));
  tx(datos);
  return true;
});
