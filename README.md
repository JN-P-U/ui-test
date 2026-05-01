# UI 테스트 증빙 시스템

단위테스트 결과 증빙 Excel 파일을 자동 생성하는 Next.js 프로젝트입니다.

---

## 시작하기

```bash
npm install
npm run dev
```

---

## 테스트 증빙 기능 사용법

### 기본 흐름

1. 화면 우측 하단의 **테스트결과 추가** 플로팅 버튼을 클릭합니다.
2. 현재 화면이 자동으로 캡처되고 증빙 생성 모달이 열립니다.
3. 모달에서 파일 정보(서비스코드, 화면ID, 화면명 등)와 테스트 케이스 내용을 입력합니다.
4. **엑셀 다운로드** 버튼을 클릭하면 Excel 파일이 생성됩니다.

### 여러 조건(케이스)을 한 파일에 담기

1. 첫 번째 케이스 캡처 후 모달에서 **+ 케이스 추가** 버튼 클릭
2. 모달이 닫히고 플로팅 버튼이 **캡처 추가** 로 바뀜
3. 원하는 화면 상태로 이동 후 **캡처 추가** 클릭 → 케이스 자동 추가
4. 반복 후 모달에서 **엑셀 다운로드**

### 새 테스트 세션 시작

모달 하단 **새 테스트 추가** 버튼 → 확인 시 케이스·입력값 전체 초기화

---

## 다른 Next.js 프로젝트에 반입하기

### 1. 파일 복사

```
app/_evidence/          ← 이 폴더 전체 복사
  ├── types.ts
  ├── AlertDialog.tsx
  ├── EvidenceContext.tsx
  ├── EvidenceModal.tsx
  ├── EvidenceFloat.tsx
  └── generate-excel.ts
```

별도 API 라우트 불필요 — `generate-excel.ts`가 Server Action으로 직접 호출됩니다.

### 2. 패키지 설치

```bash
npm install exceljs html-to-image
```

### 3. layout.tsx에 등록

```tsx
import { EvidenceScreenProvider } from "@/app/_evidence/EvidenceContext";
import EvidenceFloat from "@/app/_evidence/EvidenceFloat";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EvidenceScreenProvider>
          {children}
          <EvidenceFloat />
        </EvidenceScreenProvider>
      </body>
    </html>
  );
}
```

### 4. 팝업 컴포넌트에 화면ID 등록 (선택)

팝업이 열렸을 때 해당 화면의 ID·이름으로 자동 전환됩니다. 등록하지 않으면 URL 경로에서 자동 생성합니다.

```tsx
import { useEvidenceScreen } from "@/app/_evidence/EvidenceContext";

export default function MyModal() {
  useEvidenceScreen("MyModalId", "모달 화면명");
  // ...
}
```

---

## 생성 파일 구조

파일명 형식: `MAL_{서비스코드}_AC02(단위테스트케이스결과서)_UT_{화면ID}_{화면명}_V1.0.xlsx`

| 시트 | 내용 |
|------|------|
| 겉표지 | 서비스코드, 화면ID, 화면명, 작성일 |
| 개정이력 | 버전, 개정일, 개정내용 |
| 단위테스트케이스 | 업무분류·Level1~4, 테스트 케이스 목록 (수행결과: 성공, 증빙여부: Y 자동 입력) |
| 공통체크리스트 | UI·화면·입력·레이아웃 항목 |
| 단위테스트케이스결과증빙 | 케이스별 캡처 이미지 (화면 비율에 맞게 자동 조정) |

---

## 주요 입력 항목

| 항목 | 필수 | 설명 |
|------|------|------|
| 서비스코드 | ✅ | 예) `UNW` |
| 화면ID | | URL에서 자동 생성, 수정 가능 |
| 화면명 | | 팝업 등록 시 자동 입력, 수정 가능 |
| 작성자 | | 이름 직접 입력 |
| 업무분류 / Level1~4 | | 단위테스트케이스 시트 Row1 입력값 |
| 테스트항목 / 테스트내용 / 예상결과 / 프로그램ID / 결과확인방법 | | 케이스별 입력 |
