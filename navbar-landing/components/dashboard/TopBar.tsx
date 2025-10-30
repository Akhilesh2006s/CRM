'use client'

import { Menu, User } from 'lucide-react'

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="h-14 md:h-16 w-full bg-[#1976D2] text-white flex items-center justify-between px-4 md:px-6 shadow">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="p-1.5 rounded hover:bg-white/10">
          <Menu size={20} />
        </button>
        <div className="font-semibold text-lg">C-FORGIA</div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden sm:block">Pavan Simhadri</span>
        <User size={18} />
      </div>
    </header>
  )
}


