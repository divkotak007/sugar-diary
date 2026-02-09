@echo off
echo Starting Sugar Diary Mobile App (WEB VERSION)...
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Installing web dependencies...
call npx expo install react-dom react-native-web @expo/metro-runtime
echo.
echo Starting web server...
echo.
echo The app will open in your browser at: http://localhost:8081
echo.
pause
call npx expo start --web
pause
