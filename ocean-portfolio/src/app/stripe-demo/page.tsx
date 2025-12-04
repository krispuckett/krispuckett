'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CommandK from '@/components/CommandK'

// ============================================================================
// Types
// ============================================================================

type Page = 'inventory' | 'transfers'

interface Transfer {
  id: string
  origin: string
  destination: string
  status: 'Draft' | 'Pending' | 'Received'
  received: string
  expectedArrival: string
  items: { name: string; quantity: number }[]
  isNew?: boolean
}

interface InventoryItem {
  id: string
  name: string
  variant: string
  sku: string
  image: string
  unavailable: number
  committed: number
  available: number
  onHand: number
}

// ============================================================================
// Mock Data
// ============================================================================

const INVENTORY_ITEMS: InventoryItem[] = [
  { id: '1', name: 'Alpine Summit Jacket', variant: 'Midnight Blue / L', sku: 'ALP-JKT-001-MB-L', image: '🧥', unavailable: 0, committed: 2, available: 16, onHand: 18 },
  { id: '2', name: 'Alpine Summit Jacket', variant: 'Forest Green / M', sku: 'ALP-JKT-001-FG-M', image: '🧥', unavailable: 0, committed: 0, available: 22, onHand: 22 },
  { id: '3', name: 'Trailblazer Hiking Pants', variant: 'Stone Grey / 32', sku: 'TRL-PNT-042-SG-32', image: '👖', unavailable: 0, committed: 1, available: 17, onHand: 18 },
  { id: '4', name: 'Trailblazer Hiking Pants', variant: 'Khaki / 34', sku: 'TRL-PNT-042-KH-34', image: '👖', unavailable: 0, committed: 0, available: 13, onHand: 13 },
  { id: '5', name: 'Backcountry 45L Pack', variant: 'Forest Green', sku: 'BCK-PCK-015-FG', image: '🎒', unavailable: 0, committed: 0, available: 12, onHand: 12 },
  { id: '6', name: 'Summit Base Layer Tee', variant: 'Heather Oat / M', sku: 'SUM-TEE-088-HO-M', image: '👕', unavailable: 0, committed: 3, available: 42, onHand: 45 },
  { id: '7', name: 'Ridgeline Fleece Pullover', variant: 'Burnt Orange / XL', sku: 'RDG-FLC-023-BO-XL', image: '🧶', unavailable: 0, committed: 0, available: 31, onHand: 31 },
  { id: '8', name: 'Trekker Waterproof Boots', variant: 'Brown Leather / 10', sku: 'TRK-BT-007-BL-10', image: '🥾', unavailable: 0, committed: 1, available: 7, onHand: 8 },
  { id: '9', name: 'Insulated Grip Gloves', variant: 'Black / M', sku: 'GLV-INS-011-BK-M', image: '🧤', unavailable: 0, committed: 0, available: 52, onHand: 52 },
  { id: '10', name: 'Insulated Grip Gloves', variant: 'Black / L', sku: 'GLV-INS-011-BK-L', image: '🧤', unavailable: 0, committed: 0, available: 41, onHand: 41 },
  { id: '11', name: 'Sunshield Trail Cap', variant: 'Sand', sku: 'CAP-SUN-033-SD', image: '🧢', unavailable: 0, committed: 0, available: 67, onHand: 67 },
  { id: '12', name: 'Expedition Softshell', variant: 'Graphite / M', sku: 'EXP-SSH-034-GR-M', image: '🧥', unavailable: 0, committed: 0, available: 22, onHand: 22 },
]

const INITIAL_TRANSFERS: Transfer[] = [
  { id: 'T0001', origin: 'Main Warehouse', destination: 'Downtown Flagship', status: 'Pending', received: '0 of 5', expectedArrival: 'Dec 6, 2025', items: [] },
]

// ============================================================================
// Components
// ============================================================================

function ShopifyHeader({ onSearchClick }: { onSearchClick: () => void }) {
  return (
    <header className="h-12 bg-[#1a1a1a] flex items-center px-4 justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-[#95bf47]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.337 3.415c-.073-.037-.146-.037-.22 0-.073.037-1.097 1.317-1.244 1.537-.147.22-.294.44-.294.733v9.83c0 .293.147.513.294.733.147.22 1.17 1.5 1.244 1.537.074.037.147.037.22 0 .074-.037 1.098-1.317 1.245-1.537.147-.22.294-.44.294-.733v-9.83c0-.293-.147-.513-.294-.733-.147-.22-1.171-1.5-1.245-1.537z"/>
          <path d="M20.507 6.33c-.073-.037-.146-.037-.22 0l-3.705 2.2v7.337l3.706 2.2c.073.037.146.037.22 0 .073-.037.293-.22.293-.513V6.843c0-.293-.22-.476-.294-.513z"/>
          <path d="M11.632 8.53l-3.705-2.2c-.074-.037-.147-.037-.22 0-.074.037-.294.22-.294.513v9.83c0 .293.22.476.293.513l3.706 2.2V8.53z"/>
          <path d="M7.193 6.33c-.073-.037-.146-.037-.22 0L3.268 8.53v10.857c0 .293.22.476.294.513l3.705-2.2c.074-.037.147-.037.22 0V6.843c0-.293-.22-.476-.294-.513z"/>
        </svg>
        <span className="text-white font-semibold text-sm">shopify</span>
      </div>

      {/* Search Bar */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-3 bg-[#303030] hover:bg-[#404040] rounded-lg px-4 py-1.5 transition-colors w-[480px]"
      >
        <svg className="w-4 h-4 text-[#8c9196]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-[#8c9196] text-sm flex-1 text-left">Search</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-xs font-mono text-[#8c9196] bg-[#404040] rounded">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-xs font-mono text-[#8c9196] bg-[#404040] rounded">K</kbd>
        </div>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="text-[#8c9196] hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#5c6ac4] flex items-center justify-center text-white text-xs font-medium">
            PG
          </div>
          <span className="text-white text-sm">Prologue Gear</span>
        </div>
      </div>
    </header>
  )
}

function Sidebar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  const navItems = [
    { icon: '🏠', label: 'Home', page: null },
    { icon: '📦', label: 'Orders', page: null },
    {
      icon: '🏷️',
      label: 'Products',
      page: null,
      children: [
        { label: 'Collections', page: null },
        { label: 'Inventory', page: 'inventory' as Page },
        { label: 'Purchase orders', page: null },
        { label: 'Transfers', page: 'transfers' as Page },
        { label: 'Gift cards', page: null },
      ]
    },
    { icon: '👥', label: 'Customers', page: null },
    { icon: '📣', label: 'Marketing', page: null },
    { icon: '🏷️', label: 'Discounts', page: null },
    { icon: '📝', label: 'Content', page: null },
    { icon: '🌍', label: 'Markets', page: null },
    { icon: '💰', label: 'Finance', page: null },
    { icon: '📊', label: 'Analytics', page: null },
  ]

  return (
    <aside className="w-[200px] bg-[#f6f6f7] border-r border-[#e1e3e5] flex flex-col h-full">
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item, i) => (
          <div key={i}>
            <button
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-[#e1e3e5] transition-colors ${
                !item.children && item.page === currentPage ? 'bg-[#e1e3e5]' : ''
              }`}
            >
              <span className="text-base w-5">{item.icon}</span>
              <span className="text-[#1a1a1a]">{item.label}</span>
            </button>
            {item.children && (
              <div className="ml-7">
                {item.children.map((child, j) => (
                  <button
                    key={j}
                    onClick={() => child.page && onNavigate(child.page)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      child.page === currentPage
                        ? 'bg-[#e1e3e5] text-[#1a1a1a] font-medium'
                        : 'text-[#6d7175] hover:bg-[#e1e3e5] hover:text-[#1a1a1a]'
                    }`}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Sales channels */}
      <div className="border-t border-[#e1e3e5] py-2">
        <div className="px-3 py-1.5 text-xs text-[#6d7175] font-medium">Sales channels</div>
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-[#e1e3e5] transition-colors">
          <span className="text-base w-5">🛒</span>
          <span className="text-[#1a1a1a]">Online Store</span>
        </button>
      </div>

      {/* Apps */}
      <div className="border-t border-[#e1e3e5] py-2">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-[#e1e3e5] transition-colors">
          <span className="text-base w-5">📱</span>
          <span className="text-[#1a1a1a]">Apps</span>
          <svg className="w-4 h-4 ml-auto text-[#8c9196]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Settings */}
      <div className="border-t border-[#e1e3e5] py-2">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-[#e1e3e5] transition-colors">
          <span className="text-base w-5">⚙️</span>
          <span className="text-[#1a1a1a]">Settings</span>
        </button>
      </div>
    </aside>
  )
}

function InventoryPage() {
  return (
    <div className="flex-1 overflow-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5]">
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Inventory</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-[#1a1a1a] hover:bg-[#e1e3e5] rounded-lg transition-colors">
            Export
          </button>
          <button className="px-3 py-1.5 text-sm text-[#1a1a1a] hover:bg-[#e1e3e5] rounded-lg transition-colors">
            Import
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[#e1e3e5]">
        <button className="px-3 py-1 text-sm bg-[#e1e3e5] rounded-lg text-[#1a1a1a]">All</button>
        <button className="p-1 text-[#8c9196] hover:text-[#1a1a1a] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e1e3e5] text-left">
              <th className="px-6 py-3 w-10">
                <input type="checkbox" className="rounded border-[#8c9196]" />
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">
                <div className="flex items-center gap-1">
                  Product
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">SKU</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Unavailable</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Committed</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Available</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">On hand</th>
            </tr>
          </thead>
          <tbody>
            {INVENTORY_ITEMS.map((item) => (
              <tr key={item.id} className="border-b border-[#e1e3e5] hover:bg-[#fafbfb] transition-colors">
                <td className="px-6 py-3">
                  <input type="checkbox" className="rounded border-[#8c9196]" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f1f2f4] rounded-lg flex items-center justify-center text-xl">
                      {item.image}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{item.name}</p>
                      <span className="inline-block px-1.5 py-0.5 bg-[#e1e3e5] text-[#6d7175] text-xs rounded mt-0.5">
                        {item.variant}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#6d7175] font-mono">{item.sku}</td>
                <td className="px-4 py-3 text-sm text-[#6d7175]">{item.unavailable}</td>
                <td className="px-4 py-3 text-sm text-[#6d7175]">{item.committed}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.available}
                    readOnly
                    className="w-16 px-2 py-1 text-sm border border-[#e1e3e5] rounded-lg text-[#1a1a1a] bg-white"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.onHand}
                    readOnly
                    className="w-16 px-2 py-1 text-sm border border-[#e1e3e5] rounded-lg text-[#1a1a1a] bg-white"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <a href="#" className="text-sm text-[#2c6ecb] hover:underline">Learn more about managing inventory</a>
      </div>
    </div>
  )
}

function TransfersPage({ transfers }: { transfers: Transfer[] }) {
  return (
    <div className="flex-1 overflow-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5]">
        <div className="flex items-center gap-2">
          <span className="text-lg">↔️</span>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Transfers</h1>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#000] rounded-lg transition-colors">
          Create transfer
        </button>
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-3 border-b border-[#e1e3e5]">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e1e3e5] rounded-lg">
            <svg className="w-4 h-4 text-[#8c9196]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Searching in All"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#8c9196]"
            />
          </div>
          <button className="px-3 py-1.5 text-sm text-[#6d7175] hover:bg-[#e1e3e5] rounded-lg transition-colors">
            Cancel
          </button>
          <button className="px-3 py-1.5 text-sm text-[#6d7175] hover:bg-[#e1e3e5] rounded-lg transition-colors border border-[#e1e3e5]">
            Save as
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-sm border border-[#e1e3e5] rounded-lg text-[#1a1a1a] flex items-center gap-1">
            Status <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button className="px-3 py-1 text-sm border border-[#e1e3e5] rounded-lg text-[#1a1a1a] flex items-center gap-1">
            Origin <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button className="px-3 py-1 text-sm border border-[#e1e3e5] rounded-lg text-[#1a1a1a] flex items-center gap-1">
            Destination <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button className="px-3 py-1 text-sm text-[#2c6ecb] flex items-center gap-1">
            Add filter <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e1e3e5] text-left">
              <th className="px-6 py-3 w-10">
                <input type="checkbox" className="rounded border-[#8c9196]" />
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Transfer</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Origin</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Destination</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Received</th>
              <th className="px-4 py-3 text-sm font-medium text-[#6d7175]">Expected arrival</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {transfers.map((transfer) => (
                <motion.tr
                  key={transfer.id}
                  initial={transfer.isNew ? { opacity: 0, backgroundColor: '#e3f1df' } : { opacity: 1 }}
                  animate={{ opacity: 1, backgroundColor: '#ffffff' }}
                  transition={{ duration: 0.5 }}
                  className="border-b border-[#e1e3e5] hover:bg-[#fafbfb] transition-colors"
                >
                  <td className="px-6 py-3">
                    <input type="checkbox" className="rounded border-[#8c9196]" />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">#{transfer.id}</td>
                  <td className="px-4 py-3 text-sm text-[#6d7175]">{transfer.origin}</td>
                  <td className="px-4 py-3 text-sm text-[#6d7175]">{transfer.destination || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      transfer.status === 'Draft' ? 'bg-[#ffd79d] text-[#1a1a1a]' :
                      transfer.status === 'Pending' ? 'bg-[#aee9d1] text-[#1a1a1a]' :
                      'bg-[#a4e8f2] text-[#1a1a1a]'
                    }`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6d7175]">{transfer.received}</td>
                  <td className="px-4 py-3 text-sm text-[#6d7175]">{transfer.expectedArrival || '—'}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <a href="#" className="text-sm text-[#2c6ecb] hover:underline">Learn more about transfers</a>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function StripeDemoPage() {
  const [currentPage, setCurrentPage] = useState<Page>('inventory')
  const [isCommandKOpen, setIsCommandKOpen] = useState(false)
  const [transfers, setTransfers] = useState<Transfer[]>(INITIAL_TRANSFERS)
  const [transferCounter, setTransferCounter] = useState(2)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandKOpen(true)
      }
      if (e.key === 'Escape') {
        setIsCommandKOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTransferComplete = useCallback((transfer: {
    action: string
    location: string
    items: { productId: string; name: string; quantity: number }[]
  }) => {
    // Create new transfer
    const newTransfer: Transfer = {
      id: `T${String(transferCounter).padStart(4, '0')}`,
      origin: 'Main Warehouse',
      destination: transfer.location,
      status: 'Draft',
      received: `0 of ${transfer.items.reduce((acc, item) => acc + item.quantity, 0)}`,
      expectedArrival: '',
      items: transfer.items,
      isNew: true,
    }

    setTransferCounter(c => c + 1)

    // Navigate to transfers page and add new transfer
    setTimeout(() => {
      setCurrentPage('transfers')
      setTimeout(() => {
        setTransfers(prev => [newTransfer, ...prev])
      }, 300)
    }, 100)
  }, [transferCounter])

  return (
    <div className="flex flex-col h-screen bg-[#f6f6f7]">
      {/* Header */}
      <ShopifyHeader onSearchClick={() => setIsCommandKOpen(true)} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        {/* Page content */}
        <main className="flex-1 bg-white overflow-hidden flex flex-col">
          {currentPage === 'inventory' && <InventoryPage />}
          {currentPage === 'transfers' && <TransfersPage transfers={transfers} />}
        </main>
      </div>

      {/* Command K Modal */}
      <CommandK
        isOpen={isCommandKOpen}
        onClose={() => setIsCommandKOpen(false)}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  )
}
