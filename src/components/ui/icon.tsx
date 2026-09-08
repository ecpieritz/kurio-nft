import { iconAssets, type IconName } from '@/assets/catalog'
import { cn } from '@/lib/utils'

interface IconProps extends Omit<React.ComponentProps<'img'>, 'alt' | 'src'> {
  name: IconName
  label?: string
}

export function Icon({ name, label, className, ...props }: IconProps) {
  return (
    <img
      src={iconAssets[name]}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={cn('size-5 shrink-0', className)}
      {...props}
    />
  )
}
