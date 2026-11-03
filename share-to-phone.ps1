# OmniTag Phone QR Code & Sharing Launcher
param(
    [switch]$UseLocalTunnel
)

$Host.UI.RawUI.WindowTitle = "OmniTag 24/7 Phone Installer"

$githubUrl = "https://subnow846-ai.github.io/omnitag-app/mobile.html"
$qrCodeApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=" + [System.Uri]::EscapeDataString($githubUrl)

# Create a clean QR visualizer HTML page
$qrPagePath = Join-Path $PSScriptRoot "qr_share.html"
$qrHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OmniTag 24/7 Phone Installation</title>
  <style>
    body {
      background: #0d1117;
      color: #f0f6fc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      max-width: 460px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    }
    .pill {
      background: rgba(63, 185, 80, 0.2);
      color: #3fb950;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 12px;
    }
    h2 { margin: 6px 0 10px 0; color: #58a6ff; font-size: 24px; }
    p { color: #8b949e; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0; }
    .qr-box {
      background: #ffffff;
      padding: 16px;
      border-radius: 16px;
      display: inline-block;
      margin: 10px 0 18px 0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }
    .qr-box img { display: block; width: 250px; height: 250px; }
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
    <span class="pill">● 24/7 PERMANENT CLOUD HOSTED</span>
    <h2>📱 Install OmniTag on Your Phone</h2>
    <p>This link is hosted 24/7 on GitHub Cloud. It will continue working permanently even when your PC is turned off.</p>
    
    <div class="qr-box">
      <img src="$qrCodeApiUrl" alt="OmniTag QR Code">
    </div>

    <div class="url-box">$githubUrl</div>

    <div class="steps">
      <ol>
        <li>Scan the QR code with your iPhone or Android camera.</li>
        <li>Tap the link to open in Safari or Chrome.</li>
        <li>Tap <strong>"Install App"</strong> on the banner to add it to your home screen!</li>
      </ol>
    </div>
  </div>
</body>
</html>
"@

[System.IO.File]::WriteAllText($qrPagePath, $qrHtml)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         OmniTag 24/7 Phone Installation Launcher         " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Permanent 24/7 Cloud URL:" -ForegroundColor Green
Write-Host "  $githubUrl" -ForegroundColor White
Write-Host ""
Write-Host "  * Opening QR Code scanner on your PC screen..." -ForegroundColor Cyan
Write-Host "  * Scan it with your phone camera to install!" -ForegroundColor White
Write-Host "  * Works even when your PC is turned off." -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan

Start-Process $qrPagePath
Start-Sleep -Seconds 3
