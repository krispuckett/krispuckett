'use client'

import { useState, useEffect } from 'react'
import CommandK from '@/components/CommandK'

export default function StripeDemoPage() {
  const [isCommandKOpen, setIsCommandKOpen] = useState(false)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandKOpen(true)
        setShowHint(false)
      }
      if (e.key === 'Escape') {
        setIsCommandKOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f6f6f7]">
      {/* Shopify Screenshot Background */}
      <div className="absolute inset-0">
        {/* Placeholder for screenshot - user will add */}
        <div className="w-full h-full flex items-center justify-center bg-[#f6f6f7]">
          <img
            src="/shopify-screenshot.png"
            alt="Shopify Transfers Screen"
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              // Fallback if screenshot not added yet
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-gray-500">
                  <p class="text-lg mb-2">Add your Shopify screenshot to:</p>
                  <code class="bg-gray-200 px-3 py-1 rounded text-sm">/public/shopify-screenshot.png</code>
                  <p class="mt-4 text-sm">Press ⌘K to open the command palette</p>
                </div>
              `
            }}
          />
        </div>
      </div>

      {/* Keyboard Hint */}
      {showHint && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
            <span>Press</span>
            <kbd className="bg-[#333] px-2 py-0.5 rounded text-xs font-mono">⌘</kbd>
            <kbd className="bg-[#333] px-2 py-0.5 rounded text-xs font-mono">K</kbd>
            <span>to open command palette</span>
          </div>
        </div>
      )}

      {/* Command K Modal */}
      <CommandK
        isOpen={isCommandKOpen}
        onClose={() => setIsCommandKOpen(false)}
      />
    </div>
  )
}
