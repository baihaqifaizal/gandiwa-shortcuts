param(
    [string]$ChromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
)

$extensionPath = Resolve-Path .
if (Test-Path $ChromePath) {
    & $ChromePath --pack-extension="$($extensionPath.Path)"
    Write-Host "Success! CRX has been generated."
} else {
    Write-Host "Chrome not found at $ChromePath. Packaging failed."
}
