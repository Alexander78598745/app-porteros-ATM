@echo off
echo ========================================
echo  SERVIDOR PORTEROS ATLETICO DE MADRID
echo ========================================
echo.

echo Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no esta instalado
    echo Descarga Python desde: https://www.python.org/downloads/
    echo Presiona cualquier tecla para salir...
    pause >nul
    exit /b 1
)

echo Python encontrado ✓
echo.
echo Iniciando servidor local...
echo.
echo ┌─────────────────────────────────────┐
echo │  ACCEDE A LA APLICACION EN:         │
echo │  http://localhost:8080              │
echo │                                     │
echo │  Presiona Ctrl+C para detener       │
echo └─────────────────────────────────────┘
echo.

python -m http.server 8080