@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo Installing dependencies for the first time, this may take a minute...
    call npm install
)

if not exist public (
    echo Building the app for the first time...
    call npm run build
)

echo Starting JARVIS server...
start /min "JARVIS Server" cmd /c "npm start"

timeout /t 3 /nobreak >nul

start "" http://localhost:3000

echo.
echo JARVIS is running in a minimized window called "JARVIS Server".
echo Close that window when you're done to stop the server.
echo.
pause
