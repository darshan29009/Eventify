// User Roles
export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  EMPLOYEE: 'employee'
}

// Event Types
export const EVENT_TYPES = {
  WEDDING: 'wedding',
  BIRTHDAY: 'birthday',
  CORPORATE: 'corporate',
  PARTY: 'party',
  RELIGIOUS: 'religious',
  COLLEGE_FEST: 'college-fest',
  MUSIC_CONCERT: 'music-concert',
  SPORTS_EVENT: 'sports-event',
  PRODUCT_LAUNCH: 'product-launch',
  OTHER: 'other'
}

// Event Sub-types
export const EVENT_SUB_TYPES = {
  // Wedding
  SANGEET: 'sangeet',
  MEHNDI: 'mehndi',
  HALDI: 'haldi',
  RECEPTION: 'reception',
  MARRIAGE: 'marriage',
  ENGAGEMENT: 'engagement',

  // Birthday
  KIDS: 'kids',
  TEEN: 'teen',
  ADULT: 'adult',
  MILESTONE: 'milestone',
  SURPRISE: 'surprise',

  // Corporate
  CONFERENCE: 'conference',
  TEAM_BUILDING: 'team-building',
  ANNUAL_DAY: 'annual-day',
  SEMINAR: 'seminar',
  WORKSHOP: 'workshop',

  // Party
  ANNIVERSARY: 'anniversary',
  HOUSEWARMING: 'housewarming',
  RETIREMENT: 'retirement',
  BABY_SHOWER: 'baby-shower',
  GENDER_REVEAL: 'gender-reveal',

  // Religious
  PUJA: 'puja',
  HAVAN: 'havan',
  EID: 'eid',
  CHRISTMAS: 'christmas',
  NAVRATRI: 'navratri',
  GANESH_CHATURTHI: 'ganesh-chaturthi'
}

// Task Status
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  BLOCKED: 'blocked',
  COMPLETED: 'completed'
}

// Task Priorities
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PLANNING: 'planning',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
}

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially-refunded',
  CANCELLED: 'cancelled'
}

// Payment Methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  UPI: 'upi',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
  EMI: 'emi',
  CASH: 'cash',
  CHEQUE: 'cheque'
}

// Employee Departments
export const DEPARTMENTS = {
  EVENT_MANAGEMENT: 'Event Management',
  OPERATIONS: 'Operations',
  FINANCE: 'Finance',
  MARKETING: 'Marketing',
  HOSPITALITY: 'Hospitality',
  SECURITY: 'Security'
}

// Indian Cities
export const CITIES = [
  { code: 'MUM', name: 'Mumbai', state: 'Maharashtra' },
  { code: 'DEL', name: 'Delhi', state: 'Delhi NCR' },
  { code: 'BLR', name: 'Bangalore', state: 'Karnataka' },
  { code: 'HYD', name: 'Hyderabad', state: 'Telangana' },
  { code: 'CHE', name: 'Chennai', state: 'Tamil Nadu' },
  { code: 'KOL', name: 'Kolkata', state: 'West Bengal' },
  { code: 'PUN', name: 'Pune', state: 'Maharashtra' },
  { code: 'AHM', name: 'Ahmedabad', state: 'Gujarat' },
  { code: 'JAIP', name: 'Jaipur', state: 'Rajasthan' },
  { code: 'LKO', name: 'Lucknow', state: 'Uttar Pradesh' },
  { code: 'KOC', name: 'Kochi', state: 'Kerala' },
  { code: 'GOI', name: 'Goa', state: 'Goa' },
  { code: 'AMD', name: 'Ahmedabad', state: 'Gujarat' },
  { code: 'IND', name: 'Indore', state: 'Madhya Pradesh' },
  { code: 'BHP', name: 'Bhopal', state: 'Madhya Pradesh' },
  { code: 'VGD', name: 'Vadodara', state: 'Gujarat' },
  { code: 'NAGP', name: 'Nagpur', state: 'Maharashtra' },
  { code: 'GWT', name: 'Guwahati', state: 'Assam' },
  { code: 'BBS', name: 'Bhubaneswar', state: 'Odisha' },
  { code: 'JPR', name: 'Jamshedpur', state: 'Jharkhand' },
  { code: 'CHD', name: 'Chandigarh', state: 'Chandigarh' }
]

// State list
export const INDIAN_STATES = [
  'Maharashtra', 'Delhi NCR', 'Karnataka', 'Telangana', 'Tamil Nadu',
  'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Kerala',
  'Goa', 'Madhya Pradesh', 'Assam', 'Odisha', 'Jharkhand',
  'Chandigarh', 'Punjab', 'Haryana', 'Uttarakhand', 'Himachal Pradesh',
  'Jammu & Kashmir', 'Andhra Pradesh', 'Kerala', 'Tamil Nadu'
]

// Gender options
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
]

// Task Types
export const TASK_TYPES = [
  { value: 'planning', label: 'Planning', icon: 'fa-clipboard-list' },
  { value: 'setup', label: 'Setup & Decor', icon: 'fa-tools' },
  { value: 'coordination', label: 'Coordination', icon: 'fa-phone' },
  { value: 'deliverable', label: 'Deliverable', icon: 'fa-file-check' },
  { value: 'documentation', label: 'Documentation', icon: 'fa-file-alt' },
  { value: 'other', label: 'Other', icon: 'fa-ellipsis-h' }
]

// Service Categories
export const SERVICE_CATEGORIES = [
  { value: 'venue', label: 'Venue', icon: 'fa-map-marker-alt' },
  { value: 'catering', label: 'Catering', icon: 'fa-utensils' },
  { value: 'decoration', label: 'Decoration', icon: 'fa-sparkles' },
  { value: 'photography', label: 'Photography', icon: 'fa-camera' },
  { value: 'music', label: 'Music & DJ', icon: 'fa-music' },
  { value: 'lighting', label: 'Lighting', icon: 'fa-lightbulb' },
  { value: 'entertainment', label: 'Entertainment', icon: 'fa-theater-masks' },
  { value: 'staffing', label: 'Staffing', icon: 'fa-users' },
  { value: 'other', label: 'Other', icon: 'fa-ellipsis-h' }
]

// Payment Gateways
export const PAYMENT_GATEWAYS = {
  STRIPE: 'stripe',
  RAZORPAY: 'razorpay',
  MANUAL: 'manual'
}

// Currency formatter
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Date formatter
export const formatDate = (date, format = 'PPP') => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date))
}

// Status badges
export const STATUS_BADGES = {
  pending: { text: 'Pending', className: 'status-badge status-pending' },
  confirmed: { text: 'Confirmed', className: 'status-badge status-confirmed' },
  'in-progress': { text: 'In Progress', className: 'status-badge status-in-progress' },
  completed: { text: 'Completed', className: 'status-badge status-completed' },
  cancelled: { text: 'Cancelled', className: 'status-badge status-cancelled' },
  todo: { text: 'To Do', className: 'status-badge status-pending' },
  'in-progress': { text: 'In Progress', className: 'status-badge status-in-progress' },
  review: { text: 'Under Review', className: 'status-badge status-in-progress' },
  blocked: { text: 'Blocked', className: 'status-badge status-cancelled' }
}

// Event types display
export const EVENT_TYPE_LABELS = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  corporate: 'Corporate',
  party: 'Party',
  religious: 'Religious',
  'college-fest': 'College Fest',
  'music-concert': 'Music Concert',
  'sports-event': 'Sports Event',
  'product-launch': 'Product Launch',
  other: 'Other'
}

// Task priority colors
export const PRIORITY_COLORS = {
  low: '#48bb78',
  medium: '#ed8936',
  high: '#e53e3e',
  urgent: '#9b2c2c'
}

// Chart colors
export const CHART_COLORS = [
  '#667eea',
  '#764ba2',
  '#f6ad55',
  '#48bb78',
  '#ed8936',
  '#fc8181',
  '#4299e1',
  '#9f7aea',
  '#38b2ac',
  '#ed64a6'
]

// Default avatar
export const DEFAULT_AVATAR = '/assets/default-avatar.svg'
export const DEFAULT_EVENT_IMAGE = '/assets/images/default-event.jpg'

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// File upload limits
export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
}

export default {
  ROLES,
  EVENT_TYPES,
  EVENT_SUB_TYPES,
  TASK_STATUS,
  TASK_PRIORITIES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  DEPARTMENTS,
  CITIES,
  INDIAN_STATES,
  GENDERS,
  TASK_TYPES,
  SERVICE_CATEGORIES,
  PAYMENT_GATEWAYS,
  formatCurrency,
  formatDate,
  STATUS_BADGES,
  EVENT_TYPE_LABELS,
  PRIORITY_COLORS,
  CHART_COLORS,
  DEFAULT_AVATAR,
  DEFAULT_EVENT_IMAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  FILE_UPLOAD_LIMITS
}
