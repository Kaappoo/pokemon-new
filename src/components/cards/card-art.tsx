import { useState } from 'react'
import { cardImageUrl, type ImageQuality } from '#/domain/catalog.ts'
import { cn } from '#/lib/utils.ts'

/**
 * A card's art in a print-proportioned frame. TCGdex lists new sets before
 * all their images are published (and occasionally a file is missing), so no
 * image, or one that fails to load, becomes a typographic placeholder instead
 * of a broken picture.
 */
export function CardArt({
  image,
  name,
  localId,
  quality = 'low',
  priority = false,
  className,
}: {
  image: string | null
  name: string
  localId: string
  quality?: ImageQuality
  priority?: boolean
  className?: string
}) {
  const src = cardImageUrl(image, quality)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = src !== null && failedSrc !== src

  return (
    <div className={cn('card-frame relative', className)}>
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          width={quality === 'high' ? 600 : 245}
          height={quality === 'high' ? 825 : 337}
          onError={() => setFailedSrc(src)}
          // Server-rendered images can fail before React hydrates and attaches onError.
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailedSrc(src)
          }}
          className="size-full object-cover"
        />
      ) : (
        <div role="img" aria-label={name} className="flex size-full flex-col justify-end gap-1 p-3">
          <span aria-hidden className="font-numerals text-4xl text-paper-dim/40">
            {localId}
          </span>
          <span aria-hidden className="text-sm leading-tight font-semibold">
            {name}
          </span>
          <span aria-hidden className="text-xs text-paper-dim">
            {src ? 'Image unavailable' : 'Art coming soon'}
          </span>
        </div>
      )}
    </div>
  )
}
