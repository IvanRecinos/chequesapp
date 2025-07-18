const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  guardarConfiguracion: (config) => ipcRenderer.invoke('guardar-configuracion', config),
  obtenerBancos: () => ipcRenderer.invoke('obtener-bancos'),
  obtenerHistorial: () => ipcRenderer.invoke('obtener-historial'),
  guardarCheque: (cheque) => ipcRenderer.invoke('guardar-cheque', cheque),
  actualizarHistorial: (datos) => ipcRenderer.invoke('actualizar-historial', datos),
  obtenerBeneficiarios: () => ipcRenderer.invoke('obtener-beneficiarios'),
  imprimirCheque: (datos) => ipcRenderer.invoke('imprimir-cheque', datos),
  imprimirPrueba: (config) => ipcRenderer.invoke('imprimir-prueba', config),
  buscarHistorial: (criterio) => ipcRenderer.invoke('buscar-historial', criterio), 


  getClientes: () => ipcRenderer.invoke('obtener-beneficiarios'),
  buscarPorBanco: (banco) => ipcRenderer.invoke('buscar-por-banco', banco),
  buscarPorCliente: (cliente) => ipcRenderer.invoke('buscar-por-cliente', cliente),
  buscarPorRango: (desde, hasta) => ipcRenderer.invoke('buscar-por-rango', { desde, hasta }),
  eliminarCheque: (id) => ipcRenderer.invoke('eliminar-cheque', id),
  editarCheque: (id) => ipcRenderer.invoke('editar-cheque', id), // solo si lo manejás en main

  migrarBancos:   (ruta) => ipcRenderer.invoke('migrar-bancos', ruta),
  migrarHistorial:(ruta) => ipcRenderer.invoke('migrar-historial', ruta)
});
