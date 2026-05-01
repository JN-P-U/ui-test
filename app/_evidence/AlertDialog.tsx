"use client";

interface Props {
  message: string;
  onClose: () => void;
  onConfirm?: () => void; // 제공 시 확인/취소 두 버튼, 없으면 확인 하나
  zIndex?: number;
}

export default function AlertDialog({ message, onClose, onConfirm, zIndex = 10000 }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-xl px-8 py-6 w-80 flex flex-col items-center gap-5">
        <p className="text-sm text-gray-700 text-center leading-relaxed whitespace-pre-line">{message}</p>
        {onConfirm ? (
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-6 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors">
              취소
            </button>
            <button type="button" onClick={onConfirm}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              확인
            </button>
          </div>
        ) : (
          <button type="button" onClick={onClose}
            className="px-8 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
            확인
          </button>
        )}
      </div>
    </div>
  );
}
