# Chrome Extension Build Script
Write-Host "🚀 Chrome Extension 빌드 시작..." -ForegroundColor Green

# dist 폴더 정리 및 생성
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
}
New-Item -ItemType Directory -Path "dist" -Force | Out-Null

# 필수 파일들을 dist로 복사
Copy-Item "src\manifest.json" "dist\manifest.json"
Copy-Item "src\popup.html" "dist\popup.html"
Copy-Item "src\popup.js" "dist\popup.js"

# 아이콘 파일들 복사
Copy-Item "src\icons\icon16.png" "dist\icon16.png"
Copy-Item "src\icons\icon48.png" "dist\icon48.png"
Copy-Item "src\icons\icon128.png" "dist\icon128.png"

Write-Host "✅ 소스 파일 복사 완료" -ForegroundColor Yellow

# ZIP 파일 생성
$zipPath = "image-ocr-extension.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Compress-Archive -Path "dist\*" -DestinationPath $zipPath

Write-Host "✅ ZIP 파일 생성 완료: $zipPath" -ForegroundColor Green
Write-Host "🎉 빌드 완료! Chrome 웹 스토어에 업로드할 준비가 되었습니다." -ForegroundColor Cyan