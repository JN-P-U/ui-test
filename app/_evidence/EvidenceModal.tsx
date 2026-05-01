"use client";

import AlertDialog from "./AlertDialog";
import { useState } from "react";
import type { CaseItem } from "./types";
import { generateExcel } from "./generate-excel";

interface Props {
  cases: CaseItem[];
  serviceCode: string;
  screenId: string;
  screenName: string;
  author: string;
  bizCategory: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  onAddCase: () => void;
  onDeleteCase: (id: string) => void;
  onUpdateCase: (id: string, updates: Partial<Omit<CaseItem, "id" | "image">>) => void;
  onClose: () => void;
  onNewTest: () => void;
  onDownloadComplete: () => void;
  onServiceCodeChange: (v: string) => void;
  onScreenIdChange: (v: string) => void;
  onScreenNameChange: (v: string) => void;
  onAuthorChange: (v: string) => void;
  onBizCategoryChange: (v: string) => void;
  onLevel1Change: (v: string) => void;
  onLevel2Change: (v: string) => void;
  onLevel3Change: (v: string) => void;
  onLevel4Change: (v: string) => void;
}

export default function EvidenceModal({
  cases,
  serviceCode,
  screenId,
  screenName,
  author,
  bizCategory,
  level1,
  level2,
  level3,
  level4,
  onAddCase,
  onDeleteCase,
  onUpdateCase,
  onClose,
  onNewTest,
  onDownloadComplete,
  onServiceCodeChange,
  onScreenIdChange,
  onScreenNameChange,
  onAuthorChange,
  onBizCategoryChange,
  onLevel1Change,
  onLevel2Change,
  onLevel3Change,
  onLevel4Change,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [confirmNewTest, setConfirmNewTest] = useState(false);

  const previewFileName = `MAL_${serviceCode || "서비스코드"}_AC02(단위테스트케이스결과서)_UT_${screenId || "화면ID"}_${screenName || "화면명"}_V1.0.xlsx`;

  async function handleDownload() {
    if (!serviceCode.trim()) { setAlertMsg("서비스코드를 입력해주세요."); return; }
    if (cases.length === 0) { setAlertMsg("캡처된 케이스가 없습니다."); return; }
    setLoading(true);
    try {
      const capturedAt = new Date().toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
      const payload = {
        serviceCode, screenId, screenName, author, capturedAt,
        bizCategory, level1, level2, level3, level4,
        cases: cases.map((c) => ({
          caseNumber: c.caseNumber,
          imageBase64: c.image,
          testItem: c.testItem,
          testContent: c.testContent,
          expectedResult: c.expectedResult,
          programId: c.programId,
          verifyMethod: c.verifyMethod,
        })),
      };
      const uint8 = await generateExcel(payload);
      const blob = new Blob([uint8.buffer as ArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MAL_${serviceCode}_AC02(단위테스트케이스결과서)_UT_${screenId}_${screenName}_V1.0.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      onDownloadComplete();
    } catch (e) {
      setAlertMsg("엑셀 다운로드 중 오류가 발생했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-[740px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-700 text-white shrink-0">
          <h2 className="text-base font-bold">테스트 증빙 생성</h2>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* 파일 정보 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">파일 정보</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">서비스코드 <span className="text-red-500">*</span></label>
                <input type="text" value={serviceCode} onChange={(e) => onServiceCodeChange(e.target.value)} placeholder="예) CHC"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">화면ID</label>
                <input type="text" value={screenId} onChange={(e) => onScreenIdChange(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">화면명</label>
                <input type="text" value={screenName} onChange={(e) => onScreenNameChange(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">작성자</label>
                <input type="text" value={author} onChange={(e) => onAuthorChange(e.target.value)} placeholder="이름"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-3">
              {([
                ["업무분류", bizCategory, onBizCategoryChange],
                ["Level1",   level1,      onLevel1Change],
                ["Level2",   level2,      onLevel2Change],
                ["Level3",   level3,      onLevel3Change],
                ["Level4",   level4,      onLevel4Change],
              ] as [string, string, (v: string) => void][]).map(([label, value, onChange]) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">{label}</label>
                  <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400 truncate" title={previewFileName}>파일명: {previewFileName}</p>
          </section>

          {/* 테스트 케이스 목록 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                테스트 케이스
                <span className="ml-2 text-xs font-normal text-gray-400">{cases.length}건</span>
              </h3>
              <button type="button" onClick={onAddCase}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded hover:bg-green-100 transition-colors">
                + 케이스 추가
              </button>
            </div>

            {cases.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                캡처된 케이스가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {[...cases].reverse().map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {/* 스크린샷 썸네일 */}
                    <div className="shrink-0 w-44 border border-gray-200 rounded overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt={`케이스 ${c.caseNumber} 캡처`} className="w-full max-h-52 object-contain" />
                    </div>

                    {/* 입력 필드 */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500 shrink-0">케이스번호</label>
                          <input type="number" min="1" value={c.caseNumber}
                            onChange={(e) => onUpdateCase(c.id, { caseNumber: parseInt(e.target.value) || 1 })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-16 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        </div>
                        <button type="button" onClick={() => onDeleteCase(c.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none" title="케이스 삭제">✕</button>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-medium text-gray-500">테스트항목</label>
                        <input type="text" value={c.testItem} onChange={(e) => onUpdateCase(c.id, { testItem: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-medium text-gray-500">테스트내용</label>
                        <textarea value={c.testContent} onChange={(e) => onUpdateCase(c.id, { testContent: e.target.value })}
                          rows={2} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-medium text-gray-500">예상결과</label>
                        <textarea value={c.expectedResult} onChange={(e) => onUpdateCase(c.id, { expectedResult: e.target.value })}
                          rows={2} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs font-medium text-gray-500">프로그램ID</label>
                          <input type="text" value={c.programId} onChange={(e) => onUpdateCase(c.id, { programId: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs font-medium text-gray-500">결과확인방법</label>
                          <input type="text" value={c.verifyMethod} onChange={(e) => onUpdateCase(c.id, { verifyMethod: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50">
          <button type="button" onClick={() => setConfirmNewTest(true)}
            className="px-4 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            새 테스트 추가
          </button>
          <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors">
            취소
          </button>
          <button type="button" onClick={handleDownload} disabled={loading || cases.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />생성 중...</>
            ) : "엑셀 다운로드"}
          </button>
          </div>
        </div>
      </div>
    </div>

    {alertMsg && <AlertDialog message={alertMsg} onClose={() => setAlertMsg("")} zIndex={10001} />}
    {confirmNewTest && (
      <AlertDialog
        message={"현재 케이스가 모두 삭제됩니다.\n새 테스트를 시작하시겠습니까?"}
        onClose={() => setConfirmNewTest(false)}
        onConfirm={() => { setConfirmNewTest(false); onNewTest(); }}
        zIndex={10001}
      />
    )}
    </>
  );
}
