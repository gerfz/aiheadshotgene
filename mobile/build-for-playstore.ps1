# AI Portrait Studio - Build Script for Play Store
# Run this script to build your app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Portrait Studio - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI installation..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
    Write-Host "EAS CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "EAS CLI is already installed." -ForegroundColor Green
}
Write-Host ""

# Check if logged in
Write-Host "Checking EAS login status..." -ForegroundColor Yellow
$loginStatus = eas whoami 2>&1
if ($loginStatus -match "Not logged in") {
    Write-Host "You need to login to EAS." -ForegroundColor Yellow
    Write-Host "Please login with your Expo account:" -ForegroundColor Cyan
    eas login
    Write-Host ""
} else {
    Write-Host "Already logged in as: $loginStatus" -ForegroundColor Green
    Write-Host ""
}

# Initialize EAS project
Write-Host "Initializing EAS project..." -ForegroundColor Yellow
$projectExists = Test-Path "app.json"
if ($projectExists) {
    $appJsonContent = Get-Content "app.json" -Raw | ConvertFrom-Json
    if ($appJsonContent.expo.extra.eas.projectId) {
        Write-Host "EAS project already initialized." -ForegroundColor Green
    } else {
        Write-Host "Running eas init..." -ForegroundColor Yellow
        eas init
    }
} else {
    Write-Host "app.json not found. Are you in the mobile directory?" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Ask user what to build
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "What would you like to build?" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. APK for testing (preview profile)" -ForegroundColor White
Write-Host "2. AAB for Play Store (production profile)" -ForegroundColor White
Write-Host "3. Both (APK first, then AAB)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Building APK for testing..." -ForegroundColor Yellow
        Write-Host "This will take about 15-20 minutes." -ForegroundColor Yellow
        Write-Host ""
        eas build --platform android --profile preview
        Write-Host ""
        Write-Host "APK build complete! Download it from the link above." -ForegroundColor Green
        Write-Host "Test it thoroughly before building for production." -ForegroundColor Yellow
    }
    "2" {
        Write-Host ""
        Write-Host "Building AAB for Play Store..." -ForegroundColor Yellow
        Write-Host "This will take about 15-20 minutes." -ForegroundColor Yellow
        Write-Host ""
        
        # Check if eas.json needs updating
        $easJsonContent = Get-Content "eas.json" -Raw | ConvertFrom-Json
        if ($easJsonContent.build.production.android.buildType -ne "app-bundle") {
            Write-Host "Updating eas.json to build AAB..." -ForegroundColor Yellow
            $easJsonContent.build.production.android.buildType = "app-bundle"
            $easJsonContent | ConvertTo-Json -Depth 10 | Set-Content "eas.json"
            Write-Host "eas.json updated." -ForegroundColor Green
        }
        
        eas build --platform android --profile production
        Write-Host ""
        Write-Host "AAB build complete! Download it from the link above." -ForegroundColor Green
        Write-Host "Upload this AAB to Google Play Console." -ForegroundColor Yellow
    }
    "3" {
        Write-Host ""
        Write-Host "Building APK first..." -ForegroundColor Yellow
        Write-Host "This will take about 15-20 minutes." -ForegroundColor Yellow
        Write-Host ""
        eas build --platform android --profile preview
        Write-Host ""
        Write-Host "APK build complete!" -ForegroundColor Green
        Write-Host ""
        $continue = Read-Host "Test the APK first. Continue with AAB build? (y/n)"
        if ($continue -eq "y" -or $continue -eq "Y") {
            Write-Host ""
            Write-Host "Building AAB for Play Store..." -ForegroundColor Yellow
            
            # Update eas.json
            $easJsonContent = Get-Content "eas.json" -Raw | ConvertFrom-Json
            if ($easJsonContent.build.production.android.buildType -ne "app-bundle") {
                Write-Host "Updating eas.json to build AAB..." -ForegroundColor Yellow
                $easJsonContent.build.production.android.buildType = "app-bundle"
                $easJsonContent | ConvertTo-Json -Depth 10 | Set-Content "eas.json"
                Write-Host "eas.json updated." -ForegroundColor Green
            }
            
            eas build --platform android --profile production
            Write-Host ""
            Write-Host "AAB build complete!" -ForegroundColor Green
        } else {
            Write-Host "Skipping AAB build. Run this script again when ready." -ForegroundColor Yellow
        }
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build process complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Download your build from the link above" -ForegroundColor White
Write-Host "2. Test the APK on real devices" -ForegroundColor White
Write-Host "3. Upload AAB to Google Play Console" -ForegroundColor White
Write-Host "4. Complete your store listing" -ForegroundColor White
Write-Host "5. Submit for review" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT.md for detailed instructions." -ForegroundColor Yellow

