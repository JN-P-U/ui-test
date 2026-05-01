"use client";

import styles from "./evidence.module.css";

interface Props {
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  zIndex?: number;
}

export default function AlertDialog({ message, onClose, onConfirm, zIndex = 10000 }: Props) {
  return (
    <div className={styles.alertOverlay} style={{ zIndex }} onClick={onClose}>
      <div className={styles.alertBox} onClick={(e) => e.stopPropagation()}>
        <p className={styles.alertMsg}>{message}</p>
        {onConfirm ? (
          <div className={styles.alertBtns}>
            <button type="button" onClick={onClose} className={styles.alertBtnCancel}>취소</button>
            <button type="button" onClick={onConfirm} className={styles.alertBtnOk}>확인</button>
          </div>
        ) : (
          <button type="button" onClick={onClose} className={styles.alertBtnOk}>확인</button>
        )}
      </div>
    </div>
  );
}
