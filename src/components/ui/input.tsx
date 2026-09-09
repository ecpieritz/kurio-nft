import { cn } from '@/lib/utils'

export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full rounded-control border border-input bg-background px-4 text-sm text-foreground shadow-xs transition-[border-color,box-shadow] duration-(--duration-fast) placeholder:text-muted-foreground hover:border-primary/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}
