import type { BeachesResortData } from "@/types/beaches-resort";

export const beachesResortData: BeachesResortData = {
  visitingTickets: {
    ticketTypes: [
      {
        id: 1,
        name: "Gold for adult",
        price: "₦10,000",
        type: "adult" as const,
      },
      {
        id: 2,
        name: "Gold for children",
        price: "₦5,000",
        type: "children" as const,
      },
      {
        id: 3,
        name: "Diamond for children",
        price: "₦25,000",
        type: "children" as const,
      },
      {
        id: 4,
        name: "Diamond for adult",
        price: "₦50,000",
        type: "adult" as const,
      },
      {
        id: 5,
        name: "Premium for adults",
        price: "₦20,000",
        type: "adult" as const,
      },
      {
        id: 6,
        name: "Platinum for children",
        price: "₦10,000",
        type: "children" as const,
      },
    ],
    guestSizes: [
      { id: 1, name: "Individual (1-3)", active: true },
      { id: 2, name: "Group of 10", active: false },
      { id: 3, name: "Group of 20", active: false },
      { id: 4, name: "Group of 30", active: false },
      { id: 5, name: "Group of 50", active: false },
    ],
  },
  upcomingEvents: [
    {
      id: 1,
      name: "Bonfire Nights",
      agenda: "Agenda",
      date: "Date",
      time: "Time",
      venue: "Venue",
      tickets: "Tickets",
    },
    {
      id: 2,
      name: "Games Night",
      agenda: "Agenda",
      date: "Date",
      time: "Time",
      venue: "Venue",
      tickets: "Tickets",
    },
  ],
  activities: [
    {
      id: 1,
      name: "Kayaking",
      image:
        "https://images.pexels.com/photos/13566121/pexels-photo-13566121.jpeg",
      description:
        "In the tranquil embrace of nature, where the rhythm of the waters dictates the pace, lies the art of kayaking. With each stroke of the paddle, a symbiotic dance unfolds between man and the liquid canvas beneath.",
      pricing: [
        {
          priceAdult: "3,000 per adult",
          priceChild: "2,000 per child",
          time: "1 hour",
        },
        {
          priceAdult: "7,000 per adult",
          priceChild: "5,000 per child",
          time: "3 hours",
        },
        {
          priceAdult: "12,000 per adult",
          priceChild: "8,000 per child",
          time: "5 hours",
        },
      ],
    },
    {
      id: 2,
      name: "Boat riding",
      image: "https://images.unsplash.com/photo-1493558103817-58b2924bce98",
      description:
        "Experience the thrill of boat riding across pristine waters with stunning ocean views.",
      pricing: [
        {
          priceAdult: "5,000 per adult",
          priceChild: "3,000 per child",
          time: "1 hour",
        },
        {
          priceAdult: "10,000 per adult",
          priceChild: "7,000 per child",
          time: "3 hours",
        },
      ],
    },
    {
      id: 3,
      name: "Quad Biking",
      image:
        "https://images.pexels.com/photos/4996780/pexels-photo-4996780.jpeg",
      description:
        "Adventure through scenic coastal trails on powerful quad bikes with breathtaking views.",
      pricing: [
        {
          priceAdult: "8,000 per adult",
          priceChild: "5,000 per child",
          time: "2 hours",
        },
        {
          priceAdult: "15,000 per adult",
          priceChild: "10,000 per child",
          time: "4 hours",
        },
      ],
    },
    {
      id: 4,
      name: "Horse riding",
      image:
        "https://images.unsplash.com/photo-1600715151005-e6d44b9ef840?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description:
        "Enjoy peaceful horse riding sessions along beautiful beach landscapes and coastal trails.",
      pricing: [
        {
          priceAdult: "6,000 per adult",
          priceChild: "4,000 per child",
          time: "1 hour",
        },
        {
          priceAdult: "12,000 per adult",
          priceChild: "8,000 per child",
          time: "2 hours",
        },
      ],
    },
  ],
  accommodations: [
    {
      id: 1,
      name: "One bedroom apartment",
      images: "Images+",
      availability: "Monday-Sunday",
      description: "Description",
    },
    {
      id: 2,
      name: "Two bedroom apartment",
      images: "Images+",
      availability: "Monday-Sunday",
      description: "Description",
    },
    {
      id: 3,
      name: "Three bedroom apartment",
      images: "Images+",
      availability: "Monday-Sunday",
      description: "Description",
    },
  ],
  attractions: [
    { id: 1, name: "Entire apartment", enabled: true },
    { id: 2, name: "Free Wifi", enabled: false },
    { id: 3, name: "Air conditioning", enabled: true },
    { id: 4, name: "Free Breakfast", enabled: false },
    { id: 5, name: "Beautiful view", enabled: true },
    { id: 6, name: "Maximum Security", enabled: true },
  ],
  transactionInfo: {
    vat: true,
    serviceCharge: false,
    discountAllocated: { enabled: true, value: "20% Discount" },
  },
};

// export const accommodations: ICreateAccommodationDto[] = [
//   {
//     apartment_name: "Seaside Escape Villa",
//     apartment_type: "Villa",
//     maximum_occupants: 6,
//     price_per_night: 45000,
//     apartment_description: "A luxurious villa with stunning ocean views, modern amenities, and beach access.",
//     attractions: [
//       {
//         attraction_name: "Sunset Beach",
//         is_active: true,
//       },
//       {
//         attraction_name: "Oceanview Cliff",
//         is_active: true,
//       },
//     ],
//   },
//   {
//     apartment_name: "Cozy Studio Apartment",
//     apartment_type: "Studio",
//     maximum_occupants: 2,
//     price_per_night: 18000,
//     apartment_description: "A compact and comfortable studio perfect for solo travelers or couples.",
//   },
//   {
//     apartment_name: "Mountain Retreat Lodge",
//     apartment_type: "Lodge",
//     maximum_occupants: 8,
//     price_per_night: 60000,
//     apartment_description: "A spacious lodge nestled in the mountains, ideal for family getaways or group trips.",
//     attractions: [
//       {
//         attraction_name: "Historic Lighthouse",
//         is_active: false,
//       },
//     ],
//   },
// ];

// export const attractions: IAttraction[] = [
//   {
//     id: "attr-1",
//     attraction_name: "Sunset Beach",
//     is_active: true,
//   },
//   {
//     id: "attr-2",
//     attraction_name: "Oceanview Cliff",
//     is_active: true,
//   },
//   {
//     id: "attr-3",
//     attraction_name: "Historic Lighthouse",
//     is_active: false,
//   },
// ];
