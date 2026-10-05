@echo off
chcp 65001 >nul
title Burgenfall 8.7
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Bitte zuerst Node.js LTS installieren: https://nodejs.org
 pause
 exit /b 1
)
if not exist node_modules\three\build\three.module.js (
 call npm install --omit=dev
 if errorlevel 1 (
  echo Installation fehlgeschlagen.
  pause
  exit /b 1
 )
)
set PORT=5035
set HTTP=1
echo Burgenfall startet auf http://localhost:5035
echo Dieses Fenster offen lassen. Beenden mit Strg+C.
start "" /b powershell -NoProfile -Command "for($i=0;$i -lt 30;$i++){try{$r=Invoke-WebRequest 'http://localhost:5035/health' -UseBasicParsing -TimeoutSec 1;if($r.StatusCode -eq 200){Start-Process 'http://localhost:5035';break}}catch{};Start-Sleep -Seconds 1}"
node server.js
pause
