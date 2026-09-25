import type { GuestType, RoomType, ViewType } from '../domain/game'

type IllustrationProps = {
  className?: string
}

export function HotelMark({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Hotel mark">
      <path d="M12 54V26l20-12 20 12v28" fill="#f6b85b" stroke="#7b4b2a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 54h48" stroke="#7b4b2a" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 54V38h16v16" fill="#fff3d2" stroke="#7b4b2a" strokeWidth="3" />
      <path d="M19 28h5v5h-5zM40 28h5v5h-5z" fill="#fff3d2" stroke="#7b4b2a" strokeWidth="2" />
      <path d="M26 18h12" stroke="#fff3d2" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function HotelScene({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 420 220" role="img" aria-label="Cozy hotel scene">
      <defs>
        <linearGradient id="hotel-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffe5b5" />
          <stop offset="1" stopColor="#f8b98b" />
        </linearGradient>
      </defs>
      <rect width="420" height="220" rx="28" fill="url(#hotel-sky)" />
      <circle cx="330" cy="52" r="25" fill="#fff3c9" opacity=".9" />
      <path d="M0 176c58-36 92-25 142-4 54 22 98 20 148-2 44-19 84-15 130 8v42H0z" fill="#7eb89b" />
      <path d="M74 178V86l74-42 76 42v92" fill="#f7d19a" stroke="#7b4b2a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M64 88h172l-12-14H76z" fill="#e98d6d" stroke="#7b4b2a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M100 178v-42h98v42" fill="#fff3d2" stroke="#7b4b2a" strokeWidth="4" />
      <path d="M118 108h16v16h-16zM184 108h16v16h-16z" fill="#a9d6cf" stroke="#7b4b2a" strokeWidth="3" />
      <path d="M92 178h136" stroke="#7b4b2a" strokeWidth="4" strokeLinecap="round" />
      <path d="M268 178v-52c0-33 24-56 56-56s56 23 56 56v52" fill="#f9c784" stroke="#7b4b2a" strokeWidth="4" />
      <path d="M286 128h20v20h-20zM342 128h20v20h-20z" fill="#a9d6cf" stroke="#7b4b2a" strokeWidth="3" />
      <path d="M258 178h124" stroke="#7b4b2a" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 178c8-22 17-22 25 0M58 178c8-22 17-22 25 0" fill="none" stroke="#4b8b6f" strokeWidth="5" strokeLinecap="round" />
      <path d="M18 190h384" stroke="#4b8b6f" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function RoomArt({ type, view, className }: IllustrationProps & { type: RoomType; view: ViewType }) {
  const accent = type === 'deluxe' ? '#c98b5b' : '#8fb9a8'
  return (
    <svg className={className} viewBox="0 0 160 120" role="img" aria-label={`${type} ${view} room`}>
      <rect width="160" height="120" rx="20" fill="#fff3dc" />
      <rect x="14" y="16" width="132" height="88" rx="14" fill={view === 'sea' ? '#bfe4e0' : '#d7e2c4'} />
      <path d="M14 74c28-16 46-12 66 2 20 14 40 12 66-4v32H14z" fill={view === 'sea' ? '#6fb8bd' : '#a7c48c'} />
      <path d="M24 96h112" stroke="#7b4b2a" strokeWidth="4" strokeLinecap="round" />
      <rect x="28" y="56" width="52" height="32" rx="8" fill={accent} stroke="#7b4b2a" strokeWidth="3" />
      <rect x="36" y="50" width="20" height="14" rx="6" fill="#fff8e7" stroke="#7b4b2a" strokeWidth="2" />
      <rect x="94" y="62" width="34" height="26" rx="7" fill="#f4b183" stroke="#7b4b2a" strokeWidth="3" />
      {type === 'deluxe' && <path d="M102 62v26M94 74h34" stroke="#fff3dc" strokeWidth="3" />}
    </svg>
  )
}

export function GuestAvatar({ type, className }: IllustrationProps & { type: GuestType }) {
  const shirt = type === 'business' ? '#6d8fb3' : type === 'family' ? '#e58d72' : type === 'couple' ? '#c887ac' : type === 'tourist' ? '#77b7a1' : '#e6b45f'
  const skin = '#f6c9a5'
  return (
    <svg className={className} viewBox="0 0 80 80" role="img" aria-label={`${type} guest`}>
      <circle cx="40" cy="40" r="38" fill="#fff0cf" />
      <circle cx="40" cy="31" r="14" fill={skin} stroke="#7b4b2a" strokeWidth="3" />
      <path d="M16 70c3-17 12-25 24-25s21 8 24 25" fill={shirt} stroke="#7b4b2a" strokeWidth="3" />
      <circle cx="34" cy="30" r="2" fill="#7b4b2a" />
      <circle cx="46" cy="30" r="2" fill="#7b4b2a" />
      <path d="M35 38c4 3 7 3 10 0" fill="none" stroke="#7b4b2a" strokeWidth="2" strokeLinecap="round" />
      {type === 'couple' && <path d="M25 25c4-8 11-10 15-3 4-7 11-5 15 3" fill="#e98d6d" stroke="#7b4b2a" strokeWidth="2" />}
      {type === 'family' && <circle cx="25" cy="51" r="6" fill="#f6c9a5" stroke="#7b4b2a" strokeWidth="2" />}
      {type === 'business' && <path d="M34 18h12l-2 8H36z" fill="#6d8fb3" stroke="#7b4b2a" strokeWidth="2" />}
      {type === 'solo' && <path d="M27 19c3-8 23-8 26 0" fill="#e6b45f" stroke="#7b4b2a" strokeWidth="2" />}
    </svg>
  )
}
