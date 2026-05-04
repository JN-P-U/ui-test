import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EvidenceModal from "../src/EvidenceModal";

jest.mock("../src/generate-excel", () => ({
  generateExcel: jest.fn().mockResolvedValue(new Uint8Array([0x50, 0x4b])),
  makeFileName: jest.fn().mockReturnValue("MAL_CHC_AC02(단위테스트케이스결과서)_UT_USR_사용자_V1.0.xlsx"),
}));

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const props = {
  cases: [{ id:"c1", caseNumber:1, image:TINY_PNG, testItem:"", testContent:"", expectedResult:"", programId:"", verifyMethod:"" }],
  serviceCode:"", screenId:"USR", screenName:"사용자", author:"",
  bizCategory:"", level1:"", level2:"", level3:"", level4:"",
  onAddCase:jest.fn(), onDeleteCase:jest.fn(), onUpdateCase:jest.fn(),
  onClose:jest.fn(), onNewTest:jest.fn(), onDownloadComplete:jest.fn(),
  onServiceCodeChange:jest.fn(), onScreenIdChange:jest.fn(), onScreenNameChange:jest.fn(),
  onAuthorChange:jest.fn(), onBizCategoryChange:jest.fn(),
  onLevel1Change:jest.fn(), onLevel2Change:jest.fn(), onLevel3Change:jest.fn(), onLevel4Change:jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  global.URL.createObjectURL = jest.fn().mockReturnValue("blob:test");
  global.URL.revokeObjectURL = jest.fn();
});

test("타이틀이 렌더링된다", () => {
  render(<EvidenceModal {...props} />);
  expect(screen.getByText("테스트 증빙 생성")).toBeInTheDocument();
});

test("서비스코드 없이 다운로드 시 경고가 표시된다", async () => {
  render(<EvidenceModal {...props} serviceCode="" />);
  fireEvent.click(screen.getByText("엑셀 다운로드"));
  await waitFor(() => expect(screen.getByText("서비스코드를 입력해주세요.")).toBeInTheDocument());
});

test("닫기(✕) 클릭 시 onClose가 호출된다", () => {
  render(<EvidenceModal {...props} />);
  fireEvent.click(screen.getAllByText("✕")[0]);
  expect(props.onClose).toHaveBeenCalledTimes(1);
});

test("케이스 추가 버튼 클릭 시 onAddCase가 호출된다", () => {
  render(<EvidenceModal {...props} />);
  fireEvent.click(screen.getByText("+ 케이스 추가"));
  expect(props.onAddCase).toHaveBeenCalledTimes(1);
});

test("다운로드 성공 시 onDownloadComplete가 호출된다", async () => {
  render(<EvidenceModal {...props} serviceCode="CHC" />);
  const anchor = { href:"", download:"", click:jest.fn(), style:{} };
  const orig = document.createElement.bind(document);
  jest.spyOn(document, "createElement").mockImplementation((tag, ...args) =>
    tag === "a" ? (anchor as unknown as HTMLAnchorElement) : orig(tag, ...args as [ElementCreationOptions?])
  );
  fireEvent.click(screen.getByText("엑셀 다운로드"));
  await waitFor(() => expect(props.onDownloadComplete).toHaveBeenCalledTimes(1));
  jest.restoreAllMocks();
});
