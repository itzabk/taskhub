@echo off
setlocal enabledelayedexpansion

echo ===========================================
echo TaskHub Docker Environment Setup
echo ===========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo Error: .env file not found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo Success: .env created. Please update it with your configuration.
    exit /b 1
)

echo Success: .env file found
echo.

REM Check Docker
echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed
    exit /b 1
)

echo Success: Docker is installed
echo.

REM Start services
echo Starting TaskHub services...
docker-compose up -d

echo.
echo Waiting for services to become healthy (60 seconds)...
timeout /t 30 /nobreak

echo.
echo Waiting for MongoDB Master...
setlocal enabledelayedexpansion
for /L %%i in (1,1,10) do (
    docker exec taskhub-mongo-master mongosh -u root -p rootpassword --authenticationDatabase admin --eval "db.adminCommand('ping')" >nul 2>&1
    if !errorlevel! equ 0 (
        echo Success: MongoDB Master is ready
        goto mongodb_ready
    )
    if %%i lss 10 timeout /t 3 /nobreak
)

:mongodb_ready
echo Waiting for MongoDB Replicas...
timeout /t 10 /nobreak

echo.
echo Initializing MongoDB Replica Set...
docker-compose --profile init up mongo-init

echo.
echo ===========================================
echo Success: TaskHub is now running!
echo ===========================================
echo.
echo Access your services at:
echo    App Instance 1:  http://localhost:3000
echo    App Instance 2:  http://localhost:3001
echo    App Instance 3:  http://localhost:3002
echo    MailCatcher UI:  http://localhost:1080
echo.
echo Database connections:
echo    MongoDB:         localhost:27017 (user: root, pass: rootpassword)
echo    Redis:           localhost:6379 (pass: redispassword)
echo    MailCatcher:     localhost:1025 (SMTP)
echo.
echo For more information, see DOCKER_SETUP.md
echo.

endlocal
