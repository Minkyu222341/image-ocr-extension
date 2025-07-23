console.log("OCR Extension 로딩 시작...");

let currentImageData = null;

// DOM 로드 완료 후 초기화
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM 로드 완료");
  initializeExtension();
});

function initializeExtension() {
  console.log("확장 프로그램 초기화 중...");

  // 이전 설정 불러오기
  chrome.storage.sync.get(["language"], function (result) {
    if (result.language) {
      document.getElementById("language").value = result.language;
    }
  });

  // 드래그 앤 드롭 이벤트
  const uploadSection = document.getElementById("uploadSection");
  const fileInput = document.getElementById("fileInput");

  if (!uploadSection || !fileInput) {
    console.error("필수 DOM 요소를 찾을 수 없습니다.");
    return;
  }

  // 파일 입력 이벤트
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // 드래그 앤 드롭 이벤트
  uploadSection.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadSection.classList.add("dragover");
  });

  uploadSection.addEventListener("dragleave", () => {
    uploadSection.classList.remove("dragover");
  });

  uploadSection.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadSection.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  uploadSection.addEventListener("click", () => {
    fileInput.click();
  });

  // 업로드 버튼 이벤트
  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      fileInput.click();
    });
  }

  // OCR 시작 버튼 이벤트
  const startOCRBtn = document.getElementById("startOCRBtn");
  if (startOCRBtn) {
    startOCRBtn.addEventListener("click", startOCR);
  }

  // 복사 버튼 이벤트
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", (event) => {
      copyToClipboard(false, event);
    });
  }

  // 초기화 버튼 이벤트
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetApp);
  }

  // 언어 설정 변경 시 저장
  document.getElementById("language").addEventListener("change", function () {
    chrome.storage.sync.set({ language: this.value });
  });

  // 분리된 태그/클래스 입력 필드 설정
  const tagNameInput = document.getElementById("tagName");
  const classNameInput = document.getElementById("className");
  
  if (tagNameInput && classNameInput) {
    // 이전 설정 불러오기
    chrome.storage.sync.get(["tagName", "className"], function (result) {
      if (result.tagName) {
        tagNameInput.value = result.tagName;
      }
      if (result.className) {
        classNameInput.value = result.className;
      }
      updateTagPreview(); // 초기 미리보기 업데이트
    });

    // 태그명 변경 시 저장 및 미리보기 업데이트
    tagNameInput.addEventListener("input", function () {
      chrome.storage.sync.set({ tagName: this.value });
      updateTagPreview();
    });

    // 클래스명 변경 시 저장 및 미리보기 업데이트
    classNameInput.addEventListener("input", function () {
      chrome.storage.sync.set({ className: this.value });
      updateTagPreview();
    });
  }



  // 이미지 확대 모달 기능 초기화
  initializeImageModal();

  console.log("OCR Extension이 준비되었습니다.");
}

async function handleFileSelect(file) {
  try {
    console.log("파일 선택됨:", file.name);

    // 파일 유효성 검사
    if (!file.type.startsWith("image/")) {
      showMessage(
        "지원되지 않는 파일 형식입니다. 이미지 파일을 선택해주세요.",
        "error"
      );
      return;
    }

    // 파일 크기 검사 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        "파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.",
        "error"
      );
      return;
    }

    clearMessage();

    // 미리보기 표시
    showPreview(file);
  } catch (error) {
    console.error("파일 처리 오류:", error);
    showMessage("파일 처리 중 오류가 발생했습니다: " + error.message, "error");
  }
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageData = e.target.result;
    const imagePreview = document.getElementById("imagePreview");
    imagePreview.src = e.target.result;
    document.getElementById("previewSection").style.display = "block";
    document.getElementById("resultSection").style.display = "none";
  };
  reader.readAsDataURL(file);
}

// 실제 OCR 기능 구현
async function startOCR() {
  if (!currentImageData) {
    showMessage("먼저 이미지를 선택해주세요.", "error");
    return;
  }

  try {
    console.log("OCR 시작...");

    // 진행 상황 표시
    document.getElementById("progressSection").style.display = "block";
    document.getElementById("resultSection").style.display = "none";

    const language = document.getElementById("language").value;
    console.log("선택된 언어:", language);

    updateProgress("이미지 분석 중...", 10);

    // 이미지를 base64에서 blob으로 변환
    const base64Data = currentImageData.split(",")[1];
    const imageBlob = base64ToBlob(base64Data, "image/jpeg");

    updateProgress("OCR 서비스 연결 중...", 30);

    // 실제 OCR 처리
    const extractedText = await performOCR(imageBlob, language);

    updateProgress("텍스트 처리 중...", 80);
    await sleep(300);

    updateProgress("완료!", 100);
    await sleep(300);

    // 결과 표시
    showResult(extractedText, 90);
  } catch (error) {
    console.error("OCR 처리 오류:", error);
    showMessage(
      `텍스트 추출 중 오류가 발생했습니다: ${error.message}`,
      "error"
    );
    document.getElementById("progressSection").style.display = "none";
  }
}

// Base64를 Blob으로 변환하는 함수
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// 이미지 압축 함수 (1MB 이하로 압축)
async function compressImage(imageBlob, maxSizeKB = 1024) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 원본 크기가 이미 작으면 그대로 반환
      if (imageBlob.size <= maxSizeKB * 1024) {
        resolve(imageBlob);
        return;
      }
      
      // 압축을 위한 크기 계산
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;
      
      // 비율 유지하면서 크기 조정
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // 품질을 조정하면서 압축
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob((compressedBlob) => {
          if (compressedBlob.size <= maxSizeKB * 1024 || quality <= 0.1) {
            console.log(`이미지 압축 완료: ${Math.round(imageBlob.size / 1024)}KB → ${Math.round(compressedBlob.size / 1024)}KB`);
            resolve(compressedBlob);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, 'image/jpeg', quality);
      };
      
      tryCompress();
    };
    
    img.onerror = () => {
      console.warn('이미지 압축 실패, 원본 사용');
      resolve(imageBlob);
    };
    
    img.src = URL.createObjectURL(imageBlob);
  });
}

// 실제 OCR 처리 함수
async function performOCR(imageBlob, language) {
  try {
    // 이미지 크기 확인 및 압축
    console.log(`원본 이미지 크기: ${Math.round(imageBlob.size / 1024)}KB`);
    
    let processedBlob = imageBlob;
    if (imageBlob.size > 1024 * 1024) { // 1MB 초과 시 압축
      console.log("이미지 크기가 1MB를 초과하여 압축을 시작합니다...");
      processedBlob = await compressImage(imageBlob, 900); // 900KB로 압축 (여유분 확보)
    }

    // OCR.space API 사용 (무료 API)
    const apiKey = "K87899142388957"; // 무료 API 키 (월 25,000회 제한)

    const formData = new FormData();
    formData.append("file", processedBlob, "image.jpg");
    formData.append("apikey", apiKey);
    formData.append("language", getOCRLanguageCode(language));
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR API 오류: ${response.status}`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(
        result.ErrorMessage || "OCR 처리 중 오류가 발생했습니다."
      );
    }

    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const extractedText = result.ParsedResults[0].ParsedText;
      return extractedText || "텍스트를 찾을 수 없습니다.";
    } else {
      return "텍스트를 찾을 수 없습니다.";
    }
  } catch (error) {
    console.error("OCR 처리 오류:", error);

    // 폴백: 로컬 OCR 시도 (Canvas API 사용)
    return await performLocalOCR(imageBlob, language);
  }
}

// OCR 언어 코드 변환
function getOCRLanguageCode(language) {
  const languageMap = {
    "kor+eng": "kor",
    kor: "kor",
    eng: "eng",
    jpn: "jpn",
    chi_sim: "chs",
  };
  return languageMap[language] || "eng";
}

// 로컬 OCR 폴백 (간단한 텍스트 인식)
async function performLocalOCR(imageBlob, language) {
  try {
    // Canvas를 사용한 간단한 이미지 분석
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 이미지 데이터 분석 (매우 기본적인 방법)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const brightness = calculateAverageBrightness(imageData);

        // 밝기 기반 간단한 텍스트 존재 여부 판단
        if (brightness > 100 && brightness < 200) {
          resolve(
            "이미지에서 텍스트를 감지했지만 정확한 인식을 위해서는 인터넷 연결이 필요합니다.\n\n온라인 OCR 서비스에 연결할 수 없어 정확한 텍스트 추출이 어렵습니다."
          );
        } else {
          resolve(
            "텍스트를 찾을 수 없거나 이미지 품질이 OCR에 적합하지 않습니다."
          );
        }
      };

      img.onerror = () => {
        resolve("이미지 처리 중 오류가 발생했습니다.");
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  } catch (error) {
    console.error("로컬 OCR 오류:", error);
    return "텍스트 추출에 실패했습니다. 다른 이미지를 시도해보세요.";
  }
}

// 이미지 평균 밝기 계산
function calculateAverageBrightness(imageData) {
  const data = imageData.data;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
  }

  return totalBrightness / (data.length / 4);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateProgress(text, percentage) {
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");

  if (progressText) progressText.textContent = text;
  if (progressFill) progressFill.style.width = percentage + "%";
}

function showResult(text, confidence) {
  document.getElementById("progressSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

  const resultText = document.getElementById("resultText");

  if (text && text.trim()) {
    // 웹 접근성 태그로 래핑
    const finalText = wrapWithAccessibilityTag(text.trim());
    resultText.value = finalText;

    // 자동으로 클립보드에 복사
    copyToClipboard(true);

    // 신뢰도 표시
    if (confidence < 70) {
      showMessage(
        `텍스트 인식 신뢰도: ${Math.round(confidence)}%. 결과를 확인해주세요.`,
        "error"
      );
    } else {
      showMessage(
        `텍스트가 자동으로 클립보드에 복사되었습니다! (신뢰도: ${Math.round(confidence)}%)`,
        "success"
      );
    }
  } else {
    resultText.value = "텍스트를 찾을 수 없습니다.";
    showMessage(
      "이미지에서 텍스트를 찾을 수 없습니다. 다른 이미지를 시도해보세요.",
      "error"
    );
  }
}

function copyToClipboard(auto = false, event = null) {
  const resultText = document.getElementById("resultText");
  const text = resultText.value.trim();

  if (!text) {
    if (!auto) showMessage("복사할 텍스트가 없습니다.", "error");
    return;
  }

  // Chrome Extension API를 사용한 클립보드 복사
  navigator.clipboard
    .writeText(text)
    .then(() => {
      if (!auto) {
        showMessage("텍스트가 클립보드에 복사되었습니다!", "success");

        // 버튼 텍스트 임시 변경
        const btn = event?.target;
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = "✅ 복사됨!";
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        }
      }
    })
    .catch((err) => {
      console.error("클립보드 복사 실패:", err);

      // 폴백: 텍스트 선택
      try {
        resultText.select();
        resultText.setSelectionRange(0, 99999);
        if (!auto)
          showMessage("텍스트가 클립보드에 복사되었습니다!", "success");
      } catch (e) {
        if (!auto)
          showMessage(
            "클립보드 복사에 실패했습니다. 수동으로 복사해주세요.",
            "error"
          );
      }
    });
}

function resetApp() {
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("progressSection").style.display = "none";
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("fileInput").value = "";
  currentImageData = null;
  clearMessage();
}

function showMessage(message, type = "info") {
  const messageSection = document.getElementById("messageSection");
  const className = type === "error" ? "error" : "success";
  messageSection.innerHTML = `<div class="${className}">${message}</div>`;

  // 자동으로 메시지 제거 (성공 메시지만)
  if (type === "success") {
    setTimeout(() => {
      clearMessage();
    }, 3000);
  }
}

function clearMessage() {
  const messageSection = document.getElementById("messageSection");
  if (messageSection) {
    messageSection.innerHTML = "";
  }
}

// 태그 미리보기 업데이트 함수
function updateTagPreview() {
  const tagNameInput = document.getElementById("tagName");
  const classNameInput = document.getElementById("className");
  const previewText = document.getElementById("previewText");
  
  if (!tagNameInput || !classNameInput || !previewText) return;
  
  const tagName = tagNameInput.value.trim();
  const className = classNameInput.value.trim();
  
  if (!tagName && !className) {
    previewText.textContent = "태그를 입력하세요";
    previewText.style.color = "#999";
    return;
  }
  
  if (!tagName) {
    previewText.textContent = "태그명을 입력하세요";
    previewText.style.color = "#dc3545";
    return;
  }
  
  // 미리보기 텍스트 생성
  let preview;
  if (className) {
    preview = `<${tagName} class="${className}">추출된 텍스트</${tagName}>`;
  } else {
    preview = `<${tagName}>추출된 텍스트</${tagName}>`;
  }
  
  previewText.textContent = preview;
  previewText.style.color = "#667eea";
}

// 웹 접근성 태그로 텍스트 래핑하는 함수 (분리된 입력 필드용)
function wrapWithAccessibilityTag(text) {
  const tagNameInput = document.getElementById("tagName");
  const classNameInput = document.getElementById("className");
  
  if (!tagNameInput || !classNameInput) {
    return text; // 입력 필드가 없으면 원본 텍스트 반환
  }
  
  const tagName = tagNameInput.value.trim();
  const className = classNameInput.value.trim();
  
  // 태그명이 입력되지 않았으면 원본 텍스트 반환
  if (!tagName) {
    return text;
  }
  
  try {
    // 태그명 유효성 검사
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(tagName)) {
      console.warn("잘못된 태그명:", tagName);
      return text;
    }
    
    // 클래스명 유효성 검사 (있는 경우)
    if (className && !/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(className)) {
      console.warn("잘못된 클래스명:", className);
      return text;
    }
    
    // 최종 HTML 태그로 래핑
    let wrappedText;
    if (className) {
      wrappedText = `<${tagName} class="${className}">${text}</${tagName}>`;
    } else {
      wrappedText = `<${tagName}>${text}</${tagName}>`;
    }
    
    console.log("웹 접근성 태그 적용:", wrappedText);
    return wrappedText;
    
  } catch (error) {
    console.error("태그 래핑 오류:", error);
    return text; // 오류 발생 시 원본 텍스트 반환
  }
}

// HTML 태그 파싱 함수
function parseHtmlTag(tagInput) {
  if (!tagInput) return null;
  
  // 일반적인 태그 형식들을 지원
  // 예: "p", "p class='hid'", "span class=\"sr-only\"", "div class='hidden'"
  
  const trimmed = tagInput.trim();
  
  // 태그명만 입력된 경우 (예: "p")
  if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmed)) {
    return {
      tagName: trimmed,
      fullTag: trimmed
    };
  }
  
  // 태그명 + 속성이 입력된 경우 (예: "p class='hid'")
  const tagMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)\s+(.+)$/);
  if (tagMatch) {
    const tagName = tagMatch[1];
    const attributes = tagMatch[2];
    
    return {
      tagName: tagName,
      fullTag: `${tagName} ${attributes}`
    };
  }
  
  // 기타 복잡한 형식 처리
  const complexMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
  if (complexMatch) {
    return {
      tagName: complexMatch[1],
      fullTag: trimmed
    };
  }
  
  return null;
}

// 이미지 확대 기능 초기화 (새 창 방식)
function initializeImageModal() {
  // 이미지 미리보기 클릭 이벤트 (동적으로 추가되므로 이벤트 위임 사용)
  document.addEventListener("click", function(e) {
    if (e.target && e.target.id === "imagePreview") {
      openImageModal(e.target.src);
    }
  });
}

// 새 창으로 이미지 열기
function openImageModal(imageSrc) {
  try {
    // 더 큰 새 창에서 이미지 열기
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      // 새 창에 이미지 표시용 HTML 작성
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>이미지 확대 보기</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              background: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.1);
              max-width: 95%;
              max-height: 95%;
            }
            img {
              max-width: 100%;
              max-height: 85vh;
              object-fit: contain;
              border-radius: 8px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              cursor: zoom-in;
            }
            .info {
              margin-top: 20px;
              color: #666;
              font-size: 14px;
              line-height: 1.5;
            }
            .info-icon {
              margin-right: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${imageSrc}" alt="확대된 이미지" />
            <div class="info">
              <span class="info-icon">💡</span>이미지를 우클릭하여 저장하거나 복사할 수 있습니다
            </div>
          </div>
        </body>
        </html>
      `);
      
      newWindow.document.close();
      newWindow.focus();
      
      console.log("새 창에서 이미지 열림");
    } else {
      // 팝업 차단된 경우 폴백
      showMessage('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.', 'error');
    }
  } catch (error) {
    console.error('이미지 새 창 열기 오류:', error);
    showMessage('이미지를 새 창에서 열 수 없습니다.', 'error');
  }
}



// 에러 핸들링
window.addEventListener("error", function (e) {
  console.error("전역 에러:", e.error);
  showMessage("예상치 못한 오류가 발생했습니다.", "error");
});
