const { BrowserWindow } = require('electron');

async function imprimirCheque(datos) {
  if (!datos.bancoConfig) {
    throw new Error('No se encontró configuración para el banco seleccionado');
  }
  const b = datos.bancoConfig;

  // Aquí iría la lógica real para imprimir, usando por ejemplo:
  // - Un BrowserWindow oculto para renderizar un HTML con la plantilla de cheque y la configuración de posición
  // - O una librería específica para impresión en Node/Electron

  // Ejemplo base con BrowserWindow oculto para imprimir plantilla HTML:

  return new Promise((resolve, reject) => {
    try {
      const printWindow = new BrowserWindow({ show: false });

      // Construir el contenido HTML dinámico con los datos y posiciones
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 0; margin: 0; }
              .campo {
                position: absolute;
                white-space: nowrap;
                font-size: 12pt;
              }
            </style>
          </head>
          <body>
            <div class="campo" style="left:${b.beneficiarioX}px; top:${b.beneficiarioY}px;">
              ${datos.beneficiario}
            </div>
            <div class="campo" style="left:${b.montoX}px; top:${b.montoY}px;">
              Q${datos.monto.toFixed(2)}
            </div>
            <div class="campo" style="left:${b.montoLetrasX}px; top:${b.montoLetrasY}px;">
              ${datos.montoLetras}
            </div>
            <div class="campo" style="left:${b.fechaX}px; top:${b.fechaY}px;">
              ${datos.lugarYFecha}
            </div>
            <div class="campo" style="left:10px; top:10px; font-size: 12px; font-weight: normal;">
              Cheque No: ${datos.noCheque}
            </div>
          </body>
        </html>
      `;

      printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({}, (success, errorType) => {
          printWindow.close();
          if (!success) {
            reject(new Error(errorType));
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function imprimirPrueba(config) {
  if (!config.nombreBanco) {
    throw new Error('Debe especificar el nombre del banco para la prueba de impresión');
  }

  // Aquí se puede hacer una impresión de un cheque con datos fijos para pruebas, usando la configuración pasada
  // Por ejemplo, posiciones de texto en el cheque para ver si la configuración está correcta

  return new Promise((resolve, reject) => {
    try {
      const printWindow = new BrowserWindow({ show: false });

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 0; margin: 0; }
              .campo {
                position: absolute;
                white-space: nowrap;
                font-weight: bold;
                color: #007700;
              }
            </style>
          </head>
          <body>
            <div class="campo" style="left:${config.beneficiarioX}px; top:${config.beneficiarioY}px;">
              Beneficiario Prueba
            </div>
            <div class="campo" style="left:${config.montoX}px; top:${config.montoY}px;">
              Q1234.56
            </div>
            <div class="campo" style="left:${config.montoLetrasX}px; top:${config.montoLetrasY}px;">
              Mil doscientos treinta y cuatro con 56/100
            </div>
            <div class="campo" style="left:${config.fechaX}px; top:${config.fechaY}px;">
              Ciudad, 01/01/2025
            </div>
            <div class="campo" style="left:10px; top:10px; font-size: 12px; font-weight: normal; color: #555;">
              Prueba de impresión para banco: ${config.nombreBanco}
            </div>
          </body>
        </html>
      `;

      printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({}, (success, errorType) => {
          printWindow.close();
          if (!success) {
            reject(new Error(errorType));
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { imprimirCheque, imprimirPrueba };
