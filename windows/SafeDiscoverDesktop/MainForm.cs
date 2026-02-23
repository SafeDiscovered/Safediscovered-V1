using System.Diagnostics;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace SafeDiscoverDesktop;

public class MainForm : Form
{
    private readonly WebView2 _webView = new() { Dock = DockStyle.Fill };

    public MainForm()
    {
        Text = "SafeDiscover Defender Suite";
        Width = 1440;
        Height = 920;
        MinimizeBox = true;
        MaximizeBox = true;

        Controls.Add(_webView);
        Load += OnLoad;
    }

    private async void OnLoad(object? sender, EventArgs e)
    {
        await _webView.EnsureCoreWebView2Async();
        _webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
        _webView.CoreWebView2.Settings.IsGeneralAutofillEnabled = false;
        _webView.CoreWebView2.Settings.IsPasswordAutosaveEnabled = false;
        _webView.CoreWebView2.WebMessageReceived += HandleWebMessage;

        var appPath = Path.Combine(AppContext.BaseDirectory, "index.html");
        _webView.Source = new Uri(appPath);
    }

    private async void HandleWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            var request = JsonSerializer.Deserialize<AppRequest>(e.WebMessageAsJson);
            if (request is null || string.IsNullOrWhiteSpace(request.Command))
            {
                await EmitResult("invalid", false, "Invalid request payload.");
                return;
            }

            switch (request.Command)
            {
                case "defenderStatus":
                    await EmitResult("defenderStatus", true, await RunPowerShellAsync("Get-MpComputerStatus | Select-Object AMServiceEnabled,RealTimeProtectionEnabled,AntivirusEnabled,BehaviorMonitorEnabled,IoavProtectionEnabled,AntispywareEnabled | ConvertTo-Json -Compress"));
                    break;
                case "quickScan":
                    await RunPowerShellAsync("Start-MpScan -ScanType QuickScan");
                    await EmitResult("quickScan", true, "Microsoft Defender quick scan launched.");
                    break;
                case "firewallStatus":
                    await EmitResult("firewallStatus", true, await RunPowerShellAsync("Get-NetFirewallProfile | Select-Object Name,Enabled,DefaultInboundAction,DefaultOutboundAction | ConvertTo-Json -Compress"));
                    break;
                case "enableFirewall":
                    await RunPowerShellAsync("Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True");
                    await EmitResult("enableFirewall", true, "Windows Firewall profiles are set to enabled.");
                    break;
                case "restoreSystem":
                    await RunPowerShellAsync("Set-MpPreference -DisableRealtimeMonitoring $false; Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True");
                    await EmitResult("restoreSystem", true, "Core protection state restore attempted (admin privileges may be required).");
                    break;
                default:
                    await EmitResult(request.Command, false, "Unknown command.");
                    break;
            }
        }
        catch (Exception ex)
        {
            await EmitResult("error", false, ex.Message);
        }
    }

    private async Task<string> RunPowerShellAsync(string command)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "powershell",
            Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{command}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = psi };
        process.Start();
        var stdout = await process.StandardOutput.ReadToEndAsync();
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(stderr) ? "PowerShell command failed." : stderr.Trim());
        }

        return string.IsNullOrWhiteSpace(stdout) ? "ok" : stdout.Trim();
    }

    private Task EmitResult(string command, bool ok, string message)
    {
        var payload = JsonSerializer.Serialize(new { command, ok, message });
        return _webView.CoreWebView2.ExecuteScriptAsync($"window.nativeResult({payload});");
    }

    private record AppRequest(string Command);
}
