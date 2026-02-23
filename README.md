# SafeDiscover Defender Suite (Single-File App)

A polished single-page security console delivered as **one application file**: `index.html`.

## Includes

- Advanced authentication interface (login + sign up).
- Advanced antivirus protection layers.
- Anti-control resilience stack (anti-blackout continuity, anti-control access lock, privilege takeover guard, and policy hijack defense).
- Simulated deep scan engine with threat and control-integrity telemetry.
- Security logs, hardening actions, and control-plane restore actions.

## Run locally

```bash
python3 -m http.server 8181
```

Open <http://localhost:8181>.

## Windows support files

- `windows/SafeDiscoverLauncher.bat` - start local host and open browser.
- `windows/SafeDiscoverLauncher.ps1` - PowerShell launcher.
- `windows/SafeDiscover.manifest` - Windows app manifest template.
- `windows/SafeDiscoverInstaller.iss` - Inno Setup installer script (packages single `index.html`).
