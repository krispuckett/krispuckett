'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// Types
// ============================================================================

type WorkflowStep = 'action' | 'items' | 'quantity' | 'location' | 'confirm'

interface Tag {
  type: 'action' | 'location' | 'item'
  label: string
  value: string
  icon?: string
  quantity?: number
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

interface ItemQuantity {
  productId: string
  quantity: number
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
  onTransferComplete?: (transfer: {
    action: string
    location: string
    items: { productId: string; name: string; quantity: number }[]
  }) => void
}

export default function CommandK({ isOpen, onClose, onTransferComplete }: CommandKProps) {
  const [step, setStep] = useState<WorkflowStep>('action')
  const [inputValue, setInputValue] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [itemQuantities, setItemQuantities] = useState<Map<string, number>>(new Map())
  const [isConfirming, setIsConfirming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const quantityInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('action')
      setInputValue('')
      setTags([])
      setSelectedIndex(0)
      setSelectedItems(new Set())
      setItemQuantities(new Map())
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
      case 'items':
        return PRODUCTS.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.variant.toLowerCase().includes(query)
        )
      case 'location':
        return LOCATIONS.filter(l =>
          l.name.toLowerCase().includes(query) ||
          l.address.toLowerCase().includes(query)
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
    if (step === 'quantity') {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        handleProceedToLocation()
      }
      return
    }

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
          handleProceedToQuantity()
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
        setStep('items')
        setInputValue('')
        setSelectedIndex(0)
        break
      case 'items':
        const product = selected as Product
        const newSelected = new Set(selectedItems)
        const newQuantities = new Map(itemQuantities)
        if (newSelected.has(product.id)) {
          newSelected.delete(product.id)
          newQuantities.delete(product.id)
        } else {
          newSelected.add(product.id)
          newQuantities.set(product.id, 1) // Default quantity of 1
        }
        setSelectedItems(newSelected)
        setItemQuantities(newQuantities)
        break
      case 'location':
        const location = selected as Location
        setTags([...tags, { type: 'location', label: location.name, value: location.id }])
        setStep('confirm')
        setInputValue('')
        setSelectedIndex(0)
        break
    }
  }

  const handleProceedToQuantity = () => {
    // Add item tags with initial quantities
    const itemTags: Tag[] = PRODUCTS
      .filter(p => selectedItems.has(p.id))
      .map(p => ({
        type: 'item' as const,
        label: p.name,
        value: p.id,
        quantity: itemQuantities.get(p.id) || 1
      }))
    setTags([...tags, ...itemTags])
    setStep('quantity')
    setInputValue('')
  }

  const handleProceedToLocation = () => {
    // Update tags with final quantities
    const updatedTags = tags.map(tag => {
      if (tag.type === 'item') {
        return { ...tag, quantity: itemQuantities.get(tag.value) || 1 }
      }
      return tag
    })
    setTags(updatedTags)
    setStep('location')
    setInputValue('')
    setSelectedIndex(0)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    const product = PRODUCTS.find(p => p.id === productId)
    if (!product) return

    const validQuantity = Math.max(1, Math.min(quantity, product.stock))
    const newQuantities = new Map(itemQuantities)
    newQuantities.set(productId, validQuantity)
    setItemQuantities(newQuantities)
  }

  const handleConfirm = () => {
    setIsConfirming(true)
    setTimeout(() => {
      setIsConfirming(false)
      setIsComplete(true)

      // Call the callback with transfer data
      if (onTransferComplete) {
        const actionTag = tags.find(t => t.type === 'action')
        const locationTag = tags.find(t => t.type === 'location')
        const itemTags = tags.filter(t => t.type === 'item')

        onTransferComplete({
          action: actionTag?.label || 'Transfer',
          location: locationTag?.label || 'Unknown',
          items: itemTags.map(t => ({
            productId: t.value,
            name: t.label,
            quantity: itemQuantities.get(t.value) || 1
          }))
        })
      }

      setTimeout(() => {
        onClose()
      }, 1500)
    }, 800)
  }

  const handleRemoveLastTag = () => {
    const newTags = [...tags]
    const removed = newTags.pop()
    setTags(newTags)

    if (removed?.type === 'location') {
      setStep('location')
    } else if (removed?.type === 'item') {
      const hasMoreItems = newTags.some(t => t.type === 'item')
      if (!hasMoreItems) {
        setStep('items')
        setSelectedItems(new Set())
        setItemQuantities(new Map())
      } else {
        setStep('quantity')
      }
    } else if (removed?.type === 'action') {
      setStep('action')
    }
  }

  const getPlaceholder = () => {
    switch (step) {
      case 'action': return 'What would you like to do?'
      case 'items': return 'Search products to transfer...'
      case 'quantity': return 'Set quantities, then press Tab to continue'
      case 'location': return 'Select destination location...'
      case 'confirm': return 'Press Enter to confirm transfer'
    }
  }

  const getStepLabel = () => {
    switch (step) {
      case 'action': return 'Actions'
      case 'items': return `Products ${selectedItems.size > 0 ? `(${selectedItems.size} selected)` : ''}`
      case 'quantity': return 'Set Quantities'
      case 'location': return 'Destination'
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

  const getTotalItems = () => {
    let total = 0
    itemQuantities.forEach(qty => total += qty)
    return total
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#008060] to-[#004c3f] flex items-center justify-center shadow-lg">
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                </div>
                <p className="text-[#1a1a1a] font-semibold text-lg">Transfer initiated</p>
                <p className="text-[#6d7175] text-sm">{getTotalItems()} items moving to {tags.find(t => t.type === 'location')?.label}</p>
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
                  {tag.type === 'item' && tag.quantity && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/50 rounded text-xs">×{tag.quantity}</span>
                  )}
                </motion.span>
              ))}

              {/* Input */}
              {step !== 'quantity' && step !== 'confirm' && (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder()}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-[#1a1a1a] text-base placeholder:text-[#8c9196]"
                />
              )}
            </div>

            {/* Keyboard shortcut hint */}
            <div className="flex-shrink-0 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs font-mono text-[#6d7175] bg-[#f1f2f4] rounded">esc</kbd>
            </div>
          </div>

          {/* Results Area */}
          {(step === 'action' || step === 'items' || step === 'location') && (
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

                {results.length === 0 && (
                  <div className="px-4 py-8 text-center text-[#6d7175]">
                    <p>No results found for &ldquo;{inputValue}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity Step */}
          {step === 'quantity' && (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="px-4 py-2 text-xs font-semibold text-[#6d7175] uppercase tracking-wider bg-[#fafbfb] border-b border-[#e1e3e5]">
                {getStepLabel()}
              </div>
              <div className="py-2">
                {PRODUCTS.filter(p => selectedItems.has(p.id)).map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f1f2f4] flex items-center justify-center text-xl">
                      {product.image}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1a1a1a] font-medium">{product.name}</p>
                      <p className="text-[#6d7175] text-sm">{product.variant}</p>
                    </div>

                    {/* Quantity Input */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(product.id, (itemQuantities.get(product.id) || 1) - 1)}
                        className="w-8 h-8 rounded-lg bg-[#f1f2f4] hover:bg-[#e1e3e5] flex items-center justify-center text-[#6d7175] font-medium transition-colors"
                      >
                        −
                      </button>
                      <input
                        ref={el => { if (el) quantityInputRefs.current.set(product.id, el) }}
                        type="number"
                        min="1"
                        max={product.stock}
                        value={itemQuantities.get(product.id) || 1}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                        onKeyDown={handleKeyDown}
                        className="w-16 h-8 text-center border border-[#e1e3e5] rounded-lg text-[#1a1a1a] font-medium focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                      />
                      <button
                        onClick={() => handleQuantityChange(product.id, (itemQuantities.get(product.id) || 1) + 1)}
                        className="w-8 h-8 rounded-lg bg-[#f1f2f4] hover:bg-[#e1e3e5] flex items-center justify-center text-[#6d7175] font-medium transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Stock indicator */}
                    <div className="flex-shrink-0 text-right w-16">
                      <p className="text-[#8c9196] text-xs">of {product.stock}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="p-6">
              <div className="bg-gradient-to-br from-[#fafbfb] to-[#f4f5f7] rounded-xl p-5 mb-5 border border-[#e1e3e5]">
                <h3 className="text-[#1a1a1a] font-semibold mb-4 text-lg">Transfer Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e3f1df] flex items-center justify-center">
                      <span className="text-sm">{tags.find(t => t.type === 'action')?.icon}</span>
                    </div>
                    <div>
                      <p className="text-[#6d7175] text-xs uppercase tracking-wide">Action</p>
                      <p className="text-[#1a1a1a] font-medium">{tags.find(t => t.type === 'action')?.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e0f0ff] flex items-center justify-center">
                      <span className="text-sm">📍</span>
                    </div>
                    <div>
                      <p className="text-[#6d7175] text-xs uppercase tracking-wide">Destination</p>
                      <p className="text-[#1a1a1a] font-medium">{tags.find(t => t.type === 'location')?.label}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e1e3e5]">
                    <p className="text-[#6d7175] text-xs uppercase tracking-wide mb-2">Items ({getTotalItems()} total)</p>
                    <div className="space-y-2">
                      {tags.filter(t => t.type === 'item').map((tag, i) => {
                        const product = PRODUCTS.find(p => p.id === tag.value)
                        const quantity = itemQuantities.get(tag.value) || 1
                        return (
                          <div key={i} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{product?.image}</span>
                              <span className="text-[#1a1a1a] font-medium">{tag.label}</span>
                            </div>
                            <span className="px-2 py-1 bg-[#fff5e6] text-[#8a6116] rounded text-sm font-medium">
                              ×{quantity}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0, 128, 96, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`
                  w-full py-4 rounded-xl font-semibold text-white transition-all relative overflow-hidden
                  ${isConfirming
                    ? 'bg-[#6d7175]'
                    : 'bg-gradient-to-r from-[#008060] to-[#00a47c] hover:from-[#006e52] hover:to-[#008f6b] shadow-lg'
                  }
                `}
              >
                {isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing transfer...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Transfer
                    <kbd className="ml-2 px-2 py-0.5 text-xs font-mono bg-white/20 rounded">↵</kbd>
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Footer for Items step */}
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
                onClick={handleProceedToQuantity}
                className="px-4 py-1.5 bg-[#008060] text-white text-sm font-medium rounded-lg hover:bg-[#006e52] transition-colors flex items-center gap-2"
              >
                Set quantities
                <kbd className="px-1 py-0.5 text-xs font-mono bg-white/20 rounded">Tab</kbd>
              </button>
            </motion.div>
          )}

          {/* Footer for Quantity step */}
          {step === 'quantity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-[#fafbfb] border-t border-[#e1e3e5] flex items-center justify-between"
            >
              <p className="text-sm text-[#6d7175]">
                <span className="font-semibold text-[#1a1a1a]">{getTotalItems()}</span> total items
              </p>
              <button
                onClick={handleProceedToLocation}
                className="px-4 py-1.5 bg-[#008060] text-white text-sm font-medium rounded-lg hover:bg-[#006e52] transition-colors flex items-center gap-2"
              >
                Choose destination
                <kbd className="px-1 py-0.5 text-xs font-mono bg-white/20 rounded">Tab</kbd>
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
