'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function TopBar() {
  const router = useRouter()
  const [company] = useState('C‑FORGIA')
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    }
    router.push('/auth/login')
  }

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastY.current + 10) {
        setVisible(false) // scrolling down
      } else if (y < lastY.current - 10) {
        setVisible(true) // scrolling up
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92vw] md:w-[86vw] max-w-5xl transition-transform duration-300 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
      <div className="bg-black/90 text-white shadow-xl rounded-full px-4 md:px-6 py-2 flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-2 md:gap-3">
          <Image src="/logo.png" alt="logo" width={28} height={28} className="rounded-sm" />
          <span className="text-sm md:text-base font-semibold tracking-tight">{company}</span>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium bg-white text-black px-3 py-1.5 rounded-full hover:opacity-90">
          Logout
        </button>
      </div>
    </div>
  )
}


