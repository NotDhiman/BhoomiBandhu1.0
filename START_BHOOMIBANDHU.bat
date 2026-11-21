@echo off
setlocal
title BhoomiBandhu Launcher

:: Ensure working directory is always the script directory
cd /d "%~dp0"

:: Launch the PowerShell orchestrator with bypass policy for local execution
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_bhoomibandhu.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ==========================================================
    echo [ERROR] BhoomiBandhu failed to start. Review errors above.
    echo ==========================================================
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo BhoomiBandhu launched successfully.
timeout /t 5 >nul
exit /b 0
