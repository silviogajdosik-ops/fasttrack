@echo off
setlocal EnableDelayedExpansion
title FastTrack - Local Server
echo =============================================
echo  FastTrack -- Local Server
echo =============================================
echo.
echo  URL : http://localhost:8080/fasttrack.html
echo  Tip : Reload with F5
echo =============================================
echo.

cd /d "%~dp0"

REM ── Check if port 8080 is already in use ─────────────────────────────────────
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Port 8080 is already in use.
  echo Opening browser on existing server...
  timeout /t 1 /nobreak >nul
  start http://localhost:8080/fasttrack.html
  echo.
  echo Press any key to exit ^(server will keep running^).
  pause >nul
  goto :eof
)

REM ── Find Python ───────────────────────────────────────────────────────────────
set PY_CMD=
where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -3 --version >nul 2>&1
  if !ERRORLEVEL!==0 ( set PY_CMD=py -3 & goto :run )
)
where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python --version 2>&1 | findstr /C:"Python 3" >nul
  if !ERRORLEVEL!==0 ( set PY_CMD=python & goto :run )
)
where python3 >nul 2>&1
if %ERRORLEVEL%==0 ( set PY_CMD=python3 & goto :run )

echo.
echo ERROR: Python 3 not found.
echo Please install Python from https://www.python.org/downloads/
pause
goto :eof

:run
echo Starting server with %PY_CMD%...
start /b %PY_CMD% -m http.server 8080
timeout /t 2 /nobreak >nul
start http://localhost:8080/fasttrack.html
echo.
echo  Server is running at http://localhost:8080/fasttrack.html
echo.
echo  Press any key to STOP the server.
pause >nul

REM ── Graceful shutdown ─────────────────────────────────────────────────────────
echo Stopping server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 " ^| findstr "LISTENING"') do (
  taskkill /f /pid %%a >nul 2>&1
)
echo Done.
