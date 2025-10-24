const { BrowserWindow } = require('electron');

async function imprimirCheque(datos) {
  if (!datos.bancoConfig) {
    throw new Error('No se encontró configuración para el banco seleccionado');
  }
  const b = datos.bancoConfig;

  // Formateo de moneda con separadores de miles y 2 decimales
  const formatCurrency = (n) => {
    const num = typeof n === 'number' ? n : parseFloat(String(n).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return 'Q0.00';
    return 'Q' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

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
              ${datos.beneficiario.toUpperCase()}
            </div>
            <div class="campo" style="left:${b.montoX}px; top:${b.montoY}px;">
              ${formatCurrency(datos.monto)}
            </div>
            <div class="campo" style="left:${b.montoLetrasX}px; top:${b.montoLetrasY}px;">
              ${datos.montoLetras.toUpperCase()}
            </div>
            <div class="campo" style="left:${b.fechaX}px; top:${b.fechaY}px;">
              ${datos.lugarYFecha.toUpperCase()}
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
              BENEFICIARIO PRUEBA
            </div>
            <div class="campo" style="left:${config.montoX}px; top:${config.montoY}px;">
              Q1234.56
            </div>
            <div class="campo" style="left:${config.montoLetrasX}px; top:${config.montoLetrasY}px;">
              MIL DOSCIENTOS TREINTA Y CUATRO CON 56/100
            </div>
            <div class="campo" style="left:${config.fechaX}px; top:${config.fechaY}px;">
              CIUDAD, 01/01/2025
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
