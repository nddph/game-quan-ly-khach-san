export type GuestType = 'solo' | 'tourist' | 'business' | 'family' | 'couple'
export type RoomType = 'standard' | 'deluxe'
export type ViewType = 'city' | 'sea'
export type RoomState = 'Available' | 'Reserved' | 'Occupied' | 'NeedsCleaning' | 'Maintenance' | 'Locked'
export type GuestState = 'ConsideringOffer' | 'Reserved' | 'CheckedIn' | 'Staying' | 'WaitingCheckout' | 'ReviewCompleted' | 'Declined' | 'Expired' | 'Cancelled'
export type OfferStatus = 'Proposed' | 'Negotiating' | 'Accepted' | 'Rejected' | 'Expired'
export type ReservationStatus = 'Held' | 'CheckedIn' | 'Completed' | 'Cancelled'
export type StayStatus = 'Active' | 'AwaitingCheckout' | 'Completed'
export type RequirementKind = 'required' | 'preferred' | 'optional'
export type RoomFeature = 'wifi_standard' | 'wifi_good' | 'desk' | 'balcony' | 'kitchenette' | 'bathtub' | 'sofa' | 'quiet'

export type PersistenceMode = 'opfs' | 'sqlite-memory' | 'local-fallback'

export const MAX_CATCH_UP_MINUTES = 24 * 60

export interface Room {
  id: string
  number: number
  type: RoomType
  view: ViewType
  size: number
  adultCapacity: number
  childCapacity: number
  capacity: number
  extraBedAvailable: boolean
  extraBedFeeVND: number
  quality: number
  condition: number
  features: RoomFeature[]
  basePriceVND: number
  state: RoomState
  guestId?: string
}

export interface GuestRequirement {
  id: string
  label: string
  kind: RequirementKind
  feature?: RoomFeature
  view?: ViewType
  minCondition?: number
}

export interface FinancialSummary {
  day: number
  revenueVND: number
  operatingCostVND: number
  taxVND: number
  compensationVND: number
  repairVND: number
  waivedVND: number
  netCashChangeVND: number
  takeHomeVND: number
}

export interface Guest {
  id: string
  type: GuestType
  partyAdults: number
  partyChildren: number
  nights: number
  purpose: string
  dialogue: string
  arrivedAtGameMinute: number
  decisionDeadlineGameMinute: number
  budgetMinVND: number
  budgetMaxVND: number
  requirements: GuestRequirement[]
  state: GuestState
  roomId?: string
  nightsCompleted: number
  satisfaction: number
  rejectionCount: number
  lastEvent: string
}

export interface Offer {
  id: string
  guestId: string
  roomId: string
  nightlyRateVND: number
  extraBed: boolean
  status: OfferStatus
  counterRateVND?: number
}

export interface Reservation {
  id: string
  offerId: string
  guestId: string
  roomId: string
  checkInDay: number
  checkOutDay: number
  nightlyRateVND: number
  extraBed: boolean
  status: ReservationStatus
}

export interface Stay {
  id: string
  reservationId: string
  guestId: string
  roomId: string
  nightsCompleted: number
  status: StayStatus
  checkoutRequestedGameMinute?: number
}

export interface PaymentRecord {
  id: string
  guestId: string
  roomId: string
  stayId: string
  day: number
  paidAtGameMinute?: number
  roomChargeVND: number
  extraChargesVND: number
  waivedVND: number
  extraChargesNote: string
  totalVND: number
}

export type ServiceChargeKind = 'minibar' | 'room_service' | 'laundry' | 'tour_desk'
export type ServiceChargeStatus = 'Pending' | 'Paid' | 'Waived' | 'Forced'

export interface ServiceCharge {
  id: string
  stayId: string
  guestId: string
  roomId: string
  kind: ServiceChargeKind
  amountVND: number
  note: string
  guestWillingToPay: boolean
  status: ServiceChargeStatus
  resolvedDay?: number
}

export interface Review {
  id: string
  guestId: string
  guestType: GuestType
  roomId: string
  day: number
  rating: number
  text: string
  reasons: string[]
  reply?: string
  repliedDay?: number
}

export interface CompensationRequest {
  id: string
  guestId: string
  roomId: string
  stayId: string
  amountVND: number
  reason: string
  status: 'Pending' | 'Paid' | 'Declined'
}

export interface GameState {
  version: 1
  hotelName: string
  locationName: string
  day: number
  minuteOfDay: number
  timeScale: number
  cashVND: number
  reputation: number
  reviewCount: number
  totalRevenueVND: number
  totalCostsVND: number
  taxPaidVND: number
  rooms: Room[]
  guests: Guest[]
  offers: Offer[]
  reservations: Reservation[]
  stays: Stay[]
  payments: PaymentRecord[]
  serviceCharges: ServiceCharge[]
  reviews: Review[]
  compensationRequests: CompensationRequest[]
  lastSettlement: FinancialSummary | null
  arrivedSlots: string[]
  lastClosedDay: number
  lastSettledGameMinute: number
  lastEvent: string
  lastSavedAt: number
}

export interface SaveSnapshot {
  state: GameState
  checkpointId: string
  savedAt: number
}

export interface SuitabilityResult {
  eligible: boolean
  score: number
  positiveReasons: string[]
  negativeReasons: string[]
  blockingReason?: string
}

export interface PriceEvaluation {
  outcome: 'accept' | 'negotiate' | 'reject'
  fairPriceVND: number
  maximumPriceVND: number
  counterRateVND?: number
  reason: string
}

const guestsByType: Record<GuestType, { purpose: string; budget: [number, number]; requirements: GuestRequirement[] }> = {
  solo: {
    purpose: 'Đi công tác ngắn ngày',
    budget: [420_000, 780_000],
    requirements: [
      { id: 'clean', label: 'Phòng sạch', kind: 'required', minCondition: 78 },
      { id: 'wifi_good', label: 'WiFi tốt', kind: 'required', feature: 'wifi_good' },
      { id: 'quiet', label: 'Không gian yên tĩnh', kind: 'preferred', feature: 'quiet' },
      { id: 'sofa', label: 'Chỗ nghỉ thoải mái', kind: 'optional', feature: 'sofa' },
    ],
  },
  tourist: {
    purpose: 'Nghỉ dưỡng và tham quan',
    budget: [520_000, 1_050_000],
    requirements: [
      { id: 'clean', label: 'Phòng sạch', kind: 'required', minCondition: 75 },
      { id: 'sea_view', label: 'View biển', kind: 'preferred', view: 'sea' },
      { id: 'balcony', label: 'Ban công', kind: 'preferred', feature: 'balcony' },
      { id: 'bathtub', label: 'Bồn tắm', kind: 'optional', feature: 'bathtub' },
    ],
  },
  business: {
    purpose: 'Họp và làm việc tại Đà Nẵng',
    budget: [600_000, 1_250_000],
    requirements: [
      { id: 'desk', label: 'Bàn làm việc', kind: 'required', feature: 'desk' },
      { id: 'wifi_good', label: 'WiFi ổn định', kind: 'required', feature: 'wifi_good' },
      { id: 'quiet', label: 'Phòng yên tĩnh', kind: 'required', feature: 'quiet' },
      { id: 'city_view', label: 'View thành phố', kind: 'preferred', view: 'city' },
    ],
  },
  family: {
    purpose: 'Gia đình đi nghỉ cùng nhau',
    budget: [780_000, 1_700_000],
    requirements: [
      { id: 'kitchenette', label: 'Khu bếp nhỏ', kind: 'preferred', feature: 'kitchenette' },
      { id: 'space', label: 'Không gian rộng', kind: 'required' },
      { id: 'clean', label: 'Phòng sạch', kind: 'required', minCondition: 76 },
      { id: 'sofa', label: 'Chỗ ngồi cho gia đình', kind: 'preferred', feature: 'sofa' },
    ],
  },
  couple: {
    purpose: 'Kỷ niệm ngày yêu nhau',
    budget: [850_000, 1_900_000],
    requirements: [
      { id: 'sea_view', label: 'View biển', kind: 'required', view: 'sea' },
      { id: 'balcony', label: 'Ban công riêng tư', kind: 'preferred', feature: 'balcony' },
      { id: 'bathtub', label: 'Bồn tắm thư giãn', kind: 'preferred', feature: 'bathtub' },
      { id: 'quiet', label: 'Riêng tư và yên tĩnh', kind: 'preferred', feature: 'quiet' },
    ],
  },
}

const featureLabels: Record<RoomFeature, string> = {
  wifi_standard: 'WiFi tiêu chuẩn',
  wifi_good: 'WiFi tốt',
  desk: 'Bàn làm việc',
  balcony: 'Ban công',
  kitchenette: 'Bếp nhỏ',
  bathtub: 'Bồn tắm',
  sofa: 'Sofa',
  quiet: 'Yên tĩnh',
}

export const getFeatureLabel = (feature: RoomFeature): string => featureLabels[feature]

const guestTypeLabels: Record<GuestType, string> = {
  solo: 'Solo',
  tourist: 'Du lịch',
  business: 'Công tác',
  family: 'Gia đình',
  couple: 'Đôi',
}

export const getGuestTypeLabel = (type: GuestType): string => guestTypeLabels[type]

export const getRoomTypeLabel = (type: RoomType): string => type === 'standard' ? 'Standard' : 'Deluxe'

export const getViewLabel = (view: ViewType): string => view === 'city' ? 'View thành phố' : 'View biển'

export const formatVnd = (amount: number, locale = 'vi-VN'): string =>
  `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} ₫`

export const formatGameTime = (minuteOfDay: number): string => {
  const hours = Math.floor(minuteOfDay / 60) % 24
  const minutes = Math.floor(minuteOfDay % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const advanceGameClock = (state: GameState, realElapsedMs: number, maxGameMinutes = Number.POSITIVE_INFINITY): GameState => {
  const requestedGameMinutes = Math.max(0, (realElapsedMs / 60_000) * state.timeScale)
  const gameMinutes = Math.min(requestedGameMinutes, maxGameMinutes)
  const totalMinutes = state.minuteOfDay + gameMinutes
  const dayOffset = Math.floor(totalMinutes / (24 * 60))
  const roundedMinuteOfDay = Math.round((totalMinutes % (24 * 60)) * 100) / 100
  return {
    ...state,
    day: state.day + dayOffset,
    minuteOfDay: roundedMinuteOfDay,
  }
}

const createRooms = (): Room[] => [
  { id: 'room-101', number: 101, type: 'standard', view: 'city', size: 22, adultCapacity: 2, childCapacity: 1, capacity: 2, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 68, condition: 88, features: ['wifi_good', 'desk', 'quiet'], basePriceVND: 620_000, state: 'Available' },
  { id: 'room-102', number: 102, type: 'standard', view: 'city', size: 24, adultCapacity: 2, childCapacity: 1, capacity: 2, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 72, condition: 82, features: ['wifi_good', 'desk', 'quiet', 'sofa'], basePriceVND: 650_000, state: 'Available' },
  { id: 'room-103', number: 103, type: 'standard', view: 'sea', size: 23, adultCapacity: 2, childCapacity: 1, capacity: 2, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 70, condition: 90, features: ['wifi_good', 'balcony', 'quiet'], basePriceVND: 700_000, state: 'Available' },
  { id: 'room-104', number: 104, type: 'standard', view: 'sea', size: 28, adultCapacity: 2, childCapacity: 2, capacity: 4, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 74, condition: 84, features: ['wifi_good', 'balcony', 'kitchenette', 'sofa', 'quiet'], basePriceVND: 760_000, state: 'Available' },
  { id: 'room-105', number: 105, type: 'standard', view: 'city', size: 21, adultCapacity: 2, childCapacity: 1, capacity: 2, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 66, condition: 78, features: ['wifi_standard', 'desk'], basePriceVND: 560_000, state: 'Available' },
  { id: 'room-106', number: 106, type: 'standard', view: 'sea', size: 22, adultCapacity: 2, childCapacity: 1, capacity: 2, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 69, condition: 86, features: ['wifi_good', 'quiet', 'sofa'], basePriceVND: 680_000, state: 'Available' },
  { id: 'room-107', number: 107, type: 'standard', view: 'city', size: 25, adultCapacity: 2, childCapacity: 2, capacity: 4, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 73, condition: 91, features: ['wifi_good', 'desk', 'quiet', 'sofa'], basePriceVND: 690_000, state: 'Available' },
  { id: 'room-108', number: 108, type: 'standard', view: 'sea', size: 29, adultCapacity: 2, childCapacity: 2, capacity: 4, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 75, condition: 80, features: ['wifi_good', 'balcony', 'kitchenette', 'sofa'], basePriceVND: 780_000, state: 'Available' },
  { id: 'room-201', number: 201, type: 'deluxe', view: 'city', size: 32, adultCapacity: 4, childCapacity: 1, capacity: 4, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 82, condition: 92, features: ['wifi_good', 'desk', 'bathtub', 'sofa', 'quiet'], basePriceVND: 980_000, state: 'Available' },
  { id: 'room-202', number: 202, type: 'deluxe', view: 'city', size: 35, adultCapacity: 4, childCapacity: 1, capacity: 4, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 84, condition: 87, features: ['wifi_good', 'desk', 'bathtub', 'sofa', 'quiet'], basePriceVND: 1_050_000, state: 'Available' },
  { id: 'room-203', number: 203, type: 'deluxe', view: 'sea', size: 34, adultCapacity: 6, childCapacity: 2, capacity: 6, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 86, condition: 94, features: ['wifi_good', 'balcony', 'bathtub', 'sofa', 'quiet'], basePriceVND: 1_150_000, state: 'Available' },
  { id: 'room-204', number: 204, type: 'deluxe', view: 'sea', size: 38, adultCapacity: 6, childCapacity: 2, capacity: 6, extraBedAvailable: true, extraBedFeeVND: 150_000, quality: 88, condition: 90, features: ['wifi_good', 'balcony', 'kitchenette', 'bathtub', 'sofa', 'quiet'], basePriceVND: 1_250_000, state: 'Available' },
]

const cloneRequirements = (type: GuestType): GuestRequirement[] => guestsByType[type].requirements.map((requirement) => ({ ...requirement }))

const dialogues: Record<GuestType, string> = {
  solo: 'Hôm nay tôi đến đây một mình, cần một chỗ nghỉ yên và giá hợp lý.',
  tourist: 'Chúng tôi muốn nghỉ ngơi và ngắm view, bạn có phòng nào hợp với chúng tôi không?',
  business: 'Tôi đến Đà Nẵng đi công tác, cần chỗ làm việc và WiFi ổn định.',
  family: 'Chúng tôi là gia đình đi cùng nhau, cần phòng rộng và thuận tiện cho các bé.',
  couple: 'Chúng tôi muốn tận hưởng chuyến đi lãng mạn, phòng yên tĩnh và có view đẹp.',
}

const createGuest = (state: GameState, type: GuestType, index: number): Guest => {
  const profile = guestsByType[type]
  const familyMultiplier = type === 'family' ? 1.18 : 1
  const weekendMultiplier = state.minuteOfDay >= 17 * 60 ? 1.12 : 1
  return {
    id: `guest-${state.day}-${index}-${crypto.randomUUID()}`,
    type,
    partyAdults: type === 'family' ? 2 : 1,
    partyChildren: type === 'family' ? 1 : 0,
    nights: type === 'business' ? 3 : type === 'couple' ? 2 : type === 'family' ? 3 : 2,
    purpose: profile.purpose,
    dialogue: dialogues[type],
    arrivedAtGameMinute: state.day * 24 * 60 + state.minuteOfDay,
    decisionDeadlineGameMinute: state.day * 24 * 60 + state.minuteOfDay + 90,
    budgetMinVND: Math.round(profile.budget[0] * familyMultiplier),
    budgetMaxVND: Math.round(profile.budget[1] * familyMultiplier * weekendMultiplier),
    requirements: cloneRequirements(type),
    state: 'ConsideringOffer',
    nightsCompleted: 0,
    satisfaction: 78,
    rejectionCount: 0,
    lastEvent: 'Khách vừa đến sảnh khách sạn',
  }
}

const arrivalSlots = [8 * 60, 9 * 60, 12 * 60, 17 * 60, 20 * 60]
const guestCycle: GuestType[] = ['solo', 'business', 'tourist', 'couple', 'family']

export const processArrivals = (state: GameState): GameState => {
  const next = structuredClone(state)
  let changed = false
  const currentGameMinute = next.day * 24 * 60 + next.minuteOfDay

  next.guests.forEach((guest) => {
    if (guest.state === 'ConsideringOffer' && currentGameMinute >= guest.decisionDeadlineGameMinute) {
      guest.state = 'Expired'
      guest.lastEvent = 'Khách đã chờ quá lâu và rời khách sạn'
      next.reviews.push({
        id: `review-timeout-${crypto.randomUUID()}`,
        guestId: guest.id,
        guestType: guest.type,
        roomId: '',
        day: next.day,
        rating: 1,
        text: 'Khách đã chờ quá lâu ở sảnh và rời đi với trải nghiệm không tốt.',
        reasons: ['wait_timeout'],
      })
      next.reputation = Math.max(0, next.reputation - 4)
      next.reviewCount += 1
      next.lastEvent = `${getGuestTypeLabel(guest.type)} đã chờ quá lâu và đánh giá 1 sao`
      changed = true
    }
  })

  const overdueStays = next.stays.filter((stay) => {
    if (stay.status !== 'AwaitingCheckout' || typeof stay.checkoutRequestedGameMinute !== 'number') {
      return false
    }
    return currentGameMinute - stay.checkoutRequestedGameMinute >= 24 * 60
  })
  overdueStays.forEach((stay) => {
    const guest = next.guests.find((item) => item.id === stay.guestId)
    const charge = next.serviceCharges.find((item) => item.stayId === stay.id && item.status === 'Pending')
    const settled = checkoutGuest(next, stay.id, charge?.guestWillingToPay ? 'collect' : 'waive')
    const review = settled.reviews[settled.reviews.length - 1]
    if (review) {
      review.rating = Math.min(review.rating, 3)
      review.text = `${review.text} Khách phải tự xếp hành lý và tự thanh toán vì quầy lễ tân phản hồi quá chậm.`
      review.reasons.push('checkout_delay')
    }
    settled.reputation = Math.max(0, settled.reputation - 3)
    settled.lastEvent = `${guest ? getGuestTypeLabel(guest.type) : 'Khách'} không chờ được và đã tự thanh toán`
    Object.assign(next, settled)
    changed = true
  })

  arrivalSlots.forEach((minute, index) => {
    const slotId = `${next.day}-${index}`
    if (next.minuteOfDay < minute || next.arrivedSlots.includes(slotId)) {
      return
    }
    const activeGuests = next.guests.filter((guest) => !['Declined', 'Expired', 'ReviewCompleted', 'Cancelled'].includes(guest.state)).length
    if (activeGuests >= 8) {
      return
    }
    const type = guestCycle[(next.day + index) % guestCycle.length]
    next.guests.push(createGuest(next, type, index))
    next.arrivedSlots.push(slotId)
    next.lastEvent = `Có khách ${getGuestTypeLabel(type)} mới đến`
    changed = true
  })
  return changed ? next : state
}

export const getActiveGuests = (state: GameState): Guest[] => (Array.isArray(state.guests) ? state.guests : []).filter((guest) => !['Declined', 'Expired', 'ReviewCompleted', 'Cancelled'].includes(guest.state))

export const getAvailableRooms = (state: GameState): Room[] => (Array.isArray(state.rooms) ? state.rooms : []).filter((room) => room.state === 'Available')

const hasFeature = (room: Room, feature: RoomFeature): boolean => room.features.includes(feature)

const meetsRequirement = (room: Room, requirement: GuestRequirement): boolean => {
  if (requirement.feature && !hasFeature(room, requirement.feature)) {
    return false
  }
  if (requirement.view && room.view !== requirement.view) {
    return false
  }
  if (requirement.minCondition && room.condition < requirement.minCondition) {
    return false
  }
  if (requirement.id === 'space' && room.size < 26) {
    return false
  }
  return true
}

export const evaluateRoom = (guest: Guest, room: Room, extraBed = false): SuitabilityResult => {
  const partySize = guest.partyAdults + guest.partyChildren
  const effectiveCapacity = room.capacity + (extraBed && room.extraBedAvailable ? 1 : 0)
  if (partySize > effectiveCapacity) {
    return { eligible: false, score: 0, positiveReasons: [], negativeReasons: [], blockingReason: 'Phòng không đủ sức chứa' }
  }

  const blockingRequirement = guest.requirements.find((requirement) => requirement.kind === 'required' && !meetsRequirement(room, requirement))
  if (blockingRequirement) {
    return { eligible: false, score: 0, positiveReasons: [], negativeReasons: [blockingRequirement.label], blockingReason: `Thiếu: ${blockingRequirement.label}` }
  }

  let totalWeight = 0
  let earnedWeight = 0
  const positiveReasons: string[] = []
  const negativeReasons: string[] = []

  guest.requirements.forEach((requirement) => {
    const weight = requirement.kind === 'required' ? 3 : requirement.kind === 'preferred' ? 1.5 : 0.5
    totalWeight += weight
    if (meetsRequirement(room, requirement)) {
      earnedWeight += weight
      positiveReasons.push(requirement.label)
    } else if (requirement.kind !== 'required') {
      negativeReasons.push(requirement.label)
    }
  })

  const qualityBonus = Math.min(10, Math.max(0, room.quality - 70) / 3)
  const conditionPenalty = Math.max(0, 80 - room.condition) / 4
  const score = Math.round(Math.max(0, Math.min(100, (totalWeight === 0 ? 100 : (earnedWeight / totalWeight) * 100) + qualityBonus - conditionPenalty)))

  return { eligible: true, score, positiveReasons, negativeReasons }
}

export const evaluatePrice = (guest: Guest, room: Room, nightlyRateVND: number, extraBed = false): PriceEvaluation => {
  const fit = evaluateRoom(guest, room, extraBed)
  const fairPriceVND = Math.round(room.basePriceVND * (0.86 + room.condition / 500) + (extraBed ? room.extraBedFeeVND : 0))
  const perceivedValueVND = Math.round(fairPriceVND * (0.62 + (fit.score / 100) * 0.38))
  const tolerance = guest.type === 'couple' ? 1.14 : guest.type === 'business' ? 1.1 : guest.type === 'tourist' ? 1.06 : 1
  const maximumPriceVND = Math.min(guest.budgetMaxVND, Math.round(fairPriceVND * 1.25), Math.round(perceivedValueVND * tolerance))

  if (!fit.eligible) {
    return { outcome: 'reject', fairPriceVND, maximumPriceVND, reason: fit.blockingReason ?? 'Phòng không phù hợp' }
  }
  if (nightlyRateVND <= maximumPriceVND && fit.score >= 55) {
    return { outcome: 'accept', fairPriceVND, maximumPriceVND, reason: 'Giá nằm trong mức khách sẵn sàng chi trả' }
  }
  if (nightlyRateVND <= guest.budgetMaxVND && fit.score >= 70) {
    return { outcome: 'negotiate', fairPriceVND, maximumPriceVND, counterRateVND: maximumPriceVND, reason: 'Khách thấy phòng hợp với nhưng muốn thương lượng' }
  }
  return { outcome: 'reject', fairPriceVND, maximumPriceVND, reason: 'Giá chưa hợp lý với ngân sách và giá trị phòng' }
}

const reviewOpeners: Record<GuestType, string[]> = {
  solo: ['Tôi cảm thấy chuyến ở một mình khá thoải mái.', 'Quản lý có phản hồi nhanh và dễ trao đổi.', 'Chuyến lưu trú ngắn của tôi diễn ra đúng như kế hoạch.'],
  tourist: ['Chuyến nghỉ của chúng tôi khá đáng nhớ.', 'Vị trí khách sạn rất thuận tiện cho việc đi tham quan.', 'Chúng tôi đã ghé khách sạn nhiều lần và lần này không phải ngoại lệ.'],
  business: ['Tôi đến đây để làm việc và cần một nơi ổn định.', 'Phòng đáp ứng tốt cho các buổi họp.', 'Lịch làm việc của tôi khá kín nên mọi tiện nghi đều có giá trị.'],
  family: ['Cả gia đình chúng tôi đều cảm thấy dễ chịu khi ở đây.', 'Không gian phòng phù hợp cho chuyến đi cùng bé.', 'Các bé nhà tôi thích ở khách sạn hơn cả nhà.'],
  couple: ['Chúng tôi muốn một kỷ niệm lãng mạn và đã có trải nghiệm ấm áp.', 'Buổi lưu trú của chúng tôi khá riêng tư.', 'Đây là kỷ niệm đáng nhớ của chúng tôi.'],
}

const reviewPositives: Record<GuestType, string[]> = {
  solo: ['Phòng yên tĩnh, WiFi ổn định và giá hợp lý.', 'Nhân viên không làm phiền nhưng vẫn sẵn sàng hỗ trợ.', 'Thời gian nhận phòng nhanh và dễ thao tác.'],
  tourist: ['View đẹp, phòng sạch và nhân viên chú ý khách.', 'Giá tốt so với trải nghiệm nhận được.', 'Bãi xe và khu vực xung quanh rất tiện.'],
  business: ['Bàn làm việc, WiFi tốt và không gian đủ yên tĩnh.', 'Vị trí thuận tiện cho lịch làm việc.', 'Dịch vụ nhận phòng diễn ra nhanh gọn.'],
  family: ['Phòng rộng, tiện nghi hữu ích và nhân viên thân thiện.', 'Gia đình chúng tôi cảm thấy được chăm sóc chu đáo.', 'Bữa sáng và khu vực sinh hoạt chung rất hợp lý.'],
  couple: ['Không gian riêng tư, view đẹp và phòng ấm áp.', 'Mọi chi tiết đều tạo cảm giác nghỉ dưỡng thư giãn.', 'Buổi tối ở đây rất dễ chịu.'],
}

const reviewCritiques: Record<GuestType, string[]> = {
  solo: ['Tôi mong phòng được bảo trì tốt hơn.', 'Có một vài thiết bị trong phòng cần cập nhật.', 'Quầy lễ tân hơi bận nên tôi chờ lâu hơn mong đợi.'],
  tourist: ['Phòng cần được vệ sinh kỹ hơn.', 'Một số tiện nghi tôi mong đợi chưa có.', 'Việc dọn phòng diễn ra chậm hơn giờ dự kiến.'],
  business: ['Tiếng ồn vào buổi tối ảnh hưởng đến công việc.', 'Tôi cần phòng được bảo trì thường xuyên hơn.', 'Thiết bị trong phòng hơi cũ so với giá.'],
  family: ['Phòng xuống cấp khiến gia đình không thoải mái.', 'Khu vực lối đi chưa thuận tiện cho các bé.', 'Nhiệt độ phòng chưa ổn định khi có bé.'],
  couple: ['View bị che bởi một phần và không đúng như kỳ vọng.', 'Chúng tôi cần thêm sự riêng tư cho buổi tối.', 'Ánh sáng phòng hơi tối vào một số thời điểm.'],
}

const reviewNotes: Record<GuestType, string[]> = {
  solo: ['Tôi sẽ quay lại khi đi công tác lần sau.', 'Tỷ lệ giá phòng và chất lượng ở mức chấp nhận được.', 'Trải nghiệm tốt cho khách đi một mình.'],
  tourist: ['Rất đáng để ở thêm vài đêm nữa.', 'Nhân viên tư vấn khá nhiệt tình.', 'Khu vực xung quanh có nhiều lựa chọn ăn uống.'],
  business: ['Tôi sẽ đặt phòng này lần sau.', 'Phù hợp với khách đi công tác ngắn ngày.', 'Giá hợp lý cho khách doanh nghiệp.'],
  family: ['Các bé rất muốn ở thêm.', 'Phòng đáp ứng tốt với gia đình bốn người.', 'Nhân viên có thể đưa thêm gối cho trẻ nhỏ khi cần.'],
  couple: ['Chúng tôi đã chụp ảnh kỷ niệm ở đây.', 'Thời điểm nhận phòng thuận lợi cho chuyến đi của chúng tôi.', 'Đáng để quay lại vào kỳ nghỉ tới.'],
}

const createReview = (guest: Guest, room: Room, day: number, variantSeed = 0): Review => {
  const rating = guest.satisfaction >= 90 ? 5 : guest.satisfaction >= 78 ? 4 : guest.satisfaction >= 62 ? 3 : guest.satisfaction >= 45 ? 2 : 1
  const variant = Math.abs(day * 7 + room.number * 3 + guest.nights * 5 + variantSeed) % 3
  const opener = reviewOpeners[guest.type][variant]
  const positive = reviewPositives[guest.type][variant]
  const critique = reviewCritiques[guest.type][variant]
  const note = reviewNotes[guest.type][variant]
  const conditionNote = room.condition >= 85 ? ' Phòng được bảo trì tốt khi nhận phòng.' : room.condition >= 60 ? ' Phòng cần được bảo trì thêm một chút.' : ' Phòng xuống cấp rõ rệt vào cuối lưu trú.'
  const valueNote = guest.satisfaction >= 85 ? '' : ' Giá phòng chưa tương xứng hoàn toàn với trải nghiệm.'
  const text = rating >= 4 ? `${opener} ${positive}${note}${conditionNote}` : rating === 3 ? `${opener} ${positive} ${critique}${conditionNote}${valueNote}` : `${opener} ${critique}${conditionNote}${valueNote}`
  const reasons = [getRoomTypeLabel(room.type), getViewLabel(room.view)]
  if (room.condition < 60) reasons.push('room_condition')
  if (guest.satisfaction < 70) reasons.push('stay_value')
  if (room.condition < 40) reasons.push('maintenance_needed')
  if (rating >= 4) reasons.push('good_stay')
  return {
    id: `review-${day}-${crypto.randomUUID()}`,
    guestId: guest.id,
    guestType: guest.type,
    roomId: room.id,
    day,
    rating,
    text,
    reasons,
  }
}

const serviceChargeTemplates: { kind: ServiceChargeKind; weight: number; notes: string[]; min: number; max: number; step: number }[] = [
  {
    kind: 'minibar',
    weight: 34,
    min: 90_000,
    max: 460_000,
    step: 10_000,
    notes: [
      'Minibar: 2 chai nước suối, 1 hộp sữa và 2 gói snack.',
      'Minibar: 1 chai rượu vang nhỏ và 1 đĩa phô mai.',
      'Minibar: 3 lon nước ngọt và 1 gói bánh quy.',
      'Minibar: 1 bộ chè đá và 2 hộp nước trái cây.',
    ],
  },
  {
    kind: 'room_service',
    weight: 30,
    min: 180_000,
    max: 640_000,
    step: 20_000,
    notes: [
      'Ăn uống tại phòng: 2 phần cơm nhà và 1 phần canh.',
      'Ăn uống tại phòng: bữa sáng cho 2 người và cà phê.',
      'Đồ ăn đêm: 1 phần mì và 2 ly nước mía.',
      'Bữa tối phục vụ tại phòng cho cả nhóm khách.',
    ],
  },
  {
    kind: 'laundry',
    weight: 20,
    min: 120_000,
    max: 340_000,
    step: 10_000,
    notes: [
      'Giặt ủi: 4 áo, 2 quần và 1 bộ vest.',
      'Giặt nhanh 4 giờ cho 3 bộ đồ.',
      'Ủi hấp một bộ đồ trắng và 2 váy.',
    ],
  },
  {
    kind: 'tour_desk',
    weight: 16,
    min: 150_000,
    max: 520_000,
    step: 10_000,
    notes: [
      'Đặt tour: vé tham quan Hòn Ngọc và vé cầu Rồng.',
      'Đặt vé máy bay nội địa qua bàn lễ tân.',
      'Thuê xe đưa đón sân bay và hướng dẫn địa phương.',
    ],
  },
]

const pickRandom = (min: number, max: number, step: number): number => {
  const steps = Math.max(1, Math.round((max - min) / step))
  return min + Math.floor(Math.random() * (steps + 1)) * step
}

export const getStayServiceCharge = (state: GameState, stayId: string): ServiceCharge | undefined =>
  state.serviceCharges.find((charge) => charge.stayId === stayId && charge.status === 'Pending')

const rollServiceCharge = (state: GameState, stay: Stay, guest: Guest, room: Room): void => {
  if (Math.random() > 0.55) {
    return
  }
  const totalWeight = serviceChargeTemplates.reduce((sum, template) => sum + template.weight, 0)
  let roll = Math.random() * totalWeight
  const template = serviceChargeTemplates.find((item) => {
    roll -= item.weight
    return roll <= 0
  }) ?? serviceChargeTemplates[0]
  const note = template.notes[Math.floor(Math.random() * template.notes.length)]
  const amountVND = pickRandom(template.min, template.max, template.step)
  const guestWillingToPay = Math.random() > (guest.satisfaction < 70 ? 0.55 : 0.3)
  state.serviceCharges.push({
    id: `charge-${crypto.randomUUID()}`,
    stayId: stay.id,
    guestId: guest.id,
    roomId: room.id,
    kind: template.kind,
    amountVND,
    note: `${note} (${room.number})`,
    guestWillingToPay,
    status: 'Pending',
  })
}

const createStayForAcceptedOffer = (state: GameState, offer: Offer, room: Room, guest: Guest): void => {
  const reservationId = `reservation-${crypto.randomUUID()}`
  state.reservations.push({
    id: reservationId,
    offerId: offer.id,
    guestId: guest.id,
    roomId: room.id,
    checkInDay: state.day,
    checkOutDay: state.day + guest.nights,
    nightlyRateVND: offer.nightlyRateVND,
    extraBed: offer.extraBed,
    status: 'CheckedIn',
  })
  const stay: Stay = {
    id: `stay-${crypto.randomUUID()}`,
    reservationId,
    guestId: guest.id,
    roomId: room.id,
    nightsCompleted: 0,
    status: 'Active',
  }
  state.stays.push(stay)
  room.state = 'Occupied'
  room.guestId = guest.id
  guest.state = 'CheckedIn'
  guest.roomId = room.id
  guest.nightsCompleted = 0
  const fit = evaluateRoom(guest, room, offer.extraBed)
  const fairPrice = evaluatePrice(guest, room, offer.nightlyRateVND, offer.extraBed).fairPriceVND
  const valueScore = offer.nightlyRateVND <= fairPrice ? 100 : Math.max(35, 100 - Math.round(((offer.nightlyRateVND - fairPrice) / fairPrice) * 100))
  const conditionPenalty = room.condition < 60 ? Math.round((60 - room.condition) * 1.2) : 0
  guest.satisfaction = Math.max(30, Math.min(100, Math.round(fit.score * 0.7 + valueScore * 0.2 + room.condition * 0.1 - conditionPenalty)))
  guest.lastEvent = 'Khách đã nhận phòng'
  rollServiceCharge(state, stay, guest, room)
}

export const proposeOffer = (state: GameState, guestId: string, roomId: string, nightlyRateVND: number, extraBed = false): GameState => {
  const next = structuredClone(state)
  const guest = next.guests.find((item) => item.id === guestId)
  const room = next.rooms.find((item) => item.id === roomId)
  if (!guest || !room || guest.state !== 'ConsideringOffer' || room.state !== 'Available') {
    return state
  }

  const evaluation = evaluatePrice(guest, room, nightlyRateVND, extraBed)
  const offer: Offer = {
    id: `offer-${crypto.randomUUID()}`,
    guestId,
    roomId,
    nightlyRateVND,
    extraBed,
    status: evaluation.outcome === 'accept' ? 'Accepted' : evaluation.outcome === 'negotiate' ? 'Negotiating' : 'Rejected',
    counterRateVND: evaluation.counterRateVND,
  }
  next.offers = next.offers.filter((item) => item.guestId !== guestId)
  next.offers.push(offer)

  if (evaluation.outcome === 'accept') {
    createStayForAcceptedOffer(next, offer, room, guest)
    next.lastEvent = `${getGuestTypeLabel(guest.type)} đã nhận phòng ${room.number}`
  } else if (evaluation.outcome === 'negotiate') {
    next.lastEvent = `${getGuestTypeLabel(guest.type)} muốn thương lượng giá`
  } else {
    guest.rejectionCount = (guest.rejectionCount ?? 0) + 1
    if (guest.rejectionCount >= 2) {
      guest.state = 'Declined'
      guest.lastEvent = 'Khách đã từ chối quá nhiều deal và rời đi'
      next.lastEvent = `${getGuestTypeLabel(guest.type)} đã từ chối quá nhiều deal`
    } else {
      guest.lastEvent = `${evaluation.reason}. Khách vẫn ở sảnh, có thể thử deal khác.`
      next.lastEvent = `${getGuestTypeLabel(guest.type)} chưa đồng ý deal này`
    }
  }
  return next
}

export const acceptCounterOffer = (state: GameState, offerId: string): GameState => {
  const next = structuredClone(state)
  const offer = next.offers.find((item) => item.id === offerId)
  if (!offer || offer.status !== 'Negotiating' || !offer.counterRateVND) {
    return state
  }
  const guest = next.guests.find((item) => item.id === offer.guestId)
  const room = next.rooms.find((item) => item.id === offer.roomId)
  if (!guest || !room || room.state !== 'Available') {
    return state
  }
  offer.nightlyRateVND = offer.counterRateVND
  offer.status = 'Accepted'
  delete offer.counterRateVND
  createStayForAcceptedOffer(next, offer, room, guest)
  next.lastEvent = `${getGuestTypeLabel(guest.type)} đã đồng ý giá mới`
  return next
}

export const declineGuest = (state: GameState, guestId: string): GameState => {
  const next = structuredClone(state)
  const guest = next.guests.find((item) => item.id === guestId)
  if (!guest || guest.state !== 'ConsideringOffer') {
    return state
  }
  guest.state = 'Declined'
  guest.lastEvent = 'Khách rời đi vì không tìm được phòng phù hợp'
  next.lastEvent = `${getGuestTypeLabel(guest.type)} đã rời khách sạn`
  return next
}

export const settleDay = (state: GameState, closingDayInput = state.day): GameState => {
  if (state.lastClosedDay >= closingDayInput) {
    return state
  }
  const next = structuredClone(state)
  const closingDay = closingDayInput
  let waitingCheckout = 0

  next.stays.forEach((stay) => {
    if (stay.status !== 'Active') {
      return
    }
    const guest = next.guests.find((item) => item.id === stay.guestId)
    const room = next.rooms.find((item) => item.id === stay.roomId)
    if (!guest || !room) {
      return
    }

    stay.nightsCompleted += 1
    guest.nightsCompleted = stay.nightsCompleted
    const wear = room.type === 'deluxe' ? 4 : 6
    room.condition = Math.max(0, room.condition - wear)
    if (stay.nightsCompleted < guest.nights) {
      guest.state = 'Staying'
      guest.lastEvent = `Đã hoàn thành ${stay.nightsCompleted}/${guest.nights} đêm`
      return
    }

    stay.status = 'AwaitingCheckout'
    stay.checkoutRequestedGameMinute = next.day * 24 * 60 + next.minuteOfDay
    guest.state = 'WaitingCheckout'
    guest.lastEvent = 'Đã đủ số đêm, chờ quầy lễ tân checkout'
    waitingCheckout += 1
  })

  const closedAtGameMinute = next.day * 24 * 60 + next.minuteOfDay
  const revenue = next.payments.filter((payment) => getPaymentGameMinute(payment) > next.lastSettledGameMinute).reduce((total, payment) => total + payment.totalVND, 0)
  const operatingCost = 800_000
  const profitBeforeTax = revenue - operatingCost
  const tax = profitBeforeTax > 0 ? Math.round(profitBeforeTax * 0.2) : 0
  next.cashVND -= operatingCost + tax
  next.totalCostsVND += operatingCost
  next.taxPaidVND += tax
  next.lastSettlement = {
    day: closingDay,
    revenueVND: revenue,
    operatingCostVND: operatingCost,
    taxVND: tax,
    compensationVND: 0,
    repairVND: 0,
    waivedVND: 0,
    netCashChangeVND: profitBeforeTax - tax,
    takeHomeVND: revenue - operatingCost - tax,
  }
  next.lastClosedDay = closingDay
  next.lastSettledGameMinute = closedAtGameMinute
  next.day = closingDay + 1
  next.minuteOfDay = 8 * 60
  next.arrivedSlots = []
  next.lastEvent = waitingCheckout > 0 ? `Kết ca: ${waitingCheckout} khách đang chờ checkout` : `Kết ca: đã thực thu ${formatVnd(revenue)}`
  return processArrivals(next)
}

export const getUnsettledRevenueVND = (state: GameState): number =>
  state.payments.filter((payment) => getPaymentGameMinute(payment) > state.lastSettledGameMinute).reduce((total, payment) => total + payment.totalVND, 0)

const getPaymentGameMinute = (payment: PaymentRecord): number => payment.paidAtGameMinute ?? (payment.day + 1) * 24 * 60 - 1

export type ServiceChargeDecision = 'collect' | 'waive' | 'force'

export const checkoutGuest = (state: GameState, stayId: string, decision: ServiceChargeDecision = 'collect'): GameState => {
  const next = structuredClone(state)
  const stay = next.stays.find((item) => item.id === stayId)
  if (!stay || stay.status !== 'AwaitingCheckout') {
    return state
  }
  const reservation = next.reservations.find((item) => item.id === stay.reservationId)
  const guest = next.guests.find((item) => item.id === stay.guestId)
  const room = next.rooms.find((item) => item.id === stay.roomId)
  if (!reservation || !guest || !room) {
    return state
  }

  const charge = next.serviceCharges.find((item) => item.stayId === stay.id && item.status === 'Pending')
  let extraChargesVND = 0
  let waivedVND = 0
  let note = 'Khách không dùng dịch vụ thêm.'
  let forcedCharge = false

  if (charge) {
    if (charge.guestWillingToPay || decision === 'force') {
      extraChargesVND = charge.amountVND
      forcedCharge = !charge.guestWillingToPay
      charge.status = forcedCharge ? 'Forced' : 'Paid'
      note = `${charge.note} — khách ${forcedCharge ? 'không chịu trả nhưng quầy vẫn thu' : 'chịu trả'}.`
    } else {
      waivedVND = charge.amountVND
      charge.status = 'Waived'
      note = `${charge.note} — khách từ chối trả, quầy miễn phí.`
    }
    charge.resolvedDay = next.day
  }

  if (forcedCharge) {
    guest.satisfaction = Math.max(5, guest.satisfaction - 14)
    next.reputation = Math.max(0, next.reputation - 2)
  } else if (waivedVND > 0) {
    guest.satisfaction = Math.min(100, guest.satisfaction + 4)
  }

  const roomChargeVND = reservation.nightlyRateVND * guest.nights
  const totalVND = roomChargeVND + extraChargesVND
  next.payments.push({
    id: `payment-${crypto.randomUUID()}`,
    guestId: guest.id,
    roomId: room.id,
    stayId: stay.id,
    day: next.day,
    paidAtGameMinute: next.day * 24 * 60 + next.minuteOfDay,
    roomChargeVND,
    extraChargesVND,
    waivedVND,
    extraChargesNote: note,
    totalVND,
  })
  next.cashVND += totalVND
  next.totalRevenueVND += totalVND
  stay.status = 'Completed'
  reservation.status = 'Completed'
  guest.state = 'ReviewCompleted'
  guest.lastEvent = forcedCharge ? 'Đã hoàn tất lưu trú (bị ép thu phí)' : 'Đã hoàn tất lưu trú'
  room.state = room.condition < 40 ? 'Maintenance' : 'Available'
  delete room.guestId
  const review = createReview(guest, room, next.day, forcedCharge ? 1 : 0)
  if (forcedCharge) {
    review.rating = Math.min(review.rating, 2)
    review.text = `${review.text} Nhân viên vẫn thu phí dịch vụ dù khách đã nói không dùng và từ chối trả.`
    review.reasons.push('forced_service_charge')
  }
  next.reviews.push(review)
  next.reputation = Math.max(0, Math.min(100, next.reputation + (review.rating - 3) * 1.5))
  next.reputation = Math.round(next.reputation)
  next.reviewCount += 1

  if (room.condition < 60 || guest.satisfaction < 70) {
    next.compensationRequests.push({
      id: `compensation-${crypto.randomUUID()}`,
      guestId: guest.id,
      roomId: room.id,
      stayId: stay.id,
      amountVND: Math.max(100_000, Math.round(totalVND * 0.15)),
      reason: room.condition < 40 ? 'Phòng xuống cấp, có thiết bị cần sửa' : 'Khách chưa hài lòng về trải nghiệm lưu trú',
      status: 'Pending',
    })
  }
  next.lastEvent = `Đã checkout ${getGuestTypeLabel(guest.type)} · thu ${formatVnd(totalVND)}`
  return next
}

export const getRepairCost = (room: Room): number => 250_000 + Math.max(0, 100 - room.condition) * 20_000 + (room.type === 'deluxe' ? 500_000 : 0)

export const repairRoom = (state: GameState, roomId: string): GameState => {
  const next = structuredClone(state)
  const room = next.rooms.find((item) => item.id === roomId)
  if (!room || room.state === 'Occupied' || room.state === 'Reserved' || room.condition >= 100) {
    return state
  }
  const cost = getRepairCost(room)
  room.condition = Math.min(100, room.condition + 30)
  room.state = 'Available'
  next.cashVND -= cost
  next.totalCostsVND += cost
  if (next.lastSettlement) {
    next.lastSettlement.repairVND += cost
    next.lastSettlement.netCashChangeVND -= cost
    next.lastSettlement.takeHomeVND -= cost
  }
  next.lastEvent = `Đã sửa phòng ${room.number} với chi phí ${formatVnd(cost)}`
  return next
}

export const replyToReview = (state: GameState, reviewId: string, reply: string): GameState => {
  const next = structuredClone(state)
  const review = next.reviews.find((item) => item.id === reviewId)
  if (!review || !reply.trim()) {
    return state
  }
  review.reply = reply.trim()
  review.repliedDay = next.day
  next.lastEvent = 'Đã gửi phản hồi tới khách hàng'
  return next
}

export const resolveCompensation = (state: GameState, requestId: string, accept: boolean): GameState => {
  const next = structuredClone(state)
  const request = next.compensationRequests.find((item) => item.id === requestId)
  if (!request || request.status !== 'Pending') {
    return state
  }
  if (accept) {
    request.status = 'Paid'
    next.cashVND -= request.amountVND
    next.totalCostsVND += request.amountVND
    if (next.lastSettlement) {
      next.lastSettlement.compensationVND += request.amountVND
      next.lastSettlement.netCashChangeVND -= request.amountVND
      next.lastSettlement.takeHomeVND -= request.amountVND
    }
    next.reputation = Math.min(100, next.reputation + 1)
    next.lastEvent = `Đã bồi thường ${formatVnd(request.amountVND)} cho khách`
  } else {
    request.status = 'Declined'
    next.reputation = Math.max(0, next.reputation - 3)
    next.lastEvent = 'Đã từ chối yêu cầu bồi thường của khách'
  }
  return next
}

export const getTakeHomeVND = (state: GameState): number => state.totalRevenueVND - state.totalCostsVND - state.taxPaidVND

export const getWaivedTotalVND = (state: GameState): number => state.payments.reduce((total, payment) => total + (payment.waivedVND ?? 0), 0)

export const createNewGame = (hotelName: string): GameState => {
  const state: GameState = {
    version: 1,
    hotelName: hotelName.trim() || 'Khách sạn',
    locationName: 'Đà Nẵng',
    day: 1,
    minuteOfDay: 8 * 60,
    timeScale: 10,
    cashVND: 180_000_000,
    reputation: 55,
    reviewCount: 0,
    totalRevenueVND: 0,
    totalCostsVND: 0,
    taxPaidVND: 0,
    rooms: createRooms(),
    guests: [],
    offers: [],
    reservations: [],
    stays: [],
    payments: [],
    serviceCharges: [],
    reviews: [],
    compensationRequests: [],
    lastSettlement: null,
    arrivedSlots: [],
    lastClosedDay: 0,
    lastSettledGameMinute: 0,
    lastEvent: 'Khách sạn đã mở cửa',
    lastSavedAt: Date.now(),
  }
  return processArrivals(state)
}

export const normalizeGameState = (value: unknown): GameState | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<GameState> & { hotelName?: unknown; cashVND?: unknown; day?: unknown; minuteOfDay?: unknown; timeScale?: unknown }
  const hasCurrentShape = candidate.version === 1 && Array.isArray(candidate.rooms) && Array.isArray(candidate.guests) && Array.isArray(candidate.offers) && Array.isArray(candidate.reservations) && Array.isArray(candidate.stays) && Array.isArray(candidate.reviews) && Array.isArray(candidate.arrivedSlots)
  if (hasCurrentShape) {
    const normalized = candidate as GameState
    normalized.taxPaidVND = typeof candidate.taxPaidVND === 'number' ? candidate.taxPaidVND : 0
    normalized.rooms = normalized.rooms.map((room) => ({
      ...room,
      capacity: room.capacity ?? (room.type === 'deluxe' ? 4 : 2),
      extraBedAvailable: room.extraBedAvailable ?? true,
      extraBedFeeVND: room.extraBedFeeVND ?? 150_000,
    }))
    normalized.compensationRequests = Array.isArray(candidate.compensationRequests) ? candidate.compensationRequests : []
    normalized.lastSettlement = candidate.lastSettlement
      ? {
        ...candidate.lastSettlement,
        waivedVND: candidate.lastSettlement.waivedVND ?? 0,
        takeHomeVND: candidate.lastSettlement.takeHomeVND
          ?? candidate.lastSettlement.revenueVND
            - candidate.lastSettlement.operatingCostVND
            - candidate.lastSettlement.taxVND
            - candidate.lastSettlement.compensationVND
            - candidate.lastSettlement.repairVND,
      }
      : null
    normalized.offers = normalized.offers.map((offer) => ({ ...offer, extraBed: offer.extraBed ?? false }))
    normalized.reservations = normalized.reservations.map((reservation) => ({ ...reservation, extraBed: reservation.extraBed ?? false }))
    normalized.payments = Array.isArray(candidate.payments) ? candidate.payments : []
    normalized.payments = normalized.payments.map((payment) => ({
      ...payment,
      waivedVND: payment.waivedVND ?? 0,
      extraChargesNote: payment.extraChargesNote ?? 'Không có dịch vụ thêm.',
    }))
    normalized.serviceCharges = Array.isArray(candidate.serviceCharges) ? candidate.serviceCharges : []
    normalized.lastSettledGameMinute = typeof candidate.lastSettledGameMinute === 'number'
      ? candidate.lastSettledGameMinute
      : normalized.lastSettlement ? (normalized.lastSettlement.day + 1) * 24 * 60 : 0
    normalized.guests = normalized.guests.map((guest) => ({
      ...guest,
      dialogue: guest.dialogue ?? dialogues[guest.type] ?? 'Tôi cần một phòng phù hợp cho chuyến đi.',
      arrivedAtGameMinute: guest.arrivedAtGameMinute ?? normalized.day * 24 * 60 + normalized.minuteOfDay,
      decisionDeadlineGameMinute: guest.decisionDeadlineGameMinute ?? normalized.day * 24 * 60 + normalized.minuteOfDay + 90,
      rejectionCount: guest.rejectionCount ?? 0,
    }))
    return normalized
  }

  const looksLikeLegacySpike = typeof candidate.hotelName === 'string' && typeof candidate.cashVND === 'number'
  if (!looksLikeLegacySpike) {
    return null
  }

  const migrated = createNewGame(typeof candidate.hotelName === 'string' ? candidate.hotelName : 'Khách sạn')
  migrated.cashVND = typeof candidate.cashVND === 'number' ? candidate.cashVND : migrated.cashVND
  migrated.day = typeof candidate.day === 'number' ? Math.max(1, candidate.day) : migrated.day
  migrated.minuteOfDay = typeof candidate.minuteOfDay === 'number' ? Math.max(0, Math.min(1439, candidate.minuteOfDay)) : migrated.minuteOfDay
  migrated.timeScale = typeof candidate.timeScale === 'number' ? candidate.timeScale : migrated.timeScale
  migrated.lastEvent = 'Đã chuyển dữ liệu từ bản technical spike'
  return migrated
}

