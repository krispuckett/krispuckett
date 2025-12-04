'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// Types
// ============================================================================

type WorkflowStep = 'action' | 'location' | 'items' | 'confirm'

interface Tag {
  type: 'action' | 'location' | 'item'
  label: string
  value: string
  icon?: string
}

interface Action {
  id: string
  label: string
  description: string
  icon: string
}

interface Location {
  id: string
  name: string
  address: string
  type: 'warehouse' | 'store' | 'distribution'
}

interface Product {
  id: string
  sku: string
  name: string
  variant: string
  image: string
  stock: number
  price: number
}

// ============================================================================
// Mock Data
// ============================================================================

const ACTIONS: Action[] = [
  { id: 'transfer', label: 'Transfer inventory', description: 'Move items between locations', icon: '↔' },
  { id: 'adjust', label: 'Adjust inventory', description: 'Update stock quantities', icon: '±' },
  { id: 'receive', label: 'Receive shipment', description: 'Add incoming inventory', icon: '📦' },
  { id: 'count', label: 'Cycle count', description: 'Verify inventory accuracy', icon: '📋' },
]

const LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Main Warehouse', address: '2847 Industrial Blvd, Portland, OR', type: 'warehouse' },
  { id: 'loc-2', name: 'Downtown Flagship', address: '156 NW 23rd Ave, Portland, OR', type: 'store' },
  { id: 'loc-3', name: 'Pearl District', address: '820 NW Flanders St, Portland, OR', type: 'store' },
  { id: 'loc-4', name: 'East Distribution', address: '4521 SE Powell Blvd, Portland, OR', type: 'distribution' },
  { id: 'loc-5', name: 'Mountain View Store', address: '1200 Summit Ave, Bend, OR', type: 'store' },
]

const PRODUCTS: Product[] = [
  { id: 'prod-1', sku: 'ALP-JKT-001', name: 'Alpine Summit Jacket', variant: 'Midnight Blue / L', image: '🧥', stock: 24, price: 289 },
  { id: 'prod-2', sku: 'TRL-PNT-042', name: 'Trailblazer Hiking Pants', variant: 'Stone Grey / 32', image: '👖', stock: 18, price: 129 },
  { id: 'prod-3', sku: 'BCK-PCK-015', name: 'Backcountry 45L Pack', variant: 'Forest Green', image: '🎒', stock: 12, price: 199 },
  { id: 'prod-4', sku: 'SUM-TEE-088', name: 'Summit Base Layer Tee', variant: 'Heather Oat / M', image: '👕', stock: 45, price: 59 },
  { id: 'prod-5', sku: 'RDG-FLC-023', name: 'Ridgeline Fleece Pullover', variant: 'Burnt Orange / XL', image: '🧶', stock: 31, price: 149 },
  { id: 'prod-6', sku: 'TRK-BT-007', name: 'Trekker Waterproof Boots', variant: 'Brown Leather / 10', image: '🥾', stock: 8, price: 249 },
  { id: 'prod-7', sku: 'GLV-INS-011', name: 'Insulated Grip Gloves', variant: 'Black / M', image: '🧤', stock: 52, price: 45 },
  { id: 'prod-8', sku: 'CAP-SUN-033', name: 'Sunshield Trail Cap', variant: 'Sand', image: '🧢', stock: 67, price: 35 },
]

// ============================================================================
// Component
// ============================================================================

interface CommandKProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandK({ isOpen, onClose }: CommandKProps) {
  const [step, setStep] = useState<WorkflowStep>('action')
  const [inputValue, setInputValue] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isConfirming, setIsConfirming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('action')
      setInputValue('')
      setTags([])
      setSelectedIndex(0)
      setSelectedItems(new Set())
      setIsConfirming(false)
      setIsComplete(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Get filtered results based on current step and input
  const getResults = useCallback(() => {
    const query = inputValue.toLowerCase()

    switch (step) {
      case 'action':
        return ACTIONS.filter(a =>
          a.label.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
        )
      case 'location':
        return LOCATIONS.filter(l =>
          l.name.toLowerCase().includes(query) ||
          l.address.toLowerCase().includes(query)
        )
      case 'items':
        return PRODUCTS.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.variant.toLowerCase().includes(query)
        )
      default:
        return []
    }
  }, [step, inputValue])

  const results = getResults()

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1))
    }
  }, [results.length, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const selected = list.children[selectedIndex] as HTMLElement
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        handleSelect()
        break
      case 'Backspace':
        if (inputValue === '' && tags.length > 0) {
          e.preventDefault()
          handleRemoveLastTag()
        }
        break
      case 'Tab':
        if (step === 'items' && selectedItems.size > 0) {
          e.preventDefault()
          handleProceedToConfirm()
        }
        break
    }
  }

  const handleSelect = () => {
    if (step === 'confirm') {
      handleConfirm()
      return
    }

    if (results.length === 0) return
    const selected = results[selectedIndex]

    switch (step) {
      case 'action':
        const action = selected as Action
        setTags([...tags, { type: 'action', label: action.label, value: action.id, icon: action.icon }])
        setStep('location')
        setInputValue('')
        setSelectedIndex(0)
        break
      case 'location':
        const location = selected as Location
        setTags([...tags, { type: 'location', label: location.name, value: location.id }])
        setStep('items')
        setInputValue('')
        setSelectedIndex(0)
        break
      case 'items':
        const product = selected as Product
        const newSelected = new Set(selectedItems)
        if (newSelected.has(product.id)) {
          newSelected.delete(product.id)
        } else {
          newSelected.add(product.id)
        }
        setSelectedItems(newSelected)
        break
    }
  }

  const handleProceedToConfirm = () => {
    const itemTags: Tag[] = PRODUCTS
      .filter(p => selectedItems.has(p.id))
      .map(p => ({ type: 'item' as const, label: p.name, value: p.id }))
    setTags([...tags, ...itemTags])
    setStep('confirm')
    setInputValue('')
  }

  const handleConfirm = () => {
    setIsConfirming(true)
    setTimeout(() => {
      setIsConfirming(false)
      setIsComplete(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    }, 800)
  }

  const handleRemoveLastTag = () => {
    const newTags = [...tags]
    const removed = newTags.pop()
    setTags(newTags)

    if (removed?.type === 'item') {
      // If we removed an item tag, check if there are more item tags
      const hasMoreItems = newTags.some(t => t.type === 'item')
      if (!hasMoreItems) {
        setStep('items')
        setSelectedItems(new Set())
      }
    } else if (removed?.type === 'location') {
      setStep('location')
    } else if (removed?.type === 'action') {
      setStep('action')
    }
  }

  const getPlaceholder = () => {
    switch (step) {
      case 'action': return 'What would you like to do?'
      case 'location': return 'Select destination location...'
      case 'items': return 'Search products to transfer...'
      case 'confirm': return 'Press Enter to confirm transfer'
    }
  }

  const getStepLabel = () => {
    switch (step) {
      case 'action': return 'Actions'
      case 'location': return 'Locations'
      case 'items': return `Products ${selectedItems.size > 0 ? `(${selectedItems.size} selected)` : ''}`
      case 'confirm': return 'Confirm Transfer'
    }
  }

  const getLocationIcon = (type: Location['type']) => {
    switch (type) {
      case 'warehouse': return '🏭'
      case 'store': return '🏪'
      case 'distribution': return '📍'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[640px] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Success State */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white z-10 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-[#008060] flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#1a1a1a] font-semibold text-lg">Transfer initiated</p>
                <p className="text-[#6d7175] text-sm">{selectedItems.size} items moving to destination</p>
              </motion.div>
            </motion.div>
          )}

          {/* Input Area */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e1e3e5]">
            {/* Search Icon */}
            <div className="flex-shrink-0 text-[#8c9196]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {tags.map((tag, i) => (
                <motion.span
                  key={`${tag.type}-${tag.value}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium
                    ${tag.type === 'action' ? 'bg-[#e3f1df] text-[#1a5d1a]' : ''}
                    ${tag.type === 'location' ? 'bg-[#e0f0ff] text-[#0055a6]' : ''}
                    ${tag.type === 'item' ? 'bg-[#fff5e6] text-[#8a6116]' : ''}
                  `}
                >
                  {tag.icon && <span className="text-xs">{tag.icon}</span>}
                  {tag.label}
                </motion.span>
              ))}

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? getPlaceholder() : getPlaceholder()}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-[#1a1a1a] text-base placeholder:text-[#8c9196]"
              />
            </div>

            {/* Keyboard shortcut hint */}
            <div className="flex-shrink-0 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs font-mono text-[#6d7175] bg-[#f1f2f4] rounded">esc</kbd>
            </div>
          </div>

          {/* Results Area */}
          {step !== 'confirm' && (
            <div className="max-h-[400px] overflow-y-auto">
              {/* Section Header */}
              <div className="px-4 py-2 text-xs font-semibold text-[#6d7175] uppercase tracking-wider bg-[#fafbfb] border-b border-[#e1e3e5]">
                {getStepLabel()}
              </div>

              {/* Results List */}
              <div ref={listRef} className="py-1">
                {step === 'action' && (results as Action[]).map((action, i) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      setSelectedIndex(i)
                      handleSelect()
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                      ${selectedIndex === i ? 'bg-[#f1f2f4]' : 'hover:bg-[#fafbfb]'}
                    `}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f1f2f4] flex items-center justify-center text-xl">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1a1a1a] font-medium">{action.label}</p>
                      <p className="text-[#6d7175] text-sm">{action.description}</p>
                    </div>
                    {selectedIndex === i && (
                      <kbd className="px-1.5 py-0.5 text-xs font-mono text-[#6d7175] bg-white rounded border border-[#e1e3e5]">↵</kbd>
                    )}
                  </motion.div>
                ))}

                {step === 'location' && (results as Location[]).map((location, i) => (
                  <motion.div
                    key={location.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      setSelectedIndex(i)
                      handleSelect()
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                      ${selectedIndex === i ? 'bg-[#f1f2f4]' : 'hover:bg-[#fafbfb]'}
                    `}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f1f2f4] flex items-center justify-center text-xl">
                      {getLocationIcon(location.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1a1a1a] font-medium">{location.name}</p>
                      <p className="text-[#6d7175] text-sm truncate">{location.address}</p>
                    </div>
                    {selectedIndex === i && (
                      <kbd className="px-1.5 py-0.5 text-xs font-mono text-[#6d7175] bg-white rounded border border-[#e1e3e5]">↵</kbd>
                    )}
                  </motion.div>
                ))}

                {step === 'items' && (results as Product[]).map((product, i) => {
                  const isSelected = selectedItems.has(product.id)
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        setSelectedIndex(i)
                        handleSelect()
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                        ${selectedIndex === i ? 'bg-[#f1f2f4]' : 'hover:bg-[#fafbfb]'}
                        ${isSelected ? 'bg-[#e3f1df]' : ''}
                      `}
                    >
                      {/* Checkbox */}
                      <div className={`
                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-[#008060] border-[#008060]' : 'border-[#8c9196]'}
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Product Image */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f1f2f4] flex items-center justify-center text-xl">
                        {product.image}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[#1a1a1a] font-medium">{product.name}</p>
                          <span className="text-xs text-[#8c9196] font-mono">{product.sku}</span>
                        </div>
                        <p className="text-[#6d7175] text-sm">{product.variant}</p>
                      </div>

                      {/* Stock */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[#1a1a1a] font-medium">{product.stock}</p>
                        <p className="text-[#8c9196] text-xs">in stock</p>
                      </div>
                    </motion.div>
                  )
                })}

                {results.length === 0 && (
                  <div className="px-4 py-8 text-center text-[#6d7175]">
                    <p>No results found for &ldquo;{inputValue}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="p-4">
              <div className="bg-[#fafbfb] rounded-lg p-4 mb-4">
                <h3 className="text-[#1a1a1a] font-semibold mb-3">Transfer Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[#6d7175]">Action:</span>
                    <span className="text-[#1a1a1a] font-medium">{tags.find(t => t.type === 'action')?.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6d7175]">Destination:</span>
                    <span className="text-[#1a1a1a] font-medium">{tags.find(t => t.type === 'location')?.label}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#6d7175]">Items:</span>
                    <div className="flex-1">
                      {tags.filter(t => t.type === 'item').map((tag, i) => (
                        <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-[#fff5e6] text-[#8a6116] rounded text-xs font-medium">
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`
                  w-full py-3 rounded-lg font-semibold text-white transition-colors
                  ${isConfirming ? 'bg-[#6d7175]' : 'bg-[#008060] hover:bg-[#006e52]'}
                `}
              >
                {isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Confirm Transfer'
                )}
              </motion.button>
            </div>
          )}

          {/* Footer */}
          {step === 'items' && selectedItems.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-[#fafbfb] border-t border-[#e1e3e5] flex items-center justify-between"
            >
              <p className="text-sm text-[#6d7175]">
                <span className="font-semibold text-[#1a1a1a]">{selectedItems.size}</span> items selected
              </p>
              <button
                onClick={handleProceedToConfirm}
                className="px-4 py-1.5 bg-[#008060] text-white text-sm font-medium rounded-lg hover:bg-[#006e52] transition-colors flex items-center gap-2"
              >
                Continue
                <kbd className="px-1 py-0.5 text-xs font-mono bg-white/20 rounded">Tab</kbd>
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
