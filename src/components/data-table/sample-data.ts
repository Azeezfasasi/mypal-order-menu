// Define your data type
export interface TableSampleUserType {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  lastLogin: Date;
}

const mockData: TableSampleUserType[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "active",
    lastLogin: new Date(),
  },
  {
    id: "2",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "User",
    status: "active",
    lastLogin: new Date(),
  },
  {
    id: "3",
    name: "Michael Smith",
    email: "michael.smith@example.com",
    role: "Editor",
    status: "inactive",
    lastLogin: new Date(),
  },
  {
    id: "4",
    name: "Sophia Brown",
    email: "sophia.brown@example.com",
    role: "User",
    status: "pending",
    lastLogin: new Date(),
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.wilson@example.com",
    role: "Admin",
    status: "active",
    lastLogin: new Date(),
  },
  {
    id: "6",
    name: "Emma Thomas",
    email: "emma.thomas@example.com",
    role: "Editor",
    status: "inactive",
    lastLogin: new Date(),
  },
  {
    id: "7",
    name: "Daniel Martinez",
    email: "daniel.martinez@example.com",
    role: "User",
    status: "active",
    lastLogin: new Date(),
  },
  {
    id: "8",
    name: "Olivia Garcia",
    email: "olivia.garcia@example.com",
    role: "Admin",
    status: "pending",
    lastLogin: new Date(),
  },
  {
    id: "9",
    name: "James Anderson",
    email: "james.anderson@example.com",
    role: "Editor",
    status: "active",
    lastLogin: new Date(),
  },
  {
    id: "10",
    name: "Isabella Lopez",
    email: "isabella.lopez@example.com",
    role: "User",
    status: "inactive",
    lastLogin: new Date(),
  },
  {
    id: "11",
    name: "William Harris",
    email: "william.harris@example.com",
    role: "Admin",
    status: "active",
    lastLogin: new Date(),
  },
  {
    id: "12",
    name: "Mia Gonzalez",
    email: "mia.gonzalez@example.com",
    role: "User",
    status: "pending",
    lastLogin: new Date(),
  },
  {
    id: "13",
    name: "Benjamin Clark",
    email: "benjamin.clark@example.com",
    role: "Editor",
    status: "inactive",
    lastLogin: new Date(),
  },
  {
    id: "14",
    name: "Charlotte Lewis",
    email: "charlotte.lewis@example.com",
    role: "User",
    status: "active",
    lastLogin: new Date(),
  },
  {
    id: "15",
    name: "Henry Robinson",
    email: "henry.robinson@example.com",
    role: "Admin",
    status: "inactive",
    lastLogin: new Date(),
  },
];

export default mockData;
