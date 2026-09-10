import type { CSSProperties } from 'react'

import { iconAssets, type IconName } from '@/assets/catalog'
import { cn } from '@/lib/utils'

interface IconProps {
  name: IconName
  label?: string
  color?: string
  className?: string
  style?: CSSProperties
  title?: string
  'aria-hidden'?: boolean
}

export function Icon({
  name,
  label,
  color,
  className,
  style,
  title,
  'aria-hidden': ariaHidden,
}: IconProps) {
  const iconSrc = iconAssets[name]

  if (color) {
    const coloredIconStyle: CSSProperties = {
      WebkitMaskImage: `url("${iconSrc}")`,
      maskImage: `url("${iconSrc}")`,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      backgroundColor: color,
      ...style,
    }

    return (
      <span
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : (ariaHidden ?? true)}
        title={title}
        className={cn('inline-block size-5 shrink-0', className)}
        style={coloredIconStyle}
      />
    )
  }

  return (
    <img
      src={iconSrc}
      alt={label ?? ''}
      aria-hidden={label ? undefined : (ariaHidden ?? true)}
      title={title}
      className={cn('size-5 shrink-0', className)}
      style={style}
      decoding="async"
    />
  )
}