export enum ROLE {
  USER = "user",
  BUSINESS = "business",
  ADMIN = "admin",
  SUPERADMIN = "Superadmin",
}

export enum OrderMethod {
  EATIN = "Eatin",
  SELFPICKUP = "Selfpickup",
  DELIVERY = "Delivery",
}

export enum ResponseStatus {
  SUCCESS = "Success",
  ERROR = "Error",
}

export enum ResponseCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export enum BusinessType {
  UNREGISTERED = "Unregistered",
  REGISTERED = "Registered",
  INCORPORATED = "Incoporated",
}

export enum BusinessCategoryType {
  FINEDINING = "Fine Dining",
  SALONSANDSPA = "Salons and spa",
  MAINSTREAM = "Mainstream",
  ICONICDELICACIES = "Iconic Delicacies",
  BUFFET = "Buffet services",
  BEACHESRESORTS = "Beaches & Resorts",
  BOATYATCHCRUISE = "Boat and Yachts cruises",
  SHORTLET = "Short-let homes",
  CLUB = "Club",
  PARKSRECREATION = "Parks & Recreation",
  BEACHESRESORTACCOMMODATION = "Beaches & Resort Accommodation",
  HOTELEXPERIENCE = "Hotel Experience",
  SKINCARE = "Skin Care",
  FITNESSGYM = "Fitness & Gym",
  LUXURYNIGHT = "Luxury Night",
  FOODDRINKS = "Food & Drinks",
  BARSLOUNGES = "Bars & Lounges",
  HAPPENINGTHISMONTH = "Happening this month",
  EVENTSNIGHTS = "Events Nights",
  CONCERTSSHOWS = "Concerts & Shows",
  PRIVATECINEMAS = "Private Cinemas",
  FESTIVALSCORPORATE = "Festivals & Corporate Promotions",
  INCITYRIDES = "In-City Rides",
  LUXURYONDEMAND = "Luxury on Demand",
  HOUSEHOLDLOGISTICS = "Household Logistics",
  NIGHTLIFE = "Nightlife",
}

export enum ExperienceType {
  INDOOR = "Indoor",
  OUTDOOR = "Outdoor",
}

export enum ReservationStatus {
  PENDING = "Pending",
  BOOKED = "Booked",
  CANCELLED = "Cancelled",
}

export enum TransactionStatus {
  COMPLETED = "Completed",
  SUCCESS = "Success",
  PENDING = "Pending",
  CANCELLED = "Cancelled",
}

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  READY = "ready",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PREPARING = "preparing",
  ONTRANSIT = "on-transit",
}

export enum DeliveryStatus {
  PENDING = "pending",
  AWAITING_DELIVERY = "awaiting-delivery",
  FAILED_DELIVERY = "failed_delivery",
  ON_TRANSIT = "on-transit",
  DELIVERED = "delivered",
}

export enum ReservationType {
  SALON_SPA = "Salons and Spa",
  FINE_DINING = "Fine Dining",
  BUFFET = "Buffet services",
  SHORTS_LETS_HOMES = "Shorts lets homes",
  BEACHESRESORT = "Beaches and resorts",
}

export enum TimeFrame {
  THISWEEK = "thisWeek",
  THISMONTH = "thisMonth",
  LASTMONTH = "lastMonth",
}

export enum ChartFrame {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SIXMONTH = "6month",
  YEARLY = "yearly",
}

export enum GroupSize {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  GROUP10 = 10,
  GROUP20 = 20,
  GROUP30 = 30,
  GROUP50 = 50,
}

export enum PaymentStatus {
  PENDING = "Pending",
  SUCCESS = "Success",
  FAILED = "Failed",
}

export enum TransactionInformationType {
  VAT = "VAT",
  SERVICE_CHARGE = "SERVICE CHARGE",
  DISCOUNT = "DISCOUNT",
  STATE_TAX = "STATE TAX",
}

export enum PaymentType {
  EVENT = "Event",
  ORDER = "Order",
  ACCOMMODATION = "Accommodation",
  RESERVATION = "Reservation",
  TICKET = "Ticket",
  CLUB = "Club",
  DEAL = "Deal",
}

export enum ResType {
  EVENT = "Event",
  ACCOMODATION = "Accommodation",
  RESERVATION = "Reservation",
}

export enum VerificationStatus {
  PENDING = "Pending",
  ACCEPTED = "Accepted",
  DENIED = "Denied",
  REQUEST = "Request",
}

/**
 * Onboarding Status Enum
 */
export enum OnboardingStatus {
  INVITED = "Invited",
  PASSWORD_SET = "PasswordSet",
  COMPLETED = "Completed",
  // DOCUMENTS_SUBMITTED = "DocumentsSubmitted",
  // VERIFIED = "Verified",
  // REJECTED = "Rejected",
}

/**
 * Onboarding Source Enum
 */
export enum OnboardingSource {
  ADMIN_INVITE = "AdminInvite",
  SELF_SERVICE = "SelfService",
  DIRECT_SIGNUP = "DirectSignup",
}

export enum TicketStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
export enum DeliveryService {
  KWIKDELIVERY = "Kwik Delivery",
  CHOOWDECK = "Chowdeck",
}

export enum TicketAgeGroup {
  ADULT = "Adult",
  CHILDREN = "Children",
}

export enum BusinessTicketType {
  BEACHESRESORTS = BusinessCategoryType.BEACHESRESORTS,
  BOATYATCHCRUISE = BusinessCategoryType.BOATYATCHCRUISE,
}

export enum EventType {
  TICKET = "ticket",
  RESERVATION = "reservation",
  INFORMATIVE = "informative",
}

export enum EventClass {
  REGULAR = "regular",
  EXCLUSIVE = "exclusive",
}

export enum DealType {
  BUY = "Buy",
  SNAG = "Snag",
}

export enum ContextType {
  EVENT = "Event",
  Deal = "Deal",
}

export enum ToggleStatus {
  OFF = "Off",
  ON = "On",
}

export enum ReactionType {
  USEFUL = "Useful",
  COOL = "Cool",
  FUNNY = "Funny",
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
}

export enum Provider {
  GOOGLE = "google",
  APPLE = "apple",
  FORM = "form",
}

export enum BuffetFilterType {
  ALL = "all",
  BY_MEAL_TYPE = "by_meal_type",
}

export enum AccommodationFilterType {
  ALL = "all",
  BY_APARTMENT_TYPE = "by_apartment_type",
}

export enum SortType {
  ASC = "ASC",
  DESC = "DESC",
}

export enum NotificationType {
  ORDER_UPDATE = "order_update",
  EVENT_REMINDER = "event_reminder",
  RESERVATION_CONFIRMATION = "reservation_confirmation",
  PROMOTION = "promotion",
  GENERAL = "general",
}

export enum Platform {
  ANDROID = "android",
  IOS = "ios",
  WEB = "web",
}
