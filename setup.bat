@echo off
echo ========================================
echo Truth or Trap - Redis Setup
echo ========================================
echo.

echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)
echo OK: Node.js installed
echo.

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo OK: Dependencies installed
echo.

echo [3/4] Checking Redis...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo WARNING: Redis not running or not installed!
    echo.
    echo Please install Redis:
    echo - Windows: Download Memurai from https://www.memurai.com/get-memurai
    echo - Or use WSL2: wsl --install, then: sudo apt install redis-server
    echo.
    echo After installing, run: redis-server
    echo.
    pause
) else (
    echo OK: Redis is running
)
echo.

echo [4/4] Setting up environment...
if not exist .env (
    copy .env.example .env
    echo Created .env file from .env.example
    echo.
    echo IMPORTANT: Edit .env and set JWT_SECRET to a secure value!
    echo.
) else (
    echo .env file already exists
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure Redis is running: redis-server
echo 2. Edit .env and set JWT_SECRET
echo 3. Initialize database: npm run init-db
echo 4. Start server: npm run dev
echo.
pause
