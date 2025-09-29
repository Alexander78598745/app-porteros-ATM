#!/bin/bash

echo "========================================"
echo " SERVIDOR PORTEROS ATLETICO DE MADRID"
echo "========================================"
echo

echo "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python no está instalado"
    echo "En Ubuntu/Debian: sudo apt install python3"
    echo "En macOS: brew install python3"
    exit 1
fi

echo "Python encontrado ✓"
echo
echo "Iniciando servidor local..."
echo
echo "┌─────────────────────────────────────┐"
echo "│  ACCEDE A LA APLICACION EN:         │"
echo "│  http://localhost:8080              │"
echo "│                                     │"
echo "│  Presiona Ctrl+C para detener       │"
echo "└─────────────────────────────────────┘"
echo

python3 -m http.server 8080