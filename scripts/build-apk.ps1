# Локальная сборка release APK (Windows)
# Использование: .\scripts\build-apk.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $ProjectRoot "android"
$SdkPath = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$JavaHome = "C:\Program Files\Android\Android Studio\jbr"
$GradleHome = "C:\gradle"

if (-not (Test-Path $SdkPath)) {
    Write-Error "Android SDK не найден: $SdkPath. Установите Android Studio и SDK."
}

if (-not (Test-Path $JavaHome)) {
    Write-Error "JDK не найден: $JavaHome. Установите Android Studio."
}

if (-not (Test-Path $AndroidDir)) {
    Write-Host "Папка android отсутствует - запускаю expo prebuild..."
    Push-Location $ProjectRoot
    $env:CI = "1"
    npx expo prebuild --platform android --clean
    Pop-Location
}

New-Item -ItemType Directory -Force -Path $GradleHome | Out-Null

$env:ANDROID_HOME = $SdkPath
$env:ANDROID_SDK_ROOT = $SdkPath
$env:JAVA_HOME = $JavaHome
$env:GRADLE_USER_HOME = $GradleHome
$env:Path = (Join-Path $JavaHome "bin") + ";" + (Join-Path $SdkPath "platform-tools") + ";" + $env:Path

Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "GRADLE_USER_HOME=$env:GRADLE_USER_HOME"

Push-Location $AndroidDir
try {
    .\gradlew.bat assembleRelease --no-daemon
    $apk = Get-ChildItem -Path "app\build\outputs\apk\release" -Filter "*.apk" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($apk) {
        $dest = Join-Path $ProjectRoot "debet2-release.apk"
        Copy-Item $apk.FullName $dest -Force
        Write-Host ""
        Write-Host "APK готов: $dest" -ForegroundColor Green
    }
} finally {
    Pop-Location
}
