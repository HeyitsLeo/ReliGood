'use client'
import { useState, useRef, useCallback } from 'react'
import { ImageWithFallback } from './ImageWithFallback'

interface Props {
  images: (string | null)[] | null | undefined
  alt: string
}

export function ImageGallery({ images, alt }: Props) {
  const urls = (images ?? []).filter(Boolean) as string[]
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(idx)
  }, [])

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setActiveIndex(i)
  }, [])

  // Single image or no images — same as current behavior
  if (urls.length <= 1) {
    return (
      <ImageWithFallback
        src={urls[0]}
        alt={alt}
        className="aspect-square w-full rounded-xl object-cover"
      />
    )
  }

  return (
    <div>
      {/* Mobile: scroll-snap carousel */}
      <div className="md:hidden">
        <div ref={scrollRef} onScroll={onScroll} className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-xl">
          {urls.map((url, i) => (
            <div key={i} className="w-full flex-shrink-0 snap-center">
              <ImageWithFallback
                src={url}
                alt={`${alt} ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
            </div>
          ))}
        </div>
        {/* Dot indicators */}
        <div className="mt-2 flex justify-center gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-on-surface/20'
              }`}
              onClick={() => scrollToIndex(i)}
              aria-label={`View image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: main image + thumbnails */}
      <div className="hidden md:block">
        <ImageWithFallback
          src={urls[activeIndex]}
          alt={`${alt} ${activeIndex + 1}`}
          className="aspect-square w-full rounded-xl object-cover"
        />
        <div className="mt-3 flex gap-2">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              <ImageWithFallback
                src={url}
                alt={`${alt} thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
