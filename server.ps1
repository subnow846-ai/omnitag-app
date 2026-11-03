# OmniTag Local Web Server & Reverse Proxy
param(
    [int]$Port = 8080,
    [switch]$NoBrowser,
    [string]$RootDirectory = ""
)

$Host.UI.RawUI.WindowTitle = "OmniTag Server"

$webRoot = $RootDirectory
if (-not $webRoot -or -not (Test-Path $webRoot)) { $webRoot = $PSScriptRoot }
if (-not $webRoot -or -not (Test-Path $webRoot)) { $webRoot = (Get-Location).Path }
if (-not (Test-Path (Join-Path $webRoot "index.html"))) {
    $fallback = "C:\Users\AC\.gemini\antigravity\scratch\tagsearch-app"
    if (Test-Path (Join-Path $fallback "index.html")) { $webRoot = $fallback }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
} catch {
    Write-Host "[!] Port $Port is busy, trying port $($Port + 1)..." -ForegroundColor Yellow
    $Port = $Port + 1
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Prefixes.Add("http://127.0.0.1:$Port/")
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                OmniTag Search Engine                     " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Server running successfully!" -ForegroundColor Green
Write-Host "  * PC Access: http://localhost:$Port/" -ForegroundColor White
Write-Host ""
Write-Host "  Features: Fast tag search, API source manager, PWA support" -ForegroundColor Gray
Write-Host "  Press Ctrl+C in this window to stop the server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Open default browser or Edge app
if (-not $NoBrowser) {
    Start-Process "http://localhost:$Port/"
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        try {
            # Enable CORS on all responses
            $res.Headers.Add("Access-Control-Allow-Origin", "*")
            $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
            $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

            if ($req.HttpMethod -eq "OPTIONS") {
                $res.StatusCode = 200
                $res.Close()
                continue
            }

            $rawUrl = $req.RawUrl

            # Handle /api/proxy endpoint
            if ($rawUrl.StartsWith("/api/proxy?url=")) {
                $targetUrl = [System.Uri]::UnescapeDataString($rawUrl.Substring(15))
                try {
                    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
                    $wc = New-Object System.Net.WebClient
                    $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    
                    $data = $wc.DownloadData($targetUrl)
                    $contentType = $wc.ResponseHeaders["Content-Type"]
                    if ($contentType) {
                        $res.ContentType = $contentType
                    } else {
                        $res.ContentType = "application/json"
                    }
                    $res.StatusCode = 200
                    $res.ContentLength64 = $data.Length
                    $res.OutputStream.Write($data, 0, $data.Length)
                } catch {
                    $res.StatusCode = 502
                    $errMsg = "{`"error`": `"Proxy request failed: $($_.Exception.Message)`"}"
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($errMsg)
                    $res.ContentType = "application/json"
                    $res.ContentLength64 = $bytes.Length
                    $res.OutputStream.Write($bytes, 0, $bytes.Length)
                }
                $res.Close()
                continue
            }

            # Serve static files
            $localPath = $req.Url.LocalPath
            if ($localPath -eq "/" -or [string]::IsNullOrWhiteSpace($localPath)) {
                $localPath = "/index.html"
            }

            $filePath = [System.IO.Path]::Combine($webRoot, $localPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar))

            if ([System.IO.File]::Exists($filePath)) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                if ($mimeTypes.ContainsKey($ext)) {
                    $res.ContentType = $mimeTypes[$ext]
                } else {
                    $res.ContentType = "application/octet-stream"
                }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.StatusCode = 200
            } else {
                $res.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } catch {
            # Client abort or write error
        } finally {
            try { $res.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}
