$ErrorActionPreference = "Stop"
$root = Split-Path -Path $PSScriptRoot -Parent
Set-Location $root

Start-Process -WindowStyle Hidden -FilePath "python" -ArgumentList "-m http.server 8181"
Start-Sleep -Seconds 2
Start-Process "http://localhost:8181"
Write-Host "SafeDiscover Defender started."
