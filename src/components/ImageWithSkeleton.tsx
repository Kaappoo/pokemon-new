import React, { useState } from 'react'

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    className?: string
    containerClassName?: string
    skeletonClassName?: string
    aspectRatio?: string
}

export function ImageWithSkeleton({
    src,
    alt,
    className = '',
    containerClassName = '',
    skeletonClassName = '',
    aspectRatio,
    style,
    onLoad,
    onError,
    ...props
}: ImageWithSkeletonProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)

    return (
        <div
            className={`relative overflow-hidden ${containerClassName}`}
            style={{ aspectRatio, ...style }}
        >
            {/* Shimmer Skeleton Placeholder while loading */}
            {!isLoaded && !hasError && (
                <div
                    className={`absolute inset-0 skeleton ${skeletonClassName}`}
                />
            )}

            {/* Error state fallback */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-white/40 text-xs font-medium p-2 text-center border border-white/10 rounded-xl">
                    <span>{alt || 'Image unavailable'}</span>
                </div>
            )}

            {/* Actual image - hidden until fully loaded to prevent top-to-bottom scan effect */}
            <img
                src={src}
                alt={alt}
                onLoad={(e) => {
                    setIsLoaded(true)
                    onLoad?.(e)
                }}
                onError={(e) => {
                    setHasError(true)
                    onError?.(e)
                }}
                className={`transition-opacity duration-300 ease-out ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                } ${className}`}
                {...props}
            />
        </div>
    )
}
