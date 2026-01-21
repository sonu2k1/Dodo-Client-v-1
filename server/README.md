# Backend Setup Instructions

## Prerequisites
- Node.js installed (v18 or higher recommended)
- Google Gemini API key

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Edit `server/.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
```

### 3. Start the Backend Server
```bash
npm run dev
```

You should see:
```
🚀 DoDo Backend Server running on http://localhost:3001
📡 API endpoints available at http://localhost:3001/api
🤖 Gemini API configured: ✅
```

### 4. Start the Frontend (in a new terminal)
```bash
# From project root
npm run dev
```

## Testing the Integration

1. Open http://localhost:5173 in your browser
2. Navigate to "AI Concierge"
3. Type a message and send it
4. You should receive a response from Google Gemini!

## API Endpoints

### POST /api/ai/chat
Send a message to the AI

**Request:**
```json
{
  "message": "Hello, how can you help me?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "message": "AI response here",
  "sessionId": "session-id",
  "timestamp": 1234567890
}
```

### GET /health
Check server status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T12:00:00.000Z",
  "geminiConfigured": true
}
```

## Troubleshooting

**Error: "GEMINI_API_KEY not set"**
- Make sure you've added your API key to `server/.env`
- Restart the server after adding the key

**Error: "Failed to get AI response"**
- Check that the backend server is running on port 3001
- Verify your API key is valid
- Check the server console for detailed error messages

**CORS errors**
- Make sure the frontend is running on http://localhost:5173
- If using a different port, update the CORS configuration in `server/server.js`
