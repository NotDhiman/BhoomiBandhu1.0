<#
.SYNOPSIS
    Launcher engine for BhoomiBandhu (FastAPI Backend + React Vite Frontend).
.DESCRIPTION
    Validates environment, checks port availability without destructive killing,
    spawns FastAPI and Vite in individual visible console windows, waits for health checks,
    and opens the web frontend.
#>

[CmdletBinding()]
param (
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function Write-Step {
    param([string]$Message)
    Write-Host "`n[BHOOMIBANDHU] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-WarnMsg {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Get-ListenerProcess {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $first = $connections | Select-Object -First 1
        $proc = Get-Process -Id $first.OwningProcess -ErrorAction SilentlyContinue
        return [PSCustomObject]@{
            ProcessId   = $first.OwningProcess
            ProcessName = if ($proc) { $proc.ProcessName } else { "Unknown" }
        }
    }
    return $null
}

function Test-PortHealthy {
    param(
        [string]$Url,
        [int]$Port
    )
    try {
        $request = [System.Net.WebRequest]::Create($Url)
        $request.Timeout = 2000
        $request.Method = 'GET'
        $response = $request.GetResponse()
        $status = [int]$response.StatusCode
        $response.Close()
        return ($status -ge 200 -and $status -lt 500)
    }
    catch [System.Net.WebException] {
        if ($_.Response) {
            $status = [int]$_.Response.StatusCode
            $_.Response.Close()
            return ($status -ge 200 -and $status -lt 500)
        }
        return $false
    }
    catch {
        return $false
    }
}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "         BhoomiBandhu - One-Click Launcher               " -ForegroundColor Green
Write-Host "     FastAPI Backend (8000) + React Vite Frontend (5173)  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Inspect Environment & Dependencies
Write-Step "Inspecting environment and dependencies..."

$PythonExe = Join-Path $ScriptDir ".venv\Scripts\python.exe"
$BackendMain = Join-Path $ScriptDir "backend\main.py"
$ViteConfig = Join-Path $ScriptDir "client\vite.config.js"
$PackageJson = Join-Path $ScriptDir "package.json"
$NodeModulesVite = Join-Path $ScriptDir "node_modules\vite\bin\vite.js"

$HasError = $false

if (-not (Test-Path $PythonExe)) {
    Write-ErrMsg "Virtual environment Python executable not found at: $PythonExe"
    Write-Host "  Please ensure the virtual environment exists (.venv) before launching." -ForegroundColor Yellow
    $HasError = $true
}

if (-not (Test-Path $BackendMain)) {
    Write-ErrMsg "FastAPI entry point not found at: $BackendMain"
    $HasError = $true
}

if (-not (Test-Path $ViteConfig)) {
    Write-ErrMsg "Vite configuration not found at: $ViteConfig"
    $HasError = $true
}

if (-not (Test-Path $PackageJson)) {
    Write-ErrMsg "package.json not found in root: $PackageJson"
    $HasError = $true
}

$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
$NpmCmd = Get-Command npm -ErrorAction SilentlyContinue

if (-not $NodeCmd) {
    Write-ErrMsg "Node.js is not found in PATH. Please install Node.js (v18+) and try again."
    $HasError = $true
}

if (-not $NpmCmd) {
    Write-ErrMsg "npm is not found in PATH. Please ensure npm is installed and available in PATH."
    $HasError = $true
}

if ($NodeCmd -and (-not (Test-Path $NodeModulesVite))) {
    Write-ErrMsg "Vite dependencies not found in node_modules."
    Write-Host "  Please run 'npm install' in project root: $ScriptDir" -ForegroundColor Yellow
    $HasError = $true
}

if ($HasError) {
    Write-Host "`nLauncher aborted due to missing dependencies/prerequisites." -ForegroundColor Red
    exit 1
}

Write-Success "Prerequisites verified successfully."

# 2. Check Port Status (8000 and 5173)
Write-Step "Checking network ports (8000 for FastAPI, 5173 for Vite)..."

$BackendUrl = "http://127.0.0.1:8000"
$BackendDocsUrl = "http://127.0.0.1:8000/docs"
$FrontendUrl = "http://localhost:5173"

$BackendListener = Get-ListenerProcess -Port 8000
$BackendAlreadyRunning = $false

if ($BackendListener) {
    if (Test-PortHealthy -Url $BackendDocsUrl -Port 8000) {
        Write-Success "Port 8000 is already active and serving BhoomiBandhu FastAPI (PID: $($BackendListener.ProcessId))."
        $BackendAlreadyRunning = $true
    }
    else {
        Write-ErrMsg "Port 8000 is occupied by process '$($BackendListener.ProcessName)' (PID: $($BackendListener.ProcessId)), but not responding to FastAPI health check."
        Write-Host "  Please stop the conflicting process or verify port 8000 before running." -ForegroundColor Yellow
        exit 1
    }
}

$FrontendListener = Get-ListenerProcess -Port 5173
$FrontendAlreadyRunning = $false

if ($FrontendListener) {
    if (Test-PortHealthy -Url $FrontendUrl -Port 5173) {
        Write-Success "Port 5173 is already active and serving BhoomiBandhu Frontend (PID: $($FrontendListener.ProcessId))."
        $FrontendAlreadyRunning = $true
    }
    else {
        Write-ErrMsg "Port 5173 is occupied by process '$($FrontendListener.ProcessName)' (PID: $($FrontendListener.ProcessId)), but not responding to Vite health check."
        Write-Host "  Please stop the conflicting process or verify port 5173 before running." -ForegroundColor Yellow
        exit 1
    }
}

# 3. Launch FastAPI Backend if needed
if (-not $BackendAlreadyRunning) {
    Write-Step "Starting FastAPI Backend in a separate window..."
    $BackendCmd = "`$host.UI.RawUI.WindowTitle = 'BhoomiBandhu - FastAPI Backend (Port 8000)'; cd '$ScriptDir'; & '$PythonExe' -m uvicorn main:app --reload --app-dir backend --host 127.0.0.1 --port 8000"
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $BackendCmd
}

# 4. Launch React + Vite Frontend if needed
if (-not $FrontendAlreadyRunning) {
    Write-Step "Starting React + Vite Frontend in a separate window..."
    $FrontendCmd = "`$host.UI.RawUI.WindowTitle = 'BhoomiBandhu - Vite Frontend (Port 5173)'; cd '$ScriptDir'; npm run dev:client"
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $FrontendCmd
}

# 5. Wait for both servers to be responsive
Write-Step "Waiting for servers to become ready..."

$TimeoutSeconds = 40
$StartTime = [DateTime]::UtcNow
$BackendReady = $false
$FrontendReady = $false

while (([DateTime]::UtcNow - $StartTime).TotalSeconds -lt $TimeoutSeconds) {
    if (-not $BackendReady) {
        $BackendReady = Test-PortHealthy -Url $BackendDocsUrl -Port 8000
    }
    if (-not $FrontendReady) {
        $FrontendReady = Test-PortHealthy -Url $FrontendUrl -Port 5173
    }

    if ($BackendReady -and $FrontendReady) {
        break
    }

    Start-Sleep -Milliseconds 800
    Write-Host -NoNewline "."
}
Write-Host ""

if (-not $BackendReady) {
    Write-ErrMsg "FastAPI Backend failed to respond at $BackendUrl within $TimeoutSeconds seconds."
    Write-Host "  Check the 'BhoomiBandhu - FastAPI Backend' console window for traceback or error details." -ForegroundColor Yellow
    exit 1
}

if (-not $FrontendReady) {
    Write-ErrMsg "React + Vite Frontend failed to respond at $FrontendUrl within $TimeoutSeconds seconds."
    Write-Host "  Check the 'BhoomiBandhu - Vite Frontend' console window for compilation or npm error details." -ForegroundColor Yellow
    exit 1
}

Write-Success "Both services are active and healthy!"
Write-Host "  - FastAPI Backend: $BackendUrl (Swagger: $BackendDocsUrl)" -ForegroundColor Gray
Write-Host "  - Vite Frontend:   $FrontendUrl" -ForegroundColor Gray

# 6. Launch Browser
if (-not $NoBrowser) {
    Write-Step "Opening BhoomiBandhu in your browser..."
    Start-Process $FrontendUrl
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  BhoomiBandhu is running! Keep the windows open.        " -ForegroundColor Green
Write-Host "  To stop the application, close the server windows or   " -ForegroundColor Green
Write-Host "  press Ctrl+C in their respective PowerShell terminals.  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
