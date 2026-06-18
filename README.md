# MyPal Business Admin Dashboard

A comprehensive business administration platform designed for hospitality and service industries, supporting restaurants, fine dining establishments, salons, spas, and accommodation providers.

![Next.js](https://img.shields.io/badge/Next.js-15.2.2-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC)

## 🚀 Features

### Multi-Business Type Support

- **Mainstream Restaurants**: Order management and transaction tracking
- **Fine Dining**: Reservation system with booking management
- **Salons & Spas**: Service scheduling and appointment management
- **Accommodation**: Booking and guest management systems
- **AND MORE**: More business to be added.

### Core Functionality

- 📊 **Real-time Analytics**: Revenue tracking, customer satisfaction, and performance metrics
- 💼 **Business Management**: KYB (Know Your Business) onboarding and profile management
- 📅 **Booking & Reservations**: Comprehensive scheduling system with status tracking
- 💳 **Payment Processing**: Transaction management with multiple payment status tracking
- 📈 **Revenue Reports**: Detailed financial analytics with period-over-period comparisons
- 👥 **Customer Engagement**: Review management and satisfaction tracking
- 🎯 **Events & Deals**: Promotional campaign management
- 🏪 **Service Management**: Offerings and availability scheduling
- 📋 **Comprehensive Reporting**: Advanced analytics and business intelligence

### User Experience

- 🎨 **Modern UI**: Built with Radix UI components and Tailwind CSS
- 📱 **Responsive Design**: Mobile-first approach with adaptive layouts
- 🌙 **Dark/Light Mode**: Theme switching with next-themes
- 🔍 **Advanced Search**: Powerful filtering and search capabilities
- 📊 **Data Visualization**: Interactive charts and graphs with Recharts

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.2.2 with App Router
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 3.4.17
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Animations**: Tailwind CSS Animate

### State Management & Data Fetching

- **Global State**: Zustand with persistence
- **Server State**: TanStack Query (React Query)
- **Form State**: React Hook Form
- **Authentication**: Custom JWT-based auth system

### Development Tools

- **Language**: TypeScript 5
- **Linting**: ESLint 9 with Next.js config
- **Formatting**: Prettier with Tailwind plugin
- **Build Tool**: Turbopack for development

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Modern web browser

## ⚙️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MiPal-dev/business-admin.git
   cd business-admin
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory:

   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=https://api-mypal-com.onrender.com/v1
   NEXT_PUBLIC_APP_ENV=development
   NEXT_PUBLIC_API_KEY=your_api_key_here

   # Optional: Server-side secrets
   SECRET_KEY=your_secret_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (protected)/       # Protected dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── dashboard/        # Dashboard-specific components
│   ├── overview/         # Business overview components
│   └── shared/           # Shared components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── services/            # API services and integrations
│   └── api/             # API client and endpoints
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
└── contexts/            # React contexts
```

## 🔐 Authentication Flow

The application implements a comprehensive authentication system:

1. **Registration**: Email/password signup with OTP verification
2. **Login**: Secure signin with JWT tokens
3. **KYB Process**: Know Your Business onboarding
4. **Password Recovery**: Forgot password with OTP verification
5. **Session Management**: Persistent sessions with automatic token refresh

## 💾 API Integration

The application connects to the MyPal API with the following key endpoints:

- **Authentication**: `/auth/business/*`
- **Business Operations**: `/business/*`
- **Orders & Reservations**: Various endpoints based on business type
- **Analytics**: Revenue and metrics endpoints
- **Customer Management**: Reviews and engagement data

## 🎨 UI Components

Built with a modern component library including:

- **Data Tables**: Advanced tables with sorting, filtering, and pagination
- **Forms**: Robust form handling with validation
- **Modals & Dialogs**: Accessible overlay components
- **Charts & Graphs**: Interactive data visualizations
- **Navigation**: Responsive sidebar and header components

## 📱 Responsive Design

- **Mobile-first approach** with breakpoint-specific layouts
- **Adaptive navigation** that collapses on smaller screens
- **Touch-friendly interface** optimized for mobile devices
- **Performance-optimized** images and assets

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📱 Push Notifications Setup

### Firebase Configuration

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one
   - Enable Firebase Cloud Messaging (FCM)

2. **Add Web App to Firebase**:
   - Go to Project Settings → General → Your apps
   - Click "Add app" → Web app (</>)
   - Register your app with name "MyPal Business Admin"
   - Copy the Firebase config values

3. **Generate VAPID Key**:
   - Go to Project Settings → Cloud Messaging → Web Push certificates
   - Click "Generate key pair"
   - Copy the generated VAPID key

4. **Environment Variables**:

   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local

   # Add your Firebase configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_key_here
   ```

5. **Update Firebase Service Worker**:
   - Open `public/firebase-messaging-sw.js`
   - Replace the placeholder Firebase config with your actual values

### Backend Configuration

Your backend is already configured to handle FCM tokens. The API expects:

```typescript
interface RegisterTokenDto {
  token: string; // FCM token from Firebase
  platform: Platform; // 'web', 'android', 'ios'
  deviceInfo?: string; // Browser/device information
}
```

### Testing Push Notifications

1. **Enable Notifications**: Go to Notifications page and click "Enable Notifications"
2. **Grant Permission**: Allow notifications in browser popup
3. **Test**: Use your backend admin panel to send test notifications

### Supported Notification Types

- 🔔 **Order Updates**: New orders, status changes
- 📅 **Event Reminders**: Upcoming events and reservations
- ✅ **Reservation Confirmations**: Booking confirmations
- 🎯 **Promotions**: Special offers and deals
- 📢 **General**: System announcements

---

Built with ❤️ by the MiPal Development Team
