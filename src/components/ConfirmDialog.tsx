type ConfirmTone =
  | "default"
  | "danger"

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="confirm-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <span className="section-label">
          FinalWhistle
        </span>
        <h2 id="confirm-title">
          {title}
        </h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button
            type="button"
            className="glass-button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`primary-button ${
              tone === "danger"
                ? "danger-button"
                : ""
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
