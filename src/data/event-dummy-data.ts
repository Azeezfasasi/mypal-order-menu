import { ContextType, EventClass, EventType } from "@/types/enums";

const eventTitles = [
  "Summer Music Festival",
  "Tech Conference 2025",
  "Food & Wine Expo",
  "Art Gallery Opening",
  "Yoga & Wellness Retreat",
  "Business Networking Summit",
  "Cultural Dance Night",
  "Photography Workshop",
  "Gaming Tournament",
  "Fashion Show",
  "Hot Barbecue Party",
  "Sweet Treats Saturday",
  "Abuja Coffee Morning",
  "Street Food Carnival",
  "Startup Pitch Night",
  "Family Movie Night",
  "Book Lovers Meetup",
  "Charity Run Lagos",
  "Tech for Teens Workshop",
  "Artisan Market Day",
];

const locations = [
  "Grand Ballroom, Hilton Hotel",
  "Convention Center, Downtown",
  "Beachfront Resort",
  "City Art Gallery",
  "Wellness Center",
  "Business Hub",
  "Community Center",
  "Photography Studio",
  "Gaming Arena",
  "Fashion District",
  "Hot Barbecue, Lagos",
  "Sweet Treats Bakery, Port Harcourt",
  "Abuja Coffee House, Abuja",
  "Lekki Street Food Park",
  "Yaba Startup Hub",
  "Victoria Island Cinema",
  "Book Nook, Ikeja",
  "Lagos Marina",
  "Teens Tech Lab, Surulere",
  "Artisan Market Square, Ibadan",
];

const descriptions = [
  "Join us for an unforgettable experience featuring live performances, interactive sessions, and more!",
  "Explore the latest innovations and connect with industry leaders in this immersive event.",
  "Discover exquisite flavors and culinary masterpieces from renowned chefs.",
  "Experience a stunning collection of contemporary art pieces from emerging artists.",
  "Rejuvenate your mind and body with expert-led wellness sessions.",
  "Network with industry professionals and explore business opportunities.",
  "Celebrate diversity through traditional and modern dance performances.",
  "Learn advanced photography techniques from professional photographers.",
  "Compete in exciting gaming tournaments with amazing prizes.",
  "Witness the latest fashion trends and designer collections.",
  // New event descriptions
  "Enjoy sizzling barbecue, live music, and a fun crowd at Lagos' hottest food party!",
  "Treat yourself to delicious pastries and sweet surprises every Saturday in Port Harcourt.",
  "Start your day with fresh coffee and breakfast at Abuja's coziest new spot.",
  "Taste the best of Nigerian street food, play games, and dance at the Lekki Carnival!",
  "Pitch your startup idea, meet investors, and win prizes at Yaba's top tech event.",
  "Bring the whole family for a movie night with free popcorn and great films in Victoria Island.",
  "Meet fellow book lovers, swap stories, and enjoy readings at Ikeja's Book Nook.",
  "Run for a cause along Lagos Marina and get a free t-shirt for every participant.",
  "Teens learn coding, robotics, and win cool prizes at Surulere's tech workshop.",
  "Shop handmade crafts, taste local foods, and watch live demos at Ibadan's artisan market.",
];

const ticketTypes = [
  {
    ticket_name: "Early Bird",
    price: 49.99,
    benefits: [
      { title: "Priority Seating", description: "Reserved front-row seating" },
      { title: "Welcome Drink", description: "Complimentary welcome cocktail" },
    ],
  },
  {
    ticket_name: "VIP Access",
    price: 149.99,
    benefits: [
      {
        title: "Exclusive Lounge",
        description: "Access to premium VIP lounge area",
      },
      {
        title: "Meet & Greet",
        description: "Personal meet and greet with speakers",
      },
    ],
  },
  {
    ticket_name: "Standard Entry",
    price: 79.99,
    benefits: [
      {
        title: "General Admission",
        description: "Standard event access and seating",
      },
    ],
  },
  {
    ticket_name: "Premium Package",
    price: 199.99,
    benefits: [
      {
        title: "All Inclusive",
        description: "Complete event package with all amenities",
      },
      {
        title: "Swag Bag",
        description: "Exclusive merchandise and branded items",
      },
    ],
  },
];

const benefits = [
  { title: "Parking", description: "Free parking available" },
  {
    title: "Refreshments",
    description: "Complimentary refreshments throughout the event",
  },
  {
    title: "Merchandise",
    description: "Exclusive event merchandise and swag bag",
  },
  { title: "Networking", description: "Professional networking opportunities" },
  { title: "Certificate", description: "Certificate of participation" },
  { title: "Photography", description: "Professional photo opportunities" },
  {
    title: "VIP Access",
    description: "Access to VIP lounge and premium areas",
  },
  { title: "Meals", description: "Complimentary breakfast, lunch, and snacks" },
];

const agendaItems = [
  {
    title: "Opening Ceremony",
    description:
      "Welcome address and event overview with keynote speaker introduction",
    agendaType: ContextType.EVENT,
    event_id: "",
  },
  {
    title: "Keynote Session",
    description:
      "Inspiring presentation from industry leaders on current trends and future outlook",
    agendaType: ContextType.EVENT,
    event_id: "",
  },
  {
    title: "Interactive Workshop",
    description:
      "Hands-on learning experience with practical exercises and group activities",
    agendaType: ContextType.EVENT,
    event_id: "",
  },
  {
    title: "Networking Break",
    description:
      "Refreshment break with opportunities to connect and exchange ideas",
    agendaType: ContextType.EVENT,
    event_id: "",
  },
  {
    title: "Panel Discussion",
    description:
      "Expert panel discussing industry challenges and innovative solutions",
    agendaType: ContextType.EVENT,
    event_id: "",
  },
  {
    title: "Closing Ceremony",
    description: "Event wrap-up with key takeaways and next steps announcement",
    agendaType: ContextType.EVENT,
    event_id: "",
  },
];

export function getRandomDummyEvent() {
  const index = Math.floor(Math.random() * eventTitles.length);
  const isExclusive = Math.random() > 0.5;

  // Randomly select from all three event types
  const eventTypes = [
    EventType.TICKET,
    EventType.RESERVATION,
    EventType.INFORMATIVE,
  ];
  const randomEventType =
    eventTypes[Math.floor(Math.random() * eventTypes.length)];

  // Generate random dates
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30)); // Random date within next 30 days
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3)); // 1-3 days duration

  // Random selection for image preference (slightly biased towards upload)
  const imagePreference = Math.random() > 0.3 ? "upload" : "generate";

  // Improved flyer prompt using event data and realistic styles
  const flyerPrompts = [
    // Lagos food business example
    "Create a visually engaging mobile-friendly flyer for a Lagos-based food business.\nOffer: 'Hot Barbecue' is giving a 25% discount on smoked guinea fowl and fresh palm wine purchases throughout May 2025.\nTone & Style: Trendy, vibrant, and appealing to a broad age range (15–70). Use imagery or colors that reflect Nigerian street food culture, with a fun and welcoming vibe.\nBenefit Highlight: Add a compelling section that says:\n'Make 4 purchases this May and become a member for the next quarter! Enjoy FREE access to the exclusive Hot Barbecue Party every last Friday for the next 3 months.'\nCall to Action: Include a mobile app-focused CTA like:\n'Order now on the app!' or 'Tap to Buy!'\nFooter Info: Add business name (Hot Barbecue), Lagos location tag, and a prompt like 'Available in Lagos only'.",
    // Bakery example
    "Design a flyer for a Port Harcourt bakery.\nOffer: 10% off all pastries every Saturday in June.\nStyle: Bright, cheerful, and family-friendly.\nCTA: 'Order fresh pastries now!'\nFooter: 'Sweet Treats Bakery, Port Harcourt'",
    // Coffee shop example
    "Create a simple flyer for a new Abuja coffee shop.\nOffer: Free small coffee with every breakfast order in July.\nStyle: Minimal, cozy, and modern.\nCTA: 'Get your free coffee!'\nFooter: 'Abuja Coffee House'",
    // Street food carnival
    "Make a vibrant flyer for a Lagos street food carnival.\nHighlight: Local delicacies, live music, and games.\nStyle: Colorful, energetic, and festive.\nCTA: 'Join the Carnival!'\nFooter: 'Lekki Street Food Park'",
    // Startup pitch night
    "Create a sleek flyer for a Yaba Startup Pitch Night.\nOffer: Win seed funding and mentorship.\nStyle: Modern, tech-inspired, and bold.\nCTA: 'Pitch your idea!'\nFooter: 'Yaba Startup Hub'",
    // Family movie night
    "Design a cozy flyer for Family Movie Night at Victoria Island Cinema.\nOffer: Free popcorn for kids.\nStyle: Warm, playful, and inviting.\nCTA: 'Book your seats!'\nFooter: 'Victoria Island Cinema'",
    // Book lovers meetup
    "Create a flyer for Book Lovers Meetup in Ikeja.\nHighlight: Author readings, book swaps, and coffee.\nStyle: Literary, relaxed, and friendly.\nCTA: 'RSVP now!'\nFooter: 'Book Nook, Ikeja'",
    // Charity run
    "Make a dynamic flyer for Charity Run Lagos.\nOffer: Free t-shirt for all participants.\nStyle: Sporty, energetic, and motivational.\nCTA: 'Register today!'\nFooter: 'Lagos Marina'",
    // Tech for teens workshop
    "Design a flyer for Tech for Teens Workshop in Surulere.\nHighlight: Coding, robotics, and prizes.\nStyle: Youthful, fun, and techy.\nCTA: 'Sign up now!'\nFooter: 'Teens Tech Lab, Surulere'",
    // Artisan market day
    "Create a flyer for Artisan Market Day in Ibadan.\nHighlight: Handmade crafts, food stalls, and live demos.\nStyle: Artistic, colorful, and community-focused.\nCTA: 'Visit the market!'\nFooter: 'Artisan Market Square, Ibadan'",
    // Generic event flyer
    `Design a flyer for '${eventTitles[index]}' at ${locations[index]}. ${descriptions[index]} Use vibrant colors and include relevant icons or imagery.`,
    // Simple generic
    `Simple flyer for '${eventTitles[index]}': ${descriptions[index]}`,
  ];
  const flyerPrompt =
    flyerPrompts[Math.floor(Math.random() * flyerPrompts.length)];

  // Sample CTA options
  const ctaOptions = [
    "place_order",
    "make_reservation",
    "buy_tickets",
    "plain_informative",
  ];

  // Sample flyer URLs (mock AI-generated images)
  const flyerUrls = [
    "https://mipal-business-data.s3.eu-west-2.amazonaws.com/BusinessFlyer/file2025-08-08-06-58-38_1.png",
    "https://mipal-business-data.s3.eu-west-2.amazonaws.com/BusinessFlyer/file2025-08-07-06-58-48_1.png",
    "https://mipal-business-data.s3.eu-west-2.amazonaws.com/BusinessFlyer/file2025-08-08-09-35-02_1.png",
    "https://mipal-business-data.s3.eu-west-2.amazonaws.com/BusinessFlyer/file2025-08-07-06-58-48_1.png",
    "https://mipal-business-data.s3.eu-west-2.amazonaws.com/BusinessFlyer/file2025-08-10-06-29-21_1.png&w=3840&q=75",
  ];

  return {
    event_title: eventTitles[index],
    location: locations[index],
    business_name: "Sample Business",
    business_category: "Nightlife", // Added - required for API
    event_group: "clubbing", // API expects lowercase with underscores: informative, fine_dining, buffet, ticketing, clubbing
    event_type: randomEventType,
    event_class: isExclusive ? EventClass.EXCLUSIVE : EventClass.REGULAR,
    cta: "None", // Added - required for API
    main_catch: "FOOD", // Changed to enum value: FOOD, DRINKS, ACCOMMODATION, etc.
    about_main_catch: "Join us for an amazing experience", // Added
    event_gate_pass: "standard", // Added
    catchy_phrase: "Don't miss out!", // Added
    about: descriptions[index],
    is_eighten_plus: Math.random() > 0.8, // 20% chance of being 18+
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    start_time: "09:00 AM",
    end_time: "06:00 PM",
    duration: "9 hours",
    // New image preference and flyer fields
    image_preference: imagePreference,
    ...(imagePreference === "generate" && {
      flyer_prompt: flyerPrompt,
      flyer_cta: ctaOptions[Math.floor(Math.random() * ctaOptions.length)],
      flyer_url: flyerUrls[index % flyerUrls.length],
    }),
    // For ticket events, include 1-3 random ticket types
    tickets:
      randomEventType === EventType.TICKET
        ? ticketTypes
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 2) + 1)
        : [],
    // For exclusive events, include 2-4 random benefits
    benefits: isExclusive
      ? benefits
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 2) + 2)
      : [],
    // For exclusive events, include 2-3 random agenda items
    agendas: isExclusive
      ? agendaItems
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 1) + 2)
      : [],
    // Additional optional fields
    event_is_likeable: true,
    event_is_shareable: true,
    event_offer_text: "Special offer available",
    refine_description: false,
  };
}

// Function to get multiple random events
export function getMultipleRandomEvents(count: number) {
  return Array(count)
    .fill(null)
    .map(() => getRandomDummyEvent());
}
