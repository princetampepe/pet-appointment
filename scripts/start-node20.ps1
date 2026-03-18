Param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$nodeDir = "C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.0-win-x64"
$node = Join-Path $nodeDir "node.exe"

if (-not (Test-Path $node)) {
  throw "Node 20 not found at: $node. Reinstall with: winget install -e --id OpenJS.NodeJS.20 --scope user --silent"
}

$env:NODE_ENV = $env:NODE_ENV ?? "development"
$env:PORT = "$Port"

# Prefer Node 20 over system Node 24 for child processes.
$pathParts = $env:PATH -split ';' | Where-Object { $_ -and ($_ -ne "C:\Program Files\nodejs\") }
$env:PATH = ($nodeDir + ';' + ($pathParts -join ';'))

Write-Host ("Using Node: " + (& $node -v) + " at " + $node)
& $node (Join-Path (Split-Path -Parent $PSScriptRoot) "server.js")

