@echo off
title 99 Solar Hat Yai Server
color 0A
echo ========================================================
echo   99 SOLAR HAT YAI - LOCAL WEB SERVER
echo   บริษัท 99 แมทช์ เมคเกอร์ จำกัด (คุณไจ๋ไจ๋ 090-715-1987)
echo ========================================================
echo.
echo กำลังเปิดระบบและเบราว์เซอร์...
echo หน้าเว็บหลัก: http://localhost:3000
echo สัญญาออนไลน์: http://localhost:3000/contract.html
echo พอร์ทัลทีมงาน: http://localhost:3000/portal.html
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
node server.js
pause
