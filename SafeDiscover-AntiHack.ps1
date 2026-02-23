Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-CommandSafe {
    param(
        [scriptblock]$Script,
        [string]$ActionName
    )

    try {
        & $Script
        return "✅ $ActionName completed"
    }
    catch {
        return "❌ $ActionName failed: $($_.Exception.Message)"
    }
}

function Get-HardeningState {
    $state = [ordered]@{}

    try {
        $defender = Get-MpComputerStatus
        $state['Defender Real-Time'] = if ($defender.RealTimeProtectionEnabled) { 'Protected' } else { 'At Risk' }
        $state['Tamper Protection'] = if ($defender.IsTamperProtected) { 'Protected' } else { 'At Risk' }
    }
    catch {
        $state['Defender Real-Time'] = 'Unknown'
        $state['Tamper Protection'] = 'Unknown'
    }

    try {
        $profiles = Get-NetFirewallProfile
        $allEnabled = @($profiles.Enabled) -notcontains $false
        $state['Firewall (All Profiles)'] = if ($allEnabled) { 'Protected' } else { 'At Risk' }
    }
    catch {
        $state['Firewall (All Profiles)'] = 'Unknown'
    }

    try {
        $rdpValue = (Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server' -Name 'fDenyTSConnections').fDenyTSConnections
        $state['RDP Exposure'] = if ($rdpValue -eq 1) { 'Protected' } else { 'At Risk' }
    }
    catch {
        $state['RDP Exposure'] = 'Unknown'
    }

    try {
        $smbFeature = Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol
        $state['SMBv1 Legacy Protocol'] = if ($smbFeature.State -eq 'Disabled') { 'Protected' } else { 'At Risk' }
    }
    catch {
        $state['SMBv1 Legacy Protocol'] = 'Unknown'
    }

    try {
        $uacValue = (Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' -Name 'EnableLUA').EnableLUA
        $state['UAC Enforcement'] = if ($uacValue -eq 1) { 'Protected' } else { 'At Risk' }
    }
    catch {
        $state['UAC Enforcement'] = 'Unknown'
    }

    return $state
}

function Set-QuickHarden {
    $results = @()

    $results += Invoke-CommandSafe -ActionName 'Enable Defender real-time monitoring' -Script {
        Set-MpPreference -DisableRealtimeMonitoring $false
    }

    $results += Invoke-CommandSafe -ActionName 'Enable Windows Firewall for Domain, Private, and Public profiles' -Script {
        Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True
    }

    $results += Invoke-CommandSafe -ActionName 'Disable inbound Remote Desktop exposure' -Script {
        Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server' -Name 'fDenyTSConnections' -Value 1
    }

    $results += Invoke-CommandSafe -ActionName 'Disable SMBv1 legacy protocol' -Script {
        Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart
    }

    $results += Invoke-CommandSafe -ActionName 'Enforce SmartScreen for Explorer' -Script {
        New-Item -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer' -Force | Out-Null
        Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer' -Name 'SmartScreenEnabled' -Value 'RequireAdmin'
    }

    return $results
}

function Start-DefenderQuickScan {
    return Invoke-CommandSafe -ActionName 'Defender quick scan' -Script {
        Start-MpScan -ScanType QuickScan
    }
}

function Get-FailedLogonIntel {
    try {
        $events = Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 4625; StartTime = (Get-Date).AddHours(-24) } -MaxEvents 150
        if (-not $events) {
            return 'No failed logons in the last 24 hours.'
        }

        $byIp = @{}
        foreach ($event in $events) {
            $xml = [xml]$event.ToXml()
            $ipNode = $xml.Event.EventData.Data | Where-Object { $_.Name -eq 'IpAddress' }
            if ($null -eq $ipNode -or [string]::IsNullOrWhiteSpace($ipNode.'#text') -or $ipNode.'#text' -eq '-') {
                continue
            }
            $ip = $ipNode.'#text'
            if (-not $byIp.Contains($ip)) { $byIp[$ip] = 0 }
            $byIp[$ip]++
        }

        if ($byIp.Count -eq 0) {
            return "Failed logons detected ($($events.Count)), but no external source IPs were present."
        }

        $top = $byIp.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5
        $lines = @('Top failed-logon source IPs (24h):')
        foreach ($entry in $top) {
            $lines += "- $($entry.Key): $($entry.Value) attempts"
        }
        return ($lines -join [Environment]::NewLine)
    }
    catch {
        return "Failed-logon intel unavailable: $($_.Exception.Message)"
    }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'SafeDiscover Anti-Hack Desktop'
$form.Size = New-Object System.Drawing.Size(980, 680)
$form.StartPosition = 'CenterScreen'
$form.BackColor = [System.Drawing.Color]::FromArgb(18, 22, 34)
$form.ForeColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Advanced Anti-Hack Control Center'
$title.Font = New-Object System.Drawing.Font('Segoe UI Semibold', 20)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(24, 18)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = 'Real Windows hardening + threat response actions (Defender, Firewall, RDP, SMB, SmartScreen, Logon Intel).'
$subtitle.AutoSize = $true
$subtitle.Location = New-Object System.Drawing.Point(26, 58)
$form.Controls.Add($subtitle)

$adminBanner = New-Object System.Windows.Forms.Label
$adminBanner.AutoSize = $true
$adminBanner.Location = New-Object System.Drawing.Point(26, 86)
$adminBanner.ForeColor = [System.Drawing.Color]::Khaki
$adminBanner.Text = if (Test-IsAdmin) { 'Running elevated: full hardening actions available.' } else { 'Not elevated: relaunch PowerShell as Administrator to apply hardening actions.' }
$form.Controls.Add($adminBanner)

$grid = New-Object System.Windows.Forms.ListView
$grid.Location = New-Object System.Drawing.Point(26, 120)
$grid.Size = New-Object System.Drawing.Size(560, 300)
$grid.View = 'Details'
$grid.FullRowSelect = $true
$grid.GridLines = $true
$null = $grid.Columns.Add('Protection Module', 360)
$null = $grid.Columns.Add('Status', 180)
$form.Controls.Add($grid)

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(26, 436)
$logBox.Size = New-Object System.Drawing.Size(928, 190)
$logBox.Multiline = $true
$logBox.ScrollBars = 'Vertical'
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(10, 13, 23)
$logBox.ForeColor = [System.Drawing.Color]::PaleGreen
$form.Controls.Add($logBox)

function Write-Log {
    param([string]$Message)
    $stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $logBox.AppendText("[$stamp] $Message" + [Environment]::NewLine)
}

function Refresh-StateGrid {
    $grid.Items.Clear()
    $state = Get-HardeningState
    foreach ($kv in $state.GetEnumerator()) {
        $item = New-Object System.Windows.Forms.ListViewItem($kv.Key)
        $null = $item.SubItems.Add($kv.Value)
        switch ($kv.Value) {
            'Protected' { $item.ForeColor = [System.Drawing.Color]::LightGreen }
            'At Risk'   { $item.ForeColor = [System.Drawing.Color]::Salmon }
            default     { $item.ForeColor = [System.Drawing.Color]::Gainsboro }
        }
        $null = $grid.Items.Add($item)
    }
}

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = 'Refresh Security Posture'
$btnRefresh.Size = New-Object System.Drawing.Size(330, 40)
$btnRefresh.Location = New-Object System.Drawing.Point(624, 126)
$btnRefresh.Add_Click({
    Refresh-StateGrid
    Write-Log 'Security posture refreshed.'
})
$form.Controls.Add($btnRefresh)

$btnHarden = New-Object System.Windows.Forms.Button
$btnHarden.Text = 'Apply Quick Harden (Real Changes)'
$btnHarden.Size = New-Object System.Drawing.Size(330, 46)
$btnHarden.Location = New-Object System.Drawing.Point(624, 178)
$btnHarden.BackColor = [System.Drawing.Color]::FromArgb(28, 80, 48)
$btnHarden.ForeColor = [System.Drawing.Color]::White
$btnHarden.FlatStyle = 'Flat'
$btnHarden.Add_Click({
    if (-not (Test-IsAdmin)) {
        Write-Log 'Quick Harden blocked: run as Administrator.'
        return
    }
    Write-Log 'Running Quick Harden actions...'
    foreach ($result in Set-QuickHarden) {
        Write-Log $result
    }
    Refresh-StateGrid
})
$form.Controls.Add($btnHarden)

$btnScan = New-Object System.Windows.Forms.Button
$btnScan.Text = 'Start Defender Quick Scan'
$btnScan.Size = New-Object System.Drawing.Size(330, 40)
$btnScan.Location = New-Object System.Drawing.Point(624, 236)
$btnScan.Add_Click({
    if (-not (Test-IsAdmin)) {
        Write-Log 'Quick scan may require elevation on this host.'
    }
    Write-Log (Start-DefenderQuickScan)
})
$form.Controls.Add($btnScan)

$btnIntel = New-Object System.Windows.Forms.Button
$btnIntel.Text = 'Analyze Failed Logons (24h)'
$btnIntel.Size = New-Object System.Drawing.Size(330, 40)
$btnIntel.Location = New-Object System.Drawing.Point(624, 288)
$btnIntel.Add_Click({
    Write-Log (Get-FailedLogonIntel)
})
$form.Controls.Add($btnIntel)

$btnExport = New-Object System.Windows.Forms.Button
$btnExport.Text = 'Export Security Report'
$btnExport.Size = New-Object System.Drawing.Size(330, 40)
$btnExport.Location = New-Object System.Drawing.Point(624, 340)
$btnExport.Add_Click({
    try {
        $desktop = [Environment]::GetFolderPath('Desktop')
        $path = Join-Path $desktop ("SafeDiscover-Report-{0}.txt" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
        $state = Get-HardeningState
        $content = @()
        $content += 'SafeDiscover Anti-Hack Security Report'
        $content += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        $content += ''
        foreach ($kv in $state.GetEnumerator()) {
            $content += "{0}: {1}" -f $kv.Key, $kv.Value
        }
        $content += ''
        $content += 'Recent telemetry:'
        $content += $logBox.Text
        $content | Set-Content -Path $path -Encoding UTF8
        Write-Log "Report exported: $path"
    }
    catch {
        Write-Log "Report export failed: $($_.Exception.Message)"
    }
})
$form.Controls.Add($btnExport)

Refresh-StateGrid
Write-Log 'SafeDiscover Anti-Hack Desktop initialized.'
Write-Log 'Use Refresh Security Posture first, then harden and scan as needed.'

[void]$form.ShowDialog()
