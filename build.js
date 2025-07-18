const builder = require('electron-builder');
const Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
    appId: 'com.cheques.app',
    productName: 'ChequesApp',
    directories: {
      buildResources: 'assets',
      output: 'dist'
    },
    win: {
      icon: 'src/assets/cheques.ico',
      target: 'nsis'
    },
    publish: [
      {
        provider: 'github',
        owner: 'ivanrecinos',
        repo: 'chequesapp',
        releaseType: 'release'
      }
    ]
  }
}).then(() => {
  console.log('✔️ Build finalizado y publicado correctamente.');
}).catch((error) => {
  console.error('❌ Error en build:', error);
});
