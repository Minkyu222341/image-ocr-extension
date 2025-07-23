# Chrome 웹 스토어 배포 패키지

## 포함할 파일들 (필수)
- manifest.json
- popup.html  
- popup.js
- icon16.png
- icon48.png
- icon128.png

## 제외할 파일들 (개발용)
- .git/
- .vscode/
- .gitignore
- README.md
- LICENSE
- privacy_policy.md
- create_icons.html
- create_store_images.html
- test_image_generator.html
- build-package.md

## 배포 과정
1. 새 폴더 생성: chrome-extension-package
2. 필수 파일들만 복사
3. ZIP으로 압축
4. Chrome 웹 스토어에 업로드