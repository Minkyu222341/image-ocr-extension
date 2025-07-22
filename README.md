# 🔍 이미지 텍스트 추출기 (Image Text Extractor)

이미지에서 텍스트를 추출하고 클립보드에 자동으로 복사해주는 Chrome 확장 프로그램입니다.

## ✨ 주요 기능

- **다국어 지원**: 한국어, 영어, 일본어, 중국어
- **드래그 앤 드롭**: 간편한 이미지 업로드
- **실시간 진행률**: OCR 처리 과정 시각화
- **자동 클립보드 복사**: 추출된 텍스트 자동 복사
- **다양한 형식 지원**: JPG, PNG, GIF, BMP

## 🚀 사용법

1. Chrome 확장 프로그램 아이콘 클릭
2. 이미지를 드래그 앤 드롭 또는 파일 선택
3. 언어 선택 후 "텍스트 추출 시작" 클릭
4. 추출된 텍스트가 자동으로 클립보드에 복사됩니다!

## 📱 활용 예시

- 웹페이지 스크린샷에서 텍스트 추출
- 사진 속 간판이나 표지판 텍스트 인식
- 문서나 책 사진에서 텍스트 복사
- 외국어 이미지 텍스트 번역을 위한 전처리

## 🛠️ 기술 스택

- **Frontend**: HTML, CSS, JavaScript
- **OCR API**: OCR.space API
- **Platform**: Chrome Extension Manifest V3

## 📦 설치 방법

### Chrome 웹 스토어에서 설치 (권장)
1. [Chrome 웹 스토어](https://chrome.google.com/webstore) 접속
2. "이미지 텍스트 추출기" 검색
3. "Chrome에 추가" 클릭

### 개발자 모드로 설치
1. 이 저장소를 클론하거나 다운로드
2. Chrome에서 `chrome://extensions/` 접속
3. "개발자 모드" 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. 프로젝트 폴더 선택

## 🔧 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/[YOUR_USERNAME]/image-ocr-extension.git

# 프로젝트 디렉토리로 이동
cd image-ocr-extension

# Chrome에서 개발자 모드로 로드
# chrome://extensions/ → 개발자 모드 ON → 압축해제된 확장 프로그램 로드
```

## 📁 프로젝트 구조

```
image-ocr-extension/
├── manifest.json          # 확장 프로그램 설정
├── popup.html            # 팝업 UI
├── popup.js              # 메인 로직
├── icon16.png            # 16x16 아이콘
├── icon48.png            # 48x48 아이콘
├── icon128.png           # 128x128 아이콘
├── privacy_policy.md     # 개인정보 처리방침
├── README.md             # 프로젝트 설명
└── .gitignore           # Git 무시 파일
```

## 🔒 개인정보 보호

- 이미지는 OCR 처리 후 즉시 삭제됩니다
- 서버에 개인정보를 저장하지 않습니다
- 모든 데이터는 HTTPS로 암호화 전송됩니다
- 자세한 내용은 [개인정보 처리방침](privacy_policy.md)을 참조하세요

## 🤝 기여하기

1. 이 저장소를 Fork합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

- **이슈 리포트**: [GitHub Issues](https://github.com/[YOUR_USERNAME]/image-ocr-extension/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/[YOUR_USERNAME]/image-ocr-extension/discussions)

## 🙏 감사의 말

- [OCR.space](https://ocr.space/) - OCR API 제공
- Chrome Extensions 커뮤니티

---

⭐ 이 프로젝트가 유용하다면 스타를 눌러주세요!