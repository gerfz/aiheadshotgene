# Fix Dependencies and Rebuild

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Dependencies and Rebuilding" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Removing node_modules and package-lock.json..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
Write-Host "Cleaned up old dependencies." -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Installing compatible dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Starting new build..." -ForegroundColor Yellow
Write-Host "This will take about 15-20 minutes..." -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Build APK (preview) or AAB (production)? Enter 'apk' or 'aab'"

if ($choice -eq "aab") {
    Write-Host "Building AAB for Play Store..." -ForegroundColor Yellow
    eas build --platform android --profile production
} else {
    Write-Host "Building APK for testing..." -ForegroundColor Yellow
    eas build --platform android --profile preview
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check build status at: https://expo.dev" -ForegroundColor Yellow

