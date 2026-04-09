# Publicación de ChequesApp (Windows)

Esta guía explica cómo generar y publicar un release en GitHub que funcione con `electron-updater`.

## Artefactos necesarios

Para que el auto-updater funcione, el release de GitHub debe incluir:

- `ChequesApp Setup <version>.exe` (instalador NSIS)
- `ChequesApp Setup <version>.exe.blockmap`
- `latest.yml`

Si falta `latest.yml` o el `.blockmap`, la app no podrá detectar/descargar la actualización.

## Opción A: Publicación automática (recomendada)

Requisitos:
- Tener un token de GitHub con scope `repo` (personal access token)
- Guardarlo en un archivo `.env` en la raíz del proyecto como `GITHUB_TOKEN=<tu_token>` o `GH_TOKEN=<tu_token>`

Pasos:
1. Verifica que la versión en `package.json` coincida con la versión que deseas publicar. Por ejemplo: `"version": "1.3.1"`.
2. Ejecuta (Windows PowerShell):

```powershell
npm install
npm run release
```

Esto construirá y publicará un release (no draft) en `IvanRecinos/chequesapp` con los artefactos necesarios.

Notas:
- La configuración de publicación está en `package.json` (`build.publish`) y `build.js`.
- Si el repositorio es privado, la app cliente podría no poder descargar a menos que se reconfigure el proveedor (p. ej., `generic` con una URL accesible) o se manejen tokens en runtime (no recomendado).

## Opción B: Generar artefactos localmente y publicar manualmente

Si no deseas/puedes publicar desde la línea de comandos:

1. Asegúrate de que `package.json` tenga la versión correcta (p. ej. `1.3.1`).
2. Genera los artefactos sin publicar:

```powershell
npm install
npm run dist:local
```

Esto creará los archivos en la carpeta `dist/`:
- `ChequesApp Setup <version>.exe`
- `ChequesApp Setup <version>.exe.blockmap`
- `latest.yml`

3. Ve a la página de Releases en GitHub y crea o edita el release correspondiente a la misma versión.
   - Asegúrate de que el tag coincida con la versión (por ejemplo, `v1.3.1` o `1.3.1` según tu convención) y que el release esté "Published" (no draft/pre-release).
4. Sube manualmente esos tres archivos al release y guarda los cambios.

## Verificación

- En la app, usa el menú "Buscar actualizaciones". Con `electron-log` habilitado, revisa el log en Windows:
  - `%APPDATA%/ChequesApp/logs/main.log`
- Si todo está correcto, verás eventos `checking-for-update` y `update-available`, y luego progreso de descarga.

## Problemas comunes

- Falta `latest.yml` en el release -> No detecta actualizaciones.
- Falta `.blockmap` -> Problemas con la descarga/diferencias.
- Tag/versión no coinciden -> `electron-updater` ignora el release.
- Release en draft/pre-release -> No se detecta (a menos que configures `allowPrerelease`).
- Repo privado -> El cliente no puede acceder sin cambiar proveedor o manejar tokens.
