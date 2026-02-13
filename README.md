# Dodo Point Client Concierge with Gemini AI

### 🚀 Live Preview: [https://dodo-client.vercel.app](https://dodo-client.vercel.app)

A premium, AI-powered client concierge application featuring a glassmorphism UI, real-time financial tracking, wallet system, and intelligent interactions powered by Google Gemini.

## ✨ Key Features

- **🤖 AI Concierge**: Context-aware chat interface powered by Gemini 1.5 Pro aimed at answering client queries about their portfolio, wallet, and transactions.
- **💳 Wallet System**: Real-time balance tracking, Dodo Points earning/redeeming, and detailed transaction history.
- **📊 Financial Analytics**: ROI analysis, spend breakdown, recurring costs tracking, and ad campaign performance visualization.
- **🔒 Secure Authentication**: JWT-based auth with refresh token rotation and secure session management.
- **🎨 Glassmorphism UI**: Modern, responsive design with Framer Motion animations and neon aesthetics.
- **🛡️ Audit Logs**: Comprehensive trust logs tracking all sensitive user actions.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **Payments**: [Razorpay](https://razorpay.com/) (Integration ready)

### Deployment
- **Platform**: [Vercel](https://vercel.com/) (Frontend + Serverless Functions)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sonu2k1/Dodo-Client-v-1.git
   cd Dodo-Client-v-1
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

### Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Running Locally

1. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   *Server runs on http://localhost:3001*

2. **Start the Frontend Development Server**
   ```bash
   # In a new terminal, from the root directory
   npm run dev
   ```
   *Frontend runs on http://localhost:5173*

## 📦 Deployment

This project is configured for seamless deployment on Vercel.

1. **Push to GitHub**
2. **Import project into Vercel**
3. **Configure Environment Variables** in Vercel Dashboard (match the `.env` variables above).
4. **Deploy!**

The `vercel.json` configuration handles the build process:
- Frontend is built as static assets.
- Backend is deployed as Serverless Functions (`/api/*`).

## � How It Works

### 1. Hybrid Architecture
The application uses a **hybrid rendering approach**:
- **Frontend**: Built with React and Vite, deployed as static assets on Vercel's Edge Network for lightning-fast loading.
- **Backend API**: Deployed as **Serverless Functions** on Vercel. The Express app is wrapped in a serverless handler (`api/index.js`), allowing it to scale automatically to zero or thousands of concurrent requests.

### 2. AI Concierge Flow
1. **User Query**: User sends a message via the chat interface.
2. **Context Injection**: The frontend injects relevant context (current page, wallet balance, recent transactions) into the prompt.
3. **Gemini Processing**: The backend sends the enriched prompt to Google's **Gemini 1.5 Pro**.
4. **Intent Parsing**: The AI analyzes the user's intent (e.g., "Check status", "Explain charge") and generates a structured response.
5. **Action Execution**: If a specific action is detected (like "Redeem Points"), the backend executes the logic and updates the database.

### 3. Secure Authentication
- **JWT Strategy**: Uses short-lived **Access Tokens** (15m) for API access and long-lived **Refresh Tokens** (7d) for session management.
- **Rotation**: Refresh tokens are rotated upon use to prevent replay attacks.
- **Security**: HttpOnly cookies (optional) or secure local storage for token management.

### 4. Wallet & Points System
- **Double-Entry Ledger**: Every transaction is recorded as a credit or debit to ensure financial integrity.
- **Dodo Points**: Users earn points for specific actions (logging in, completing tasks). These points can be redeemed for account credit, handled via a transactional MongoDB session.

## �📂 Project Structure

```
Dodo-Client-v-1/
├── api/                  # Vercel Serverless Function entry point
├── public/               # Static assets
├── server/               # Backend Express Server
│   ├── models/           # Mongoose Models
│   ├── routes/           # API Routes
│   ├── middleware/       # Auth & Security Middleware
│   └── services/         # Business Logic (AI, Payments)
├── src/                  # Frontend React App
│   ├── components/       # Reusable UI Components
│   ├── context/          # React Context (Auth, Theme)
│   ├── hooks/            # Custom Hooks
│   ├── pages/            # Page Components
│   └── styles/           # Global Styles
├── vercel.json           # Vercel Deployment Config
└── vite.config.js        # Vite Config (Proxy setup)
```
