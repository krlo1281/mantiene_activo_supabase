@echo off
title Antigravity - Inicio de Servidores
echo ============================================
echo   ANTIGRAVITY - Iniciando servidores...
echo ============================================
echo.

:: Iniciar Backend en una nueva ventana
echo [1/2] Iniciando Backend (Express + Prisma)...
start "Backend - Antigravity" cmd /k "cd /d %~dp0backend && npm run dev"

:: Pequeña pausa para dar tiempo al backend
timeout /t 3 /nobreak > nul

:: Iniciar Frontend en una nueva ventana
echo [2/2] Iniciando Frontend (Vite + React)...
start "Frontend - Antigravity" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   Servidores iniciados correctamente!
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Puedes cerrar esta ventana. Los servidores
echo seguiran corriendo en sus ventanas propias.
pause
