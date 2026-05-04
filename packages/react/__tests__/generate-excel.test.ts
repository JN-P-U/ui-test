/**
 * @jest-environment node
 */
import ExcelJS from "exceljs";
import { generateExcel } from "../generate-excel";

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const base = {
  serviceCode: "CHC", screenId: "UserList", screenName: "사용자 목록",
  author: "홍길동", capturedAt: "2026-05-04 10:00:00",
  cases: [{ id:"c1", caseNumber: 1, image: TINY_PNG, testItem: "조회", testContent: "목록 표시", expectedResult: "12건", programId: "P01", verifyMethod: "화면 확인" }],
};

async function load(data: Uint8Array) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data.buffer as ArrayBuffer);
  return wb;
}

test("Uint8Array를 반환한다", async () => {
  expect(await generateExcel(base)).toBeInstanceOf(Uint8Array);
});

test("5개 시트가 올바른 이름으로 생성된다", async () => {
  const wb = await load(await generateExcel(base));
  expect(wb.worksheets.map((w) => w.name)).toEqual([
    "겉표지", "개정이력", "단위테스트케이스", "공통체크리스트", "단위테스트케이스결과증빙",
  ]);
});

test("겉표지에 서비스코드·화면ID·화면명이 기록된다", async () => {
  const wb = await load(await generateExcel(base));
  const cover = wb.getWorksheet("겉표지")!;
  expect([cover.getCell("B2").value, cover.getCell("B3").value, cover.getCell("B4").value])
    .toEqual(["CHC", "UserList", "사용자 목록"]);
});

test("capturedAt 미지정 시 YYYY-MM-DD 형식으로 기록된다", async () => {
  const wb = await load(await generateExcel({ ...base, capturedAt: undefined }));
  const cover = wb.getWorksheet("겉표지")!;
  expect(String(cover.getCell("B5").value)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("증빙 시트 케이스번호가 01, 02 형식으로 기록된다", async () => {
  const cases = [1, 2].map((n) => ({ id:`c${n}`, caseNumber:n, image:TINY_PNG, testItem:"", testContent:"", expectedResult:"", programId:"", verifyMethod:"" }));
  const wb = await load(await generateExcel({ ...base, cases }));
  const ev = wb.getWorksheet("단위테스트케이스결과증빙")!;
  expect(ev.getCell("A3").value).toBe("01");
});

test("케이스가 없어도 정상 생성된다", async () => {
  const result = await generateExcel({ ...base, cases: [] });
  expect(result.length).toBeGreaterThan(0);
});
