import { nftArtwork, type NftArtworkName } from '@/assets/catalog'
import { cn } from '@/lib/utils'

interface NftArtworkProps extends Omit<
  React.ComponentProps<'img'>,
  'alt' | 'height' | 'src' | 'srcSet' | 'width'
> {
  artwork: NftArtworkName
  alt?: string
}

export function NftArtwork({ artwork, alt, className, sizes, ...props }: NftArtworkProps) {
  const asset = nftArtwork[artwork]

  return (
    <img
      src={asset.src}
      srcSet={asset.srcSet}
      sizes={sizes ?? '(max-width: 768px) 100vw, 800px'}
      alt={alt ?? asset.alt}
      width={asset.width}
      height={asset.height}
      className={cn('aspect-square object-cover', className)}
      {...props}
    />
  )
}
