interface PasswordVisibilityButtonProps {
  visible: boolean
  onClick: () => void
  label: string
}

export function PasswordVisibilityButton({
  visible,
  onClick,
  label,
}: PasswordVisibilityButtonProps) {
  return (
    <button
      type="button"
      aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      aria-pressed={visible}
      className="absolute inset-y-0 right-3 my-auto grid size-7 place-items-center text-primary transition-colors hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />

        <circle cx="12" cy="12" r="2.5" />

        {!visible && <path d="M4 20 20 4" />}
      </svg>
    </button>
  )
}
