# 📱 INSTRUCCIONES DE INSTALACIÓN - APP PORTEROS ATLÉTICO DE MADRID

## 🚀 PASO 1: DESCARGAR LOS ARCHIVOS

Descarga estos archivos desde el entorno donde están creados:

### Archivos principales:
- ✅ `index.html` - Página principal
- ✅ `app.js` - Lógica de la aplicación  
- ✅ `styles.css` - Estilos
- ✅ `manifest.json` - Configuración PWA
- ✅ `sw.js` - Service Worker (para funcionar offline)
- ✅ `escudo-atm.png` - Logo del Atlético
- ✅ `jspdf.umd.min.js` - Biblioteca para generar PDF

### Organiza los archivos así:
```
porteros-atletico/
├── index.html
├── app.js
├── styles.css
├── manifest.json
├── sw.js
├── escudo-atm.png
├── jspdf.umd.min.js
└── INSTRUCCIONES_INSTALACION.md
```

## 🖥️ PASO 2: EJECUTAR SERVIDOR LOCAL

### WINDOWS:

#### Opción A: Con Python (recomendado)
1. Abre **PowerShell** o **CMD** como administrador
2. Navega a la carpeta: `cd C:\ruta\a\porteros-atletico`
3. Ejecuta: `python -m http.server 8080`
4. Ve a: `http://localhost:8080`

#### Opción B: Con Node.js
1. Instala Node.js si no lo tienes
2. Abre **PowerShell** en la carpeta del proyecto
3. Ejecuta: `npx http-server -p 8080`
4. Ve a: `http://localhost:8080`

#### Opción C: Extension de Visual Studio Code
1. Instala **Live Server** en VS Code
2. Abre la carpeta del proyecto en VS Code
3. Clic derecho en `index.html` → **"Open with Live Server"**

### MAC:

#### Con Python:
1. Abre **Terminal**
2. Navega: `cd /ruta/a/porteros-atletico`
3. Ejecuta: `python3 -m http.server 8080`
4. Ve a: `http://localhost:8080`

#### Con Node.js:
1. Instala Node.js
2. En Terminal: `npx http-server -p 8080`
3. Ve a: `http://localhost:8080`

### LINUX:

#### Con Python:
```bash
cd /ruta/a/porteros-atletico
python3 -m http.server 8080
```

#### Con PHP:
```bash
cd /ruta/a/porteros-atletico
php -S localhost:8080
```

## 📱 PASO 3: INSTALAR COMO PWA

### ANDROID:

#### Chrome/Edge:
1. Ve a `http://localhost:8080`
2. Busca el botón **"Instalar App"** en la aplicación
3. Si no aparece: **Menú (⋮)** → **"Instalar aplicación"**
4. Confirma la instalación

#### Samsung Internet:
1. Ve a `http://localhost:8080`
2. **Menú** → **"Añadir página a"** → **"Pantalla de inicio"**

### iOS (iPhone/iPad):

#### Safari (OBLIGATORIO - no funciona en Chrome iOS):
1. Ve a `http://localhost:8080`
2. Toca **botón compartir** (📤)
3. **"Añadir a pantalla de inicio"**
4. Personaliza el nombre y toca **"Añadir"**

### WINDOWS (PC):

#### Chrome:
1. Ve a `http://localhost:8080`
2. Busca **ícono de instalación (⬇)** en barra de direcciones
3. O busca el botón **"Instalar App"** en la aplicación
4. O **Ctrl+Shift+A**

#### Edge:
1. Ve a `http://localhost:8080`  
2. **Menú (⋯)** → **"Aplicaciones"** → **"Instalar este sitio como aplicación"**
3. O busca el botón **"Instalar App"**

### MAC:

#### Safari:
1. Ve a `http://localhost:8080`
2. **Archivo** → **"Añadir a Dock"**

#### Chrome:
1. Ve a `http://localhost:8080`
2. **Menú (⋮)** → **"Instalar [nombre de la app]"**

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "No se puede acceder al sitio"
- ✅ Verifica que el servidor esté ejecutándose
- ✅ Asegúrate de usar el puerto correcto (8080)
- ✅ Prueba con `http://127.0.0.1:8080` en lugar de localhost

### No aparece opción de instalación:
- ✅ Actualiza la página (F5)
- ✅ Verifica que uses un navegador compatible
- ✅ Asegúrate de usar HTTP/HTTPS (no file://)
- ✅ Espera unos segundos después de cargar la página

### En iOS no funciona:
- ✅ DEBE ser Safari, no Chrome ni otros navegadores
- ✅ Verifica que tengas iOS 11.3 o superior

### Archivos no se cargan:
- ✅ Verifica que todos los archivos estén en la misma carpeta
- ✅ Respeta las mayúsculas/minúsculas en los nombres
- ✅ Verifica permisos de la carpeta

## ✅ VERIFICACIÓN DE INSTALACIÓN

Una vez instalada correctamente:
- 📱 Aparece ícono independiente en escritorio/pantalla inicio
- 🚀 Se abre sin barra del navegador (pantalla completa)
- 🔄 Funciona sin conexión a internet
- ⚡ Carga más rápido (archivos en caché)

## 🆘 SI NADA FUNCIONA

### Alternativa rápida:
1. Crea un acceso directo manual:
   - Copia `http://localhost:8080` 
   - Crea acceso directo en escritorio
   - Cambia ícono por el escudo del Atlético

### Contacto:
Si sigues teniendo problemas, proporciona:
- Sistema operativo y versión
- Navegador y versión  
- Mensaje de error exacto
- Paso donde se detiene el proceso

---

**¡Aúpa Atleti! 🔴⚪**