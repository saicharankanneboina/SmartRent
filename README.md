# SmartRent

SmartRent is a modern, responsive, full-stack web application designed for renting equipment, featuring an AI-assisted Natural Language Recommendation engine powered by the Gemini API.

## Features
- **Role-based Auth:** Renter, Equipment Owner, Admin
- **Equipment Listing:** Owners can manage their equipment
- **AI Recommendation Engine:** Natural language search parsing via Gemini AI
- **Smart Scoring System:** Ranks equipment based on suitability, availability, distance, price, and rating
- **Explainable AI:** Highlights exactly *why* a piece of equipment was recommended
- **Simulated Payment & Security Deposit:** Seamless checkout flow visualization
- **Dashboards:** Unique views for Renters, Owners, and Admins
- **Equipment Comparison Tool:** Side-by-side comparison of 2 to 4 equipment listings (daily rate, security deposit, projected 3/7-day total cost, ratings, availability, specs) with a floating comparison dock and dedicated comparison view

## Tech Stack
- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **AI/ML:** @google/genai (Gemini 2.5 Flash)

## Setup Instructions

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in your Gemini API Key and MongoDB URI.
   ```bash
   cp .env.example .env
   ```
4. Make sure MongoDB is running locally or provide a valid MongoDB Atlas URI in `.env`.
5. Run the backend server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

### 2. Frontend Setup
1. The frontend uses Vanilla JS and standard HTML/CSS. It does not require a bundler.
2. You can serve the `frontend` directory using any static web server. For example:
   ```bash
   npx serve frontend
   # OR
   cd frontend && python -m http.server 8000
   ```
3. Open `http://localhost:3000` (or `8000`) in your browser to view the application.

## Testing
Automated tests are built with Jest and Supertest. They use an in-memory MongoDB database so no local MongoDB instance is required to run the tests.
```bash
cd backend
npm run test
```

## Security
- Passwords hashed using `bcryptjs`
- API endpoints protected with JWT authorization
- Gemini API integration is safely executed server-side. Do not expose `GEMINI_API_KEY` on the client.
