@echo off
setlocal
cd /d "%~dp0"
for /f %%P in ('powershell -NoProfile -Command "$l=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,0); $l.Start(); $p=$l.LocalEndpoint.Port; $l.Stop(); Write-Output $p"') do set PORT=%%P
set URL=http://127.0.0.1:%PORT%/?build=physics-v10-%RANDOM%

echo ==========================================
echo Summerflow Physics v10 - Fresh Run
echo Port: %PORT%
echo ==========================================

py -3 --version >nul 2>&1
if not errorlevel 1 goto USE_PY
python --version >nul 2>&1
if not errorlevel 1 goto USE_PYTHON

echo Python 3 was not detected.
start "" "%~dp0index.html"
pause
exit /b 0

:USE_PY
start "Summerflow Physics v10 Server" /D "%~dp0" cmd /k py -3 -m http.server %PORT% --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "%URL%"
exit /b 0

:USE_PYTHON
start "Summerflow Physics v10 Server" /D "%~dp0" cmd /k python -m http.server %PORT% --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "%URL%"
exit /b 0
