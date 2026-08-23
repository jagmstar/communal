# Build script for Capacitor Android mobile app.
# Temporarily moves API routes out of the app directory so Next.js
# can static-export the pages without trying to export server-side API routes.
# The native app fetches from the deployed Vercel backend.

$ErrorActionPreference = "Stop"
$projectRoot = "F:\communal"
$apiDir = "$projectRoot\src\app\api"
$apiBak = "$projectRoot\src\app\_api_bak"

Write-Host "=== Communal Mobile Build ===" -ForegroundColor Cyan

# Step 1: Move API routes out temporarily
if (Test-Path $apiDir) {
    Write-Host "Moving API routes out for static export..."
    Move-Item $apiDir $apiBak -Force
}

# Step 2: Build with static export
Write-Host "Building static export..."
$env:MOBILE_BUILD = "true"
Push-Location $projectRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
} finally {
    # Step 3: Restore API routes
    if (Test-Path $apiBak) {
        Write-Host "Restoring API routes..."
        Move-Item $apiBak $apiDir -Force
    }
    Pop-Location
    $env:MOBILE_BUILD = $null
}

Write-Host "Static export complete. Output: dist/" -ForegroundColor Green

# Step 4: Sync to Capacitor
Write-Host "Syncing Capacitor..."
Push-Location $projectRoot
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "Cap sync warning (non-fatal)" -ForegroundColor Yellow }
Pop-Location

# Step 5: Build APK
Write-Host "Building Android APK..."
$androidDir = "$projectRoot\android"
if (Test-Path $androidDir) {
    Push-Location $androidDir
    .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) { Write-Host "APK build failed - check Android SDK setup" -ForegroundColor Red; exit 1 }
    Pop-Location

    $apk = Get-ChildItem "$androidDir\app\build\outputs\apk\debug\*.apk" -ErrorAction SilentlyContinue
    if ($apk) {
        Write-Host ""
        Write-Host "=== BUILD SUCCESS ===" -ForegroundColor Green
        Write-Host "APK: $($apk.FullName)" -ForegroundColor Green
    } else {
        Write-Host "APK not found in expected location" -ForegroundColor Yellow
    }
} else {
    Write-Host "Android platform not added yet. Run: npx cap add android" -ForegroundColor Yellow
    Write-Host "Then re-run this script." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Mobile build complete ===" -ForegroundColor Cyan
