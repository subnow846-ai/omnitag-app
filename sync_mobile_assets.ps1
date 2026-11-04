# Sync script to update android assets, standalone single-file html, and download zip
$root = "C:\Users\AC\.gemini\antigravity\scratch\tagsearch-app"

# 1. Copy files to Android assets
$androidAssets = Join-Path $root "android\app\src\main\assets"
Copy-Item (Join-Path $root "mobile.html") (Join-Path $androidAssets "mobile.html") -Force
Copy-Item (Join-Path $root "css\mobile.css") (Join-Path $androidAssets "css\mobile.css") -Force
Copy-Item (Join-Path $root "js\mobile-app.js") (Join-Path $androidAssets "js\mobile-app.js") -Force
Copy-Item (Join-Path $root "js\api-sources.js") (Join-Path $androidAssets "js\api-sources.js") -Force
Copy-Item (Join-Path $root "js\autocomplete.js") (Join-Path $androidAssets "js\autocomplete.js") -Force
Write-Output "Copied files to android/app/src/main/assets"

# 2. Build omnitag-mobile-standalone.html
$mobileHtml = [System.IO.File]::ReadAllText((Join-Path $root "mobile.html"))
$mobileCss = [System.IO.File]::ReadAllText((Join-Path $root "css\mobile.css"))
$apiSourcesJs = [System.IO.File]::ReadAllText((Join-Path $root "js\api-sources.js"))
$autocompleteJs = [System.IO.File]::ReadAllText((Join-Path $root "js\autocomplete.js"))
$mobileAppJs = [System.IO.File]::ReadAllText((Join-Path $root "js\mobile-app.js"))

# Replace <link rel="stylesheet" href="css/mobile.css..."> with <style>...</style>
$standalone = [System.Text.RegularExpressions.Regex]::Replace($mobileHtml, '<link rel="stylesheet" href="css/mobile\.css[^"]*">', "<style>`n$mobileCss`n</style>")

# Replace the 3 external script tags with inlined script tags
$scriptsBlock = @"
  <script>
$apiSourcesJs
  </script>
  <script>
$autocompleteJs
  </script>
  <script>
$mobileAppJs
  </script>
"@

$regexScripts = '<!-- Reusable API engine and Autocomplete logic -->[\s\S]*?<script src="js/mobile-app\.js[^"]*"></script>'
$standalone = [System.Text.RegularExpressions.Regex]::Replace($standalone, $regexScripts, $scriptsBlock)
[System.IO.File]::WriteAllText((Join-Path $root "omnitag-mobile-standalone.html"), $standalone)
Write-Output "Built omnitag-mobile-standalone.html (Size: $($standalone.Length))"

# 3. Build omnitag-mobile-download.zip
$zipPath = Join-Path $root "omnitag-mobile-download.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$tempDir = Join-Path $root "temp_zip_package"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $tempDir "omnitag-mobile\css") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir "omnitag-mobile\js") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir "omnitag-mobile\assets") -Force | Out-Null

Copy-Item (Join-Path $root "mobile.html") (Join-Path $tempDir "omnitag-mobile\mobile.html")
Copy-Item (Join-Path $root "css\mobile.css") (Join-Path $tempDir "omnitag-mobile\css\mobile.css")
Copy-Item (Join-Path $root "js\mobile-app.js") (Join-Path $tempDir "omnitag-mobile\js\mobile-app.js")
Copy-Item (Join-Path $root "js\api-sources.js") (Join-Path $tempDir "omnitag-mobile\js\api-sources.js")
Copy-Item (Join-Path $root "js\autocomplete.js") (Join-Path $tempDir "omnitag-mobile\js\autocomplete.js")
Copy-Item (Join-Path $root "manifest.json") (Join-Path $tempDir "omnitag-mobile\manifest.json")
Copy-Item (Join-Path $root "sw.js") (Join-Path $tempDir "omnitag-mobile\sw.js")
if (Test-Path (Join-Path $root "assets\icon.svg")) {
    Copy-Item (Join-Path $root "assets\icon.svg") (Join-Path $tempDir "omnitag-mobile\assets\icon.svg")
}

Compress-Archive -Path "$tempDir\omnitag-mobile\*" -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force
Write-Output "Built omnitag-mobile-download.zip (Size: $((Get-Item $zipPath).Length))"
