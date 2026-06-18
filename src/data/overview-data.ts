// import { IUser } from "@/types";
// import { IBusiness } from "@/types/auth-types";
// import { BusinessCategoryType, PaymentStatus } from "@/types/enums";
// import type {
//   Reservation as ReservationData,
//   BusinessTransactionResponse,
//   Transaction,
//   TransactionList,
//   RevenueData,
//   RevenueResponse,
//   CompareRevenueData,
//   CompareRevenueResponse,
// } from "@/types/overview";

// // ============= DUMMY USERS =============
// const dummyUsers: Partial<IUser>[] = [
//   {
//     id: "user-001",
//     email: "john.doe@example.com",
//     firstname: "John",
//     lastname: "Doe",
//     phone_number: "+234-801-234-5678",
//   },
//   {
//     id: "user-002",
//     email: "jane.smith@example.com",
//     firstname: "Jane",
//     lastname: "Smith",
//     phone_number: "+234-802-345-6789",
//   },
//   {
//     id: "user-003",
//     email: "david.wilson@example.com",
//     firstname: "David",
//     lastname: "Wilson",
//     phone_number: "+234-803-456-7890",
//   },
//   {
//     id: "user-004",
//     email: "sarah.johnson@example.com",
//     firstname: "Sarah",
//     lastname: "Johnson",
//     phone_number: "+234-804-567-8901",
//   },
//   {
//     id: "user-005",
//     email: "mike.brown@example.com",
//     firstname: "Mike",
//     lastname: "Brown",
//     phone_number: "+234-805-678-9012",
//   },
// ];

// // ============= DUMMY BUSINESSES =============
// const dummyBusinesses: IBusiness[] = [
//   {
//     id: "biz-001",
//     name: "Ocean View Resort",
//     email: "info@oceanviewresort.com",
//     category: BusinessCategoryType.BEACHESRESORTS,
//   },
//   {
//     id: "biz-002",
//     name: "City Center Shortlet",
//     email: "bookings@citycentersl.com",
//     category: BusinessCategoryType.SHORTLET,
//   },
//   {
//     id: "biz-003",
//     name: "Lagos Premium Apartments",
//     email: "hello@lagospremium.com",
//     category: BusinessCategoryType.SHORTLET,
//   },
// ];

// // ============= DUMMY TRANSACTIONS =============
// const dummyTransactions: Transaction[] = [
//   {
//     id: "txn-001",
//     transaction_id: "TXN-2024-001234",
//     amount: 45000,
//     status: PaymentStatus.COMPLETED,
//     reference: "REF-OVR-20241201-001",
//     payment_method: "Card",
//     description: "Deluxe Ocean Suite - 3 nights booking",
//     createdAt: "2024-12-01T10:30:00Z",
//     updatedAt: "2024-12-01T10:35:00Z",
//     user: dummyUsers[0],
//     business: dummyBusinesses[0],
//   },
//   {
//     id: "txn-002",
//     transaction_id: "TXN-2024-001235",
//     amount: 25000,
//     status: PaymentStatus.PENDING,
//     reference: "REF-CCS-20241202-002",
//     payment_method: "Bank Transfer",
//     description: "2 Bedroom Apartment - 2 nights",
//     createdAt: "2024-12-02T14:15:00Z",
//     updatedAt: "2024-12-02T14:15:00Z",
//     user: dummyUsers[1],
//     business: dummyBusinesses[1],
//   },
//   {
//     id: "txn-003",
//     transaction_id: "TXN-2024-001236",
//     amount: 68000,
//     status: PaymentStatus.COMPLETED,
//     reference: "REF-OVR-20241203-003",
//     payment_method: "Card",
//     description: "Presidential Suite - 5 nights with breakfast",
//     createdAt: "2024-12-03T09:20:00Z",
//     updatedAt: "2024-12-03T09:25:00Z",
//     user: dummyUsers[2],
//     business: dummyBusinesses[0],
//   },
//   {
//     id: "txn-004",
//     transaction_id: "TXN-2024-001237",
//     amount: 35000,
//     status: PaymentStatus.CANCELLED,
//     reference: "REF-LPA-20241204-004",
//     payment_method: "Card",
//     description: "1 Bedroom Luxury Apartment - 4 nights",
//     createdAt: "2024-12-04T16:45:00Z",
//     updatedAt: "2024-12-04T17:00:00Z",
//     user: dummyUsers[3],
//     business: dummyBusinesses[2],
//   },
//   {
//     id: "txn-005",
//     transaction_id: "TXN-2024-001238",
//     amount: 52000,
//     status: PaymentStatus.COMPLETED,
//     reference: "REF-OVR-20241205-005",
//     payment_method: "Bank Transfer",
//     description: "Family Suite - 4 nights with full board",
//     createdAt: "2024-12-05T11:10:00Z",
//     updatedAt: "2024-12-05T11:15:00Z",
//     user: dummyUsers[4],
//     business: dummyBusinesses[0],
//   },
//   {
//     id: "txn-006",
//     transaction_id: "TXN-2024-001239",
//     amount: 18000,
//     status: PaymentStatus.COMPLETED,
//     reference: "REF-CCS-20241206-006",
//     payment_method: "Card",
//     description: "Studio Apartment - 1 night",
//     createdAt: "2024-12-06T13:30:00Z",
//     updatedAt: "2024-12-06T13:35:00Z",
//     user: dummyUsers[0],
//     business: dummyBusinesses[1],
//   },
//   {
//     id: "txn-007",
//     transaction_id: "TXN-2024-001240",
//     amount: 95000,
//     status: PaymentStatus.PENDING,
//     reference: "REF-LPA-20241207-007",
//     payment_method: "Bank Transfer",
//     description: "Penthouse Suite - 7 nights with premium services",
//     createdAt: "2024-12-07T08:45:00Z",
//     updatedAt: "2024-12-07T08:45:00Z",
//     user: dummyUsers[1],
//     business: dummyBusinesses[2],
//   },
//   {
//     id: "txn-008",
//     transaction_id: "TXN-2024-001241",
//     amount: 28000,
//     status: PaymentStatus.COMPLETED,
//     reference: "REF-OVR-20241208-008",
//     payment_method: "Card",
//     description: "Standard Room - 3 nights",
//     createdAt: "2024-12-08T15:20:00Z",
//     updatedAt: "2024-12-08T15:25:00Z",
//     user: dummyUsers[2],
//     business: dummyBusinesses[0],
//   },
//   {
//     id: "txn-009",
//     transaction_id: "TXN-2024-001242",
//     amount: 42000,
//     status: PaymentStatus.COMPLETED,
//     reference: "REF-CCS-20241209-009",
//     payment_method: "Bank Transfer",
//     description: "3 Bedroom Apartment - 3 nights",
//     createdAt: "2024-12-09T12:00:00Z",
//     updatedAt: "2024-12-09T12:05:00Z",
//     user: dummyUsers[3],
//     business: dummyBusinesses[1],
//   },
//   {
//     id: "txn-010",
//     transaction_id: "TXN-2024-001243",
//     amount: 75000,
//     status: PaymentStatus.CANCELLED,
//     reference: "REF-LPA-20241210-010",
//     payment_method: "Card",
//     description: "Executive Suite - 6 nights with spa package",
//     createdAt: "2024-12-10T10:15:00Z",
//     updatedAt: "2024-12-10T10:30:00Z",
//     user: dummyUsers[4],
//     business: dummyBusinesses[2],
//   },
//   {
//     id: "txn-011",
//     transaction_id: "TXN-2024-001244",
//     amount: 38000,
//     status: PaymentStatus.COMPLETED,
//     reference: "REF-OVR-20241211-011",
//     payment_method: "Card",
//     description: "Superior Room - 4 nights with breakfast",
//     createdAt: "2024-12-11T14:45:00Z",
//     updatedAt: "2024-12-11T14:50:00Z",
//     user: dummyUsers[0],
//     business: dummyBusinesses[0],
//   },
//   {
//     id: "txn-012",
//     transaction_id: "TXN-2024-001245",
//     amount: 22000,
//     status: PaymentStatus.PENDING,
//     reference: "REF-CCS-20241212-012",
//     payment_method: "Bank Transfer",
//     description: "1 Bedroom Apartment - 2 nights",
//     createdAt: "2024-12-12T09:30:00Z",
//     updatedAt: "2024-12-12T09:30:00Z",
//     user: dummyUsers[1],
//     business: dummyBusinesses[1],
//   },
// ];

// // ============= TRANSACTION LIST RESPONSE =============
// export const dummyTransactionList: TransactionList = {
//   data: dummyTransactions,
//   total: 12,
//   page: 0,
//   limit: 10,
// };

// export const dummyBusinessTransactionResponse: BusinessTransactionResponse = {
//   status: "success",
//   statusCode: 200,
//   message: "Business transactions retrieved successfully",
//   data: dummyTransactionList,
// };

// // ============= REVENUE DATA =============
// export const dummyRevenueData: RevenueData[] = [
//   {
//     period: "December 2024",
//     revenue: 543000,
//     count: 12,
//   },
//   {
//     period: "November 2024",
//     revenue: 687000,
//     count: 18,
//   },
//   {
//     period: "October 2024",
//     revenue: 456000,
//     count: 14,
//   },
//   {
//     period: "September 2024",
//     revenue: 612000,
//     count: 16,
//   },
//   {
//     period: "August 2024",
//     revenue: 789000,
//     count: 22,
//   },
//   {
//     period: "July 2024",
//     revenue: 834000,
//     count: 25,
//   },
// ];

// export const dummyRevenueResponse: RevenueResponse = {
//   status: "success",
//   statusCode: 200,
//   message: "Revenue data retrieved successfully",
//   data: dummyRevenueData,
// };

// // ============= COMPARE REVENUE DATA =============
// export const dummyCompareRevenueData: CompareRevenueData = {
//   current: [
//     {
//       period: "Week 1",
//       revenue: 125000,
//       count: 3,
//     },
//     {
//       period: "Week 2",
//       revenue: 189000,
//       count: 5,
//     },
//     {
//       period: "Week 3",
//       revenue: 156000,
//       count: 4,
//     },
//     {
//       period: "Week 4",
//       revenue: 203000,
//       count: 6,
//     },
//   ],
//   previous: [
//     {
//       period: "Week 1",
//       revenue: 98000,
//       count: 2,
//     },
//     {
//       period: "Week 2",
//       revenue: 145000,
//       count: 4,
//     },
//     {
//       period: "Week 3",
//       revenue: 167000,
//       count: 5,
//     },
//     {
//       period: "Week 4",
//       revenue: 178000,
//       count: 4,
//     },
//   ],
//   comparison: {
//     revenue_change: 85000,
//     count_change: 3,
//     revenue_percentage: 14.5,
//     count_percentage: 20,
//   },
// };

// export const dummyCompareRevenueResponse: CompareRevenueResponse = {
//   status: "success",
//   statusCode: 200,
//   message: "Revenue comparison data retrieved successfully",
//   data: dummyCompareRevenueData,
// };

// // ============= FILTERED DATA HELPERS =============
// export const getTransactionsByStatus = (
//   status: PaymentStatus
// ): Transaction[] => {
//   return dummyTransactions.filter((txn) => txn.status === status);
// };

// export const getTransactionsByBusiness = (
//   businessId: string
// ): Transaction[] => {
//   return dummyTransactions.filter((txn) => txn.business.id === businessId);
// };

// export const getTransactionsByDateRange = (
//   startDate: string,
//   endDate: string
// ): Transaction[] => {
//   // This is a simplified date comparison - in real implementation you'd parse the DD-MM-YY format
//   return dummyTransactions.filter((txn) => {
//     const txnDate = new Date(txn.createdAt);
//     return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
//   });
// };

// export const getTransactionsPaginated = (
//   page: number = 0,
//   limit: number = 10
// ): TransactionList => {
//   const startIndex = page * limit;
//   const endIndex = startIndex + limit;
//   const paginatedData = dummyTransactions.slice(startIndex, endIndex);

//   return {
//     data: paginatedData,
//     total: dummyTransactions.length,
//     page,
//     limit,
//   };
// };

// // ============= TRANSACTION SUMMARY STATISTICS =============
// export const getTransactionSummary = () => {
//   const completed = dummyTransactions.filter(
//     (txn) => txn.status === PaymentStatus.COMPLETED
//   );
//   const pending = dummyTransactions.filter(
//     (txn) => txn.status === PaymentStatus.PENDING
//   );
//   const cancelled = dummyTransactions.filter(
//     (txn) => txn.status === PaymentStatus.FAILED
//   );

//   const totalRevenue = completed.reduce((sum, txn) => sum + txn.amount, 0);
//   const pendingRevenue = pending.reduce((sum, txn) => sum + txn.amount, 0);

//   return {
//     total_transactions: dummyTransactions.length,
//     completed_transactions: completed.length,
//     pending_transactions: pending.length,
//     cancelled_transactions: cancelled.length,
//     total_revenue: totalRevenue,
//     pending_revenue: pendingRevenue,
//     average_transaction_value: Math.round(totalRevenue / completed.length),
//     completion_rate: Math.round(
//       (completed.length / dummyTransactions.length) * 100
//     ),
//   };
// };

// // ============= EXPORT ALL DUMMY DATA =============
// export const transactionDummyData = {
//   transactions: dummyTransactions,
//   transactionList: dummyTransactionList,
//   businessTransactionResponse: dummyBusinessTransactionResponse,
//   revenueData: dummyRevenueData,
//   revenueResponse: dummyRevenueResponse,
//   compareRevenueData: dummyCompareRevenueData,
//   compareRevenueResponse: dummyCompareRevenueResponse,
//   users: dummyUsers,
//   businesses: dummyBusinesses,
//   // Helper functions
//   getTransactionsByStatus,
//   getTransactionsByBusiness,
//   getTransactionsByDateRange,
//   getTransactionsPaginated,
//   getTransactionSummary,
// };

// export default transactionDummyData;

// export const reservationsData: ReservationData[] = [
//   {
//     id: "RSV-20250611-F1726A21",
//     user: {
//       id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//       firstname: "Divine",
//       lastname: "Onuora",
//       email: "preshlizzie10@gmail.com",
//       phone_number: "09018317833",
//       gender: "Male",
//       birthday: "22nd October",
//       image_url: null,
//       is_active: true,
//       role: "user",
//       address: null,
//       long: null,
//       lat: null,
//       wallet: 0,
//       password: "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//       provider: "form",
//       current_token:
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//       createdAt: "2025-01-15T09:57:40.951Z",
//       updatedAt: "2025-06-11T16:16:32.000Z",
//       deletedAt: null,
//       referralCode: "preshlizzie10",
//       loyality_point: 0,
//       payment_pin: null,
//     },
//     status: "Cancelled",
//     createdAt: "2025-06-11T17:27:29.234Z",
//     details: {
//       id: "4e041e1b-207e-47c2-a9bb-f65b3b32be3a",
//       name: "",
//       no_of_adults: 2,
//       no_of_children: 1,
//       total_individuals: 3,
//       reservation_id: "RSV-20250611-F1726A21",
//       experience: "Indoor",
//       date: "22-10",
//       time: "02:30 PM",
//       status: "Cancelled",
//       createdAt: "2025-06-11T17:27:29.234Z",
//       updatedAt: "2025-06-12T06:42:02.000Z",
//       deletedAt: null,
//       user: {
//         id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//         firstname: "Divine",
//         lastname: "Onuora",
//         email: "preshlizzie10@gmail.com",
//         phone_number: "09018317833",
//         gender: "Male",
//         birthday: "22nd October",
//         image_url: null,
//         is_active: true,
//         role: "user",
//         address: null,
//         long: null,
//         lat: null,
//         wallet: 0,
//         password:
//           "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//         provider: "form",
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//         createdAt: "2025-01-15T09:57:40.951Z",
//         updatedAt: "2025-06-11T16:16:32.000Z",
//         deletedAt: null,
//         referralCode: "preshlizzie10",
//         loyality_point: 0,
//         payment_pin: null,
//       },
//       business: {
//         id: "c0249bc8-8a86-4148-ac8a-a84426702dfd",
//         business_name: "Breanna Riley",
//         email: "waz05975@toaik.com",
//         business_number: "09018317813",
//         description: "Eum nostrud qui saep",
//         image_url:
//           "https://mipal-business-data.s3.eu-west-2.amazonaws.com/Profile/file2025-05-10-06-26-03.png",
//         role: "business",
//         business_bank_name: null,
//         business_acc_name: null,
//         business_acc_number: null,
//         wallet: 0,
//         address: "865 Second Lane",
//         long: null,
//         lat: null,
//         is_active: true,
//         is_verified: "Accepted",
//         password:
//           "$2a$10$r5HU7ud57p7uNav1G/wJFODFU9M3z/Cw0umjnzxF4HZVWyIdRyupK",
//         business_type: "Unregistered",
//         business_start_date: "2020-01-08T23:00:00.000Z",
//         tax_identification_number: null,
//         cac_document: null,
//         memat: null,
//         director_identity: null,
//         directors_address: null,
//         shareholders_address: null,
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMwMjQ5YmM4LThhODYtNDE0OC1hYzhhLWE4NDQyNjcwMmRmZCIsIm5hbWUiOiJCcmVhbm5hIFJpbGV5IiwiZW1haWwiOiJ3YXowNTk3NUB0b2Fpay5jb20iLCJyb2xlIjoiYnVzaW5lc3MiLCJpYXQiOjE3NDk3OTYwMDIsImV4cCI6MTc0OTc5NjkwMn0.VZivLsXsr4ZPwxdiKjtntEND5--p-LTCIMNASgaayig",
//         createdAt: "2025-05-10T06:05:37.063Z",
//         updatedAt: "2025-06-13T06:26:42.000Z",
//         deletedAt: null,
//       },
//     },
//   },
//   {
//     id: "RSV-20250611-04FC1294",
//     user: {
//       id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//       firstname: "Divine",
//       lastname: "Onuora",
//       email: "preshlizzie10@gmail.com",
//       phone_number: "09018317833",
//       gender: "Male",
//       birthday: "22nd October",
//       image_url: null,
//       is_active: true,
//       role: "user",
//       address: null,
//       long: null,
//       lat: null,
//       wallet: 0,
//       password: "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//       provider: "form",
//       current_token:
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//       createdAt: "2025-01-15T09:57:40.951Z",
//       updatedAt: "2025-06-11T16:16:32.000Z",
//       deletedAt: null,
//       referralCode: "preshlizzie10",
//       loyality_point: 0,
//       payment_pin: null,
//     },
//     status: "Pending",
//     createdAt: "2025-06-11T17:27:15.380Z",
//     details: {
//       id: "6fca3162-4d4f-4008-a92a-769461f30e83",
//       name: "",
//       no_of_adults: 2,
//       no_of_children: 1,
//       total_individuals: 3,
//       reservation_id: "RSV-20250611-04FC1294",
//       experience: "Indoor",
//       date: "22-09",
//       time: "02:30 PM",
//       status: "Pending",
//       createdAt: "2025-06-11T17:27:15.380Z",
//       updatedAt: "2025-06-11T17:27:15.380Z",
//       deletedAt: null,
//       user: {
//         id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//         firstname: "Divine",
//         lastname: "Onuora",
//         email: "preshlizzie10@gmail.com",
//         phone_number: "09018317833",
//         gender: "Male",
//         birthday: "22nd October",
//         image_url: null,
//         is_active: true,
//         role: "user",
//         address: null,
//         long: null,
//         lat: null,
//         wallet: 0,
//         password:
//           "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//         provider: "form",
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//         createdAt: "2025-01-15T09:57:40.951Z",
//         updatedAt: "2025-06-11T16:16:32.000Z",
//         deletedAt: null,
//         referralCode: "preshlizzie10",
//         loyality_point: 0,
//         payment_pin: null,
//       },
//       business: {
//         id: "c0249bc8-8a86-4148-ac8a-a84426702dfd",
//         business_name: "Breanna Riley",
//         email: "waz05975@toaik.com",
//         business_number: "09018317813",
//         description: "Eum nostrud qui saep",
//         image_url:
//           "https://mipal-business-data.s3.eu-west-2.amazonaws.com/Profile/file2025-05-10-06-26-03.png",
//         role: "business",
//         business_bank_name: null,
//         business_acc_name: null,
//         business_acc_number: null,
//         wallet: 0,
//         address: "865 Second Lane",
//         long: null,
//         lat: null,
//         is_active: true,
//         is_verified: "Accepted",
//         password:
//           "$2a$10$r5HU7ud57p7uNav1G/wJFODFU9M3z/Cw0umjnzxF4HZVWyIdRyupK",
//         business_type: "Unregistered",
//         business_start_date: "2020-01-08T23:00:00.000Z",
//         tax_identification_number: null,
//         cac_document: null,
//         memat: null,
//         director_identity: null,
//         directors_address: null,
//         shareholders_address: null,
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMwMjQ5YmM4LThhODYtNDE0OC1hYzhhLWE4NDQyNjcwMmRmZCIsIm5hbWUiOiJCcmVhbm5hIFJpbGV5IiwiZW1haWwiOiJ3YXowNTk3NUB0b2Fpay5jb20iLCJyb2xlIjoiYnVzaW5lc3MiLCJpYXQiOjE3NDk3OTYwMDIsImV4cCI6MTc0OTc5NjkwMn0.VZivLsXsr4ZPwxdiKjtntEND5--p-LTCIMNASgaayig",
//         createdAt: "2025-05-10T06:05:37.063Z",
//         updatedAt: "2025-06-13T06:26:42.000Z",
//         deletedAt: null,
//       },
//     },
//   },
//   {
//     id: "RSV-20250611-2B17E6CF",
//     user: {
//       id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//       firstname: "Divine",
//       lastname: "Onuora",
//       email: "preshlizzie10@gmail.com",
//       phone_number: "09018317833",
//       gender: "Male",
//       birthday: "22nd October",
//       image_url: null,
//       is_active: true,
//       role: "user",
//       address: null,
//       long: null,
//       lat: null,
//       wallet: 0,
//       password: "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//       provider: "form",
//       current_token:
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//       createdAt: "2025-01-15T09:57:40.951Z",
//       updatedAt: "2025-06-11T16:16:32.000Z",
//       deletedAt: null,
//       referralCode: "preshlizzie10",
//       loyality_point: 0,
//       payment_pin: null,
//     },
//     status: "Pending",
//     createdAt: "2025-06-11T17:26:47.294Z",
//     details: {
//       id: "4e17d932-7a2c-419c-b474-17d10c414744",
//       name: "",
//       no_of_adults: 2,
//       no_of_children: 1,
//       total_individuals: 3,
//       reservation_id: "RSV-20250611-2B17E6CF",
//       experience: "Indoor",
//       date: "22-07",
//       time: "02:30 PM",
//       status: "Pending",
//       createdAt: "2025-06-11T17:26:47.294Z",
//       updatedAt: "2025-06-11T17:26:47.294Z",
//       deletedAt: null,
//       user: {
//         id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//         firstname: "Divine",
//         lastname: "Onuora",
//         email: "preshlizzie10@gmail.com",
//         phone_number: "09018317833",
//         gender: "Male",
//         birthday: "22nd October",
//         image_url: null,
//         is_active: true,
//         role: "user",
//         address: null,
//         long: null,
//         lat: null,
//         wallet: 0,
//         password:
//           "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//         provider: "form",
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//         createdAt: "2025-01-15T09:57:40.951Z",
//         updatedAt: "2025-06-11T16:16:32.000Z",
//         deletedAt: null,
//         referralCode: "preshlizzie10",
//         loyality_point: 0,
//         payment_pin: null,
//       },
//       business: {
//         id: "c0249bc8-8a86-4148-ac8a-a84426702dfd",
//         business_name: "Breanna Riley",
//         email: "waz05975@toaik.com",
//         business_number: "09018317813",
//         description: "Eum nostrud qui saep",
//         image_url:
//           "https://mipal-business-data.s3.eu-west-2.amazonaws.com/Profile/file2025-05-10-06-26-03.png",
//         role: "business",
//         business_bank_name: null,
//         business_acc_name: null,
//         business_acc_number: null,
//         wallet: 0,
//         address: "865 Second Lane",
//         long: null,
//         lat: null,
//         is_active: true,
//         is_verified: "Accepted",
//         password:
//           "$2a$10$r5HU7ud57p7uNav1G/wJFODFU9M3z/Cw0umjnzxF4HZVWyIdRyupK",
//         business_type: "Unregistered",
//         business_start_date: "2020-01-08T23:00:00.000Z",
//         tax_identification_number: null,
//         cac_document: null,
//         memat: null,
//         director_identity: null,
//         directors_address: null,
//         shareholders_address: null,
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMwMjQ5YmM4LThhODYtNDE0OC1hYzhhLWE4NDQyNjcwMmRmZCIsIm5hbWUiOiJCcmVhbm5hIFJpbGV5IiwiZW1haWwiOiJ3YXowNTk3NUB0b2Fpay5jb20iLCJyb2xlIjoiYnVzaW5lc3MiLCJpYXQiOjE3NDk3OTYwMDIsImV4cCI6MTc0OTc5NjkwMn0.VZivLsXsr4ZPwxdiKjtntEND5--p-LTCIMNASgaayig",
//         createdAt: "2025-05-10T06:05:37.063Z",
//         updatedAt: "2025-06-13T06:26:42.000Z",
//         deletedAt: null,
//       },
//     },
//   },
//   {
//     id: "RSV-20250611-360E41CF",
//     user: {
//       id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//       firstname: "Divine",
//       lastname: "Onuora",
//       email: "preshlizzie10@gmail.com",
//       phone_number: "09018317833",
//       gender: "Male",
//       birthday: "22nd October",
//       image_url: null,
//       is_active: true,
//       role: "user",
//       address: null,
//       long: null,
//       lat: null,
//       wallet: 0,
//       password: "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//       provider: "form",
//       current_token:
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//       createdAt: "2025-01-15T09:57:40.951Z",
//       updatedAt: "2025-06-11T16:16:32.000Z",
//       deletedAt: null,
//       referralCode: "preshlizzie10",
//       loyality_point: 0,
//       payment_pin: null,
//     },
//     status: "Booked",
//     createdAt: "2025-06-11T17:26:31.566Z",
//     details: {
//       id: "377fa934-72d5-405e-aef2-eeb9693b5d4f",
//       name: "",
//       no_of_adults: 2,
//       no_of_children: 1,
//       total_individuals: 3,
//       reservation_id: "RSV-20250611-360E41CF",
//       experience: "Indoor",
//       date: "17-06",
//       time: "02:30 PM",
//       status: "Booked",
//       createdAt: "2025-06-11T17:26:31.566Z",
//       updatedAt: "2025-06-12T06:40:47.000Z",
//       deletedAt: null,
//       user: {
//         id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//         firstname: "Divine",
//         lastname: "Onuora",
//         email: "preshlizzie10@gmail.com",
//         phone_number: "09018317833",
//         gender: "Male",
//         birthday: "22nd October",
//         image_url: null,
//         is_active: true,
//         role: "user",
//         address: null,
//         long: null,
//         lat: null,
//         wallet: 0,
//         password:
//           "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//         provider: "form",
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//         createdAt: "2025-01-15T09:57:40.951Z",
//         updatedAt: "2025-06-11T16:16:32.000Z",
//         deletedAt: null,
//         referralCode: "preshlizzie10",
//         loyality_point: 0,
//         payment_pin: null,
//       },
//       business: {
//         id: "c0249bc8-8a86-4148-ac8a-a84426702dfd",
//         business_name: "Breanna Riley",
//         email: "waz05975@toaik.com",
//         business_number: "09018317813",
//         description: "Eum nostrud qui saep",
//         image_url:
//           "https://mipal-business-data.s3.eu-west-2.amazonaws.com/Profile/file2025-05-10-06-26-03.png",
//         role: "business",
//         business_bank_name: null,
//         business_acc_name: null,
//         business_acc_number: null,
//         wallet: 0,
//         address: "865 Second Lane",
//         long: null,
//         lat: null,
//         is_active: true,
//         is_verified: "Accepted",
//         password:
//           "$2a$10$r5HU7ud57p7uNav1G/wJFODFU9M3z/Cw0umjnzxF4HZVWyIdRyupK",
//         business_type: "Unregistered",
//         business_start_date: "2020-01-08T23:00:00.000Z",
//         tax_identification_number: null,
//         cac_document: null,
//         memat: null,
//         director_identity: null,
//         directors_address: null,
//         shareholders_address: null,
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMwMjQ5YmM4LThhODYtNDE0OC1hYzhhLWE4NDQyNjcwMmRmZCIsIm5hbWUiOiJCcmVhbm5hIFJpbGV5IiwiZW1haWwiOiJ3YXowNTk3NUB0b2Fpay5jb20iLCJyb2xlIjoiYnVzaW5lc3MiLCJpYXQiOjE3NDk3OTYwMDIsImV4cCI6MTc0OTc5NjkwMn0.VZivLsXsr4ZPwxdiKjtntEND5--p-LTCIMNASgaayig",
//         createdAt: "2025-05-10T06:05:37.063Z",
//         updatedAt: "2025-06-13T06:26:42.000Z",
//         deletedAt: null,
//       },
//     },
//   },
//   {
//     id: "RSV-20250611-419AE2B6",
//     user: {
//       id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//       firstname: "Divine",
//       lastname: "Onuora",
//       email: "preshlizzie10@gmail.com",
//       phone_number: "09018317833",
//       gender: "Male",
//       birthday: "22nd October",
//       image_url: null,
//       is_active: true,
//       role: "user",
//       address: null,
//       long: null,
//       lat: null,
//       wallet: 0,
//       password: "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//       provider: "form",
//       current_token:
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//       createdAt: "2025-01-15T09:57:40.951Z",
//       updatedAt: "2025-06-11T16:16:32.000Z",
//       deletedAt: null,
//       referralCode: "preshlizzie10",
//       loyality_point: 0,
//       payment_pin: null,
//     },
//     status: "Pending",
//     createdAt: "2025-06-11T17:26:03.093Z",
//     details: {
//       id: "bf086100-1b46-475c-b5ad-2c5191e8d870",
//       name: "",
//       no_of_adults: 2,
//       no_of_children: 1,
//       total_individuals: 3,
//       reservation_id: "RSV-20250611-419AE2B6",
//       experience: "Indoor",
//       date: "16-06",
//       time: "02:30 PM",
//       status: "Pending",
//       createdAt: "2025-06-11T17:26:03.093Z",
//       updatedAt: "2025-06-11T17:26:03.093Z",
//       deletedAt: null,
//       user: {
//         id: "8bb6b521-0eac-444c-b5f6-16d9e74e1f2f",
//         firstname: "Divine",
//         lastname: "Onuora",
//         email: "preshlizzie10@gmail.com",
//         phone_number: "09018317833",
//         gender: "Male",
//         birthday: "22nd October",
//         image_url: null,
//         is_active: true,
//         role: "user",
//         address: null,
//         long: null,
//         lat: null,
//         wallet: 0,
//         password:
//           "$2a$10$R/BjhEEWRc3UM1gRLcAR1eblZB.dEKnLlFasPy49NTySOtacIeVia",
//         provider: "form",
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhiYjZiNTIxLTBlYWMtNDQ0Yy1iNWY2LTE2ZDllNzRlMWYyZiIsImZpcnN0bmFtZSI6IkRpdmluZSIsImxhc3RuYW1lIjoiT251b3JhIiwiZW1haWwiOiJwcmVzaGxpenppZTEwQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5NjU4NTkyfQ.BXlCgZc6M61gUfkr1xR-uAI7y5vYM-9crqXM9aXVwgk",
//         createdAt: "2025-01-15T09:57:40.951Z",
//         updatedAt: "2025-06-11T16:16:32.000Z",
//         deletedAt: null,
//         referralCode: "preshlizzie10",
//         loyality_point: 0,
//         payment_pin: null,
//       },
//       business: {
//         id: "c0249bc8-8a86-4148-ac8a-a84426702dfd",
//         business_name: "Breanna Riley",
//         email: "waz05975@toaik.com",
//         business_number: "09018317813",
//         description: "Eum nostrud qui saep",
//         image_url:
//           "https://mipal-business-data.s3.eu-west-2.amazonaws.com/Profile/file2025-05-10-06-26-03.png",
//         role: "business",
//         business_bank_name: null,
//         business_acc_name: null,
//         business_acc_number: null,
//         wallet: 0,
//         address: "865 Second Lane",
//         long: null,
//         lat: null,
//         is_active: true,
//         is_verified: "Accepted",
//         password:
//           "$2a$10$r5HU7ud57p7uNav1G/wJFODFU9M3z/Cw0umjnzxF4HZVWyIdRyupK",
//         business_type: "Unregistered",
//         business_start_date: "2020-01-08T23:00:00.000Z",
//         tax_identification_number: null,
//         cac_document: null,
//         memat: null,
//         director_identity: null,
//         directors_address: null,
//         shareholders_address: null,
//         current_token:
//           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMwMjQ5YmM4LThhODYtNDE0OC1hYzhhLWE4NDQyNjcwMmRmZCIsIm5hbWUiOiJCcmVhbm5hIFJpbGV5IiwiZW1haWwiOiJ3YXowNTk3NUB0b2Fpay5jb20iLCJyb2xlIjoiYnVzaW5lc3MiLCJpYXQiOjE3NDk3OTYwMDIsImV4cCI6MTc0OTc5NjkwMn0.VZivLsXsr4ZPwxdiKjtntEND5--p-LTCIMNASgaayig",
//         createdAt: "2025-05-10T06:05:37.063Z",
//         updatedAt: "2025-06-13T06:26:42.000Z",
//         deletedAt: null,
//       },
//     },
//   },
// ];
