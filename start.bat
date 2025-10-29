@echo off
echo Starting Employment Platform Backend...
echo.

REM Check if MongoDB is running
echo Checking MongoDB connection...
mongosh --eval "db.adminCommand('ping')" > nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB is not running. Please start MongoDB first.
    echo Run: mongod
    pause
    exit /b 1
)

REM Check if Redis is running
echo Checking Redis connection...
redis-cli ping > nul 2>&1
if %errorlevel% neq 0 (
    echo Redis is not running. Please start Redis first.
    echo Run: redis-server
    pause
    exit /b 1
)

echo All dependencies are running!
echo.

REM Seed database if needed
if not exist "seeded.flag" (
    echo Seeding database with sample data...
    npm run seed:all
    if %errorlevel% equ 0 (
        echo. > seeded.flag
        echo Database seeded successfully!
    ) else (
        echo Failed to seed database. Continuing anyway...
    )
    echo.
)

echo Starting development server...
npm run dev