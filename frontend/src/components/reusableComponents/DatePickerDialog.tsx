import { useEffect, useState } from "react";
import s from "./DatePickerDialog.module.css";

type DatePickerDialogProps = {
  isOpen: boolean;
  title: string;
  confirmLabel?: string;
  initialDate?: string;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: (dateKey: string) => void;
};

const getTodayKey = () => new Date().toISOString().split("T")[0];

export function DatePickerDialog({
  isOpen,
  title,
  confirmLabel = "Confirm",
  initialDate,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: DatePickerDialogProps) {
  const [dateKey, setDateKey] = useState(initialDate ?? getTodayKey());

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setDateKey(initialDate ?? getTodayKey());
  }, [initialDate, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={s.backdrop} role="dialog" aria-modal="true">
      <div className={s.dialog}>
        <h3 className={s.title}>{title}</h3>
        <label className={s.label}>
          Date
          <input
            type="date"
            value={dateKey}
            onChange={(event) => setDateKey(event.target.value)}
            className={s.input}
          />
        </label>
        <div className={s.actions}>
          <button type="button" className={s.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={s.confirmButton}
            onClick={() => onConfirm(dateKey)}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
