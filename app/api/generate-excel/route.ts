import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

interface RequestBody {
  imageBase64: string;
  testName: string;
  result: "Pass" | "Fail";
  note: string;
  capturedAt: string;
}

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json();
  const { imageBase64, testName, result, note, capturedAt } = body;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "UI Test Evidence System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("테스트 증빙");

  // 컬럼 너비 설정
  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 35;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 22;
  sheet.getColumn(5).width = 30;

  // ── 타이틀 행 ──
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "단위 테스트 증빙";
  titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.border = borderStyle();
  sheet.getRow(1).height = 32;

  // ── 테스트 정보 헤더 행 ──
  const headerLabels = ["테스트 항목명", "결과", "캡처 일시", "비고"];
  sheet.mergeCells("A2:A2");
  const infoLabelCell = sheet.getCell("A2");
  infoLabelCell.value = "테스트 정보";
  applyHeaderStyle(infoLabelCell);

  ["B2", "C2", "D2", "E2"].forEach((addr, i) => {
    const cell = sheet.getCell(addr);
    cell.value = headerLabels[i];
    applyHeaderStyle(cell);
  });
  sheet.getRow(2).height = 22;

  // ── 테스트 정보 값 행 ──
  const infoValCell = sheet.getCell("A3");
  infoValCell.value = "";
  applyValueStyle(infoValCell);

  const values: Record<string, string> = {
    B3: testName,
    C3: result,
    D3: capturedAt,
    E3: note,
  };
  for (const [addr, val] of Object.entries(values)) {
    const cell = sheet.getCell(addr);
    cell.value = val;
    applyValueStyle(cell);
    if (addr === "C3") {
      cell.font = {
        bold: true,
        color: { argb: result === "Pass" ? "FF15803D" : "FFB91C1C" },
      };
    }
  }
  sheet.getRow(3).height = 20;

  // ── 구분선 ──
  sheet.addRow([]);
  sheet.getRow(4).height = 8;

  // ── 캡처 이미지 라벨 ──
  sheet.mergeCells("A5:E5");
  const imgLabelCell = sheet.getCell("A5");
  imgLabelCell.value = "화면 캡처";
  applyHeaderStyle(imgLabelCell);
  sheet.getRow(5).height = 22;

  // ── 스크린샷 삽입 ──
  const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  const imageId = workbook.addImage({
    base64: base64Data,
    extension: "png",
  });

  // 이미지 크기 추정 후 행 높이 확보 (A4 기준 ~600px 높이)
  const imgRowCount = 30;
  for (let r = 6; r <= 6 + imgRowCount; r++) {
    sheet.getRow(r).height = 20;
  }

  sheet.addImage(imageId, {
    tl: { col: 0, row: 5 },
    br: { col: 5, row: 5 + imgRowCount },
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("테스트증빙_" + capturedAt.replace(/[: ]/g, "-"))}.xlsx`,
    },
  });
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

function applyValueStyle(cell: ExcelJS.Cell) {
  cell.font = { size: 10 };
  cell.alignment = { horizontal: "left", vertical: "middle" };
  cell.border = borderStyle();
}
