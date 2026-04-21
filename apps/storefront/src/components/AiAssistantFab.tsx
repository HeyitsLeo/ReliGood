'use client'

import { WHATSAPP_URL } from '@/lib/constants'

export function AiAssistantFab() {
  return (
    <a
      href={`${WHATSAPP_URL}?text=${encodeURIComponent('Hi, I need help choosing a product!')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8"
      aria-label="AI Tech Advisor"
    >
      <div className="primary-gradient flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110">
        <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z" />
        </svg>
      </div>
      {/* Tooltip */}
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-on-surface px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        AI Tech Advisor
      </span>
    </a>
  )
}
