@echo off
setlocal
chcp 65001 >nul

set "ROOT=%~dp0"
set "PORT=8765"
set "NODE_EXE="

for /f "delims=" %%i in ('where node 2^>nul') do (
  if not defined NODE_EXE set "NODE_EXE=%%i"
)

if not defined NODE_EXE (
  set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)

if not exist "%NODE_EXE%" (
  echo Node.js was not found. The local server cannot start.
  echo Please install Node.js or run this script in the Codex environment.
  pause
  exit /b 1
)

if not exist "%ROOT%scripts\serve_site.js" (
  echo scripts\serve_site.js was not found. Please run this BAT from the project root.
  pause
  exit /b 1
)

echo Starting local server...
echo URL: http://127.0.0.1:%PORT%/

start "Opera Platform Local Server" cmd /k ""%NODE_EXE%" "%ROOT%scripts\serve_site.js""

timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"

echo Page opened. To stop the server, close the "Opera Platform Local Server" window.
endlocal
