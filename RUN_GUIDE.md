# BhoomiBandhu - One-Click Launcher & Run Guide

This guide explains how to start, verify, and stop the **BhoomiBandhu** platform on Windows 11.

---

## 1. One-Click Quick Start

To launch the full BhoomiBandhu stack:

1. Double-click **`START_BHOOMIBANDHU.bat`** in the project root (`E:\BhoomiBandhu_React_Express_APIReady`).
2. The launcher will automatically:
   - Validate Python `.venv` and Node/npm prerequisites.
   - Check if ports `8000` (FastAPI) and `5173` (Vite) are available or already running.
   - Start **FastAPI Backend** (`backend\main.py`) in its own PowerShell console titled:
     `BhoomiBandhu - FastAPI Backend (Port 8000)`
   - Start **React + Vite Frontend** (`client\vite.config.js`) in its own PowerShell console titled:
     `BhoomiBandhu - Vite Frontend (Port 5173)`
   - Wait until both services pass health checks.
   - Automatically launch your default browser to **`http://localhost:5173`**.

---

## 2. Service URLs & Ports

| Service | Port | Local URL | Swagger / Docs |
| :--- | :--- | :--- | :--- |
| **React + Vite Frontend** | `5173` | [http://localhost:5173](http://localhost:5173) | — |
| **FastAPI Backend** | `8000` | [http://127.0.0.1:8000](http://127.0.0.1:8000) | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |

> **Vite API Proxy:** All frontend API calls made to `/api/*` are automatically proxied by Vite to `http://localhost:8000/api/*`.

---

## 3. How to Stop the Application

Because both services run in their own dedicated console windows, you have complete visibility and control:

- **Method 1 (Clean Terminal Shutdown):** Click into either console window and press `Ctrl + C`.
- **Method 2:** Close the two PowerShell console windows:
  - `BhoomiBandhu - FastAPI Backend (Port 8000)`
  - `BhoomiBandhu - Vite Frontend (Port 5173)`

---

## 4. Architecture & Safety Features

* **No Blind Port Killing:** The launcher checks if the ports are already occupied. If the BhoomiBandhu servers are already running and responsive, it reuses them safely. If an unrelated application occupies port 8000 or 5173, the launcher displays a clear error without terminating unrelated processes.
* **Explorer & Desktop Agnostic:** `START_BHOOMIBANDHU.bat` utilizes `cd /d "%~dp0"` to guarantee correct path resolution regardless of whether it is run from File Explorer, a desktop shortcut, or a terminal.
* **Express Isolation:** Only Vite frontend and FastAPI backend are launched. `server.js` (Express) is not executed.
