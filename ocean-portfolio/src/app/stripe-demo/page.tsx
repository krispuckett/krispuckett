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
// Polaris Icons (SVG)
// ============================================================================

const Icons = {
  home: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10.555 2.168a1 1 0 0 0-1.11 0l-6 4a1 1 0 0 0-.445.832v8a2 2 0 0 0 2 2h2.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a2 2 0 0 0 2-2v-8a1 1 0 0 0-.445-.832l-6-4Z"/>
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M5.5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-6Z"/>
      <path d="M5.5 11a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4Z"/>
      <path fillRule="evenodd" d="M1 6.5a2.5 2.5 0 0 1 2.5-2.5h10a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-10a2.5 2.5 0 0 1-2.5-2.5v-9Zm2.5-1.5a1.5 1.5 0 0 0-1.5 1.5v9a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-9a1.5 1.5 0 0 0-1.5-1.5h-10Z"/>
      <path d="M13 2.5a.5.5 0 0 0-1 0v.5h-4v-.5a.5.5 0 0 0-1 0v.5h-.5a2.5 2.5 0 0 0-2.5 2.5.5.5 0 0 0 1 0 1.5 1.5 0 0 1 1.5-1.5h7a1.5 1.5 0 0 1 1.5 1.5.5.5 0 0 0 1 0 2.5 2.5 0 0 0-2.5-2.5h-.5v-.5Z"/>
    </svg>
  ),
  products: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9.098 2.382a2 2 0 0 1 1.804 0l5.11 2.556a1.5 1.5 0 0 1 .83 1.342v7.72a1 1 0 0 1-.553.894l-5.61 2.806a2 2 0 0 1-1.788-.003l-5.39-2.722a1 1 0 0 1-.543-.886v-7.81a1.5 1.5 0 0 1 .83-1.34l5.31-2.557Zm1.204.895a1 1 0 0 0-.902 0l-4.766 2.383 5.461 2.647 5.461-2.647-4.766-2.383h-.488Zm4.74 4.214-5.084 2.464v6.083l4.806-2.403a.25.25 0 0 0 .138-.224l.14-5.92Zm-6.084 8.567v-6.103l-5.08-2.463.16 5.934c0 .097.056.185.144.226l4.776 2.406Z"/>
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M6 4a2 2 0 0 0-2 2v2h4v-4H6Z"/>
      <path d="M9 4v4h4v-4H9Z"/>
      <path d="M14 4v4h2V6a2 2 0 0 0-2-2Z"/>
      <path d="M16 9h-2v2h2V9Z"/>
      <path d="M16 12h-2v2a2 2 0 0 1-2 2H9v-4H4v2a2 2 0 0 0 2 2h2v2h4v-2h2a3 3 0 0 0 3-3v-3h-1Z"/>
      <path d="M4 9h4v2H4V9Z"/>
      <path d="M9 9h4v2H9V9Z"/>
    </svg>
  ),
  transfer: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M14.854 5.854a.5.5 0 0 0-.708-.708l-2 2a.5.5 0 0 0 .708.708l1.146-1.147v5.793a.5.5 0 0 0 1 0v-5.793l1.146 1.147a.5.5 0 0 0 .708-.708l-2-2Z"/>
      <path d="M6.854 7.146a.5.5 0 1 0-.708.708l1.147 1.146h-5.793a.5.5 0 0 0 0 1h5.793l-1.147 1.146a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2Z"/>
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
      <path d="M4.25 16a.75.75 0 0 1-.744-.656 6.003 6.003 0 0 1 11.866-1.29.75.75 0 0 1-1.372.592 4.503 4.503 0 0 0-8.9.968.75.75 0 0 1-.75.636l-.1-.25Z"/>
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M11 3a1 1 0 1 0-2 0v.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h5a.5.5 0 0 1 .5.5v.5a1 1 0 1 0 2 0v-.5a.5.5 0 0 1 .5-.5h.586l2.707 2.707a1 1 0 0 0 1.414-1.414l-2.707-2.707v-.172l2.707-2.707a1 1 0 0 0-1.414-1.414l-2.707 2.707h-.586a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5h.586l2.707 2.707a1 1 0 0 0 1.414-1.414l-2.707-2.707v-.172l2.707-2.707a1 1 0 0 0-1.414-1.414l-2.707 2.707h-.586a.5.5 0 0 1-.5-.5v-.5Z"/>
    </svg>
  ),
  discounts: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M7.5 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
      <path d="M13.5 12.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
      <path d="M13.146 6.146a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708-.708l7-7Z"/>
      <path fillRule="evenodd" d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-1a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/>
    </svg>
  ),
  content: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M5.5 8a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9Z"/>
      <path d="M5.5 11a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Z"/>
      <path fillRule="evenodd" d="M2 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4Z"/>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm1 0v12h12V4H4Z"/>
      <path d="M5 14v-3h2v3H5Z"/>
      <path d="M9 14v-5h2v5H9Z"/>
      <path d="M13 14V8h2v6h-2Z"/>
    </svg>
  ),
  store: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M2.5 8v6.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V8h-1v6.5a.5.5 0 0 1-.5.5h-5V9h-2v6H4a.5.5 0 0 1-.5-.5V8h-1Z"/>
      <path d="M16.434 4H3.566l-1.5 3.5h15.868l-1.5-3.5Z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.547 2.748a.5.5 0 0 1 .453-.248h2a.5.5 0 0 1 .453.248l.621 1.132a.5.5 0 0 0 .425.253l1.29.007a.5.5 0 0 1 .413.217l1 1.5a.5.5 0 0 1 .04.504l-.542 1.06a.5.5 0 0 0 0 .455l.542 1.059a.5.5 0 0 1-.04.504l-1 1.5a.5.5 0 0 1-.413.217l-1.29.007a.5.5 0 0 0-.425.253l-.621 1.132a.5.5 0 0 1-.453.248h-2a.5.5 0 0 1-.453-.248l-.621-1.132a.5.5 0 0 0-.425-.253l-1.29-.007a.5.5 0 0 1-.413-.217l-1-1.5a.5.5 0 0 1-.04-.504l.542-1.06a.5.5 0 0 0 0-.455l-.542-1.059a.5.5 0 0 1 .04-.504l1-1.5a.5.5 0 0 1 .413-.217l1.29-.007a.5.5 0 0 0 .425-.253l.621-1.132ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
    </svg>
  ),
  apps: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M4 4h4v4H4V4Z"/>
      <path d="M4 12h4v4H4v-4Z"/>
      <path d="M12 4h4v4h-4V4Z"/>
      <path d="M12 12h4v4h-4v-4Z"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8Z"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.293 4.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L11.586 10 7.293 5.707a1 1 0 0 1 0-1.414Z"/>
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1Z"/>
    </svg>
  ),
  sortAsc: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 3a1 1 0 0 1 .707.293l3 3a1 1 0 0 1-1.414 1.414L11 6.414V16a1 1 0 1 1-2 0V6.414L7.707 7.707a1 1 0 0 1-1.414-1.414l3-3A1 1 0 0 1 10 3Z"/>
    </svg>
  ),
  notification: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 2a6 6 0 0 0-6 6v2.586l-.707.707A1 1 0 0 0 4 13h12a1 1 0 0 0 .707-1.707L16 10.586V8a6 6 0 0 0-6-6Z"/>
      <path d="M10 18a3 3 0 0 1-2.83-2h5.66A3 3 0 0 1 10 18Z"/>
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z"/>
      <path d="M10 5.5a.5.5 0 0 1 .5.5v.54a2.5 2.5 0 0 1 1.625 1.2.5.5 0 0 1-.866.5A1.5 1.5 0 0 0 10 7.5h-.25a1.25 1.25 0 1 0 0 2.5h.5a2.25 2.25 0 0 1 .207 4.488.5.5 0 0 1 .043.012.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5v-.54a2.5 2.5 0 0 1-1.625-1.2.5.5 0 0 1 .866-.5 1.5 1.5 0 0 0 1.259.74h.25a1.25 1.25 0 1 0 0-2.5h-.5a2.25 2.25 0 0 1-.207-4.488.5.5 0 0 1-.043-.012.5.5 0 0 1 .5-.5Z"/>
    </svg>
  ),
  markets: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM2.5 10a7.5 7.5 0 0 0 5.05 7.084 13.158 13.158 0 0 1-1.8-4.584H2.586A7.527 7.527 0 0 0 2.5 10Zm.086-1.5h3.164a13.158 13.158 0 0 1 1.8-4.584A7.5 7.5 0 0 0 2.586 8.5ZM10 2.758c-.98 1.126-1.74 2.6-2.197 4.242h4.394C11.74 5.358 10.98 3.884 10 2.758Zm2.45 1.158a7.5 7.5 0 0 1 4.964 4.584h-3.164a13.158 13.158 0 0 0-1.8-4.584Zm1.8 6.084h3.164a7.527 7.527 0 0 1 0 2.5h-3.164a14.652 14.652 0 0 0 0-2.5Zm-.053 4a13.158 13.158 0 0 1-1.8 4.584 7.5 7.5 0 0 0 4.964-4.584h-3.164Zm-4.394 0c.457 1.642 1.217 3.116 2.197 4.242.98-1.126 1.74-2.6 2.197-4.242H9.803Zm-1.553 0H5.086a7.527 7.527 0 0 0 2.464 4.084 13.158 13.158 0 0 1-1.8-4.084Zm-1.664-1.5a14.652 14.652 0 0 1 0-2.5h3.164a14.652 14.652 0 0 0 0 2.5H5.086Zm3.664 0h2.5a14.652 14.652 0 0 0 0-2.5h-2.5a14.652 14.652 0 0 0 0 2.5Z"/>
    </svg>
  ),
  purchaseOrder: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M5.5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-6Z"/>
      <path d="M5.5 11a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4Z"/>
      <path fillRule="evenodd" d="M4 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4Zm0 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4Z"/>
    </svg>
  ),
  collections: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h5A1.5 1.5 0 0 1 10 4.5v5A1.5 1.5 0 0 1 8.5 11h-5A1.5 1.5 0 0 1 2 9.5v-5Z"/>
      <path d="M11.5 6h5A1.5 1.5 0 0 1 18 7.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 10 12.5v-5A1.5 1.5 0 0 1 11.5 6Z"/>
      <path d="M3.5 12A1.5 1.5 0 0 0 2 13.5v2A1.5 1.5 0 0 0 3.5 17h5A1.5 1.5 0 0 0 10 15.5v-2A1.5 1.5 0 0 0 8.5 12h-5Z"/>
    </svg>
  ),
  giftCard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 7a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1H8a1 1 0 1 1 0-2h1V8a1 1 0 0 1 1-1Z"/>
      <path fillRule="evenodd" d="M4 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4Zm0 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4Z"/>
    </svg>
  ),
}

// Shopify Logo
const ShopifyLogo = () => (
  <svg viewBox="0 0 109 124" className="w-6 h-6" fill="none">
    <path d="M95.8 28.8c-.1-.6-.6-1-1.1-1-.5-.1-10.3-.8-10.3-.8s-6.8-6.8-7.6-7.5c-.7-.7-2.2-.5-2.7-.3-.1 0-1.5.5-3.9 1.2-2.3-6.7-6.4-12.8-13.6-12.8h-.6c-2-2.7-4.6-3.9-6.7-3.9-16.7 0-24.7 20.8-27.2 31.4-6.5 2-11.1 3.4-11.6 3.6-3.6 1.1-3.7 1.2-4.2 4.6-.4 2.6-9.7 74.8-9.7 74.8l72.8 13.6 39.4-8.5s-12.9-85.5-13-86.4zM66.3 22.3l-6.4 2c0-1.3 0-2.8-.1-4.3 4 .6 6.1 3.1 6.5 2.3zm-10.8 3.3l-13.7 4.2c1.3-5.1 3.9-10.2 8.8-13.5 1.9 2 4.4 5.4 4.9 9.3zm-7.5-15.4c.9 0 1.8.3 2.7 1-6.5 3.1-13.5 10.9-16.4 26.5l-10.8 3.3c3-10.2 10.2-30.8 24.5-30.8z" fill="#95BF47"/>
    <path d="M94.7 27.8c-.5-.1-10.3-.8-10.3-.8s-6.8-6.8-7.6-7.5c-.3-.3-.6-.4-1-.4l-5.4 110.2 39.4-8.5S96.9 35.3 96.8 34.4c-.1-.6-.6-1-1.1-1-.5-.1-.5-.2-.5-.2-.5-.4-.5-.4-.5-.4z" fill="#5E8E3E"/>
    <path d="M57.2 45.6l-4.9 14.5s-4.3-2.3-9.5-2.3c-7.7 0-8.1 4.8-8.1 6 0 6.6 17.2 9.1 17.2 24.5 0 12.1-7.7 19.9-18.1 19.9-12.5 0-18.9-7.8-18.9-7.8l3.3-11s6.6 5.6 12.1 5.6c3.6 0 5.1-2.8 5.1-4.9 0-8.6-14.1-9-14.1-23 0-11.8 8.5-23.3 25.7-23.3 6.6 0 10.2 1.8 10.2 1.8z" fill="#fff"/>
  </svg>
)

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
    <header className="h-14 bg-[#1a1a1a] flex items-center px-3 justify-between font-[var(--font-inter)]">
      {/* Logo */}
      <div className="flex items-center">
        <ShopifyLogo />
      </div>

      {/* Search Bar */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-3 bg-[#303030] hover:bg-[#404040] rounded-lg px-3 py-[6px] transition-colors w-[600px] mx-4"
      >
        <span className="text-[#b5b5b5]">{Icons.search}</span>
        <span className="text-[#b5b5b5] text-sm flex-1 text-left">Search</span>
        <div className="flex items-center gap-0.5">
          <kbd className="px-1.5 py-0.5 text-[11px] font-medium text-[#b5b5b5] bg-[#404040] rounded border border-[#505050]">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-[11px] font-medium text-[#b5b5b5] bg-[#404040] rounded border border-[#505050]">K</kbd>
        </div>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-[#b5b5b5] hover:text-white hover:bg-[#333] rounded-lg transition-colors relative">
          {Icons.notification}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e53935] rounded-full border border-[#1a1a1a]" />
        </button>
        <div className="flex items-center gap-2 px-2 py-1 hover:bg-[#333] rounded-lg cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-md bg-[#36a420] flex items-center justify-center text-white text-xs font-semibold">
            PG
          </div>
          <span className="text-white text-sm font-medium">Prologue Gear</span>
        </div>
      </div>
    </header>
  )
}

function Sidebar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  return (
    <aside className="w-[220px] bg-[#f6f6f7] border-r border-[#e3e3e3] flex flex-col h-full font-[var(--font-inter)]">
      <nav className="flex-1 py-3 overflow-y-auto">
        {/* Main nav */}
        <div className="px-2 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.home}</span>
            Home
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.orders}</span>
            Orders
          </button>
        </div>

        {/* Products section */}
        <div className="mt-4 px-2">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.products}</span>
            Products
          </button>
          <div className="ml-8 mt-0.5 space-y-0.5">
            <button className="w-full text-left px-2 py-[5px] text-[13px] text-[#5c5c5c] hover:bg-[#ebebeb] hover:text-[#303030] rounded-lg transition-colors">
              Collections
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className={`w-full text-left px-2 py-[5px] text-[13px] rounded-lg transition-colors ${
                currentPage === 'inventory'
                  ? 'bg-[#ebebeb] text-[#303030] font-medium'
                  : 'text-[#5c5c5c] hover:bg-[#ebebeb] hover:text-[#303030]'
              }`}
            >
              Inventory
            </button>
            <button className="w-full text-left px-2 py-[5px] text-[13px] text-[#5c5c5c] hover:bg-[#ebebeb] hover:text-[#303030] rounded-lg transition-colors">
              Purchase orders
            </button>
            <button
              onClick={() => onNavigate('transfers')}
              className={`w-full text-left px-2 py-[5px] text-[13px] rounded-lg transition-colors ${
                currentPage === 'transfers'
                  ? 'bg-[#ebebeb] text-[#303030] font-medium'
                  : 'text-[#5c5c5c] hover:bg-[#ebebeb] hover:text-[#303030]'
              }`}
            >
              Transfers
            </button>
            <button className="w-full text-left px-2 py-[5px] text-[13px] text-[#5c5c5c] hover:bg-[#ebebeb] hover:text-[#303030] rounded-lg transition-colors">
              Gift cards
            </button>
          </div>
        </div>

        {/* Other nav items */}
        <div className="mt-2 px-2 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.customers}</span>
            Customers
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.content}</span>
            Content
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.analytics}</span>
            Analytics
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.marketing}</span>
            Marketing
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.discounts}</span>
            Discounts
          </button>
        </div>

        {/* Sales channels */}
        <div className="mt-6 px-2">
          <div className="px-2 py-1 text-[11px] font-semibold text-[#6d6d6d] uppercase tracking-wide">Sales channels</div>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.store}</span>
            Online Store
          </button>
        </div>

        {/* Apps */}
        <div className="mt-2 px-2">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#5c5c5c]">{Icons.apps}</span>
            Apps
            <span className="ml-auto text-[#8a8a8a]">{Icons.chevronRight}</span>
          </button>
        </div>
      </nav>

      {/* Settings at bottom */}
      <div className="border-t border-[#e3e3e3] p-2">
        <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
          <span className="text-[#5c5c5c]">{Icons.settings}</span>
          Settings
        </button>
      </div>
    </aside>
  )
}

function InventoryPage() {
  return (
    <div className="flex-1 overflow-auto bg-[#f1f1f1] font-[var(--font-inter)]">
      {/* Page Header */}
      <div className="bg-white border-b border-[#e3e3e3]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#5c5c5c]">{Icons.inventory}</span>
            <h1 className="text-[20px] font-semibold text-[#303030]">Inventory</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-[6px] text-[13px] font-medium text-[#303030] hover:bg-[#f1f1f1] rounded-lg border border-[#c9cccf] transition-colors">
              Export
            </button>
            <button className="px-3 py-[6px] text-[13px] font-medium text-[#303030] hover:bg-[#f1f1f1] rounded-lg border border-[#c9cccf] transition-colors">
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="p-5">
        <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e3e3e3]">
            <button className="px-3 py-[5px] text-[13px] font-medium bg-[#303030] text-white rounded-lg">All</button>
            <button className="p-1.5 text-[#5c5c5c] hover:bg-[#f1f1f1] rounded-lg transition-colors">
              {Icons.plus}
            </button>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e3e3e3] bg-[#fafafa]">
                <th className="px-4 py-2 w-10">
                  <input type="checkbox" className="w-[18px] h-[18px] rounded border-[#8a8a8a] accent-[#303030]" />
                </th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">
                  <div className="flex items-center gap-1">
                    Product
                    <span className="text-[#8a8a8a]">{Icons.sortAsc}</span>
                  </div>
                </th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">SKU</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Unavailable</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Committed</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Available</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">On hand</th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY_ITEMS.map((item) => (
                <tr key={item.id} className="border-b border-[#e3e3e3] hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-2">
                    <input type="checkbox" className="w-[18px] h-[18px] rounded border-[#8a8a8a] accent-[#303030]" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#f1f1f1] rounded-lg flex items-center justify-center text-lg border border-[#e3e3e3]">
                        {item.image}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#303030]">{item.name}</p>
                        <span className="inline-block px-[6px] py-[2px] bg-[#e3e3e3] text-[#5c5c5c] text-[11px] rounded mt-0.5">
                          {item.variant}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[13px] text-[#6d6d6d] font-mono">{item.sku}</td>
                  <td className="px-3 py-2 text-[13px] text-[#6d6d6d]">{item.unavailable}</td>
                  <td className="px-3 py-2 text-[13px] text-[#6d6d6d]">{item.committed}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.available}
                      readOnly
                      className="w-16 px-2 py-1 text-[13px] border border-[#c9cccf] rounded-lg text-[#303030] bg-white focus:outline-none focus:border-[#5c5ac7] focus:ring-1 focus:ring-[#5c5ac7]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.onHand}
                      readOnly
                      className="w-16 px-2 py-1 text-[13px] border border-[#c9cccf] rounded-lg text-[#303030] bg-white focus:outline-none focus:border-[#5c5ac7] focus:ring-1 focus:ring-[#5c5ac7]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-4 py-3 text-center border-t border-[#e3e3e3]">
            <a href="#" className="text-[13px] text-[#005bd3] hover:underline">Learn more about managing inventory</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function TransfersPage({ transfers }: { transfers: Transfer[] }) {
  return (
    <div className="flex-1 overflow-auto bg-[#f1f1f1] font-[var(--font-inter)]">
      {/* Page Header */}
      <div className="bg-white border-b border-[#e3e3e3]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#5c5c5c]">{Icons.transfer}</span>
            <h1 className="text-[20px] font-semibold text-[#303030]">Transfers</h1>
          </div>
          <button className="px-4 py-[7px] text-[13px] font-semibold text-white bg-[#303030] hover:bg-[#1a1a1a] rounded-lg transition-colors">
            Create transfer
          </button>
        </div>
      </div>

      {/* Content card */}
      <div className="p-5">
        <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-sm overflow-hidden">
          {/* Search & Filters */}
          <div className="px-4 py-3 border-b border-[#e3e3e3]">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-[6px] bg-white border border-[#c9cccf] rounded-lg focus-within:border-[#5c5ac7] focus-within:ring-1 focus-within:ring-[#5c5ac7]">
                <span className="text-[#8a8a8a]">{Icons.search}</span>
                <input
                  type="text"
                  placeholder="Searching in All"
                  className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-[#8a8a8a]"
                />
              </div>
              <button className="px-3 py-[6px] text-[13px] text-[#5c5c5c] hover:bg-[#f1f1f1] rounded-lg transition-colors">
                Cancel
              </button>
              <button className="px-3 py-[6px] text-[13px] text-[#303030] hover:bg-[#f1f1f1] rounded-lg transition-colors border border-[#c9cccf]">
                Save as
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-[5px] text-[13px] border border-[#c9cccf] rounded-lg text-[#303030] flex items-center gap-1 hover:bg-[#f1f1f1] transition-colors">
                Status {Icons.chevronDown}
              </button>
              <button className="px-3 py-[5px] text-[13px] border border-[#c9cccf] rounded-lg text-[#303030] flex items-center gap-1 hover:bg-[#f1f1f1] transition-colors">
                Origin {Icons.chevronDown}
              </button>
              <button className="px-3 py-[5px] text-[13px] border border-[#c9cccf] rounded-lg text-[#303030] flex items-center gap-1 hover:bg-[#f1f1f1] transition-colors">
                Destination {Icons.chevronDown}
              </button>
              <button className="px-3 py-[5px] text-[13px] text-[#005bd3] flex items-center gap-1 hover:bg-[#f1f1f1] rounded-lg transition-colors">
                Add filter {Icons.plus}
              </button>
            </div>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e3e3e3] bg-[#fafafa]">
                <th className="px-4 py-2 w-10">
                  <input type="checkbox" className="w-[18px] h-[18px] rounded border-[#8a8a8a] accent-[#303030]" />
                </th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Transfer</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Origin</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Destination</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Status</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Received</th>
                <th className="px-3 py-2 text-[12px] font-medium text-[#6d6d6d] text-left">Expected arrival</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {transfers.map((transfer) => (
                  <motion.tr
                    key={transfer.id}
                    initial={transfer.isNew ? { opacity: 0, backgroundColor: '#d4edda' } : { opacity: 1 }}
                    animate={{ opacity: 1, backgroundColor: '#ffffff' }}
                    transition={{ duration: 0.8 }}
                    className="border-b border-[#e3e3e3] hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" className="w-[18px] h-[18px] rounded border-[#8a8a8a] accent-[#303030]" />
                    </td>
                    <td className="px-3 py-3 text-[13px] font-medium text-[#303030]">#{transfer.id}</td>
                    <td className="px-3 py-3 text-[13px] text-[#303030]">{transfer.origin}</td>
                    <td className="px-3 py-3 text-[13px] text-[#6d6d6d]">{transfer.destination || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-[2px] text-[12px] font-medium rounded-full ${
                        transfer.status === 'Draft' ? 'bg-[#ffd79d] text-[#594218]' :
                        transfer.status === 'Pending' ? 'bg-[#aee9d1] text-[#1c5e3e]' :
                        'bg-[#a4e8f2] text-[#164a52]'
                      }`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-[#6d6d6d]">{transfer.received}</td>
                    <td className="px-3 py-3 text-[13px] text-[#6d6d6d]">{transfer.expectedArrival || '—'}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-4 py-3 text-center border-t border-[#e3e3e3]">
            <a href="#" className="text-[13px] text-[#005bd3] hover:underline">Learn more about transfers</a>
          </div>
        </div>
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

    setTimeout(() => {
      setCurrentPage('transfers')
      setTimeout(() => {
        setTransfers(prev => [newTransfer, ...prev])
      }, 300)
    }, 100)
  }, [transferCounter])

  return (
    <div className="flex flex-col h-screen bg-[#f1f1f1] font-[var(--font-inter)]">
      <ShopifyHeader onSearchClick={() => setIsCommandKOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        <main className="flex-1 overflow-hidden flex flex-col">
          {currentPage === 'inventory' && <InventoryPage />}
          {currentPage === 'transfers' && <TransfersPage transfers={transfers} />}
        </main>
      </div>

      <CommandK
        isOpen={isCommandKOpen}
        onClose={() => setIsCommandKOpen(false)}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  )
}
