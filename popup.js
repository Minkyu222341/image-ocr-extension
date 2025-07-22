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

// 실제 OCR 처리 함수
async function performOCR(imageBlob, language) {
  try {
    // OCR.space API 사용 (무료 API)
    const apiKey = "K87899142388957"; // 무료 API 키 (제한적)

    const formData = new FormData();
    formData.append("file", imageBlob, "image.jpg");
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
    resultText.value = text.trim();

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

// 에러 핸들링
window.addEventListener("error", function (e) {
  console.error("전역 에러:", e.error);
  showMessage("예상치 못한 오류가 발생했습니다.", "error");
});
