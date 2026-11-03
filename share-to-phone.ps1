# OmniTag Instant Phone Sharing & Live Tunnel
param(
    [int]$Port = 8080
)

$Host.UI.RawUI.WindowTitle = "OmniTag Phone Sharing Tunnel"

$cfPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cfPath)) {
    Write-Host "[!] cloudflared was not found at $cfPath" -ForegroundColor Red
    pause
    exit 1
}

# 1. Start local server if not already running on port 8080
$serverRunning = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", $Port)
    $tcp.Close()
    $serverRunning = $true
} catch {
    $serverRunning = $false
}

if (-not $serverRunning) {
    Write-Host "[*] Starting OmniTag local server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$PSScriptRoot\server.ps1`" -Port $Port -NoBrowser"
    Start-Sleep -Seconds 2
}

# 2. Launch Cloudflare Tunnel
Write-Host "[*] Establishing secure public tunnel for your phone..." -ForegroundColor Cyan

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $cfPath
$psi.Arguments = "tunnel --url http://localhost:$Port --http-host-header localhost"
$psi.UseShellExecute = $false
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)

$publicUrl = ""
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

while (-not $proc.HasExited -and $stopwatch.ElapsedMilliseconds -lt 20000) {
    $line = $proc.StandardError.ReadLine()
    if ($line -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
        $publicUrl = $matches[0]
        break
    }
}

if (-not $publicUrl) {
    Write-Host "[!] Could not capture public tunnel URL. Check internet connection." -ForegroundColor Red
    $proc.Kill()
    pause
    exit 1
}

$phoneUrl = "$publicUrl/mobile.html"
$qrCodeApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=" + [System.Uri]::EscapeDataString($phoneUrl)

# 3. Create a clean QR visualizer HTML page
$qrPagePath = Join-Path $PSScriptRoot "qr_share.html"
$qrHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scan to Install OmniTag on Phone</title>
  <style>
    body {
      background: #0d1117;
      color: #f0f6fc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 20px;
      padding: 36px;
      text-align: center;
      max-width: 440px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    }
    h2 { margin-top: 0; color: #58a6ff; font-size: 24px; }
    p { color: #8b949e; font-size: 14px; line-height: 1.5; }
    .qr-box {
      background: #ffffff;
      padding: 16px;
      border-radius: 16px;
      display: inline-block;
      margin: 20px 0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }
    .qr-box img { display: block; width: 260px; height: 260px; }
    .url-box {
      background: #21262d;
      border: 1px solid #30363d;
      padding: 10px 14px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 13px;
      word-break: break-all;
      color: #3fb950;
      margin-bottom: 18px;
    }
    .steps {
      text-align: left;
      background: #21262d;
      padding: 14px 18px;
      border-radius: 10px;
      font-size: 13px;
    }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>📱 Scan to Install on Phone</h2>
    <p>Point your smartphone camera at the QR code below:</p>
    
    <div class="qr-box">
      <img src="$qrCodeApiUrl" alt="OmniTag QR Code">
    </div>

    <div class="url-box">$phoneUrl</div>

    <div class="steps">
      <ol>
        <li>Scan the QR code with your iPhone or Android camera.</li>
        <li>Tap the notification to open the link in Safari or Chrome.</li>
        <li>Tap <strong>"Install App"</strong> on the banner to download it to your home screen!</li>
      </ol>
    </div>
  </div>
</body>
</html>
"@

[System.IO.File]::WriteAllText($qrPagePath, $qrHtml)

# 4. Display in console
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         OmniTag Live Phone Sharing & Installation        " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Public Secure Tunnel is ACTIVE!" -ForegroundColor Green
Write-Host ""
Write-Host "  Direct Link for Phone: " -NoNewline -ForegroundColor White
Write-Host "$phoneUrl" -ForegroundColor Green
Write-Host ""
Write-Host "  1. Opening QR Code scanner page on your PC screen..." -ForegroundColor Cyan
Write-Host "  2. Just scan the QR code with your phone camera!" -ForegroundColor White
Write-Host ""
Write-Host "  Keep this window open while using the app on your phone." -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop sharing." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Open QR page in default browser on PC
Start-Process $qrPagePath

try {
    while (-not $proc.HasExited) {
        Start-Sleep -Seconds 1
    }
} finally {
    try { $proc.Kill() } catch {}
}
