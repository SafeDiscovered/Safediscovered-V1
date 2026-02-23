# SafeDiscover Defender Suite

SafeDiscover is now a real **Windows desktop app shell** around the single-file `index.html` using **WebView2 + .NET 8**.

## What is included

- `index.html` (single-file app UI + logic).
- `windows/SafeDiscoverDesktop/` desktop host project.
- Native protection actions (when running desktop host on Windows):
  - Read Microsoft Defender status.
  - Trigger Defender quick scan.
  - Read Windows Firewall profile status.
  - Enable firewall profiles.

> Note: true kernel-level or EDR-grade protection requires signed drivers and enterprise backend services. This project provides a secure desktop control surface + native Windows Defender/Firewall orchestration.

## Run web mode (UI only)

```bash
python3 -m http.server 8181
```

Open <http://localhost:8181>.

## Build and run Windows desktop app

Requirements:
- Windows 10/11
- .NET 8 SDK
- WebView2 runtime

Commands (from repo root in PowerShell):

```powershell
dotnet restore .\windows\SafeDiscoverDesktop\SafeDiscoverDesktop.csproj
dotnet run --project .\windows\SafeDiscoverDesktop\SafeDiscoverDesktop.csproj
```

To publish a distributable build:

```powershell
dotnet publish .\windows\SafeDiscoverDesktop\SafeDiscoverDesktop.csproj -c Release -r win-x64 --self-contained false
```
