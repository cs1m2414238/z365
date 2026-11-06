param([string]$JavaHome = $env:JAVA_HOME)

$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $workspace

function Assert-Exit([string]$Step) {
    if ($LASTEXITCODE -ne 0) { throw "$Step failed (exit $LASTEXITCODE)." }
}

function Test-Url([string]$Url) {
    try { return (Invoke-WebRequest -Uri $Url -TimeoutSec 2).StatusCode -eq 200 }
    catch { return $false }
}

$portableNode = Join-Path $workspace '.tools/node-v26.13.0-win-x64'
if (Test-Path -LiteralPath (Join-Path $portableNode 'node.exe')) {
    $env:PATH = "$portableNode;$env:PATH"
}
if ((& node --version) -notmatch '^v26\.') { throw 'Install Node.js 26, then run this command again.' }

$javaCandidates = @($JavaHome) + @(
    Get-ChildItem -Path "$env:USERPROFILE/.jdks/*", "$env:ProgramFiles/Java/*", "$env:ProgramFiles/Microsoft/*", "$env:ProgramFiles/Eclipse Adoptium/*" -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | Select-Object -ExpandProperty FullName
)
$selectedJava = $null
foreach ($javaCandidate in $javaCandidates) {
    if (-not $javaCandidate) { continue }
    $javaExe = Join-Path $javaCandidate 'bin/java.exe'
    if (-not (Test-Path -LiteralPath $javaExe)) { continue }
    $version = (& $javaExe --version 2>&1 | Out-String)
    if ($version -match '(?:openjdk|java) (\d+)' -and [int]$Matches[1] -ge 21) {
        $selectedJava = $javaCandidate
        break
    }
}
if (-not $selectedJava) { throw 'Set JAVA_HOME to a JDK 21 or newer installation.' }
$env:JAVA_HOME = $selectedJava
$env:PATH = "$(Join-Path $selectedJava 'bin');$env:PATH"

if (-not (Test-Path -LiteralPath '.env')) {
    $databasePassword = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    $databasePort = if ([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners().Port -contains 5432) { 5433 } else { 5432 }
    @('SERVER_PORT=8080', 'POSTGRES_DB=z365_db', 'POSTGRES_USER=z365_user',
        "POSTGRES_PASSWORD=$databasePassword", "POSTGRES_PORT=$databasePort") |
        Set-Content -LiteralPath '.env' -Encoding utf8NoBOM
}

docker compose --env-file .env -f infra/docker-compose.yml up -d --wait --wait-timeout 120
Assert-Exit 'PostgreSQL startup'

$logDirectory = Join-Path $workspace '.tools/local-logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$runStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$apiDirectory = Join-Path $workspace 'apps/core-api'
$apiPortLine = Get-Content -LiteralPath '.env' | Where-Object { $_ -match '^SERVER_PORT=' } | Select-Object -Last 1
$apiPort = if ($env:SERVER_PORT) { $env:SERVER_PORT } elseif ($apiPortLine) { $apiPortLine.Split('=', 2)[1] } else { '8080' }
$apiUrl = "http://127.0.0.1:$apiPort"

if (-not (Test-Url "$apiUrl/api/v1/auth/csrf")) {
    $apiJar = Join-Path $apiDirectory 'target/core-api-0.0.1-SNAPSHOT.jar'
    $newestInput = @((Get-Item -LiteralPath (Join-Path $apiDirectory 'pom.xml'))) + @(Get-ChildItem -LiteralPath (Join-Path $apiDirectory 'src/main') -Recurse -File) |
        Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    if (-not (Test-Path -LiteralPath $apiJar) -or (Get-Item -LiteralPath $apiJar).LastWriteTimeUtc -lt $newestInput.LastWriteTimeUtc) {
        Push-Location -LiteralPath $apiDirectory
        try {
            & './mvnw.cmd' '-DskipTests' package
            Assert-Exit 'Core API build'
        } finally { Pop-Location }
    }
    Start-Process -FilePath (Join-Path $selectedJava 'bin/java.exe') -ArgumentList @('-jar', "`"$apiJar`"", '--server.address=127.0.0.1') -WorkingDirectory $apiDirectory -WindowStyle Hidden -RedirectStandardOutput "$logDirectory/api-$runStamp.log" -RedirectStandardError "$logDirectory/api-$runStamp.err.log" | Out-Null
    $apiReady = $false
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        if (Test-Url "$apiUrl/api/v1/auth/csrf") { $apiReady = $true; break }
        Start-Sleep -Milliseconds 500
    }
    if (-not $apiReady) { throw "The API did not become ready. Check $logDirectory." }
}

if (-not (Test-Url 'http://127.0.0.1:5173')) {
    $env:BACKEND_PROXY_URL = $apiUrl
    $viteEntry = Join-Path $workspace 'node_modules/vite/bin/vite.js'
    if (-not (Test-Path -LiteralPath $viteEntry)) { throw 'Run npm install from the repository root first.' }
    Start-Process -FilePath (Get-Command node).Source -ArgumentList @("`"$viteEntry`"", '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory (Join-Path $workspace 'apps/web') -WindowStyle Hidden -RedirectStandardOutput "$logDirectory/web-$runStamp.log" -RedirectStandardError "$logDirectory/web-$runStamp.err.log" | Out-Null
}
Write-Host "Create your account: http://127.0.0.1:5173/register"
Write-Host "API: $apiUrl | Logs: $logDirectory"
Write-Host 'PostgreSQL uses a persistent Docker volume. No user accounts are seeded.'
