import { useRef, useEffect, type ReactNode } from 'react'

interface CarouselProps {
    children: ReactNode[]
    slidesPerView?: number
    autoplay?: boolean
    autoplayDelay?: number
    className?: string
    cardClassName?: string
}

export default function Carousel({
    children,
    slidesPerView = 3,
    autoplay = true,
    autoplayDelay = 3000,
    className = '',
    cardClassName = '',
}: CarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!autoplay || !scrollRef.current || children.length === 0) return

        const el = scrollRef.current
        const slideWidth = el.scrollWidth / children.length

        intervalRef.current = setInterval(() => {
            if (!el) return
            const maxScroll = el.scrollWidth - el.clientWidth

            if (el.scrollLeft >= maxScroll - 2) {
                el.scrollTo({ left: 0, behavior: 'smooth' })
            } else {
                el.scrollBy({ left: slideWidth, behavior: 'smooth' })
            }
        }, autoplayDelay)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [autoplay, autoplayDelay, children.length])

    const handleMouseEnter = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
    }

    const handleMouseLeave = () => {
        if (!autoplay || !scrollRef.current || children.length === 0) return
        const el = scrollRef.current
        const slideWidth = el.scrollWidth / children.length

        intervalRef.current = setInterval(() => {
            if (!el) return
            const maxScroll = el.scrollWidth - el.clientWidth
            if (el.scrollLeft >= maxScroll - 2) {
                el.scrollTo({ left: 0, behavior: 'smooth' })
            } else {
                el.scrollBy({ left: slideWidth, behavior: 'smooth' })
            }
        }, autoplayDelay)
    }

    return (
        <div
            ref={scrollRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 ${className}`}
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
            }}
        >
            {children.map((child, i) => (
                <div
                    key={i}
                    className={`snap-center flex-shrink-0 ${cardClassName}`}
                    style={{
                        width: `calc(${100 / slidesPerView}% - ${((slidesPerView - 1) * 16) / slidesPerView}px)`,
                    }}
                >
                    {child}
                </div>
            ))}
        </div>
    )
}
