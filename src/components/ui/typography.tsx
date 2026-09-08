import type { ElementType, HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const typographyVariants = cva('font-mono', {
  variants: {
    variant: {
      display: 'text-display font-bold tracking-display text-balance',
      title: 'text-title font-bold tracking-heading text-balance',
      heading: 'text-heading font-semibold tracking-heading',
      subheading: 'text-subheading font-semibold',
      body: 'text-body',
      caption: 'text-caption',
      label: 'text-label font-semibold tracking-label uppercase',
      eyebrow: 'text-caption font-semibold tracking-label',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      accent: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-success',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
  },
})

type TypographyProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    as?: ElementType
  }

function Typography({ as: Component = 'p', variant, tone, className, ...props }: TypographyProps) {
  return (
    <Component
      data-slot="typography"
      className={cn(typographyVariants({ variant, tone }), className)}
      {...props}
    />
  )
}

export { Typography }
