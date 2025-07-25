# Chrome Extension Build Script
# 배포용 패키지를 dist 폴더에 생성

Write-Host "🚀 Chrome Extension 빌드 시작..." -ForegroundColor Green

# dist 폴더 정리
if (Test-Path "dist") {
    Remove-Item "dist\*" -Recurse -Force
    Write-Host "✅ dist 폴더 정리 완료" -ForegroundColor Yellow
}

# 필수 파일들을 dist로 복사
Copy-Item "src\manifest.json" "dist\"
Copy-Item "src\popup.html" "dist\"
Copy-Item "src\popup.js" "dist\"
Copy-Item "src\icons\*" "dist\"

Write-Host "✅ 소스 파일 복사 완료" -ForegroundColor Yellow

# ZIP 파일 생성
$zipPath = "image-ocr-extension.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Compress-Archive -Path "dist\*" -DestinationPath $zipPath

Write-Host "✅ ZIP 파일 생성 완료: $zipPath" -ForegroundColor Green
Write-Host "🎉 빌드 완료! Chrome 웹 스토어에 업로드할 준비가 되었습니다." -ForegroundColor Cyan