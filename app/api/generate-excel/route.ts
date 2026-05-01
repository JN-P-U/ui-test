import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

interface CasePayload {
  caseNumber: number;
  imageBase64: string;
  testItem: string;
  testContent: string;
  expectedResult: string;
  programId: string;
  verifyMethod: string;
}

interface RequestBody {
  serviceCode: string;
  screenId: string;
  screenName: string;
  author: string;
  capturedAt: string;
  bizCategory: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  cases: CasePayload[];
}

const IMG_ROW_HEIGHT_PT = 20;
const IMG_COL_WIDTH    = 18;   // Excel character-width units per image column
const IMG_COL_PX       = 7.5;  // approximate pixels per character-width unit
const PT_TO_PX         = 96 / 72; // screen pixels per point

/** PNG IHDR 헤더에서 실제 픽셀 크기를 읽는다 */
function getPngSize(base64: string): { w: number; h: number } {
  const buf = Buffer.from(base64, "base64");
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json();
  const { serviceCode, screenId, screenName, author, capturedAt, bizCategory, level1, level2, level3, level4, cases } = body;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "UI Test Evidence System";
  workbook.created = new Date();

  const coverSheet = workbook.addWorksheet("겉표지");
  setupCoverSheet(coverSheet, serviceCode, screenId, screenName, capturedAt);

  const revisionSheet = workbook.addWorksheet("개정이력");
  setupRevisionSheet(revisionSheet, capturedAt);

  const testCaseSheet = workbook.addWorksheet("단위테스트케이스");
  setupTestCaseSheet(testCaseSheet, screenId, screenName, author, { bizCategory, level1, level2, level3, level4 }, cases);

  const checklistSheet = workbook.addWorksheet("공통체크리스트");
  setupChecklistSheet(checklistSheet);

  const evidenceSheet = workbook.addWorksheet("단위테스트케이스결과증빙");
  setupEvidenceSheet(workbook, evidenceSheet, cases);

  const fileName = `MAL_${serviceCode}_AC02(단위테스트케이스결과서)_UT_${screenId}_${screenName}_V1.0.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}

function setupCoverSheet(
  sheet: ExcelJS.Worksheet,
  serviceCode: string,
  screenId: string,
  screenName: string,
  capturedAt: string
) {
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 45;

  sheet.mergeCells("A1:B1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "단위테스트케이스 결과서";
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 44;

  const rows: [string, string][] = [
    ["서비스코드", serviceCode],
    ["화면ID", screenId],
    ["화면명", screenName],
    ["작성일", capturedAt],
    ["문서버전", "V1.0"],
  ];

  rows.forEach(([label, value], i) => {
    const rowNum = i + 2;
    sheet.getRow(rowNum).height = 24;

    const lCell = sheet.getCell(`A${rowNum}`);
    lCell.value = label;
    lCell.font = { bold: true, size: 11 };
    lCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
    lCell.alignment = { horizontal: "center", vertical: "middle" };
    lCell.border = borderStyle();

    const vCell = sheet.getCell(`B${rowNum}`);
    vCell.value = value;
    vCell.font = { size: 11 };
    vCell.alignment = { horizontal: "left", vertical: "middle" };
    vCell.border = borderStyle();
  });
}

function setupRevisionSheet(sheet: ExcelJS.Worksheet, capturedAt: string) {
  const headers = ["버전", "개정일자", "개정내용", "개정자"];
  const widths = [12, 20, 55, 15];

  headers.forEach((h, i) => {
    sheet.getColumn(i + 1).width = widths[i];
    const cell = sheet.getCell(1, i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
  });
  sheet.getRow(1).height = 22;

  const r = sheet.addRow(["V1.0", capturedAt, "최초 작성", ""]);
  r.height = 20;
  r.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= 4) {
      cell.border = borderStyle();
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
  });
}

function setupTestCaseSheet(
  sheet: ExcelJS.Worksheet,
  screenId: string,
  screenName: string,
  author: string,
  meta: { bizCategory: string; level1: string; level2: string; level3: string; level4: string },
  cases: CasePayload[]
) {
  // 12 컬럼 (A–L)
  // A~I : 단위테스트 케이스 영역 / J~L : 단위테스트 결과 영역
  const colWidths = [12, 20, 35, 20, 25, 22, 22, 15, 10, 14, 12, 18];
  colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

  // ── Row 1: 메타데이터 ──
  // 레이블 셀 (A, C, E, G, I, K)
  const row1Labels: { col: number; label: string }[] = [
    { col: 1, label: "업무분류" },
    { col: 3, label: "Level1" },
    { col: 5, label: "Level2" },
    { col: 7, label: "Level3" },
    { col: 9, label: "Level4" },
    { col: 11, label: "작성자" },
  ];
  row1Labels.forEach(({ col, label }) => {
    const cell = sheet.getCell(1, col);
    cell.value = label;
    applyHeaderStyle(cell);
  });
  // 입력 셀 (B=업무분류, D=Level1, F=Level2, H=Level3, J=Level4 / L=작성자)
  const row1Inputs: [number, string][] = [
    [2, meta.bizCategory],
    [4, meta.level1],
    [6, meta.level2],
    [8, meta.level3],
    [10, meta.level4],
  ];
  row1Inputs.forEach(([col, value]) => {
    const cell = sheet.getCell(1, col);
    cell.value = value || "";
    cell.border = borderStyle();
    cell.alignment = { vertical: "middle" };
  });
  const authorCell = sheet.getCell("L1");
  authorCell.value = author;
  authorCell.border = borderStyle();
  authorCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(1).height = 22;

  // ── Row 2: UT 정보 ──
  // A2 = 단위테스트ID 레이블
  const utIdLabel = sheet.getCell("A2");
  utIdLabel.value = "단위테스트ID";
  applyHeaderStyle(utIdLabel);

  // B2:D2 merged = {UT_프로그램ID}
  sheet.mergeCells("B2:D2");
  const utIdCell = sheet.getCell("B2");
  utIdCell.value = `UT_${screenId}`;
  utIdCell.border = borderStyle();
  utIdCell.alignment = { horizontal: "left", vertical: "middle" };

  // E2 = 단위테스트명 레이블
  const utNameLabel = sheet.getCell("E2");
  utNameLabel.value = "단위테스트명";
  applyHeaderStyle(utNameLabel);

  // F2:J2 merged = [단위테스트명 입력 - screenName으로 자동]
  sheet.mergeCells("F2:J2");
  const utNameCell = sheet.getCell("F2");
  utNameCell.value = screenName;
  utNameCell.border = borderStyle();
  utNameCell.alignment = { horizontal: "left", vertical: "middle" };

  // K2 = 작성일 레이블
  const dateLabel = sheet.getCell("K2");
  dateLabel.value = "작성일";
  applyHeaderStyle(dateLabel);

  // L2 = YYYY-MM-DD
  const dateCell = sheet.getCell("L2");
  const today = new Date();
  dateCell.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  dateCell.border = borderStyle();
  dateCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(2).height = 22;

  // ── Row 3: 섹션 헤더 ──
  sheet.mergeCells("A3:I3");
  const caseSection = sheet.getCell("A3");
  caseSection.value = "단위테스트 케이스";
  caseSection.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
  caseSection.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
  caseSection.alignment = { horizontal: "center", vertical: "middle" };
  caseSection.border = borderStyle();

  sheet.mergeCells("J3:L3");
  const resultSection = sheet.getCell("J3");
  resultSection.value = "단위테스트 결과";
  resultSection.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
  resultSection.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  resultSection.alignment = { horizontal: "center", vertical: "middle" };
  resultSection.border = borderStyle();
  sheet.getRow(3).height = 22;

  // ── Row 4: 컬럼 헤더 ──
  // A~I: 케이스 컬럼 / J~L: 결과 컬럼
  const colHeaders = [
    "케이스번호", "테스트항목", "테스트내용", "테스트데이터", "예상결과",
    "프로그램ID", "결과확인방법", "비고", "", "수행결과", "증빙여부", "증빙제외사유",
  ];
  colHeaders.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
  });
  sheet.getRow(4).height = 22;

  // ── Row 5+: 데이터 (자동생성) ──
  // 자동생성: 케이스번호(A), 테스트항목(B=screenName), 프로그램ID(F=screenId),
  //           수행결과(J=성공), 증빙여부(K=Y) — 나머지는 사용자 기입
  cases.forEach(({ caseNumber, testItem, testContent, expectedResult, programId, verifyMethod }) => {
    const caseNum = caseNumber.toString().padStart(2, "0");
    const r = sheet.addRow([
      caseNum, testItem, testContent, "", expectedResult, programId, verifyMethod, "", "", "성공", "Y", "",
    ]);
    r.height = 20;
    r.eachCell({ includeEmpty: true }, (cell, col) => {
      if (col <= 12) {
        cell.border = borderStyle();
        cell.alignment = {
          horizontal: col === 1 ? "center" : "left",
          vertical: "middle",
          wrapText: true,
        };
        if (col === 10) {
          cell.font = { bold: true, color: { argb: "FF15803D" } };
        }
      }
    });
  });
}

const CHECKLIST_ITEMS: [string, string][] = [
  ["UI", "화면 load시 최상단 및 입력항목에서 Focus 되는가?"],
  ["UI", "필수 입력항목이 입력안내가 표시되는가?"],
  ["UI", "Enable, Disable 처리가 올바르게 동작하는가?"],
  ["UI", "상태에 따라 버튼, 입력, 표시 처리가 올바르게 되는가?"],
  ["화면", "검색 조건이 올바르게 동작하는가?"],
  ["화면", "페이징 처리가 올바르게 동작하는가?"],
  ["화면", "정렬 기능이 올바르게 동작하는가?"],
  ["입력", "필수 입력값 검증이 올바르게 동작하는가?"],
  ["입력", "입력 type(숫자, 문자, 날짜 등)이 올바르게 동작하는가?"],
  ["입력", "최대 입력길이 제한이 올바르게 동작하는가?"],
  ["보고서 출력", "출력 버튼 클릭시 올바르게 동작하는가?"],
  ["레이아웃", "화면 해상도에 따른 레이아웃이 올바른가?"],
  ["레이아웃", "오류 발생시 오류메시지가 올바르게 표시되는가?"],
];

function setupChecklistSheet(sheet: ExcelJS.Worksheet) {
  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 60;
  sheet.getColumn(3).width = 10;

  sheet.mergeCells("A1:C1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "공통 체크리스트";
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 28;

  const hRow = sheet.getRow(2);
  ["프로그램 유형", "공통 체크 항목", "Y/N/NA"].forEach((h, i) => {
    hRow.getCell(i + 1).value = h;
    applyHeaderStyle(hRow.getCell(i + 1));
  });
  hRow.height = 22;

  const categoryRanges: { start: number; end: number }[] = [];
  let currentCat = "";
  let catStart = 3;

  CHECKLIST_ITEMS.forEach(([category, item], idx) => {
    const rowNum = idx + 3;
    const row = sheet.getRow(rowNum);
    row.height = 18;

    if (category !== currentCat) {
      if (currentCat) {
        categoryRanges.push({ start: catStart, end: rowNum - 1 });
      }
      currentCat = category;
      catStart = rowNum;
      row.getCell(1).value = category;
    }

    row.getCell(2).value = item;
    row.getCell(3).value = "NA";

    [1, 2, 3].forEach((col) => {
      row.getCell(col).border = borderStyle();
      row.getCell(col).alignment = {
        horizontal: col === 3 ? "center" : "left",
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  if (currentCat) {
    categoryRanges.push({ start: catStart, end: CHECKLIST_ITEMS.length + 2 });
  }

  categoryRanges.forEach(({ start, end }) => {
    if (start < end) {
      sheet.mergeCells(`A${start}:A${end}`);
    }
    const cell = sheet.getCell(`A${start}`);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderStyle();
  });
}

function setupEvidenceSheet(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  cases: CasePayload[]
) {
  // A: 케이스번호, B-I: 이미지 영역 (8 cols)
  sheet.getColumn(1).width = 14;
  for (let c = 2; c <= 9; c++) sheet.getColumn(c).width = IMG_COL_WIDTH;

  // Row 1: 제목
  sheet.mergeCells("A1:I1");
  const mainHeader = sheet.getCell("A1");
  mainHeader.value = "단위테스트 결과 증빙";
  mainHeader.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  mainHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  mainHeader.alignment = { horizontal: "center", vertical: "middle" };
  mainHeader.border = borderStyle();
  sheet.getRow(1).height = 28;

  // Row 2: 컬럼 헤더
  const caseNumHeader = sheet.getCell("A2");
  caseNumHeader.value = "케이스번호";
  applyHeaderStyle(caseNumHeader);
  sheet.mergeCells("B2:I2");
  const evidenceHeader = sheet.getCell("B2");
  evidenceHeader.value = "테스트 결과 증빙";
  applyHeaderStyle(evidenceHeader);
  sheet.getRow(2).height = 22;

  // 이미지 영역 픽셀 폭 (B~I: 8열 × 18 units × 7.5 px)
  const imgAreaWidthPx = 8 * IMG_COL_WIDTH * IMG_COL_PX;

  let currentRow = 3;

  for (const testCase of cases) {
    const base64Data = testCase.imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    // 이미지 비율에 맞는 행 수 계산
    let numRows = 30;
    try {
      const { w, h } = getPngSize(base64Data);
      const imgHeightPx = imgAreaWidthPx * (h / w);
      numRows = Math.max(10, Math.ceil(imgHeightPx / (IMG_ROW_HEIGHT_PT * PT_TO_PX)));
    } catch { /* 파싱 실패 시 기본값 사용 */ }

    const endRow = currentRow + numRows - 1;

    // 케이스번호 셀 (A열, 병합)
    sheet.mergeCells(`A${currentRow}:A${endRow}`);
    const caseNumCell = sheet.getCell(`A${currentRow}`);
    caseNumCell.value = testCase.caseNumber;
    caseNumCell.font = { bold: true, size: 12 };
    caseNumCell.alignment = { horizontal: "center", vertical: "middle" };
    caseNumCell.border = borderStyle();

    // 행 높이 설정
    for (let r = currentRow; r <= endRow; r++) {
      sheet.getRow(r).height = IMG_ROW_HEIGHT_PT;
    }

    // 이미지 셀 외곽 테두리만 적용 (내부 격자선 없음)
    for (let r = currentRow; r <= endRow; r++) {
      for (let c = 2; c <= 9; c++) {
        const isTop    = r === currentRow;
        const isBottom = r === endRow;
        const isLeft   = c === 2;
        const isRight  = c === 9;
        if (isTop || isBottom || isLeft || isRight) {
          sheet.getCell(r, c).border = {
            top:    isTop    ? { style: "thin" } : undefined,
            bottom: isBottom ? { style: "thin" } : undefined,
            left:   isLeft   ? { style: "thin" } : undefined,
            right:  isRight  ? { style: "thin" } : undefined,
          };
        }
      }
    }

    // 이미지 배치
    const imageId = workbook.addImage({ base64: base64Data, extension: "png" });
    sheet.addImage(imageId, `B${currentRow}:I${endRow}`);

    currentRow = endRow + 1;
  }
}

function borderStyle(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.BorderStyle = "thin";
  return {
    top: { style: side },
    left: { style: side },
    bottom: { style: side },
    right: { style: side },
  };
}

function applyHeaderStyle(cell: ExcelJS.Cell) {
  cell.font = { bold: true, size: 10, color: { argb: "FF1E3A5F" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = borderStyle();
}
