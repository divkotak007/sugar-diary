@echo off
echo Starting Sugar Diary Mobile App...
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting Expo development server...
echo.
echo INSTRUCTIONS:
echo 1. Install "Expo Go" app on your phone from Play Store/App Store
echo 2. Scan the QR code that appears below with Expo Go (Android) or Camera (iOS)
echo 3. The app will load on your phone
echo.
pause
call npx expo start
pause
