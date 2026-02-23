[Setup]
AppName=SafeDiscover Defender Suite
AppVersion=1.0.0
DefaultDirName={autopf}\SafeDiscover
DefaultGroupName=SafeDiscover
OutputDir=.
OutputBaseFilename=SafeDiscoverSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Files]
Source: "..\index.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\styles.css"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\app.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "SafeDiscoverLauncher.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\SafeDiscover Defender"; Filename: "{app}\SafeDiscoverLauncher.bat"
Name: "{commondesktop}\SafeDiscover Defender"; Filename: "{app}\SafeDiscoverLauncher.bat"
