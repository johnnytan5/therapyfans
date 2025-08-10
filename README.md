# TherapyFans 🧠💜

**Anonymous Therapy, Verified Trust**

A revolutionary Web3-powered therapy platform that combines complete anonymity with verified therapist credentials through zero-knowledge proof technology.

## 🌟 Key Features

### 🔒 **Complete Anonymity**
- **zkLogin Integration**: Anonymous authentication using Google, Facebook, or Twitch
- **Zero Personal Data**: Only wallet addresses are stored - no names, emails, or personal information
- **Privacy-First Design**: All sessions and interactions are completely anonymous
- **Encrypted Communications**: End-to-end encryption for all therapy sessions

### ⛽ **Sponsored Gas System**
- **Zero-Cost Transactions**: All blockchain operations are sponsored by the platform
- **Seamless Experience**: Users never need to purchase or manage SUI tokens
- **Automatic NFT Minting**: Therapist credentials and session bookings are automatically minted
- **Kiosk Creation**: Digital storefronts are created with sponsored gas

### 🏪 **Decentralized Marketplace**
- **Verified Therapists**: All therapists are verified with blockchain-stored credentials
- **AI-Powered Matching**: Intelligent therapist-client matching based on preferences
- **Transparent Pricing**: Clear pricing in SUI with 90/10 revenue split (90% to therapist, 10% to platform)
- **Instant Booking**: Real-time availability and instant session booking

## 🚀 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling with custom animations
- **Radix UI** - Accessible component library

### Blockchain
- **Sui Blockchain** - High-performance Layer 1 blockchain
- **Move Language** - Smart contracts for therapist NFTs and session management
- **Enoki Wallet** - zkLogin integration for anonymous authentication
- **dApp Kit** - Sui wallet integration

### Backend
- **Supabase** - Database and authentication
- **Jitsi Meet** - Secure video conferencing
- **Express.js** - API endpoints for sponsored transactions

## 📱 Core Features

### For Clients
- **Anonymous Profiles**: Create profiles with only a wallet address
- **AI Matchmaking**: Get personalized therapist recommendations
- **Secure Sessions**: Encrypted video therapy sessions
- **Session History**: Track your therapy journey anonymously
- **Payment Integration**: On-ramp from fiat to SUI

### For Therapists
- **Credential Verification**: Blockchain-stored professional credentials
- **Digital Storefront**: Customizable kiosk for your practice
- **Session Management**: Automated booking and scheduling
- **Revenue Tracking**: Transparent payment processing
- **Professional Tools**: Availability management and client preferences

## 🔧 Smart Contracts

### Therapist NFT (`therapist_nft.move`)
- Stores verified therapist credentials on-chain
- Immutable professional history
- Automatic verification system

### Booking Proof (`booking_proof.move`)
- Records therapy session bookings
- Handles payment distribution
- Session verification and completion tracking

### Kiosk Rental (`kiosk_rental.move`)
- Digital storefront management
- Revenue sharing automation
- Professional presentation tools

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- Sui CLI
- Supabase account
- Jitsi Meet account

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/therapyfans.git
cd therapyfans
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sui Blockchain
NEXT_PUBLIC_PACKAGE_ID=your_package_id
SPONSOR_PRIVATE_KEY=your_sponsor_private_key

# Jitsi Meet
JITSI_APP_ID=your_jitsi_app_id
JITSI_PRIVATE_KEY=your_jitsi_private_key
JITSI_KID=your_jitsi_kid

# AI Services (optional)
OPENAI_API_KEY=your_openai_key
```

### 4. Database Setup
Run the Supabase migrations to create the necessary tables:
```sql
-- Clients table for anonymous profiles
CREATE TABLE clients (
  wallet_address TEXT PRIMARY KEY,
  anon_display_name TEXT,
  email TEXT,
  auth_provider TEXT,
  provider_subject TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB,
  vibe_tags JSONB,
  total_sessions INTEGER DEFAULT 0,
  total_spent_sui DECIMAL DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Therapists table for verified professionals
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  specialization TEXT,
  credentials TEXT,
  years_experience INTEGER,
  bio TEXT,
  session_types JSONB,
  languages JSONB,
  price_per_session DECIMAL,
  rating DECIMAL DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  profile_image_url TEXT,
  certification_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Deploy Smart Contracts
```bash
cd smart-contract
sui move build
sui client publish --gas-budget 50000000
```

### 6. Start Development Server
```bash
npm run dev
```

## 🏗️ Project Structure

```
therapyfans/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes for sponsored transactions
│   │   ├── marketplace/       # Therapist marketplace
│   │   ├── session/          # Therapy session management
│   │   └── therapist/        # Therapist onboarding
│   ├── components/           # Reusable React components
│   │   ├── client/          # Client-specific components
│   │   ├── therapy/         # Therapy-related components
│   │   ├── wallet/          # Wallet integration components
│   │   └── ui/              # Base UI components
│   ├── lib/                 # Utility libraries and services
│   └── types/               # TypeScript type definitions
├── smart-contract/          # Sui Move smart contracts
├── public/                  # Static assets
└── docs/                   # Documentation
```

## 🔐 Security & Privacy

### Anonymity Features
- **zkLogin Authentication**: Zero-knowledge proof-based login
- **Wallet-Only Identification**: No personal data stored
- **Encrypted Sessions**: End-to-end encryption for all communications
- **Data Minimization**: Only essential data is collected and stored

### Smart Contract Security
- **Verified Credentials**: Therapist credentials stored on-chain
- **Immutable Records**: Session history cannot be altered
- **Transparent Payments**: All transactions are publicly verifiable
- **Access Control**: Role-based permissions for different user types

## 💰 Economic Model

### Revenue Distribution
- **90% to Therapists**: Direct payment to therapist wallets
- **10% to Platform**: Covers gas sponsorship and operational costs

### Gas Sponsorship
- **Client Transactions**: All client interactions are gas-free
- **Therapist Onboarding**: NFT minting and kiosk creation sponsored
- **Session Bookings**: Automatic payment processing with sponsored gas

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are properly configured for production deployment.

### Smart Contract Deployment
Deploy to Sui mainnet:
```bash
sui client publish --gas-budget 50000000 --network testnet
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🙏 Acknowledgments

- **Sui Foundation** for blockchain infrastructure
- **Enoki** for zkLogin technology
- **Jitsi** for secure video conferencing
- **Supabase** for backend services

---

**Therapy Fans** - Making mental health accessible, anonymous, and secure through Web3 technology. 🧠💜
