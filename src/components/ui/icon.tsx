import type { ComponentProps, CSSProperties } from 'react'

import { iconAssets, type IconName } from '@/assets/catalog'
import { cn } from '@/lib/utils'

interface IconProps extends Omit<ComponentProps<'img'>, 'alt' | 'src'> {
  name: IconName
  label?: string
  color?: string
}

const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

export function Icon({ name, label, color, className, style, ...props }: IconProps) {
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
      <img
        src={transparentPixel}
        alt={label ?? ''}
        aria-hidden={label ? undefined : true}
        className={cn('size-5 shrink-0', className)}
        style={coloredIconStyle}
        {...props}
      />
    )
  }

  return (
    <img
      src={iconSrc}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={cn('size-5 shrink-0', className)}
      style={style}
      {...props}
    />
  )
}
