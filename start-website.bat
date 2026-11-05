@echo off
setlocal EnableExtensions
title IBC website
if /i "%~1"=="open-browser" goto open_browser

echo.
echo   IBC - Indian Business Circle
echo   Starting the website. Keep this window open while you use it.
echo.

rem ---- 1. Find the IBC project folder (the one that contains package.json) ----
set "ROOT="
if exist "%~dp0package.json" set "ROOT=%~dp0"
if not defined ROOT call :find_project
if not defined ROOT (
  if exist "%USERPROFILE%\Downloads\IBC-ccr-78a3e796-su4pjp.zip" (
    echo   Unzipping the download, please wait...
    mkdir "%USERPROFILE%\Downloads\IBC-ccr-78a3e796-su4pjp" 2>nul
    tar -xf "%USERPROFILE%\Downloads\IBC-ccr-78a3e796-su4pjp.zip" -C "%USERPROFILE%\Downloads\IBC-ccr-78a3e796-su4pjp"
    call :find_project
  )
)
if not defined ROOT (
  echo   Could not find the IBC folder.
  echo   Put this file inside the IBC folder ^(next to package.json^) and double-click it again.
  echo.
  pause
  exit /b 1
)
cd /d "%ROOT%"
echo   Project folder: %CD%
echo.

rem ---- 2. Check Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is not installed. Opening the download page...
  echo   Install it, then double-click this file again.
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

rem ---- 3. Install packages (first time takes a few minutes) ----
set "npm_config_engine_strict=false"
echo   Installing packages. The first time this can take a few minutes...
call npx --yes pnpm@10 install
if errorlevel 1 (
  echo.
  echo   Installing failed. Take a screenshot of this window and send it to Claude.
  pause
  exit /b 1
)

rem ---- 4. Open the browser when the site is ready, and start the site ----
start "" /min "%~f0" open-browser
echo.
echo   Starting the website at http://localhost:3001
echo   Chrome will open by itself when it is ready.
echo   To stop the website, close this window.
echo.
call npx --yes pnpm@10 --filter @ibc/web dev
pause
exit /b 0

:find_project
for /d %%A in ("%USERPROFILE%\Downloads\IBC*") do (
  if exist "%%~fA\package.json" set "ROOT=%%~fA\"
  for /d %%B in ("%%~fA\IBC*") do if exist "%%~fB\package.json" set "ROOT=%%~fB\"
)
exit /b 0

:open_browser
rem Wait (up to about 4 minutes) until the website answers, then open it.
set /a TRIES=0
:wait_loop
set /a TRIES+=1
curl -s -o nul http://localhost:3001/ >nul 2>nul
if not errorlevel 1 goto ready
if %TRIES% geq 120 goto ready
timeout /t 2 /nobreak >nul
goto wait_loop
:ready
start "" "http://localhost:3001/"
exit
