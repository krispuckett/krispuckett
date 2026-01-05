// ============================================================================
// Age of Empires 2 Style Icons - Medieval themed SVG icons
// ============================================================================

import type { AgentType, BuildingType, AgentStatus } from '@/lib/aoe-types'

// Shared props for all icons
interface IconProps {
  className?: string
  size?: number
}

// ============================================================================
// Resource Icons
// ============================================================================

export const TokenIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size}>
    <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#8B4513" fontWeight="bold">T</text>
  </svg>
)

export const AgentCountIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size}>
    <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" fill="#4A90D9"/>
    <circle cx="18" cy="7" r="3" fill="#4A90D9" opacity="0.6"/>
    <circle cx="6" cy="7" r="3" fill="#4A90D9" opacity="0.6"/>
  </svg>
)

export const TaskIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" fill="#4CAF50"/>
  </svg>
)

// ============================================================================
// Agent (Unit) Icons
// ============================================================================

export const VillagerIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Body */}
    <ellipse cx="16" cy="22" rx="6" ry="8" fill="#8B4513"/>
    {/* Head */}
    <circle cx="16" cy="10" r="6" fill="#DEB887"/>
    {/* Hood/Hat */}
    <path d="M10 10 Q16 2 22 10 Q16 6 10 10" fill="#654321"/>
    {/* Tools on back */}
    <rect x="20" y="14" width="2" height="12" fill="#8B4513" transform="rotate(-20 21 20)"/>
    <rect x="21" y="12" width="5" height="3" fill="#A0A0A0" transform="rotate(-20 23 13)"/>
  </svg>
)

export const ScoutIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Horse body */}
    <ellipse cx="16" cy="20" rx="10" ry="6" fill="#8B4513"/>
    {/* Horse legs */}
    <rect x="8" y="22" width="2" height="8" fill="#654321"/>
    <rect x="22" y="22" width="2" height="8" fill="#654321"/>
    {/* Horse head */}
    <ellipse cx="24" cy="14" rx="4" ry="5" fill="#8B4513"/>
    {/* Rider */}
    <ellipse cx="14" cy="14" rx="3" ry="4" fill="#4169E1"/>
    <circle cx="14" cy="8" r="3" fill="#DEB887"/>
  </svg>
)

export const ArcherIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Body */}
    <ellipse cx="16" cy="22" rx="5" ry="8" fill="#228B22"/>
    {/* Head */}
    <circle cx="16" cy="10" r="5" fill="#DEB887"/>
    {/* Hood */}
    <path d="M11 10 Q16 4 21 10 Q16 7 11 10" fill="#006400"/>
    {/* Bow */}
    <path d="M24 8 Q28 16 24 24" fill="none" stroke="#8B4513" strokeWidth="2"/>
    <line x1="24" y1="8" x2="24" y2="24" stroke="#DEB887" strokeWidth="1"/>
    {/* Arrow */}
    <line x1="16" y1="16" x2="28" y2="16" stroke="#8B4513" strokeWidth="1.5"/>
    <polygon points="28,16 26,14 26,18" fill="#A0A0A0"/>
  </svg>
)

export const KnightIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Horse body */}
    <ellipse cx="16" cy="22" rx="10" ry="6" fill="#2F4F4F"/>
    {/* Horse armor */}
    <ellipse cx="16" cy="21" rx="9" ry="5" fill="#A0A0A0"/>
    {/* Horse head */}
    <ellipse cx="24" cy="15" rx="4" ry="5" fill="#2F4F4F"/>
    <ellipse cx="24" cy="14" rx="3" ry="4" fill="#A0A0A0"/>
    {/* Rider armor */}
    <ellipse cx="14" cy="14" rx="4" ry="5" fill="#A0A0A0"/>
    {/* Helmet */}
    <circle cx="14" cy="7" r="4" fill="#A0A0A0"/>
    <rect x="13" y="3" width="2" height="5" fill="#FFD700"/>
    {/* Lance */}
    <line x1="20" y1="4" x2="28" y2="18" stroke="#8B4513" strokeWidth="2"/>
    <polygon points="28,18 26,16 28,14" fill="#A0A0A0"/>
  </svg>
)

export const MonkIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Robe */}
    <path d="M10 28 L10 14 Q16 8 22 14 L22 28 Z" fill="#8B0000"/>
    {/* Head */}
    <circle cx="16" cy="10" r="5" fill="#DEB887"/>
    {/* Tonsure */}
    <circle cx="16" cy="8" r="3" fill="#654321"/>
    <circle cx="16" cy="7" r="2" fill="#DEB887"/>
    {/* Staff */}
    <line x1="24" y1="6" x2="24" y2="28" stroke="#8B4513" strokeWidth="2"/>
    <circle cx="24" cy="6" r="3" fill="#FFD700"/>
    <path d="M21 6 L24 3 L27 6" fill="none" stroke="#FFD700" strokeWidth="1.5"/>
  </svg>
)

export const SiegeIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Trebuchet base */}
    <rect x="4" y="24" width="24" height="4" fill="#8B4513"/>
    {/* Wheels */}
    <circle cx="8" cy="28" r="3" fill="#654321"/>
    <circle cx="24" cy="28" r="3" fill="#654321"/>
    {/* Frame */}
    <polygon points="16,4 8,24 24,24" fill="none" stroke="#8B4513" strokeWidth="2"/>
    {/* Arm */}
    <line x1="16" y1="8" x2="28" y2="12" stroke="#8B4513" strokeWidth="3"/>
    {/* Counterweight */}
    <rect x="4" y="10" width="6" height="6" fill="#A0A0A0"/>
    {/* Projectile */}
    <circle cx="28" cy="10" r="3" fill="#696969"/>
  </svg>
)

// ============================================================================
// Building Icons
// ============================================================================

export const TownCenterIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Main building */}
    <rect x="4" y="16" width="24" height="14" fill="#8B4513"/>
    {/* Roof */}
    <polygon points="2,16 16,4 30,16" fill="#654321"/>
    {/* Tower left */}
    <rect x="4" y="10" width="6" height="20" fill="#A0522D"/>
    <polygon points="4,10 7,4 10,10" fill="#654321"/>
    {/* Tower right */}
    <rect x="22" y="10" width="6" height="20" fill="#A0522D"/>
    <polygon points="22,10 25,4 28,10" fill="#654321"/>
    {/* Door */}
    <rect x="13" y="22" width="6" height="8" fill="#2F1810"/>
    {/* Windows */}
    <rect x="7" y="18" width="3" height="4" fill="#87CEEB"/>
    <rect x="22" y="18" width="3" height="4" fill="#87CEEB"/>
    {/* Banner */}
    <rect x="15" y="4" width="2" height="8" fill="#8B4513"/>
    <polygon points="17,4 17,8 22,6" fill="#4169E1"/>
  </svg>
)

export const BarracksIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Main building */}
    <rect x="4" y="14" width="24" height="16" fill="#696969"/>
    {/* Roof */}
    <polygon points="2,14 16,6 30,14" fill="#4A4A4A"/>
    {/* Door */}
    <rect x="12" y="20" width="8" height="10" fill="#2F1810"/>
    {/* Crossed swords emblem */}
    <line x1="10" y1="10" x2="22" y2="10" stroke="#C0C0C0" strokeWidth="2"/>
    <line x1="16" y1="6" x2="16" y2="14" stroke="#C0C0C0" strokeWidth="2"/>
    {/* Shield decorations */}
    <ellipse cx="7" cy="18" rx="2" ry="3" fill="#8B0000"/>
    <ellipse cx="25" cy="18" rx="2" ry="3" fill="#8B0000"/>
  </svg>
)

export const StableIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Barn structure */}
    <rect x="4" y="14" width="24" height="16" fill="#8B4513"/>
    {/* Barn roof */}
    <polygon points="0,14 16,4 32,14" fill="#654321"/>
    {/* Large door */}
    <rect x="10" y="18" width="12" height="12" fill="#2F1810"/>
    {/* Door cross beams */}
    <line x1="10" y1="24" x2="22" y2="24" stroke="#4A3728" strokeWidth="2"/>
    <line x1="16" y1="18" x2="16" y2="30" stroke="#4A3728" strokeWidth="2"/>
    {/* Horseshoe emblem */}
    <path d="M14 10 Q16 14 18 10 Q18 8 16 7 Q14 8 14 10" fill="#C0C0C0"/>
  </svg>
)

export const MonasteryIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Main building */}
    <rect x="6" y="16" width="20" height="14" fill="#D4C4A8"/>
    {/* Central tower */}
    <rect x="12" y="6" width="8" height="24" fill="#D4C4A8"/>
    {/* Spire */}
    <polygon points="16,0 12,6 20,6" fill="#8B4513"/>
    {/* Cross */}
    <line x1="16" y1="0" x2="16" y2="5" stroke="#FFD700" strokeWidth="2"/>
    <line x1="14" y1="2" x2="18" y2="2" stroke="#FFD700" strokeWidth="2"/>
    {/* Arched windows */}
    <ellipse cx="16" cy="12" rx="2" ry="3" fill="#87CEEB"/>
    <ellipse cx="10" cy="22" rx="2" ry="3" fill="#87CEEB"/>
    <ellipse cx="22" cy="22" rx="2" ry="3" fill="#87CEEB"/>
  </svg>
)

export const SiegeWorkshopIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Workshop structure */}
    <rect x="2" y="12" width="28" height="18" fill="#4A4A4A"/>
    {/* Sloped roof */}
    <polygon points="0,12 16,4 32,12" fill="#363636"/>
    {/* Large opening */}
    <rect x="8" y="16" width="16" height="14" fill="#1A1A1A"/>
    {/* Gear emblem */}
    <circle cx="16" cy="10" r="3" fill="#8B4513"/>
    <path d="M13 10 L11 10 M19 10 L21 10 M16 7 L16 5 M16 13 L16 15" stroke="#8B4513" strokeWidth="2"/>
    {/* Mini catapult inside */}
    <polygon points="12,26 16,20 20,26" fill="#8B4513"/>
    <circle cx="16" cy="18" r="2" fill="#696969"/>
  </svg>
)

export const CastleIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Main wall */}
    <rect x="4" y="12" width="24" height="18" fill="#808080"/>
    {/* Towers */}
    <rect x="2" y="8" width="6" height="22" fill="#696969"/>
    <rect x="24" y="8" width="6" height="22" fill="#696969"/>
    {/* Battlements */}
    <rect x="2" y="6" width="2" height="4" fill="#696969"/>
    <rect x="6" y="6" width="2" height="4" fill="#696969"/>
    <rect x="24" y="6" width="2" height="4" fill="#696969"/>
    <rect x="28" y="6" width="2" height="4" fill="#696969"/>
    {/* Central tower */}
    <rect x="12" y="4" width="8" height="26" fill="#808080"/>
    <polygon points="16,0 12,4 20,4" fill="#4169E1"/>
    {/* Gate */}
    <path d="M12 30 L12 20 Q16 16 20 20 L20 30" fill="#2F1810"/>
    {/* Portcullis lines */}
    <line x1="14" y1="20" x2="14" y2="30" stroke="#4A4A4A" strokeWidth="1"/>
    <line x1="16" y1="18" x2="16" y2="30" stroke="#4A4A4A" strokeWidth="1"/>
    <line x1="18" y1="20" x2="18" y2="30" stroke="#4A4A4A" strokeWidth="1"/>
  </svg>
)

export const UniversityIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
    {/* Columns */}
    <rect x="6" y="12" width="3" height="16" fill="#D4C4A8"/>
    <rect x="14" y="12" width="4" height="16" fill="#D4C4A8"/>
    <rect x="23" y="12" width="3" height="16" fill="#D4C4A8"/>
    {/* Pediment */}
    <polygon points="4,12 16,4 28,12" fill="#C4B498"/>
    {/* Base */}
    <rect x="4" y="26" width="24" height="4" fill="#A09080"/>
    {/* Book emblem */}
    <rect x="13" y="7" width="6" height="4" fill="#8B4513"/>
    <line x1="16" y1="7" x2="16" y2="11" stroke="#D4C4A8" strokeWidth="1"/>
  </svg>
)

// ============================================================================
// Status Icons
// ============================================================================

export const IdleIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg viewBox="0 0 16 16" className={className} width={size} height={size}>
    <circle cx="8" cy="8" r="6" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
    <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#8B4513" fontWeight="bold">!</text>
  </svg>
)

export const WorkingIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg viewBox="0 0 16 16" className={className} width={size} height={size}>
    <circle cx="8" cy="8" r="6" fill="#4CAF50"/>
    <path d="M6 8 L7 10 L10 6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const AttackingIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg viewBox="0 0 16 16" className={className} width={size} height={size}>
    <circle cx="8" cy="8" r="6" fill="#F44336"/>
    <polygon points="8,4 6,10 8,8 10,10" fill="white"/>
  </svg>
)

// ============================================================================
// Get Icon by Type
// ============================================================================

export function getAgentIcon(type: AgentType, props?: IconProps) {
  const icons: Record<AgentType, React.FC<IconProps>> = {
    villager: VillagerIcon,
    scout: ScoutIcon,
    archer: ArcherIcon,
    knight: KnightIcon,
    monk: MonkIcon,
    siege: SiegeIcon,
  }
  const Icon = icons[type]
  return <Icon {...props} />
}

export function getBuildingIcon(type: BuildingType, props?: IconProps) {
  const icons: Record<BuildingType, React.FC<IconProps>> = {
    'town-center': TownCenterIcon,
    barracks: BarracksIcon,
    'archery-range': BarracksIcon, // Reuse barracks for now
    stable: StableIcon,
    monastery: MonasteryIcon,
    'siege-workshop': SiegeWorkshopIcon,
    castle: CastleIcon,
    university: UniversityIcon,
  }
  const Icon = icons[type]
  return <Icon {...props} />
}

export function getStatusIcon(status: AgentStatus, props?: IconProps) {
  switch (status) {
    case 'idle':
      return <IdleIcon {...props} />
    case 'working':
    case 'moving':
      return <WorkingIcon {...props} />
    case 'attacking':
    case 'defending':
      return <AttackingIcon {...props} />
    default:
      return null
  }
}
