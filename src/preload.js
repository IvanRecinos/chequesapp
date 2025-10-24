const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existentes
  guardarConfiguracion: (config) => ipcRenderer.invoke('guardar-configuracion', config),
  obtenerBancos: () => ipcRenderer.invoke('obtener-bancos'),
  guardarCheque: (cheque) => ipcRenderer.invoke('guardar-cheque', cheque),
  obtenerHistorial: () => ipcRenderer.invoke('obtener-historial'),
  actualizarHistorial: (datos) => ipcRenderer.invoke('actualizar-historial', datos),
  obtenerBeneficiarios: () => ipcRenderer.invoke('obtener-beneficiarios'),
  imprimirCheque: (datos) => ipcRenderer.invoke('imprimir-cheque', datos),
  imprimirPrueba: (config) => ipcRenderer.invoke('imprimir-prueba', config),
  buscarHistorial: (filtros) => ipcRenderer.invoke('buscar-historial', filtros),
  buscarPorBanco: (banco) => ipcRenderer.invoke('buscar-por-banco', banco),
  buscarPorCliente: (cliente) => ipcRenderer.invoke('buscar-por-cliente', cliente),
  buscarPorRango: (rango) => ipcRenderer.invoke('buscar-por-rango', rango),
  eliminarCheque: (id) => ipcRenderer.invoke('eliminar-cheque', id),
  editarCheque: (id) => ipcRenderer.invoke('editar-cheque', id),
  actualizarCheque: (id, datos) => ipcRenderer.invoke('actualizar-cheque', { id, datos }),
  abrirConfigBanco: (nombreBanco) => ipcRenderer.invoke('abrir-config-banco', nombreBanco),
  abrirPrincipal: () => ipcRenderer.invoke('abrir-principal'),

  // Nuevos para Editar bancos
  obtenerConfiguracionesBancos: () => ipcRenderer.invoke('obtener-configuraciones-bancos'),
  eliminarConfigBanco: (nombreBanco) => ipcRenderer.invoke('eliminar-config-banco', nombreBanco),

  // AutoUpdater progress (si lo usas en renderer)
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_e, percent) => callback(percent)),
});
