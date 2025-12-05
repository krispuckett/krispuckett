'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CommandK from '@/components/CommandK'

// ============================================================================
// Types
// ============================================================================

type Page = 'inventory' | 'movements'

interface Movement {
  id: string
  origin: string
  destination: string
  status: 'Draft' | 'Pending' | 'Received'
  received: string
  expectedArrival: string
  items: { name: string; quantity: number; sku: string }[]
  isNew?: boolean
  createdAt: string
}

// Locations for movements
const LOCATIONS = [
  { id: 'warehouse', name: 'Main Warehouse', type: 'warehouse' as const },
  { id: 'flagship', name: 'Downtown Flagship', type: 'store' as const },
  { id: 'mall', name: 'Westfield Mall', type: 'store' as const },
  { id: 'outlet', name: 'Factory Outlet', type: 'store' as const },
]

interface InventoryItem {
  id: string
  name: string
  variant: string
  sku: string
  icon: keyof typeof Icons
  unavailable: number
  committed: number
  available: number
  onHand: number
}

// ============================================================================
// Polaris Icons (SVG) - Official Filled Variants
// ============================================================================

const Icons = {
  home: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M14 16h-2a1 1 0 0 1-1-1v-2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v2.5a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-4.257a3 3 0 0 1 .879-2.122l3.707-3.707a2 2 0 0 1 2.828 0l3.707 3.707a3 3 0 0 1 .879 2.122v4.257a2 2 0 0 1-2 2Z"/>
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4.255 5.847a2.75 2.75 0 0 1 2.72-2.347h6.05a2.75 2.75 0 0 1 2.72 2.347l.66 4.46c.063.425.095.853.095 1.282v1.661a3.25 3.25 0 0 1-3.25 3.25h-6.5a3.25 3.25 0 0 1-3.25-3.25v-1.66c0-.43.032-.858.094-1.283l.661-4.46Zm2.72-.847a1.25 1.25 0 0 0-1.236 1.067l-.583 3.933h2.484a1.25 1.25 0 0 1 1.185.855l.159.474a.25.25 0 0 0 .237.171h1.558a.25.25 0 0 0 .237-.17l.159-.475a1.25 1.25 0 0 1 1.185-.855h2.484l-.583-3.933a1.25 1.25 0 0 0-1.236-1.067h-6.05Z"/>
    </svg>
  ),
  products: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.575 4.649a3.75 3.75 0 0 1 2.7-1.149h1.975a3.25 3.25 0 0 1 3.25 3.25v2.187a3.25 3.25 0 0 1-.996 2.34l-4.747 4.572a2.5 2.5 0 0 1-3.502-.033l-2.898-2.898a2.75 2.75 0 0 1-.036-3.852l4.254-4.417Zm4.425 3.351a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.77 3.406a2.25 2.25 0 0 1 2.46 0l3.569 2.328a3.75 3.75 0 0 1 1.701 3.141v6.875c0 .69-.56 1.25-1.25 1.25h-10.5c-.69 0-1.25-.56-1.25-1.25v-6.875a3.75 3.75 0 0 1 1.702-3.141l3.569-2.328Zm.73 9.844a.5.5 0 0 0-.5-.5h-1.5a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5v-2Zm1.25-4.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h1.5Zm2.25 4.5a.5.5 0 0 0-.5-.5h-1.5a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5v-2Z"/>
    </svg>
  ),
  transfer: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M3.75 4a.75.75 0 0 1 .75.75v4.5h6.69l-1.72-1.72a.75.75 0 0 1 1.06-1.06l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72h-6.69v4.5a.75.75 0 0 1-1.5 0v-10.5a.75.75 0 0 1 .75-.75Z"/>
      <path d="M16.25 4a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0v-10.5a.75.75 0 0 1 .75-.75Z"/>
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 9.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"/>
      <path d="M10 11.5c-1.968 0-3.815.95-4.959 2.552l-.561.786a1.05 1.05 0 0 0 .855 1.662h9.33a1.05 1.05 0 0 0 .855-1.662l-.561-.786a6.094 6.094 0 0 0-4.959-2.552Z"/>
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M3.5 9.75a2.11 2.11 0 0 0 1.982 2.105l4.056.246a.75.75 0 0 1 .4.146l3.068 2.272c.825.611 1.994.022 1.994-1.004v-7.608c0-1.032-1.18-1.62-2.004-.997l-3.097 2.341a.75.75 0 0 1-.407.15l-4.01.244a2.11 2.11 0 0 0-1.982 2.105Z"/>
      <path d="M6.625 13.177v2.147a1.301 1.301 0 0 0 2.594.152l.238-2.023-.154-.114-2.678-.162Z"/>
      <path d="M17.5 8.75a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5Z"/>
    </svg>
  ),
  discounts: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M11.527 3.327c-.6-1.306-2.455-1.306-3.054 0a1.68 1.68 0 0 1-2.112.874c-1.347-.5-2.66.813-2.16 2.16a1.68 1.68 0 0 1-.874 2.112c-1.306.6-1.306 2.455 0 3.054a1.68 1.68 0 0 1 .874 2.112c-.5 1.347.813 2.659 2.16 2.16a1.68 1.68 0 0 1 2.112.874c.6 1.306 2.455 1.306 3.054 0a1.68 1.68 0 0 1 2.112-.874c1.347.499 2.66-.813 2.16-2.16a1.68 1.68 0 0 1 .874-2.112c1.306-.6 1.306-2.455 0-3.054a1.68 1.68 0 0 1-.874-2.112c.5-1.347-.813-2.66-2.16-2.16a1.68 1.68 0 0 1-2.112-.874Zm-2.527 4.923a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm3.53.53-4 4a.75.75 0 1 1-1.06-1.06l4-4a.75.75 0 1 1 1.06 1.06Zm.47 3.47a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
    </svg>
  ),
  content: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
      <path fillRule="evenodd" d="M7.42 3.5h5.16c.535 0 .98 0 1.345.03.38.03.736.098 1.073.27a2.75 2.75 0 0 1 1.202 1.202c.172.337.24.693.27 1.073.03.365.03.81.03 1.345v1.91c0 .535 0 .98-.03 1.345-.03.38-.098.736-.27 1.073a2.751 2.751 0 0 1-1.201 1.202c-.338.172-.694.24-1.074.27a6.052 6.052 0 0 1-.288.017.744.744 0 0 1-.137.013h-6.08c-.535 0-.98 0-1.345-.03-.38-.03-.736-.098-1.073-.27a2.75 2.75 0 0 1-1.047-.934.75.75 0 0 1-.176-.31c-.157-.324-.22-.667-.25-1.031-.029-.365-.029-.81-.029-1.345v-1.91c0-.535 0-.98.03-1.345.03-.38.098-.736.27-1.073a2.75 2.75 0 0 1 1.202-1.202c.337-.172.693-.24 1.073-.27.365-.03.81-.03 1.345-.03Zm7.58 5.8-.001.533-.135-.192a1.75 1.75 0 0 0-2.778-.116l-1.086 1.303-2.411-2.893a1.75 1.75 0 0 0-2.68-.01l-.909 1.073v-1.548c0-.572 0-.957.025-1.253.023-.287.065-.424.111-.514a1.25 1.25 0 0 1 .547-.547c.09-.046.227-.088.514-.111.296-.024.68-.025 1.253-.025h5.1c.572 0 .957 0 1.252.025.288.023.425.065.516.111.235.12.426.311.546.547.046.09.088.227.111.514.024.296.025.68.025 1.253v1.85Z"/>
      <path d="M4 15.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Z"/>
      <path d="M12.75 15a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"/>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9.971 4c-.204 0-.344 0-.465.024a1.25 1.25 0 0 0-.982.982c-.024.121-.024.26-.024.465v9.058c0 .204 0 .344.024.465.099.496.486.883.982.982a2.5 2.5 0 0 0 .465.024h.058c.204 0 .344 0 .465-.024a1.25 1.25 0 0 0 .982-.982a2.5 2.5 0 0 0 .024-.465v-9.058c0-.204 0-.344-.024-.465a1.25 1.25 0 0 0-.982-.982a2.504 2.504 0 0 0-.465-.024h-.058Z"/>
      <path d="M5.471 9.5c-.204 0-.344 0-.465.024a1.25 1.25 0 0 0-.982.982c-.024.121-.024.26-.024.465v3.558c0 .204 0 .344.024.465.099.496.486.883.982.982a2.5 2.5 0 0 0 .465.024h.058c.204 0 .344 0 .465-.024a1.25 1.25 0 0 0 .982-.982c.024-.121.024-.26.024-.465v-3.558c0-.204 0-.344-.024-.465a1.25 1.25 0 0 0-.982-.982a2.503 2.503 0 0 0-.465-.024h-.058Z"/>
      <path d="M14.471 6.5c-.204 0-.344 0-.465.024a1.25 1.25 0 0 0-.982.982c-.024.121-.024.26-.024.465v6.558c0 .204 0 .344.024.465.099.496.486.883.982.982.121.024.26.024.465.024h.058c.204 0 .344 0 .465-.024a1.25 1.25 0 0 0 .982-.982c.024-.121.024-.26.024-.465v-6.558c0-.204 0-.344-.024-.465a1.25 1.25 0 0 0-.982-.982a2.504 2.504 0 0 0-.465-.024h-.058Z"/>
    </svg>
  ),
  store: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M12.278 3a2.75 2.75 0 0 1 2.162 1.051l2.16 2.75.01.013c.736 1.03.238 2.396-.831 2.811h-1.17c-.475 0-.915-.244-1.166-.646l-.663-1.06a.624.624 0 0 0-1.137.184l-.075.298a1.616 1.616 0 0 1-3.136 0l-.075-.298a.628.628 0 0 0-.637-.477.624.624 0 0 0-.5.293l-.662 1.06a1.375 1.375 0 0 1-1.166.646h-1.17c-1.07-.415-1.568-1.781-.832-2.81l.01-.015 2.16-2.749a2.75 2.75 0 0 1 2.162-1.051h4.556Z"/>
      <path fillRule="evenodd" d="M4.5 10.875v4.375c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.375h-.892a2.625 2.625 0 0 1-2.226-1.234l-.012-.02a2.866 2.866 0 0 1-4.74 0l-.012.02a2.625 2.625 0 0 1-2.226 1.234h-.892Zm8.5 2.475a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v2.4c0 .138.112.25.25.25h2.5a.25.25 0 0 0 .25-.25v-2.4Z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.013 4.389c0-.767.621-1.389 1.389-1.389h1.196c.767 0 1.39.622 1.39 1.389v.66c0 .153.101.33.307.436.141.074.278.155.411.241.196.128.402.13.536.052l.576-.332a1.389 1.389 0 0 1 1.897.508l.599 1.037a1.39 1.39 0 0 1-.509 1.897l-.621.359c-.131.075-.232.249-.225.477a5.135 5.135 0 0 1-.004.427c-.012.233.09.412.223.489l.627.362c.665.384.892 1.233.509 1.897l-.599 1.037a1.39 1.39 0 0 1-1.897.508l-.672-.388c-.132-.076-.332-.076-.526.045a4.928 4.928 0 0 1-.325.185c-.206.108-.308.284-.308.437v.778a1.39 1.39 0 0 1-1.389 1.39h-1.196a1.389 1.389 0 0 1-1.39-1.39v-.778c0-.153-.102-.33-.307-.437a4.96 4.96 0 0 1-.325-.185c-.194-.121-.395-.12-.526-.045l-.672.388a1.39 1.39 0 0 1-1.898-.508l-.598-1.037a1.389 1.389 0 0 1 .509-1.897l.627-.362c.133-.077.235-.256.223-.49a5.03 5.03 0 0 1-.004-.426c.007-.228-.094-.401-.225-.477l-.621-.359a1.389 1.389 0 0 1-.509-1.897l.598-1.037a1.389 1.389 0 0 1 1.898-.508l.576.332c.133.078.34.076.535-.052a4.81 4.81 0 0 1 .412-.24c.205-.108.308-.284.308-.437v-.66Zm1.987 7.611a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
    </svg>
  ),
  apps: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M13.5 3.625c.483 0 .875.392.875.875v1.125h1.125a.875.875 0 0 1 0 1.75h-1.125v1.125a.875.875 0 0 1-1.75 0v-1.125h-1.125a.875.875 0 0 1 0-1.75h1.125v-1.125c0-.483.392-.875.875-.875Z"/>
      <path d="M5.75 3.75a2 2 0 0 0-2 2v2.75c0 .414.336.75.75.75h4a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 0-.75-.75h-2.75Z"/>
      <path d="M3.75 14.25a2 2 0 0 0 2 2h2.75a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 0-.75-.75h-4a.75.75 0 0 0-.75.75v2.75Z"/>
      <path d="M14.25 16.25a2 2 0 0 0 2-2v-2.75a.75.75 0 0 0-.75-.75h-4a.75.75 0 0 0-.75.75v4c0 .414.336.75.75.75h2.75Z"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M12.323 13.383a5.5 5.5 0 1 1 1.06-1.06l2.897 2.897a.75.75 0 1 1-1.06 1.06l-2.897-2.897Zm.677-4.383a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"/>
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M5.72 8.47a.75.75 0 0 1 1.06 0l3.47 3.47 3.47-3.47a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 0-1.06Z"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10.75 5.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.5h-3.5c-.414 0-.75.336-.75.75s.336.75.75.75h3.5v3.5c0 .414.336.75.75.75s.75-.336.75-.75v-3.5h3.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-3.5v-3.5Z"/>
    </svg>
  ),
  sortAsc: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M9.116 4.323a1.25 1.25 0 0 1 1.768 0l2.646 2.647a.75.75 0 0 1-1.06 1.06l-2.47-2.47-2.47 2.47a.75.75 0 1 1-1.06-1.06l2.646-2.647Z"/>
      <path fillOpacity=".33" fillRule="evenodd" d="M9.116 15.677a1.25 1.25 0 0 0 1.768 0l2.646-2.647a.75.75 0 0 0-1.06-1.06l-2.47 2.47-2.47-2.47a.75.75 0 0 0-1.06 1.06l2.646 2.647Z"/>
    </svg>
  ),
  notification: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="m7.252 14.424-2.446-.281c-1.855-.213-2.38-2.659-.778-3.616l.065-.038a2.887 2.887 0 0 0 1.407-2.48v-.509a4.5 4.5 0 0 1 9 0v.51c0 1.016.535 1.958 1.408 2.479l.065.038c1.602.957 1.076 3.403-.778 3.616l-2.543.292v.365a2.7 2.7 0 0 1-5.4 0v-.376Zm3.9.076h-2.4v.3a1.2 1.2 0 0 0 2.4 0v-.3Zm-3.152-1.5h4l3.024-.348a.452.452 0 0 0 .18-.837l-.065-.038a4.414 4.414 0 0 1-.747-.562 4.387 4.387 0 0 1-1.392-3.205v-.51a3 3 0 0 0-6 0v.51a4.387 4.387 0 0 1-2.138 3.767l-.065.038a.452.452 0 0 0 .18.838l3.023.347Z"/>
    </svg>
  ),
  // Product icons
  jacket: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 2c-.6 0-1.1.2-1.5.5L5 5v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5l-3.5-2.5c-.4-.3-.9-.5-1.5-.5Zm-3 4h6v2H7V6Zm0 4h6v6H7v-6Z"/>
    </svg>
  ),
  pants: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M6 2h8v3H6V2Zm0 4h3v12H6V6Zm5 0h3v12h-3V6Z"/>
    </svg>
  ),
  backpack: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M8 2a2 2 0 0 0-2 2h8a2 2 0 0 0-2-2H8Zm6 3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Zm-4 3a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H7a1 1 0 1 1 0-2h2V9a1 1 0 0 1 1-1Z"/>
    </svg>
  ),
  shirt: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 2L6 4v3h2V5.5L10 4l2 1.5V7h2V4l-4-2Zm-4 6v10h8V8H6Z"/>
    </svg>
  ),
  fleece: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 2c-1.1 0-2 .4-2.5 1L5 5v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5l-2.5-2c-.5-.6-1.4-1-2.5-1Zm0 2c.3 0 .5.1.7.2L13 6v10H7V6l2.3-1.8c.2-.1.4-.2.7-.2Z"/>
    </svg>
  ),
  boot: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M6 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h4v2H6V3Zm0 7h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a4 4 0 0 1 4-4Z"/>
    </svg>
  ),
  gloves: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M7 2a1 1 0 0 1 2 0v5h2V3a1 1 0 1 1 2 0v4h2V4a1 1 0 1 1 2 0v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V6a1 1 0 0 1 2 0v3h1V2Z"/>
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M3 11c0-3.9 3.1-7 7-7s7 3.1 7 7H3Zm-1 1h16v2H2v-2Zm12 3v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h-4Z"/>
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
  { id: 'SKU-001', name: 'Alpine Summit Jacket', variant: 'Midnight Blue / L', sku: 'ASJ-MB-L', icon: 'jacket', unavailable: 0, committed: 2, available: 16, onHand: 18 },
  { id: 'SKU-002', name: 'Alpine Summit Jacket', variant: 'Forest Green / M', sku: 'ASJ-FG-M', icon: 'jacket', unavailable: 0, committed: 0, available: 22, onHand: 22 },
  { id: 'SKU-003', name: 'Alpine Summit Jacket', variant: 'Charcoal / S', sku: 'ASJ-CH-S', icon: 'jacket', unavailable: 0, committed: 1, available: 14, onHand: 15 },
  { id: 'SKU-004', name: 'Trailblazer Hiking Pants', variant: 'Stone Grey / 32', sku: 'THP-SG-32', icon: 'pants', unavailable: 0, committed: 1, available: 17, onHand: 18 },
  { id: 'SKU-005', name: 'Trailblazer Hiking Pants', variant: 'Khaki / 34', sku: 'THP-KH-34', icon: 'pants', unavailable: 0, committed: 0, available: 13, onHand: 13 },
  { id: 'SKU-006', name: 'Backcountry 45L Pack', variant: 'Forest Green', sku: 'B45-FG', icon: 'backpack', unavailable: 0, committed: 0, available: 12, onHand: 12 },
  { id: 'SKU-007', name: 'Backcountry 45L Pack', variant: 'Black', sku: 'B45-BK', icon: 'backpack', unavailable: 0, committed: 2, available: 8, onHand: 10 },
  { id: 'SKU-008', name: 'Summit Base Layer', variant: 'Heather Oat / M', sku: 'SBL-HO-M', icon: 'shirt', unavailable: 0, committed: 3, available: 42, onHand: 45 },
  { id: 'SKU-009', name: 'Summit Base Layer', variant: 'Black / L', sku: 'SBL-BK-L', icon: 'shirt', unavailable: 0, committed: 0, available: 38, onHand: 38 },
  { id: 'SKU-010', name: 'Ridgeline Fleece', variant: 'Burnt Orange / XL', sku: 'RF-BO-XL', icon: 'fleece', unavailable: 0, committed: 0, available: 31, onHand: 31 },
  { id: 'SKU-011', name: 'Ridgeline Fleece', variant: 'Navy / M', sku: 'RF-NV-M', icon: 'fleece', unavailable: 0, committed: 1, available: 24, onHand: 25 },
  { id: 'SKU-012', name: 'Trekker Boots', variant: 'Brown / 10', sku: 'TB-BR-10', icon: 'boot', unavailable: 0, committed: 1, available: 7, onHand: 8 },
  { id: 'SKU-013', name: 'Trekker Boots', variant: 'Black / 11', sku: 'TB-BK-11', icon: 'boot', unavailable: 0, committed: 0, available: 11, onHand: 11 },
  { id: 'SKU-014', name: 'Insulated Gloves', variant: 'Black / M', sku: 'IG-BK-M', icon: 'gloves', unavailable: 0, committed: 0, available: 52, onHand: 52 },
  { id: 'SKU-015', name: 'Insulated Gloves', variant: 'Black / L', sku: 'IG-BK-L', icon: 'gloves', unavailable: 0, committed: 0, available: 41, onHand: 41 },
  { id: 'SKU-016', name: 'Trail Cap', variant: 'Sand', sku: 'TC-SD', icon: 'cap', unavailable: 0, committed: 0, available: 67, onHand: 67 },
  { id: 'SKU-017', name: 'Trail Cap', variant: 'Olive', sku: 'TC-OL', icon: 'cap', unavailable: 0, committed: 0, available: 54, onHand: 54 },
  { id: 'SKU-018', name: 'Expedition Softshell', variant: 'Graphite / M', sku: 'ES-GR-M', icon: 'jacket', unavailable: 0, committed: 0, available: 22, onHand: 22 },
]

const INITIAL_MOVEMENTS: Movement[] = [
  { id: 'M0001', origin: 'Main Warehouse', destination: 'Downtown Flagship', status: 'Pending', received: '0 of 5', expectedArrival: 'Dec 6, 2025', items: [{ name: 'Alpine Summit Jacket', quantity: 5, sku: 'ASJ-MB-L' }], createdAt: '2025-12-03' },
]

// ============================================================================
// Components
// ============================================================================

function ShopifyHeader({ onSearchClick }: { onSearchClick: () => void }) {
  return (
    <header className="h-14 bg-[#1a1a1a] flex items-center px-3 justify-between font-[var(--font-inter)]">
      <div className="flex items-center">
        <ShopifyLogo />
      </div>

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
        <div className="px-2 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.home}</span>
            Home
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.orders}</span>
            Orders
          </button>
        </div>

        <div className="mt-4 px-2">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.products}</span>
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
              onClick={() => onNavigate('movements')}
              className={`w-full text-left px-2 py-[5px] text-[13px] rounded-lg transition-colors ${
                currentPage === 'movements'
                  ? 'bg-[#ebebeb] text-[#303030] font-medium'
                  : 'text-[#5c5c5c] hover:bg-[#ebebeb] hover:text-[#303030]'
              }`}
            >
              Movements
            </button>
            <button className="w-full text-left px-2 py-[5px] text-[13px] text-[#5c5c5c] hover:bg-[#ebebeb] hover:text-[#303030] rounded-lg transition-colors">
              Gift cards
            </button>
          </div>
        </div>

        <div className="mt-2 px-2 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.customers}</span>
            Customers
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.content}</span>
            Content
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.analytics}</span>
            Analytics
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.marketing}</span>
            Marketing
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.discounts}</span>
            Discounts
          </button>
        </div>

        <div className="mt-6 px-2">
          <div className="px-2 py-1 text-[11px] font-semibold text-[#6d6d6d] uppercase tracking-wide">Sales channels</div>
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.store}</span>
            Online Store
          </button>
        </div>

        <div className="mt-2 px-2">
          <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
            <span className="text-[#303030]">{Icons.apps}</span>
            Apps
            <span className="ml-auto text-[#8a8a8a]">{Icons.chevronRight}</span>
          </button>
        </div>
      </nav>

      <div className="border-t border-[#e3e3e3] p-2">
        <button className="w-full flex items-center gap-3 px-2 py-[6px] text-[13px] text-left hover:bg-[#ebebeb] rounded-lg transition-colors text-[#303030]">
          <span className="text-[#303030]">{Icons.settings}</span>
          Settings
        </button>
      </div>
    </aside>
  )
}

function InventoryPage() {
  return (
    <div className="flex-1 overflow-auto bg-[#f1f1f1] font-[var(--font-inter)]">
      <div className="bg-white border-b border-[#e3e3e3]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#303030]">{Icons.inventory}</span>
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

      <div className="p-5">
        <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e3e3e3]">
            <button className="px-3 py-[5px] text-[13px] font-medium bg-[#303030] text-white rounded-lg">All</button>
            <button className="p-1.5 text-[#5c5c5c] hover:bg-[#f1f1f1] rounded-lg transition-colors">
              {Icons.plus}
            </button>
          </div>

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
                      <div className="w-10 h-10 bg-[#f1f1f1] rounded-lg flex items-center justify-center text-[#5c5c5c] border border-[#e3e3e3]">
                        {Icons[item.icon]}
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

          <div className="px-4 py-3 text-center border-t border-[#e3e3e3]">
            <a href="#" className="text-[13px] text-[#005bd3] hover:underline">Learn more about managing inventory</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Movement creation step types
type CreationStep = 'origin' | 'destination' | 'products' | 'quantity' | 'review'

// Quick workflow shortcuts (pills)
const WORKFLOW_SHORTCUTS = [
  { id: 'flagship', label: 'To Flagship', origin: 'warehouse', destination: 'flagship' },
  { id: 'mall', label: 'To Mall', origin: 'warehouse', destination: 'mall' },
  { id: 'outlet', label: 'To Outlet', origin: 'warehouse', destination: 'outlet' },
]

function MovementsPage({
  movements,
  onCreateMovement
}: {
  movements: Movement[]
  onCreateMovement: (movement: Movement) => void
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState<CreationStep>('origin')
  const [searchInput, setSearchInput] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Array<{ item: typeof INVENTORY_ITEMS[0]; quantity: number }>>([])
  const [selectedOrigin, setSelectedOrigin] = useState<typeof LOCATIONS[0] | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<typeof LOCATIONS[0] | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [pendingProduct, setPendingProduct] = useState<typeof INVENTORY_ITEMS[0] | null>(null)
  const [quantityInput, setQuantityInput] = useState('')
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false)
  const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when creating or step changes
  useEffect(() => {
    if (isCreating) {
      // Use requestAnimationFrame for more reliable focus after render
      requestAnimationFrame(() => {
        if (step === 'quantity') {
          quantityInputRef.current?.focus()
        } else if (step !== 'review') {
          inputRef.current?.focus()
        }
      })
    }
  }, [isCreating, step])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOriginDropdownOpen(false)
      setDestinationDropdownOpen(false)
    }
    if (originDropdownOpen || destinationDropdownOpen) {
      // Delay to allow the click that opened the dropdown to complete
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside, { once: true })
      }, 0)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [originDropdownOpen, destinationDropdownOpen])

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchInput])

  const handleCreateMovement = () => {
    if (selectedProducts.length === 0 || !selectedOrigin || !selectedDestination) return

    const totalQty = selectedProducts.reduce((sum, p) => sum + p.quantity, 0)
    const newMovement: Movement = {
      id: `M${String(movements.length + 1).padStart(4, '0')}`,
      origin: selectedOrigin.name,
      destination: selectedDestination.name,
      status: 'Pending',
      received: `0 of ${totalQty}`,
      expectedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: selectedProducts.map(p => ({ name: p.item.name, quantity: p.quantity, sku: p.item.sku })),
      isNew: true,
      createdAt: new Date().toISOString().split('T')[0],
    }

    onCreateMovement(newMovement)
    resetForm()
  }

  const resetForm = () => {
    setIsCreating(false)
    setStep('origin')
    setSelectedProducts([])
    setSelectedOrigin(null)
    setSelectedDestination(null)
    setSearchInput('')
    setHighlightedIndex(0)
    setPendingProduct(null)
    setQuantityInput('')
  }

  // Quick workflow shortcut - pre-fills origin and destination
  const applyShortcut = (shortcut: typeof WORKFLOW_SHORTCUTS[0]) => {
    const origin = LOCATIONS.find(l => l.id === shortcut.origin)
    const destination = LOCATIONS.find(l => l.id === shortcut.destination)
    if (origin) setSelectedOrigin(origin)
    if (destination) setSelectedDestination(destination)
    setStep('products')
    setSearchInput('')
    setHighlightedIndex(0)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const selectOrigin = (loc: typeof LOCATIONS[0]) => {
    setSelectedOrigin(loc)
    setSearchInput('')
    setHighlightedIndex(0)
    setStep('destination')
  }

  const selectDestination = (loc: typeof LOCATIONS[0]) => {
    setSelectedDestination(loc)
    setSearchInput('')
    setHighlightedIndex(0)
    setStep('products')
  }

  const addProduct = (item: typeof INVENTORY_ITEMS[0], qty: number = 1) => {
    const existing = selectedProducts.find(p => p.item.id === item.id)
    if (existing) {
      setSelectedProducts(prev => prev.map(p =>
        p.item.id === item.id ? { ...p, quantity: p.quantity + qty } : p
      ))
    } else {
      setSelectedProducts(prev => [...prev, { item, quantity: qty }])
    }
    setSearchInput('')
    setHighlightedIndex(0)
    setPendingProduct(null)
    setQuantityInput('')
  }

  // Start quantity entry for a product (Tab flow)
  const startQuantityEntry = (item: typeof INVENTORY_ITEMS[0]) => {
    setPendingProduct(item)
    setQuantityInput('1')
    setStep('quantity')
  }

  // Confirm quantity and add product
  const confirmQuantity = () => {
    if (pendingProduct) {
      const qty = parseInt(quantityInput) || 1
      addProduct(pendingProduct, qty)
      setStep('products')
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(itemId)
    } else {
      setSelectedProducts(prev => prev.map(p =>
        p.item.id === itemId ? { ...p, quantity } : p
      ))
    }
  }

  const removeProduct = (itemId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.item.id !== itemId))
  }

  // Parse natural language input for quantity (e.g., "5 jackets", "jacket x10")
  const parseQuantityFromSearch = (search: string): { query: string; quantity: number } => {
    // Match "5 jackets" or "10 base layer"
    const prefixMatch = search.match(/^(\d+)\s+(.+)$/i)
    if (prefixMatch) {
      return { query: prefixMatch[2], quantity: parseInt(prefixMatch[1]) }
    }
    // Match "jacket x5" or "jacket *10"
    const suffixMatch = search.match(/^(.+?)\s*[x*](\d+)$/i)
    if (suffixMatch) {
      return { query: suffixMatch[1], quantity: parseInt(suffixMatch[2]) }
    }
    return { query: search, quantity: 1 }
  }

  // Get filtered items based on current step
  const getFilteredItems = () => {
    const { query } = parseQuantityFromSearch(searchInput)
    const search = query.toLowerCase().trim()

    if (step === 'origin') {
      return LOCATIONS.filter(loc =>
        !search || loc.name.toLowerCase().includes(search)
      )
    }
    if (step === 'destination') {
      return LOCATIONS.filter(loc =>
        loc.id !== selectedOrigin?.id &&
        (!search || loc.name.toLowerCase().includes(search))
      )
    }
    if (step === 'products') {
      return INVENTORY_ITEMS.filter(item =>
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.variant.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search)
      )
    }
    return []
  }

  const filteredItems = getFilteredItems()

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape to go back or close
    if (e.key === 'Escape') {
      e.preventDefault()
      if (step === 'quantity') {
        setPendingProduct(null)
        setQuantityInput('')
        setStep('products')
      } else if (step === 'destination') {
        setStep('origin')
        setSelectedOrigin(null)
        setSearchInput('')
      } else if (step === 'products') {
        if (selectedProducts.length > 0) {
          setStep('review')
        } else {
          setStep('destination')
          setSelectedDestination(null)
          setSearchInput('')
        }
      } else if (step === 'review') {
        setStep('products')
      } else if (step === 'origin') {
        resetForm()
      }
      return
    }

    // Cmd+Enter to submit (from any step with products)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (selectedProducts.length > 0 && selectedOrigin && selectedDestination) {
        handleCreateMovement()
      }
      return
    }

    // Tab in products step - if there's a highlighted product, go to quantity entry
    if (e.key === 'Tab' && step === 'products') {
      e.preventDefault()
      const item = filteredItems[highlightedIndex] as typeof INVENTORY_ITEMS[0]
      if (item && searchInput) {
        // If user typed something and hits Tab, enter quantity mode
        startQuantityEntry(item)
      } else if (selectedProducts.length > 0) {
        // If no search but products selected, go to review
        setStep('review')
      }
      return
    }

    // Arrow navigation
    const maxItems = Math.min(filteredItems.length, 10)
    if (maxItems === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev + 1) % maxItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev - 1 + maxItems) % maxItems)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filteredItems[highlightedIndex]
      if (!item) return

      if (step === 'origin') {
        selectOrigin(item as typeof LOCATIONS[0])
      } else if (step === 'destination') {
        selectDestination(item as typeof LOCATIONS[0])
      } else if (step === 'products') {
        const { quantity } = parseQuantityFromSearch(searchInput)
        addProduct(item as typeof INVENTORY_ITEMS[0], quantity)
      }
    }
  }

  // Quantity input keyboard handler
  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmQuantity()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setPendingProduct(null)
      setQuantityInput('')
      setStep('products')
    }
  }

  // Get placeholder text based on step
  const getPlaceholder = () => {
    if (step === 'origin') return 'Search locations...'
    if (step === 'destination') return 'Search destinations...'
    if (step === 'products') return 'Type product name, or "10 jackets" for quantity...'
    if (step === 'quantity') return 'Enter quantity...'
    return ''
  }

  // Get step label
  const getStepLabel = () => {
    if (step === 'origin') return 'From'
    if (step === 'destination') return 'To'
    if (step === 'products') return 'Add'
    if (step === 'quantity') return 'Qty'
    if (step === 'review') return 'Review'
    return ''
  }

  return (
    <div className="flex-1 overflow-auto bg-[#f1f1f1] font-[var(--font-inter)]">
      <div className="bg-white border-b border-[#e3e3e3]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#303030]">{Icons.transfer}</span>
            <h1 className="text-[20px] font-semibold text-[#303030]">Movements</h1>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-[7px] text-[13px] font-semibold text-white bg-[#303030] hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              Create movement
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <div className="max-w-[780px] mx-auto">
              <motion.div
                key="create"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_40px_-12px_rgba(0,0,0,0.2)] overflow-hidden"
              >
                {/* Command bar header */}
                <div className="relative">
                  {/* Route breadcrumb - pill dropdowns for hot-swapping */}
                  {(selectedOrigin || selectedDestination) && (
                    <div className="px-5 pt-4 pb-1">
                      <div className="inline-flex items-center gap-1 px-1 py-0.5 bg-[#f6f6f7] rounded-full">
                        {selectedOrigin && (
                          <div className="relative">
                            <button
                              onClick={() => { setOriginDropdownOpen(!originDropdownOpen); setDestinationDropdownOpen(false) }}
                              className={`flex items-center gap-1.5 pl-1 pr-2 py-1 bg-white rounded-full shadow-sm text-[12px] font-medium text-[#202223] hover:shadow-md transition-all ${originDropdownOpen ? 'ring-2 ring-[#8c9196]' : ''}`}
                            >
                              <span className="w-5 h-5 rounded-full bg-[#f6f6f7] flex items-center justify-center">
                                <span className="text-[#5c5c5c] scale-[0.7]">{Icons.inventory}</span>
                              </span>
                              {selectedOrigin.name.split(' ')[0]}
                              <svg className={`w-3 h-3 text-[#8c9196] transition-transform ${originDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {/* Origin dropdown */}
                            {originDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#e4e5e7] py-1 z-10">
                                {LOCATIONS.filter(loc => loc.id !== selectedDestination?.id).map(loc => (
                                  <button
                                    key={loc.id}
                                    onClick={() => { setSelectedOrigin(loc); setOriginDropdownOpen(false) }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#f6f6f7] transition-colors ${
                                      selectedOrigin.id === loc.id ? 'bg-[#f2f3f5]' : ''
                                    }`}
                                  >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      loc.type === 'warehouse' ? 'bg-[#f6f6f7]' : 'bg-[#e3f1df]'
                                    }`}>
                                      <span className={`scale-[0.65] ${loc.type === 'warehouse' ? 'text-[#5c5c5c]' : 'text-[#1a7f37]'}`}>
                                        {loc.type === 'warehouse' ? Icons.inventory : Icons.store}
                                      </span>
                                    </span>
                                    <span className="text-[#202223]">{loc.name}</span>
                                    {selectedOrigin.id === loc.id && (
                                      <svg className="w-4 h-4 text-[#1a7f37] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {selectedOrigin && selectedDestination && (
                          <svg className="w-4 h-4 text-[#8c9196]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        )}
                        {selectedDestination && (
                          <div className="relative">
                            <button
                              onClick={() => { setDestinationDropdownOpen(!destinationDropdownOpen); setOriginDropdownOpen(false) }}
                              className={`flex items-center gap-1.5 pl-1 pr-2 py-1 bg-white rounded-full shadow-sm text-[12px] font-medium text-[#202223] hover:shadow-md transition-all ${destinationDropdownOpen ? 'ring-2 ring-[#8c9196]' : ''}`}
                            >
                              <span className="w-5 h-5 rounded-full bg-[#e3f1df] flex items-center justify-center">
                                <span className="text-[#1a7f37] scale-[0.7]">{Icons.store}</span>
                              </span>
                              {selectedDestination.name.split(' ')[0]}
                              <svg className={`w-3 h-3 text-[#8c9196] transition-transform ${destinationDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {/* Destination dropdown */}
                            {destinationDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#e4e5e7] py-1 z-10">
                                {LOCATIONS.filter(loc => loc.id !== selectedOrigin?.id).map(loc => (
                                  <button
                                    key={loc.id}
                                    onClick={() => { setSelectedDestination(loc); setDestinationDropdownOpen(false) }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#f6f6f7] transition-colors ${
                                      selectedDestination.id === loc.id ? 'bg-[#f2f3f5]' : ''
                                    }`}
                                  >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      loc.type === 'warehouse' ? 'bg-[#f6f6f7]' : 'bg-[#e3f1df]'
                                    }`}>
                                      <span className={`scale-[0.65] ${loc.type === 'warehouse' ? 'text-[#5c5c5c]' : 'text-[#1a7f37]'}`}>
                                        {loc.type === 'warehouse' ? Icons.inventory : Icons.store}
                                      </span>
                                    </span>
                                    <span className="text-[#202223]">{loc.name}</span>
                                    {selectedDestination.id === loc.id && (
                                      <svg className="w-4 h-4 text-[#1a7f37] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main input area */}
                  {step !== 'review' && step !== 'quantity' && (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded bg-[#8c9196] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          ref={inputRef}
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={getPlaceholder()}
                          className="flex-1 text-[16px] bg-transparent outline-none placeholder:text-[#9ca3af] text-[#111827] font-medium"
                          autoComplete="off"
                          autoFocus
                        />
                        {step === 'products' && searchInput && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-[#f3f4f6] rounded-md">
                            <kbd className="text-[10px] font-medium text-[#6b7280]">Tab</kbd>
                            <span className="text-[10px] text-[#9ca3af]">qty</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quantity input mode */}
                  {step === 'quantity' && pendingProduct && (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-md bg-[#e3f1df] flex items-center justify-center">
                          <span className="text-[#1a7f37] scale-[0.6]">{Icons[pendingProduct.icon]}</span>
                        </div>
                        <input
                          ref={quantityInputRef}
                          type="number"
                          min="1"
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(e.target.value)}
                          onKeyDown={handleQuantityKeyDown}
                          className="w-16 text-[16px] font-semibold bg-[#f3f4f6] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#5c5ac7] text-[#111827] text-center"
                          autoComplete="off"
                        />
                        <span className="text-[14px] text-[#374151]">× {pendingProduct.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Subtle separator */}
                  <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent" />
                </div>

                {/* Quick actions - only on origin step */}
                {step === 'origin' && (
                  <div className="px-5 py-3 bg-[#fafafa]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">Quick</span>
                      {WORKFLOW_SHORTCUTS.map(shortcut => (
                        <button
                          key={shortcut.id}
                          onClick={() => applyShortcut(shortcut)}
                          className="px-3 py-1.5 text-[12px] font-medium text-[#202223] bg-white border border-[#c9cccf] hover:bg-[#f6f6f7] rounded-lg transition-all"
                        >
                          {shortcut.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results list */}
                {step !== 'review' && step !== 'quantity' && (
                  <div className="max-h-[320px] overflow-y-auto">
                    {(step === 'origin' || step === 'destination') && (
                      <div className="p-2">
                        {(filteredItems as typeof LOCATIONS).slice(0, 6).map((loc, index) => (
                          <button
                            key={loc.id}
                            onClick={() => step === 'origin' ? selectOrigin(loc) : selectDestination(loc)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                              index === highlightedIndex
                                ? 'bg-[#f2f3f5] ring-1 ring-[#8c9196] ring-inset'
                                : 'hover:bg-[#f6f6f7]'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              loc.type === 'warehouse' ? 'bg-[#f6f6f7]' : 'bg-[#e3f1df]'
                            }`}>
                              <span className={loc.type === 'warehouse' ? 'text-[#5c5c5c]' : 'text-[#1a7f37]'}>
                                {loc.type === 'warehouse' ? Icons.inventory : Icons.store}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-semibold truncate text-[#202223]">
                                {loc.name}
                              </p>
                              <p className="text-[12px] text-[#6d7175]">
                                {loc.type === 'warehouse' ? 'Warehouse' : 'Retail store'}
                              </p>
                            </div>
                            {index === highlightedIndex && (
                              <kbd className="px-2 py-1 bg-[#e4e5e7] rounded text-[11px] font-medium text-[#6d7175]">↵</kbd>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {step === 'products' && (
                      <div className="flex flex-col">
                        {/* Selected products - elevated card style */}
                        {selectedProducts.length > 0 && (
                          <div className="mx-4 mt-2 mb-4 rounded-xl border border-[#d1fae5] bg-gradient-to-b from-[#f0fdf4] to-[#ecfdf5] shadow-sm">
                            <div className="px-4 py-3 flex items-center justify-between border-b border-[#d1fae5]">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shadow-sm">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-[13px] font-semibold text-[#166534]">
                                    {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} items ready
                                  </span>
                                  <span className="text-[12px] text-[#6b7280] ml-2">
                                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedProducts([])}
                                className="text-[11px] font-medium text-[#6b7280] hover:text-[#dc2626] transition-colors"
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="max-h-[160px] overflow-y-auto">
                              {selectedProducts.map(({ item, quantity }) => (
                                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#d1fae5] last:border-b-0">
                                  <div className="w-9 h-9 rounded-lg bg-white border border-[#d1fae5] flex items-center justify-center shadow-sm">
                                    <span className="text-[#1a7f37] scale-[0.85]">{Icons[item.icon]}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[#166534] truncate">{item.name}</p>
                                    <p className="text-[11px] text-[#6b7280]">{item.variant}</p>
                                  </div>
                                  <div className="flex items-center bg-white rounded-lg border border-[#d1fae5] shadow-sm">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, quantity - 1) }}
                                      className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:bg-[#f0fdf4] text-[16px] font-medium transition-colors rounded-l-lg"
                                    >
                                      −
                                    </button>
                                    <span
                                      className="w-10 text-center text-[14px] font-bold text-[#166534] select-none"
                                    >
                                      {quantity}
                                    </span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, quantity + 1) }}
                                      className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:bg-[#f0fdf4] text-[16px] font-medium transition-colors rounded-r-lg"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeProduct(item.id) }}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Product search results - section with header */}
                        <div className="flex flex-col">
                          <div className="px-4 py-2 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#6d7175] uppercase tracking-wider">
                              {searchInput ? 'Search results' : 'All products'}
                            </span>
                            <span className="text-[11px] text-[#8c9196]">
                              {(filteredItems as typeof INVENTORY_ITEMS).length} items
                            </span>
                          </div>
                          <div className="px-2 pb-2 max-h-[400px] overflow-y-auto">
                          {(filteredItems as typeof INVENTORY_ITEMS).slice(0, 10).map((item, index) => {
                            const { quantity } = parseQuantityFromSearch(searchInput)
                            const existingQty = selectedProducts.find(p => p.item.id === item.id)?.quantity || 0
                            const isHighlighted = index === highlightedIndex

                            return (
                              <div
                                key={item.id}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                  isHighlighted
                                    ? 'bg-[#f2f3f5] ring-1 ring-[#8c9196] ring-inset'
                                    : existingQty > 0 ? 'bg-[#f1f8f5]' : 'hover:bg-[#f6f6f7]'
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                                  existingQty > 0 ? 'bg-[#d4edda]' : 'bg-[#f6f6f7]'
                                }`}>
                                  <span className={`scale-[0.85] ${existingQty > 0 ? 'text-[#1a7f37]' : 'text-[#5c5c5c]'}`}>
                                    {Icons[item.icon]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold truncate text-[#202223]">
                                    {item.name}
                                  </p>
                                  <p className="text-[11px] text-[#6d7175]">
                                    {item.variant} · <span className="font-mono">{item.sku}</span>
                                  </p>
                                </div>

                                {/* Inline quantity controls */}
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {existingQty > 0 ? (
                                    <>
                                      <button
                                        onClick={() => updateQuantity(item.id, existingQty - 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded text-[13px] text-[#6d7175] hover:bg-[#e4e5e7] transition-colors"
                                      >
                                        −
                                      </button>
                                      <span className="w-7 text-center text-[13px] font-bold text-[#1a7f37]">
                                        {existingQty}
                                      </span>
                                      <button
                                        onClick={() => updateQuantity(item.id, existingQty + 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded text-[13px] text-[#6d7175] hover:bg-[#e4e5e7] transition-colors"
                                      >
                                        +
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Quick add buttons - always visible */}
                                      <div className="flex items-center gap-0.5">
                                        {[1, 5, 10].map(qty => (
                                          <button
                                            key={qty}
                                            onClick={() => addProduct(item, qty)}
                                            className="px-2 py-1 text-[11px] font-medium rounded text-[#6d7175] bg-[#f6f6f7] hover:bg-[#e4e5e7] transition-colors"
                                          >
                                            +{qty}
                                          </button>
                                        ))}
                                      </div>
                                      <span className="text-[11px] font-medium ml-2 text-[#8c9196]">
                                        {item.available}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Review step */}
                {step === 'review' && (
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-[#303030] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#111827]">Review movement</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedProducts.map(({ item, quantity }) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#5c5c5c] border border-[#e5e7eb]">
                            {Icons[item.icon]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#111827] truncate">{item.name}</p>
                            <p className="text-[11px] text-[#6b7280]">{item.variant}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-white rounded-lg border border-[#e5e7eb] p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] text-[14px] font-medium transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-[14px] font-semibold text-[#111827]">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] text-[14px] font-medium transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setStep('products')}
                      className="mt-3 text-[13px] font-medium text-[#2c6ecb] hover:text-[#1f5199] flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add more items
                    </button>
                  </div>
                )}

                {/* Quantity confirm */}
                {step === 'quantity' && (
                  <div className="p-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setPendingProduct(null); setQuantityInput(''); setStep('products') }}
                      className="px-4 py-2 text-[13px] font-medium text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmQuantity}
                      className="px-4 py-2 text-[13px] font-semibold text-white bg-[#303030] hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    >
                      Add {quantityInput || 1} items
                    </button>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-3 bg-[#f9fafb] border-t border-[#f3f4f6] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-[#9ca3af]">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white border border-[#e5e7eb] rounded text-[10px] font-medium text-[#6b7280] shadow-sm">↑↓</kbd>
                      <span>navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white border border-[#e5e7eb] rounded text-[10px] font-medium text-[#6b7280] shadow-sm">↵</kbd>
                      <span>select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white border border-[#e5e7eb] rounded text-[10px] font-medium text-[#6b7280] shadow-sm">esc</kbd>
                      <span>back</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetForm}
                      className="px-3 py-1.5 text-[12px] font-medium text-[#6b7280] hover:text-[#374151] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    {selectedProducts.length > 0 && selectedOrigin && selectedDestination && step !== 'quantity' && (
                      <button
                        onClick={handleCreateMovement}
                        className="px-4 py-1.5 text-[12px] font-semibold text-white bg-[#303030] hover:bg-[#1a1a1a] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        Create
                        <kbd className="px-1 py-0.5 bg-white/20 rounded text-[10px]">⌘↵</kbd>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e3e3e3]">
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" className="w-[18px] h-[18px] rounded border-[#8a8a8a] accent-[#303030]" />
                    </th>
                    <th className="px-3 py-3 text-[12px] font-medium text-[#6d6d6d] text-left">ID</th>
                    <th className="px-3 py-3 text-[12px] font-medium text-[#6d6d6d] text-left">Route</th>
                    <th className="px-3 py-3 text-[12px] font-medium text-[#6d6d6d] text-left">Items</th>
                    <th className="px-3 py-3 text-[12px] font-medium text-[#6d6d6d] text-left">Status</th>
                    <th className="px-3 py-3 text-[12px] font-medium text-[#6d6d6d] text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {movements.map((movement) => (
                      <motion.tr
                        key={movement.id}
                        initial={movement.isNew ? { opacity: 0, backgroundColor: '#d1fae5' } : { opacity: 1 }}
                        animate={{ opacity: 1, backgroundColor: '#ffffff' }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="border-b border-[#e3e3e3] hover:bg-[#fafafa] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input type="checkbox" className="w-[18px] h-[18px] rounded border-[#8a8a8a] accent-[#303030]" />
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[13px] font-medium text-[#303030]">#{movement.id}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="text-[#303030]">{movement.origin}</span>
                            <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-[#6d6d6d]">{movement.destination}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[13px] text-[#6d6d6d]">{movement.received}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full ${
                            movement.status === 'Draft' ? 'bg-[#ffd79d] text-[#594218]' :
                            movement.status === 'Pending' ? 'bg-[#aee9d1] text-[#1c5e3e]' :
                            'bg-[#a4e8f2] text-[#164a52]'
                          }`}>
                            {movement.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[13px] text-[#6d6d6d]">{movement.createdAt}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {movements.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 mx-auto mb-3 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                    <span className="text-[#8a8a8a]">{Icons.transfer}</span>
                  </div>
                  <p className="text-[#6d6d6d] text-[13px]">No movements yet</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="mt-2 text-[#005bd3] text-[13px] hover:underline"
                  >
                    Create your first movement
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS)
  const [movementCounter, setMovementCounter] = useState(2)

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
    const newMovement: Movement = {
      id: `M${String(movementCounter).padStart(4, '0')}`,
      origin: 'Main Warehouse',
      destination: transfer.location,
      status: 'Pending',
      received: `0 of ${transfer.items.reduce((acc, item) => acc + item.quantity, 0)}`,
      expectedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: transfer.items.map(item => ({ name: item.name, quantity: item.quantity, sku: '' })),
      isNew: true,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setMovementCounter(c => c + 1)

    setTimeout(() => {
      setCurrentPage('movements')
      setTimeout(() => {
        setMovements(prev => [newMovement, ...prev])
      }, 300)
    }, 100)
  }, [movementCounter])

  const handleCreateMovement = useCallback((movement: Movement) => {
    setMovements(prev => [movement, ...prev])
    setMovementCounter(c => c + 1)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[#f1f1f1] font-[var(--font-inter)]">
      <ShopifyHeader onSearchClick={() => setIsCommandKOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        <main className="flex-1 overflow-hidden flex flex-col">
          {currentPage === 'inventory' && <InventoryPage />}
          {currentPage === 'movements' && (
            <MovementsPage
              movements={movements}
              onCreateMovement={handleCreateMovement}
            />
          )}
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
