# SafeDiscover Defender Suite

A polished single-page security console with:

- Advanced authentication interface (login + sign up).
- Simulated antivirus deep scan engine with real-time progress.
- Security logs, threat metrics, and module dashboard.
- Windows launcher and installer support files.

## Run locally

```bash
python3 -m http.server 8181
```

Open <http://localhost:8181>.

## Windows support files

- `windows/SafeDiscoverLauncher.bat` - start local host and open browser.
- `windows/SafeDiscoverLauncher.ps1` - PowerShell launcher.
- `windows/SafeDiscover.manifest` - Windows app manifest template.
- `windows/SafeDiscoverInstaller.iss` - Inno Setup installer script.
