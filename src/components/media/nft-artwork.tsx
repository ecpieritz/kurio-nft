import { nftArtwork, type NftArtworkName } from '@/assets/catalog'
import { cn } from '@/lib/utils'

interface NftArtworkProps extends Omit<
  React.ComponentProps<'img'>,
  'alt' | 'height' | 'src' | 'width'
> {
  artwork: NftArtworkName
  alt?: string
}

export function NftArtwork({ artwork, alt, className, ...props }: NftArtworkProps) {
  const asset = nftArtwork[artwork]

  return (
    <img
      src={asset.src}
      alt={alt ?? asset.alt}
      width={asset.width}
      height={asset.height}
      className={cn('aspect-square object-cover', className)}
      {...props}
    />
  )
}
