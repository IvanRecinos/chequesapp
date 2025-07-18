const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron'); // 👈 modificado
const path = require('path');
const db = require('./db/db');
const { imprimirCheque, imprimirPrueba } = require('./util/imprimir');
const fs = require('fs');

// 👇 NUEVO: Actualizador y logging
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = true;
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;
let configWindow;
let historialWindow;
let acercaWindow;
let migrarWindow;
let progressWindow; // 👈 NUEVO

// 👇 NUEVO: Ventana para mostrar progreso de actualización
function createProgressWindow () {
  progressWindow = new BrowserWindow({
    width: 400,
    height: 140,
    title: 'Actualizando ChequesApp…',
    resizable: false,
    minimizable: false,
    maximizable: false,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: { nodeIntegration: true }
  });

  progressWindow.loadURL('data:text/html,' +
    encodeURIComponent(`
      <style>
        body{font-family:sans-serif;margin:0;padding:20px;}
        #bar{width:100%;background:#ddd;height:14px;border-radius:7px;overflow:hidden}
        #progress{width:0;height:14px;background:#4ade80}
        #txt{margin-top:6px;font-size:13px;text-align:center}
      </style>
      <h3 style="margin:0 0 8px">Descargando actualización…</h3>
      <div id="bar"><div id="progress"></div></div>
      <div id="txt">0&nbsp;%</div>
      <script>
        require('electron').ipcRenderer.on('download-progress',(e,p)=>{
          const pr=Math.floor(p.percent);
          document.getElementById('progress').style.width=pr+'%';
          document.getElementById('txt').textContent=pr+' %';
        });
      </script>
    `)
  );
}

// 👇 NUEVO: Eventos del autoUpdater
autoUpdater.on('error', err => {
  console.error('Updater error:', err);
});

autoUpdater.on('update-available', () => {
  createProgressWindow();
  progressWindow.once('ready-to-show', () => progressWindow.show());
});

autoUpdater.on('download-progress', p => {
  if (progressWindow) progressWindow.webContents.send('download-progress', p);
});

autoUpdater.on('update-downloaded', () => {
  if (progressWindow) progressWindow.close();
  dialog.showMessageBox({
    type: 'info',
    buttons: ['Reiniciar ahora', 'Más tarde'],
    defaultId: 0,
    message: 'Se descargó una actualización de ChequesApp.',
    detail: 'Reiniciar la aplicación para aplicar la nueva versión.'
  }).then(r => {
    if (r.response === 0) autoUpdater.quitAndInstall();
  });
});

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
        { label: 'Salir', role: 'quit' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openMigrarWindow () {
  if (migrarWindow) { migrarWindow.focus(); return; }

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

  migrarWindow.on('closed', () => { migrarWindow = null; });
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
  autoUpdater.checkForUpdates(); // 👈 NUEVO: verifica actualizaciones al iniciar

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// 👉 IPC HANDLERS (todos los que ya tenías)
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
