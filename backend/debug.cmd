@echo off
cd /d "%~dp0"
taskkill /F /FI "WINDOWTITLE eq node*"
node --inspect=127.0.0.1:9229 app.js
