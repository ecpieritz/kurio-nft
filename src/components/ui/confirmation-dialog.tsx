import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  pending?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  pending = false,
  onConfirm,
  onOpenChange,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-panel border border-border bg-card p-0 text-card-foreground shadow-elevated backdrop:bg-overlay/85"
      onCancel={(event) => {
        if (pending) {
          event.preventDefault()
          return
        }
        onOpenChange(false)
      }}
      onClose={() => onOpenChange(false)}
    >
      <div className="p-6 md:p-7">
        <h2 id="confirmation-dialog-title" className="text-heading font-bold">
          {title}
        </h2>
        <p id="confirmation-dialog-description" className="mt-3 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? 'Saindo...' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
