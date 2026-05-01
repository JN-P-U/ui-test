"use client";

import { useState } from "react";
import type { CaseItem } from "./types";
import EvidenceModal from "./EvidenceModal";
import { useEvidenceScreenCtx } from "./EvidenceContext";

function waitFrames() {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

export default function EvidenceFloat() {
  const { currentScreenId, currentScreenName } = useEvidenceScreenCtx();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCapture, setPendingCapture] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [serviceCode, setServiceCode] = useState("");
  const [screenId, setScreenId] = useState("");
  const [screenName, setScreenName] = useState("");
  const [author, setAuthor] = useState("");
  const [bizCategory, setBizCategory] = useState("");
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");
  const [level4, setLevel4] = useState("");

  function resetMeta() {
    setServiceCode(""); setScreenId(""); setScreenName(""); setAuthor("");
    setBizCategory(""); setLevel1(""); setLevel2(""); setLevel3(""); setLevel4("");
  }

  async function captureScreen(): Promise<string> {
    const { toPng } = await import("html-to-image");
    return toPng(document.body, { pixelRatio: 1.5, cacheBust: true });
  }

  function initMeta() {
    if (!screenId) setScreenId(currentScreenId);
    if (!screenName) setScreenName(currentScreenName);
  }

  async function handleOpenEvidence() {
    if (cases.length > 0) { setModalOpen(true); return; }
    initMeta();
    setIsCapturing(true);
    await waitFrames(); // 버튼 숨김이 DOM에 반영된 뒤 캡처
    try {
      const image = await captureScreen();
      setCases([{
        id: Date.now().toString(), caseNumber: 1, image,
        testItem: "", testContent: "", expectedResult: "",
        programId: "", verifyMethod: "",
      }]);
      setModalOpen(true);
    } finally {
      setIsCapturing(false);
    }
  }

  function handleAddCase() {
    setModalOpen(false);
    setPendingCapture(true);
  }

  async function handlePendingCapture() {
    setIsCapturing(true);
    await waitFrames(); // 버튼 숨김이 DOM에 반영된 뒤 캡처
    try {
      const image = await captureScreen();
      setCases((prev) => {
        const nextNum = Math.max(...prev.map((c) => c.caseNumber), 0) + 1;
        return [...prev, {
          id: Date.now().toString(), caseNumber: nextNum, image,
          testItem: "", testContent: "", expectedResult: "",
          programId: "", verifyMethod: "",
        }];
      });
    } finally {
      setIsCapturing(false);
      setPendingCapture(false);
      setModalOpen(true);
    }
  }

  function handleCancelPendingCapture() {
    setPendingCapture(false);
    setModalOpen(true);
  }

  function handleDeleteCase(id: string) {
    setCases((prev) => prev.filter((c) => c.id !== id));
  }

  function handleUpdateCase(id: string, updates: Partial<Omit<CaseItem, "id" | "image">>) {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  // 캡처 중에는 모든 플로팅 UI 숨김
  if (isCapturing) return null;

  return (
    <>
      {/* 플로팅 트리거 버튼 — 모달 열려 있을 때는 숨김 */}
      {!pendingCapture && !modalOpen && (
        <div className="fixed bottom-6 right-6 z-[10001]">
          <button
            type="button"
            onClick={handleOpenEvidence}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-green-700 transition-colors"
          >
            {cases.length > 0 ? <>케이스 추가 ({cases.length})</> : <>테스트결과 추가</>}
          </button>
        </div>
      )}

      {/* 케이스 추가 캡처 대기 */}
      {pendingCapture && (
        <div className="fixed bottom-6 right-6 z-[10001] flex flex-col items-end gap-2">
          <div className="bg-black/75 text-white text-xs rounded-lg px-3 py-2 text-right leading-5">
            원하는 화면 상태로 이동 후<br />아래 버튼을 눌러 캡처하세요
          </div>
          <button
            type="button"
            onClick={handlePendingCapture}
            className="px-5 py-3 bg-green-600 text-white text-sm font-bold rounded-full shadow-xl hover:bg-green-700 transition-colors"
          >
            캡처 추가
          </button>
          <button
            type="button"
            onClick={handleCancelPendingCapture}
            className="px-4 py-2 bg-white text-gray-600 text-xs border border-gray-300 rounded-full shadow hover:bg-gray-50 transition-colors"
          >
            ← 돌아가기
          </button>
        </div>
      )}

      {/* 증빙 모달 */}
      {modalOpen && (
        <EvidenceModal
          cases={cases}
          serviceCode={serviceCode}
          screenId={screenId}
          screenName={screenName}
          author={author}
          onAddCase={handleAddCase}
          onDeleteCase={handleDeleteCase}
          onUpdateCase={handleUpdateCase}
          onClose={() => { setModalOpen(false); resetMeta(); }}
          onNewTest={() => { setCases([]); resetMeta(); }}
          onDownloadComplete={() => { setCases([]); setModalOpen(false); resetMeta(); }}
          onServiceCodeChange={setServiceCode}
          onScreenIdChange={setScreenId}
          onScreenNameChange={setScreenName}
          onAuthorChange={setAuthor}
          bizCategory={bizCategory}
          level1={level1}
          level2={level2}
          level3={level3}
          level4={level4}
          onBizCategoryChange={setBizCategory}
          onLevel1Change={setLevel1}
          onLevel2Change={setLevel2}
          onLevel3Change={setLevel3}
          onLevel4Change={setLevel4}
        />
      )}
    </>
  );
}
