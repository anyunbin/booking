@echo off
chcp 65001 >nul
echo ===================================
echo 预约系统启动脚本
echo ===================================
echo.

REM 检查Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js已安装
echo.

REM 检查依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

echo 🚀 正在启动后端服务器...
echo.
echo 服务器地址: http://localhost:3000
echo API地址: http://localhost:3000/api
echo.
echo 提示: 保持此窗口打开，服务器将一直运行
echo 按 Ctrl+C 可以停止服务器
echo.
echo ===================================
echo.

REM 启动服务器
call npm start

pause

