"use client";

import { useState } from "react";

interface Props {
  image: string;
  onClose: () => void;
  onRecapture: () => void;
}

export default function TestEvidenceModal({ image, onClose, onRecapture }: Props) {
  const [testName, setTestName] = useState("");
  const [result, setResult] = useState<"Pass" | "Fail">("Pass");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!testName.trim()) {
      alert("테스트 항목명을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const capturedAt = new Date().toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });

      const res = await fetch("/api/generate-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image, testName, result, note, capturedAt }),
      });

      if (!res.ok) throw new Error("엑셀 생성 실패");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `테스트증빙_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 팝업 */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-[680px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-700 text-white shrink-0">
          <h2 className="text-base font-bold">테스트 증빙 생성</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* 본문 (스크롤) */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* 테스트 정보 입력 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">테스트 정보</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  테스트 항목명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="예) 사용자 목록 조회 - 상태 필터"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">결과</label>
                <div className="flex gap-2">
                  {(["Pass", "Fail"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResult(r)}
                      className={`flex-1 py-2 rounded text-sm font-semibold border transition-colors ${
                        result === r
                          ? r === "Pass"
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">비고</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="특이사항 입력"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* 캡처 미리보기 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">화면 캡처 미리보기</h3>
              <button
                onClick={onRecapture}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                다시 캡처
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-h-72 overflow-y-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="캡처 미리보기" className="w-full" />
            </div>
          </section>
        </div>

        {/* 푸터 버튼 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                생성 중...
              </>
            ) : (
              "엑셀 다운로드"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
