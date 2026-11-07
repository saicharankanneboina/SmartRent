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

## Tech Stack
- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **AI/ML:** @google/genai (Gemini 2.5 Flash)
- **Testing:** Jest, Supertest (Backend API); Selenium WebDriver, Pytest (Frontend UI E2E)

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
   cd frontend
   npx serve . --listen 3000
   # OR
   cd frontend && python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your browser to view the application.

## Testing

### 1. Backend Integration Tests (Jest & Supertest)
Automated backend API tests use an in-memory MongoDB database so no local MongoDB instance is required to run the tests.
```bash
cd backend
npm run test
```
- **Test 1 — Registration**: Valid user registration, owner registration, duplicate and missing field handling.
- **Test 2 — Login**: Authentication with valid credentials, password mismatch (401), and non-existent users.
- **Test 3 — Equipment**: Catalog retrieval, item schema validation, and search filtering.
- **Test 4 — Booking**: Booking creation, automatic rental price calculation, and payment method handling.
- **Test 5 — Double Booking Prevention**: Overlapping date collision prevention guard.
- **Test 6 — Booking Date Range Validation (Logical Test)**: Enforces business logic that rental end dates must be strictly after start dates (rejects backwards or 0-day bookings with 400).

### 2. End-to-End UI Automation Tests (Selenium WebDriver)
SmartRent includes 5 automated browser tests built with **Python** and **Selenium WebDriver**:

- **Test Case 1: Homepage Title & Navigation Verification**
  - Confirms homepage branding, loads the page title, and tests navigation across the navigation bar to the `About` page.
- **Test Case 2: User Registration Form Elements & Input Validation**
  - Verifies form controls (`name`, `email`, `password`, `role` dropdown), simulates real user input, and validates field values.
- **Test Case 3: Login Authentication Validation & Feedback**
  - Tests invalid credential submission and asserts error message display and UI state handling.
- **Test Case 4: Route Guard Protection & Unauthorized Access Redirect (Logical Test)**
  - Verifies that attempting to navigate directly to the protected dashboard (`dashboard.html`) without logging in automatically redirects visitors to `login.html`.
- **Test Case 5: Authenticated Session UI State & Logout Flow (Logical Test)**
  - Verifies that an active user session updates the navbar to display 'Dashboard' and 'Logout', and clicking 'Logout' clears session storage and restores guest navigation.

#### Prerequisites
- **Python 3.10+**
- **Google Chrome** (Selenium 4+ automatically manages the matching ChromeDriver binary via Selenium Manager)

#### Setup & Execution
1. Install Python dependencies:
   ```bash
   pip install -r selenium_tests/requirements.txt
   ```
2. Start the frontend server:
   ```bash
   cd frontend
   npx serve . --listen 3000
   ```
3. Run the Selenium tests (in a second terminal):
   ```bash
   python selenium_tests/test_smartrent.py
   # Or using pytest for verbose output:
   pytest selenium_tests/test_smartrent.py -v -s
   ```
*(Note: To run in headless mode without opening a visible browser window, uncomment `options.add_argument("--headless=new")` in `selenium_tests/test_smartrent.py`)*

## Security
- Passwords hashed using `bcryptjs`
- API endpoints protected with JWT authorization
- Gemini API integration is safely executed server-side. Do not expose `GEMINI_API_KEY` on the client.
