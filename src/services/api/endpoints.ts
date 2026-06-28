export const API_BASE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const nodeEnv = process.env.NODE_ENV;

  // console.log("🔧 API Configuration:", {
  //   env: nodeEnv,
  //   envUrl: envUrl ? "SET" : "NOT_SET",
  //   finalUrl: envUrl || (nodeEnv === "production"
  //     ? "⚠️ PRODUCTION but API_URL not set!"
  //     : "staging-api.mypal-inc.com"),
  // });

  // In production, REQUIRE the env variable to be set
  if (nodeEnv === "production" && !envUrl) {
    console.error(
      "❌ CRITICAL: NEXT_PUBLIC_API_URL is not set for production! " +
      "This will cause all API requests to fail."
    );
  }

  return (
    envUrl ||
    "https://staging-api.mypal-inc.com/v1"
  );
})();

export const ENDPOINTS = {
  BUSINESS_AUTH: {
    SIGNIN: "/auth/business/signin",
    SIGNUP: "/auth/business/signup",
    LOGOUT: "/auth/business/logout",
    VERIFY_TOKEN: "/verifyToken",
    FORGET_PASSWORD: "/auth/business/forget-password",
    VERIFY_OTP: "/auth/business/verifyotp",
    RESEND_OTP: "/auth/business/resend-otp",
    RESET_PASSWORD: "/auth/business/reset-password",
    CHANGE_PASSWORD: "/auth/business/change-password",
    UPDATE_BUSINESS: "/auth/update-business",
    DELETE_BUSINESS: "/auth/delete-business",
    ONBOARDING_VALIDATE: (token: string) => `/businesses/onboarding/${token}`,
    ONBOARDING_DELEGATE: "/onboarding/delegate",
    ONBOARDING_SET_PASSWORD: (token: string) =>
      `/businesses/onboarding/${token}/password`,
  },
  OFFERINGS_RESERVATIONS: {
    GET_GRID: ({ start_date, end_date, category }: { start_date: string; end_date: string; category?: string }) => `/dashboard/offerings-inventory/grid?start_date=${start_date}&end_date=${end_date}${category ? `&category=${category}` : ''}`,
    BLOCK_UNBLOCK_INVENTORY_SLOT: "/dashboard/offerings-inventory/state/block",
    OVERRIDE_PRICE: "/dashboard/offerings-inventory/state/price",
    GET_LIVE_RESERVATIONS: "/dashboard/offerings-reservations/live",
    CREATE_RESERVATIONS: "/dashboard/offerings-reservations/manual",
    RETRIEVE_RESERVATIONS: ({ entity_id, entity_type, start_date, end_date }: { entity_id: string; entity_type: string; start_date: string; end_date: string; }) => `/dashboard/offerings-reservations/range?entity_id=${entity_id}&entity_type=${entity_type}&start_date=${start_date}&end_date=${end_date}`,

  },
  AGREEMENTS: {
    // Accommodation Agreement Endpoints
    ACCOMMODATION: {
      CREATE: "/agreements/accommodation",
      GET_ALL: "/agreements/accommodation",
      GET_BY_ID: (id: string) => `/agreements/accommodation/${id}`,
      GET_BY_BUSINESS: (business_id: string) =>
        `/agreements/accommodation/business/${business_id}`,
      GET_MY: "/agreements/accommodation/my-agreement",
      UPDATE: (id: string) => `/agreements/accommodation/${id}`,
      UPDATE_ADMIN: (id: string) => `/agreements/accommodation/admin/${id}`,
      DELETE: (id: string) => `/agreements/accommodation/${id}`,
    },

    // Business Agreement Endpoints
    BUSINESS: {
      CREATE: "/agreements/business",
      GET_ALL: "/agreements/business",
      GET_BY_ID: (id: string) => `/agreements/business/${id}`,
      GET_BY_BUSINESS: (business_id: string) =>
        `/agreements/business/by-business/${business_id}`,
      GET_MY: "/agreements/business/my-agreement",
      UPDATE: (id: string) => `/agreements/business/${id}`,
      UPDATE_ADMIN: (id: string) => `/agreements/business/${id}/admin`,
      DELETE: (id: string) => `/agreements/business/${id}`,
    },

    // Agreement Terms Endpoints
    TERMS: {
      CREATE: "/agreements/terms",
      GET_ALL: "/agreements/terms",
      GET_BY_ID: (id: string) => `/agreements/terms/${id}`,
      UPDATE: (id: string) => `/agreements/terms/${id}`,
      DELETE: (id: string) => `/agreements/terms/${id}`,
    },
    // Combined Endpoints for Agreements with Terms
    COMBINED: {
      GET_BUSINESS: (business_id: string) =>
        `/agreements/combined/business/${business_id}`,
      GET_ACCOMMODATION: (business_id: string) =>
        `/agreements/combined/accommodation/${business_id}`,
    },
  },

  // ===== BUSINESS CONTRACTS =====
  BUSINESS_CONTRACTS: {
    // Get the current business contract
    GET: "/business/contracts",
    //Retrieve the contract template for the authenticated business's category
    GET_TEMPLATE: "/business/contracts/template",
    // Create a new contract or update existing contract details (only when status is PENDING)
    CREATE_OR_UPDATE: "/business/contracts",
    // Update business contract (only when status is PENDING)
    UPDATE: "/business/contracts",
    // Submit contract for processing (changes status from PENDING to PROCESSING)
    SUBMIT: "/business/contracts/submit",
  },

  // ===== BUSINESS TEAM MANAGEMENT =====
  BUSINESS_TEAM: {
    // Team Member Endpoints
    INVITE: "/business/team/invite",
    ACCEPT_INVITE: "/business/team/accept-invite",
    GET_MEMBERS: "/business/team/members",
    GET_MY_PROFILE: "/business/team/members/me",
    GET_MEMBER: (id: string) => `/business/team/members/${id}`,
    DELETE_MEMBER: (id: string) => `/business/team/members/${id}`,
    UPDATE_MEMBER_ROLE: (id: string) => `/business/team/members/${id}/role`,

    // Permissions Endpoints
    GET_PERMISSIONS: "/business/team/permissions",

    // Roles Endpoints
    GET_ROLES: "/business/team/roles",
    CREATE_ROLE: "/business/team/roles",
    GET_ROLE: (id: string) => `/business/team/roles/${id}`,
    UPDATE_ROLE: (id: string) => `/business/team/roles/${id}`,
    DELETE_ROLE: (id: string) => `/business/team/roles/${id}`,
  },

  DEALS: {
    CREATE: "/deals/create",
    GET_ALL: "/deals",
    GET_BUSINESS_DEALS: "/deals/business",
    GET_ONE: (id: string) => `/deals/${id}`,
    UPDATE: (deal_id: string) => `/deals/${deal_id}`,
    DELETE: (deal_id: string) => `/deals/${deal_id}`,
    GET_UPCOMING: "/deals/upcoming",
    GET_BUSINESS_UPCOMING: "/deals/business/upcoming",
  },
  BUSINESS: {
    ALL: "/businesses",
    // Get the current business details (for authenticated business)
    ME: "/businesses/me/details",
    // Add category to current business (extend into another category)
    ME_ADD_CATEGORY: "/businesses/me/add-category",
    // Switch active business context for authenticated owner
    SWITCH: "/businesses/switch",
    UPDATE_BANK: "/business/bankaccount/update",
    RESERVATIONS: "/business/reservations",
    RESERVATIONS_STATUS_UPDATE: (id: string) => `/business/reservation/${id}`,
    RESERVATION_REVENUES: "/business/reservations/revenues",
    TRANSACTIONS: "/business/transactions",
    TRANSACTION_REVENUES: "/business/transaction/revenues",
    ORDERS: "/business/orders",
    SINGLE_ORDER: (id: string) => `/business/orders/${id}`,
    ORDER_REVENUES: "/business/order/revenues",
    ORDER_STATUS_UPDATE: (id: string) => `/business/order/${id}`,
  },

  BUSINESS_CATEGORIES: {
    GET_ALL: "/categories",
    CREATE: "/create-category",
    GET_CATEGORY_BUSINESS: (category_id: string | number) =>
      `/categories/${category_id}/business`,
    UPDATE: (id: string | number) => `/business/categories/${id}`,
    DELETE: (id: string | number) => `/business/categories/${id}`,
  },
  BUSINESS_CUISINE: {
    GET_MY_ICONIC_DELICACY_CUISINES: "/iconic-delicacies/my-cuisine-categories",
    ADD_ICONIC_DELICACY_CUISINES: "/iconic-delicacies/select-cuisine/category",
    REMOVE_ICONIC_DELICACY_CUISINES: "/iconic-delicacies/remove-cuisine-category",
    GET_ALL_ICONIC_DELICACY_CUISINES: "/iconic-delicacies/cuisine/categories",
    GET_MY_BUFFET_CUISINES: "/buffet/my-cuisine-categories",
    ADD_BUFFET_CUISINES: "/buffet/select-cuisine/category",
    REMOVE_BUFFET_CUISINES: "/buffet/remove-cuisine-category",
    GET_ALL_BUFFET_CUISINES: "/buffet/cuisine/categories",
  },
  FINE_DINING_MENU_ORDERS: {
    GET_MENU_CATEGORIES: "/menu/categories",
    CREATE_MENU_CATEGORIES: "/menu/categories",
    UPDATE_MENU_CATEGORY: (id: string) => `/menu/categories/${id}`,
    DELETE_MENU_CATEGORY: (id: string) => `/menu/categories/${id}`,
    CREATE_MENU_ITEM: "/menu/items",
    UPDATE_MENU_ITEM: (id: string) => `/menu/items/${id}`,
    DELETE_MENU_ITEM: (id: string) => `/menu/items/${id}`,
    RESTOCK_MENU_ITEM: (id: string) => `/menu/items/${id}/stock`,
    CREATE_ORDER: "/orders",
    GET_ALL_ORDERS: "/orders",
    MARK_ORDER_AS_PAID: (id: string) => `/orders/${id}/pay`,
    GET_KITCHEN_TICKETS: (status?: string) => `/kitchen/tickets${status ? `?status=${status}` : ''}`,
    UPDATE_KITCHEN_TICKET_STATUS: (id: string) => `/kitchen/items/${id}/status`,
  },
  LOCATION: {
    GET_ALL: "/location",
    CREATE: "/location",
    GET_ONE: (id: string | number) => `/location/${id}`,
    UPDATE: (id: string | number) => `/location/${id}`,
    DELETE: (id: string | number) => `/location/${id}`,
  },
  MESSAGING: {
    GET_ALL: "/business/messaging/conversations",
    GET_SINGLE: (id: string | number) => `/business/messaging/conversations/${id}`,
    SEND_MESSAGE: (id: string | number) => `/business/messaging/conversations/${id}/messages`,
    SEND_FIRST_MESSAGE: `/business/messaging/conversations/messages`
  },
  ORDER_OPTIONS: {
    GET_ALL: "/iconic-delicacies/available-order-options",
    GET_MY_ORDER_OPTIONS: "/iconic-delicacies/order-options/",
    UPDATE_ORDER_OPTION: (id: string) => `/iconic-delicacies/order-options/${id}`,
    ENABLE_ORDER_OPTION: (id: string) => `/iconic-delicacies/order-options/${id}/enable`,
    DISABLE_ORDER_OPTION: (id: string) => `/iconic-delicacies/order-options/${id}/disable`,
  },
  USER: {
    EXPERIENCE_CREATE: "/user/experience",
    EXPERIENCES_GET: "/user/expriences",
    EXPERIENCE_DELETE: (experienceId: string) =>
      `/users/experience/${experienceId}`,
    EXPERIENCE_DELETE_ALT: (experienceId: string) =>
      `/user/experience/${experienceId}`,
    USERS_GET_ALL: "/users",
    USER_GET_BY_ID: (id: string) => `/user/${id}`,
    USERS_FILTER: "/users/filter",
  },
  PAYMENT: {
    SET_PIN: "/payment-pin/set",
    CHANGE_PIN: "/payment-pin/change",
  },
  MEDIA: {
    GET_ALL: `/uploads/business`,
    GET_ONE: (mediaId: string | number) => `/uploads/business/${mediaId}`,
    UPLOAD_MEDIA: `/uploads/business/`,
    DELETE_MEDIA: (id: string | number) => `/uploads/business/${id}`,
  },
  DEFAULTS: {
    BANKS_GET_ALL: "https://api.paystack.co/bank",
  },
  PAYOUTS: {
    BANK_ACCOUNTS: {
      CREATE: "/payouts/bank-accounts",
      GET_ALL: "/payouts/bank-accounts",
      SET_PRIMARY: (id: string) => `/payouts/bank-accounts/${id}/primary`,
    },
    BANKS: "/payouts/banks",
    ESTIMATED: "/payouts/estimated",
    PAYOUT_CONFIG: "/payouts/payout-config",
    SETTLEMENTS: "/payouts/settlements",
    SIMULATION: {
      PREPARE: "/payouts/simulation/prepare",
      PROCESS_NOW: "/payouts/simulation/process-now",
      TRIGGER_CRON: "/payouts/simulation/trigger-cron",
    },
  },
  OPERATING_DAYS: {
    CREATE: "/operating-days",
    GET_ALL: "/operating-days",
    BUSINESS_OP_DAYS: "/business/operating-days",
    GET_ONE: (dayId: string) => `/operating-days/${dayId}`,
    UPDATE_BUSINESS_OP_DAYS: (dayId: string) => `/operating-days/${dayId}`,
    DELETE_BUSINESS_OP_DAYS: (dayId: string) => `/operating-days/${dayId}`,
  },
  BLACKOUT_DAYS: {
    CREATE: "/create-blackout",
    GET_ALL: "/blackouts",
    BUSINESS_BLACKOUT: "/business/blackoutdays",
    GET_ONE: (blackout_id: string) => `/blackouts/${blackout_id}`,
    UPDATE_BUSINESS_BLACKOUT: (blackout_id: string) =>
      `/business/blackoutday/${blackout_id}`,
    DELETE_BUSINESS_BLACKOUT: (blackout_id: string) =>
      `/business/blackoutday/${blackout_id}`,
  },
  REVIEW: {
    // Core review endpoints
    CREATE: "/reviews",
    GET_BY_BUSINESS: (businessId: string) => `/reviews/business/${businessId}`,
    GET_ONE: (reviewId: string) => `/reviews/${reviewId}`,
    UPDATE: (reviewId: string) => `/reviews/${reviewId}`,
    DELETE: (reviewId: string) => `/reviews/${reviewId}`,
    TOGGLE_DISPLAY: (reviewId: string) => `/reviews/${reviewId}/toggle_display`,
    GET_AVERAGE_RATING: (businessId: string) =>
      `/reviews/business/${businessId}/average_rating`,

    // Comment endpoints
    ADD_COMMENT: (reviewId: string) => `/reviews/${reviewId}/comments`,
    GET_COMMENTS: (reviewId: string) => `/reviews/${reviewId}/comments`,
    UPDATE_COMMENT: (commentId: string) => `/reviews/comments/${commentId}`,
    DELETE_COMMENT: (commentId: string) => `/reviews/comments/${commentId}`,

    // Reaction endpoints
    ADD_REACTION: (reviewId: string) => `/reviews/${reviewId}/reactions`,
    GET_REACTIONS: (reviewId: string) => `/reviews/${reviewId}/reactions`,
    REMOVE_REACTION: (reactionId: string) => `/reviews/reactions/${reactionId}`,
  },
  SHARED_ACTIVITIES: {
    GET_LIKES: "/business/likes",
    GET_SHARES: "/business/shares",
    GET_SHARED_EXPERIENCES: "/business/shared-experiences",
  },
  FINE_DINING_MENU: {
    CREATE: "/menu/create/fine_dining",
    UPDATE: (id: string | number) => `/menu/fine_dining/${id}`,
    GET_ONE: (id: string | number) => `/menu/fine_dining/${id}`,
    GET_BUSINESS_MENUS: "/menu/business/fine_dinings",
    DELETE: (id: string | number) => `/menu/business/fine_dining/${id}`,
    GET_ALL: "/menu/fine_dinings",
  },
  FINEDINING_CUISINE: {
    LIST: "/cuisine/categories",
    MY: "/my-cuisine-categories",
    CATEGORIES: "/cuisine/categories",
    SELECT_CATEGORY: "/select-cuisine/category",
    REMOVE_CATEGORY: "/remove-cuisine-category",
    GET_SELECTED_CATEGORIES: "/business/cuisine-category",
    GET_CATEGORY: (id: string | number) =>
      `/v1/business/cuisine-category/${id}`,
  },
  // New Business Experience Endpoints
  BUSINESS_EXPERIENCE: {
    // Public endpoints for experiences
    GENERAL: "/experiences",
    CREATE: "/create-experience",
    GET_ALL: "/experiences",
    GET_ONE: (experience_id: string | number) =>
      `/experiences/${experience_id}`,
    UPDATE: (experience_id: string | number) => `/experiences/${experience_id}`,
    DELETE: (experience_id: string | number) => `/experiences/${experience_id}`,
  },
  // Service Offering Endpoints
  SERVICE_OFFERING: {
    // Category endpoints
    GET_BUSINESS_MENUS: "/business/menus",
    CREATE_CATEGORY: "/servicecategory",
    CREATE_DEFAULT_CATEGORY: "/defaultcategory",
    UPDATE_CATEGORY: (categoryId: string) => `/service-category/${categoryId}`,
    DELETE_CATEGORY: (categoryId: string) => `/service-category/${categoryId}`,

    // Service Item endpoints
    CREATE_SERVICE_ITEM: "/category/item",
    UPDATE_SERVICE_ITEM: (itemId: string) => `/service-item/${itemId}`,
    DELETE_SERVICE_ITEM: (itemId: string) => `/service-item/${itemId}`,

    // Accommodation endpoints
    GET_ACCOMMODATION: (id: string) => `/accomodations/${id}`,
    GET_BUSINESS_ACCOMMODATIONS: () => `/accomodations/business`,
    CREATE_ACCOMMODATION: "/create-accommodation",
    UPDATE_ACCOMMODATION: (id: string) => `/accomodations/${id}`,
    DELETE_ACCOMMODATION: (id: string) => `/accomodation/${id}`,

    // Attraction endpoints
    GET_ALL_ATTRACTIONS: "/business/attractions",
    GET_ATTRACTION: (id: string) => `/attractions/${id}`,
    CREATE_ATTRACTION: "/create_attraction/business",
    UPDATE_ATTRACTION: (id: string) => `/attraction/${id}/update`,
    DELETE_ATTRACTION: (id: string) => `/attraction/${id}/delete`,
    TOGGLE_ATTRACTION_STATUS: (id: string) => `/toggle_attraction/${id}`,

    CREATE_ICONIC_DEL_ATTRACTION_ATTRIBUTE: "/iconic-delicacies/attractions/attributes",
    GET_ALL_ICONIC_DEL_ATTRACTION_ATTRIBUTE: "/iconic-delicacies/attractions/attributes",

    CREATE_ICONIC_DEL_ATTRACTION_SPORT: "/iconic-delicacies/attractions/sports",
    GET_ALL_ICONIC_DEL_ATTRACTION_SPORT: "/iconic-delicacies/attractions/sports",

    CREATE_BUFFET_ATTRACTION_ATTRIBUTE: "/buffet/attractions/attributes",
    GET_ALL_BUFFET_ATTRACTION_ATTRIBUTE: "/buffet/attractions/attributes",

    CREATE_BUFFET_ATTRACTION_SPORT: "/buffet/attractions/sports",
    GET_ALL_BUFFET_ATTRACTION_SPORT: "/buffet/attractions/sports",

  },

  ACCOMMODATIONS: {
    UPLOAD_IMAGES: "/upload-images", //Upload images and get URLs back to use in create-accommodation endpoint images array of File
    CREATE: "/create-accommodation", // Create accommodation with attractions for Beaches and Resort, Shortlets Homes businesses
    GET_ONE: (id: string | number) => `/accomodations/${id}`,
    GET_BUSINESS: () => `/accomodations/business`, //Endpoint to get business accomodations
    UPDATE: (id: string | number) => `/accomodations/${id}`,
    PATCH: (id: string | number) => `/accomodations/${id}`,
    DELETE: (id: string | number) => `/accomodation/${id}`,

    CATEGORIES: {
      GET_ALL: "/accommodation-categories", // Get all accommodation categories
      CREATE: "/accommodation-categories",
      UPDATE: (id: string | number) => `/accommodation-categories/${id}`,
      DELETE: (id: string | number) => `/accommodation-categories/${id}`,
      GET_PUBLIC: "/public/accommodation-categories",
    },

    PUBLIC: {
      GET_ALL: "/public/accommodations",
      GET_BY_BUSINESS: (businessId: string | number) =>
        `/public/business/${businessId}/accommodations`,
      GET_BY_CATEGORY: (categoryId: string | number) =>
        `/public/accommodations/category/${categoryId}`,
      GET_DEFAULT_ATTRACTIONS: "/public/default-attractions",
      GET_CATEGORIES: "/public/accommodation-categories",
    },
  },

  AVAILABILITY: {
    // Buffet category availability endpoints
    GET_ALL: "/category/availability",
    GET_BY_CATEGORY: (categoryId: string) =>
      `/category/availability/${categoryId}`,
    UPDATE: (availabilityId: string) =>
      `/category/availability/${availabilityId}`,
  },

  TABLE_MANAGEMENT: {
    UPDATE_BOOKING_RULES: "/inventory/booking-rules",
    CREATE_BULK_TABLE: "/inventory/tables/bulk",
    GET_DAY_GRID: (day: string) => `/dashboard/grid/day?date=${day}`,
    GET_TABLE_VIEW: (day: string) => `/dashboard/reservations/table-view?date=${day}`,
    GET_WEEK_GRID: ({ start_date, end_date }: { start_date: string; end_date: string }) => `/dashboard/grid/week?start_date=${start_date}&end_date=${end_date}`,
    GET_INSIGHTS: ({ start_date, end_date }: { start_date: string; end_date: string }) => `/dashboard/grid/insights?start_date=${start_date}&end_date=${end_date}`,
    GET_AVAILABLE_TABLES: ({ date, start_time, end_time, party_size }: { date: string; start_time: string; end_time: string; party_size: string }) => `/dashboard/reservations/available-tables?date=${date}&start_time=${start_time}&end_time=${end_time}&party_size=${party_size}`,
    MAKE_RESERVATION: "/dashboard/reservations/book",
    MAKE_EXTERNAL_RESERVATION: "/dashboard/reservations/external",
    CHECK_HAS_TABLE_STATUS: "/dashboard/reservations/has-tables",
    GET_ALL_TABLES: "/inventory/tables",
    ADD_TABLE: "/inventory/tables",
    UPDATE_TABLE: (table_id: string) => `/inventory/tables/${table_id}`,
    DELETE_TABLE: (table_id: string) => `/inventory/tables/${table_id}`,
    GET_RESERVATIONS: ({ date, start_time, end_time, table_id }: { date: string; start_time: string; end_time: string; table_id?: string }) => `/dashboard/reservations/range?date=${date}&start_time=${start_time}&end_time=${end_time}${table_id ? `&table_id=${table_id}` : ''}`,
    BLOCK_SLOT: `/dashboard/reservations/block`,
    UNBLOCK_SLOT: (id: string) => `/dashboard/reservations/block/${id}`,
    UPDATE_DATE_TABLE_QUANTITY: "/inventory/tables/state/quantity",
  },

  BUSINESS_ACTIVITY: {
    CREATE: "/business/activity",
    GET_BUSINESS_ACTIVITIES: "/business/activities",
    GET_ONE: (id: string | number) => `/${id}`,
    UPDATE: (activityId: string) => `/business/activities/${activityId}`,
    DELETE: (activityId: string) => `/business/activities/${activityId}`,
    DELETE_IMAGE: (imageId: string) => `/business/activity/${imageId}`,
  },

  BUSINESS_TICKETS: {
    CREATE: "/businessticket/business/ticket",
    GET_ALL: "/businessticket/business/tickets",
    GET_ONE: (ticketId: string) =>
      `/businessticket/business/tickets/${ticketId}`,
    UPDATE: (ticketId: string) =>
      `/businessticket/business/tickets/${ticketId}`,
    DELETE: (ticketId: string) =>
      `/businessticket/business/tickets/${ticketId}`,
  },

  // Transaction Information endpoints
  TRANSACTION_SETTINGS: {
    // Admin endpoints
    CREATE: "/transaction-information",
    GET_ALL: "/transaction-information", // Used for both admin list and available charges
    GET_ONE: (id: string) => `/transaction-information/${id}`,
    DELETE: (id: string) => `/transaction-information/${id}`,
    UPDATE_USER_DISCOUNT: "/transaction-information/admin/user-discount",
    UPDATE_USER_CHARGE: "/transaction-information/business/charge/percentage",

    // Business endpoints
    BUSINESS_CHARGES: "/transaction-information/business/charge-types",
    UPDATE_BUSINESS_DISCOUNT: "/transaction-information/business/discount",
    TOGGLE_BUSINESS_CHARGE: "/transaction-information/business/charge/toggle", // Used for both toggling and selecting charges
  },
  CANCELLATION_POLICIES: {
    CREATE: "/cancellation-policies/business",
    GET_ALL: "/cancellation-policies/business",
    GET_ONE: (id: string) => `/cancellation-policies/business/${id}`,
    UPDATE: (id: string) => `/cancellation-policies/business/${id}`,
    DELETE: (id: string) => `/cancellation-policies/business/${id}`,
  },
  OCCASIONS: {
    CREATE: "/occasions/business",
    GET_ALL: "/occasions/business",
    GET_ONE: (id: string) => `/occasions/business/${id}`,
    UPDATE: (id: string) => `/occasions/business/${id}`,
    DELETE: (id: string) => `/occasions/business/${id}`,
  },
  EVENTS: {
    // CRUD operations
    CREATE: "/events/create",
    GET_ALL: "/events",
    GET_ONE: (id: string | number) => `/events/${id}`,
    UPDATE: (id: string | number) => `/events/${id}`,
    DELETE: (id: string | number) => `/events/${id}`,

    // Business specific
    GET_BUSINESS_EVENTS: "/events/business",
    GET_BUSINESS_UPCOMING: "/events/business/upcoming-events",

    // Public queries
    GET_UPCOMING: "/events/upcoming-event",
    GET_BY_TYPE: "/events", // Uses query params

    // Tickets
    GET_TICKETS: (eventId: string | number) => `/events/${eventId}/tickets`,

    // AI Flyer Generation
    GENERATE_FLYER: "/events/generate-flyers",
  },
  EVENT_RESERVATION: {
    CREATE: `/eventreservation`,
    GET_ALL: (eventId: string) => `/eventreservation/${eventId}`,
    UPDATE: (reservationId: string) => `/eventreservation/${reservationId}`,
    DELETE: (reservationId: string) => `/eventreservation/${reservationId}`,
  },
  // Buffet Reservations
  BUFFET_RESERVATIONS: {
    CREATE: "/buffet-reservations",
    VERIFY_PAYMENT: (reference_id: string) =>
      `/buffet-reservations/verify-payment/${reference_id}`,
    GET_BUSINESS_RESERVATIONS: "/buffet-reservations/business",
    GET_ONE: (id: string) => `/buffet-reservations/business/${id}`,
  },
  NOTIFICATIONS: {
    REGISTER_TOKEN: "/notifications/register/token",
    REMOVE_USER_TOKENS: "/notifications/tokens",
    GET_ALL: "/notifications/all",
    GET_UNREAD_COUNT: "/notifications/unread/count",
    GET_BY_TYPE: (type: string) => `/notifications/type/${type}`,
    MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_AS_READ: "/notifications/mark-all/read",
    DELETE: (id: string) => `/notifications/${id}`,
    // Admin notification endpoints
    SEND_ORDER_UPDATE: "/notifications/order-update",
    SEND_EVENT_REMINDER: "/notifications/event-reminder",
    SEND_RESERVATION_CONFIRMATION: "/notifications/reservation-confirmation",
  },
  GOOGLE_PLACES: {
    AUTOCOMPLETE: "/google-places/autocomplete",
    DETAILS: (placeId: string) => `/google-places/details/${placeId}`,
    NEARBY: "/google-places/nearby",
    REVERSE_GEOCODE: "/google-places/reverse-geocode",
  },

  // Nightlife Endpoints
  NIGHTLIFE: {
    // Reservations
    RESERVE_BAR: "/nightlife/reservations/bar",
    RESERVE_LOUNGE: "/nightlife/reservations/lounge",
    GET_RESERVATIONS: "/nightlife/reservations",
    GET_RESERVATION: (id: string) => `/nightlife/reservations/${id}`,
    UPDATE_RESERVATION: (id: string) => `/nightlife/reservations/${id}`,
    DELETE_RESERVATION: (id: string) => `/nightlife/reservations/${id}`,

    // Events
    CREATE_EVENT: "/nightlife/events",
    GET_EVENTS: "/nightlife/events",
    GET_EVENT: (id: string) => `/nightlife/events/${id}`,
    UPDATE_EVENT: (id: string) => `/nightlife/events/${id}`,
    DELETE_EVENT: (id: string) => `/nightlife/events/${id}`,

    // Profile
    GET_PROFILE: "/nightlife/profile",
    UPDATE_PROFILE: "/nightlife/profile",

    // Business Operations
    GET_BUSINESSES: "/nightlife/businesses",
    GET_MY_RESERVATIONS: "/nightlife/my-reservations",

    // Admin
    ADMIN_GET_BUSINESSES: "/nightlife/admin/businesses",
    ADMIN_APPROVE_BUSINESS: (businessId: string) =>
      `/nightlife/admin/approve/${businessId}`,
    ADMIN_GET_ANALYTICS: "/nightlife/admin/analytics",
    ADMIN_POST_FEATURE: (businessId: string) =>
      `/nightlife/admin/feature/${businessId}`,
    ADMIN_DELETE_CONTENT: (id: string) => `/nightlife/admin/content/${id}`,
  },

  // QR CODE ENDPOINTS
  QRCODE: {
    GENERATE: "/qrcode/generate",
    SCAN: "/qrcode/scan",
    GET_MY_QRS: "/qrcode/my-qrs",
    GET_SCAN_HISTORY: "/qrcode/scan-history",
    GET_STATUS: (id: string) => `/qrcode/${id}/status`,
    REGENERATE: (id: string) => `/qrcode/${id}/regenerate`,
  },

  // DELIVERY ENDPOINTS
  DELIVERY: {
    // Delivery Zones
    CREATE_ZONE: "/delivery/zones",
    GET_ZONES: "/delivery/zones",
    GET_ZONE: (id: string) => `/delivery/zones/${id}`,
    UPDATE_ZONE: (id: string) => `/delivery/zones/${id}`,
    DELETE_ZONE: (id: string) => `/delivery/zones/${id}`,

    // Delivery Riders
    CREATE_RIDER: "/delivery/riders",
    GET_RIDERS: "/delivery/riders",
    GET_RIDER: (id: string) => `/delivery/riders/${id}`,
    UPDATE_RIDER: (id: string) => `/delivery/riders/${id}`,
    DELETE_RIDER: (id: string) => `/delivery/riders/${id}`,
    UPDATE_RIDER_STATUS: (id: string) => `/delivery/riders/${id}`,

    // Delivery Orders
    GET_ORDERS: "/delivery/orders",
    GET_ORDER: (id: string) => `/delivery/orders/${id}`,
    ASSIGN_RIDER: "/delivery/orders/assign",
    UPDATE_ORDER_STATUS: (id: string) => `/delivery/orders/${id}`,

    // Delivery Analytics
    GET_ANALYTICS: "/delivery/analytics",
    GET_ANALYTICS_STATS: "/delivery/analytics/stats",
  },

  // FILTERS ENDPOINTS
  FILTERS: {
    AVAILABLE: "/filters/business/available",
    BUSINESS: "/filters/business",
    REPLACE: "/filters/business",
  },

  // CLUB ENDPOINTS
  CLUB: {
    MANAGEMENT: "/club-management",
    MANAGEMENT_UPDATE: (id: string) => `/club-management/${id}`,
    MANAGEMENT_DELETE: (id: string) => `/club-management/${id}`,
    RESERVATIONS_CREATE: "/club-reservations",
    RESERVATIONS_GET_ALL: "/club-reservations",
    RESERVATIONS_GET_ONE: (id: string) => `/club-reservations/${id}`,
    RESERVATIONS_VERIFY_PAYMENT: (reference_id: string) =>
      `/club-reservations/verify-payment/${reference_id}`,
  },

  // PROMOTIONS ENDPOINTS
  PROMOTIONS: {
    CREATE: "/promotions/business",
    LIST: "/promotions/business",
  },

  // BUFFET OFFERINGS ENDPOINTS
  BUFFET_OFFERINGS: {
    CREATE: "/buffet-offerings",
    GET_ALL: "/buffet-offerings",
    GET_BUSINESS_OFFERINGS: "/buffet-offerings/business",
    GET_ONE: (id: string) => `/buffet-offerings/${id}`,
    UPDATE: (id: string) => `/buffet-offerings/${id}`,
    DELETE: (id: string) => `/buffet-offerings/${id}`,
    GET_BY_CATEGORY: (categoryId: string) =>
      `/buffet-offerings/category/${categoryId}`,
  },

  // BRANCHES ENDPOINTS
  BRANCHES: {
    CREATE: "/branches",
    GET_ALL: "/branches",
    GET_ONE: (id: string) => `/branches/${id}`,
    UPDATE: (id: string) => `/branches/${id}`,
    DELETE: (id: string) => `/branches/${id}`,
    TOGGLE_ACTIVE: (id: string) => `/branches/${id}/toggle-active`,
    GET_MENU_ITEMS: (id: string) => `/branches/${id}/menu-items`,
    LINK_MENU_ITEMS: (id: string) => `/branches/${id}/menu-items`,
    UPDATE_MENU_ITEMS: (branchId: string, itemId: string) =>
      `/branches/${branchId}/menu-items/${itemId}`,
    UNLINK_MENU_ITEMS: (branchId: string, itemId: string) =>
      `/branches/${branchId}/menu-items/${itemId}`,
  },
} as const;
