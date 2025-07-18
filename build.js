require('dotenv').config();
const { build } = require('electron-builder');

build({
  publish: {
    provider: 'github',
    owner: 'IvanRecinos',     // Tu usuario de GitHub con mayúscula aquí
    repo: 'chequesapp',
    private: true
  },
  // Opcional: otros ajustes si quieres
}).catch(err => {
  console.error(err);
  process.exit(1);
});
