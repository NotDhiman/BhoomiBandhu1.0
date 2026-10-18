@echo off
echo.
echo  ====================================
echo   BhoomiBandhu - React + Express
echo  ====================================
echo.
cd /d "%~dp0"
if not exist "node_modules\vite\bin\vite.js" npm install
if not exist "client\dist\index.html" npm run build
start "" "http://localhost:3000"
npm start
pause
