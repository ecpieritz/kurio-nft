import type { PropsWithChildren } from 'react'

import { HomeContent } from '@/features/home/home-content'

export function AuthModalLayout({
  children,
}: PropsWithChildren) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate min-h-[calc(100svh-var(--header-height))] overflow-hidden md:min-h-[56rem]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none hidden select-none md:block"
      >
        <HomeContent />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-overlay/75 backdrop-blur-[1px] md:block"
      />

      <div className="relative z-10 flex min-h-svh items-start justify-center bg-card px-7 pb-12 pt-24 md:absolute md:inset-0 md:min-h-0 md:bg-transparent md:px-6 md:pb-20 md:pt-16">
        {children}
      </div>
    </main>
  )
}