@echo off
echo ========================================
echo AI Portrait Studio - Build Script
echo ========================================
echo.

echo Step 1: Login to EAS
echo ------------------------------------
eas whoami
if errorlevel 1 (
    echo You need to login first.
    echo.
    eas login
)
echo.

echo Step 2: Initialize EAS Project
echo ------------------------------------
eas init
echo.

echo Step 3: Build APK for Testing
echo ------------------------------------
echo This will take about 15-20 minutes...
echo.
eas build --platform android --profile preview
echo.

echo ========================================
echo APK Build Complete!
echo ========================================
echo.
echo Download your APK from the link above and test it thoroughly.
echo.
echo When ready to build for Play Store, run:
echo   eas build --platform android --profile production
echo.
echo See DEPLOYMENT.md for detailed instructions.
echo.
pause

