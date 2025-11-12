# PowerShell script to fix all API URLs in frontend JavaScript files

Write-Host "🔧 Fixing API URLs in all frontend files..." -ForegroundColor Cyan

$backendURL = "https://kavyaproman360-backend.onrender.com"

# Get all JS files in frontend
$jsFiles = Get-ChildItem -Path "frontend\assests\js" -Filter "*.js" -Recurse

foreach ($file in $jsFiles) {
    if ($file.Name -eq "config.js") {
        Write-Host "⏭️  Skipping config.js" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace fetch calls
    $content = $content -replace "fetch\('\/api\/", "fetch(apiUrl('/api/"
    $content = $content -replace 'fetch\("/api/', 'fetch(apiUrl("/api/'
    $content = $content -replace 'fetch\(`/api/', 'fetch(apiUrl(`/api/'
    $content = $content -replace "fetch\('http://localhost:3000/api/", "fetch(apiUrl('/api/"
    $content = $content -replace 'fetch\("http://localhost:3000/api/', 'fetch(apiUrl("/api/'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "⏭️  No changes: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 Done! All API URLs updated to use apiUrl() helper function." -ForegroundColor Green
Write-Host "Backend URL: $backendURL" -ForegroundColor Cyan
