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
- **Frontend:** Vanilla JS, HTML5, CSS3, Nginx (Docker container)
- **Backend:** Node.js (v22), Express.js
- **Database:** MongoDB 7 (Mongoose ODM)
- **Containerization:** Docker & Docker Compose
- **CI/CD:** Jenkins Pipeline (`Jenkinsfile`)
- **AI/ML:** @google/genai (Gemini 2.5 Flash / 3.6 Flash)
- **Testing:** Jest, Supertest (Backend API); Selenium WebDriver, Pytest (Frontend UI E2E)

---

## Setup & Deployment Instructions

### Option 1: Docker Compose (Recommended — Fast & Containerized)

The easiest way to run the entire SmartRent stack (Frontend, Backend, and MongoDB) is using Docker Compose.

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

#### 1. Setup Environment Variables
Ensure `backend/.env` exists. If not, copy from `.env.example`:
```bash
cp backend/.env.example backend/.env
```
Update `GEMINI_API_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`.

#### 2. Build and Start Services
From the root project directory (`SmartRent`), execute:
```bash
docker compose up --build -d
```

This starts 3 isolated containers:
| Service | Container Name | Image / Base | Internal Port | Exposed Host Port | URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `smartrent-frontend` | `nginx:alpine` | `80` | `8084` | [http://localhost:8084](http://localhost:8084) |
| **Backend** | `smartrent-backend` | `node:22-alpine` | `5000` | `5000` | [http://localhost:5000](http://localhost:5000) |
| **Database** | `smartrent-mongodb` | `mongo:7` | `27017` | `27017` | `mongodb://localhost:27017` |

#### 3. Seed Demo Data (Admin & Equipment Catalog)
Once containers are running and healthy, seed the database directly via Docker Compose:
```bash
# Seed System Administrator
docker compose exec backend npm run seed

# Seed Demo Equipment Catalog & Equipment Owner
docker compose exec backend npm run seed:equipment
```

#### 4. Useful Docker Commands
```bash
# Check container status
docker compose ps

# View live container logs
docker compose logs -f

# View logs for a specific service (e.g. backend)
docker compose logs -f backend

# Stop all containers
docker compose down

# Stop and delete database volumes (clean reset)
docker compose down -v
```

---

### Option 2: Local Manual Setup

If you prefer to run services individually without Docker:

#### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in your Gemini API Key and MongoDB URI:
   ```bash
   cp .env.example .env
   ```
4. Make sure MongoDB is running locally (e.g., `mongodb://localhost:27017/smartrent`).
5. Seed demo data:
   ```bash
   npm run seed
   npm run seed:equipment
   ```
6. Run the backend server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

#### 2. Frontend Setup
1. The frontend uses Vanilla JS, HTML5, and CSS3 without requiring a bundler.
2. Serve the `frontend` directory using any static web server:
   ```bash
   cd frontend
   npx serve . --listen 3000
   # OR
   cd frontend && python -m http.server 3000
   ```
3. Open `http://localhost:3000` (or `http://localhost:8084` if using Docker) in your browser.

---

## Testing

### 1. Backend Integration Tests (Jest & Supertest)
Automated backend API tests use an in-memory MongoDB database (`mongodb-memory-server`), so no external MongoDB instance is required.
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

---

### 2. End-to-End UI Automation Tests (Selenium WebDriver)
SmartRent includes 5 automated browser tests built with **Python** and **Selenium WebDriver**:

- **Test Case 1: Homepage Title & Navigation Verification**
  - Confirms homepage branding, loads the page title, and tests navigation across the navigation bar to the `About` page.
- **Test Case 2: User Registration Form Elements & Input Validation**
  - Verifies form controls (`name`, `email`, `password`, `role` dropdown), simulates real user input, and validates field values.
- **Test Case 3: Login Authentication Validation & Feedback**
  - Tests invalid credential submission and asserts error message display and UI state handling.
- **Test Case 4: Route Guard Protection & Unauthorized Access Redirect (Logical Test)**
  - Verifies that attempting to navigate directly to the protected dashboard (`dashboard.html` / `/dashboard`) without logging in automatically redirects visitors to `login.html`.
- **Test Case 5: Authenticated Session UI State & Logout Flow (Logical Test)**
  - Verifies that an active user session updates the navbar to display 'Dashboard' and 'Logout', and clicking 'Logout' clears session storage and restores guest navigation.

#### Prerequisites
- **Python 3.10+**
- **Google Chrome** (Selenium 4+ automatically manages ChromeDriver via Selenium Manager)

#### Setup & Execution
1. Install Python dependencies:
   ```bash
   pip install -r selenium_tests/requirements.txt
   ```
2. Start the frontend server (if running locally):
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
*(Note: To target Docker or custom frontend port, set `SMARTRENT_BASE_URL=http://localhost:8084 python selenium_tests/test_smartrent.py`. To run in headless mode without opening a visible browser window, uncomment `options.add_argument("--headless=new")` in `selenium_tests/test_smartrent.py`)*

---

## CI/CD Pipeline (Jenkins)
The project includes a root `Jenkinsfile` for continuous integration automation:
- **Checkout**: Pulls latest code from source control.
- **Install Dependencies**: Installs production & test dependencies.
- **Run Tests**: Injects Jenkins credentials securely (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.) and executes `npm test`.

---

## Default Credentials & Demo Accounts
| Role | Email | Password | Seed Source |
| :--- | :--- | :--- | :--- |
| **System Admin** | Defined in `.env` (`ADMIN_EMAIL`) | Defined in `.env` (`ADMIN_PASSWORD`) | `npm run seed` |
| **Equipment Owner** | `equipmentowner@smartrent.com` | `DemoOwner123` | `npm run seed:equipment` |
| **Renter (Sample)** | `alex.johnson@example.com` | `SecurePass2026!` | Registered via UI / Test Case 2 |

---

## Security
- Passwords securely hashed using `bcryptjs`
- API endpoints protected with JWT authorization and role-based middleware (`protect`, `authorize`)
- Client-side route protection for dashboards and authenticated pages
- Gemini AI requests handled server-side to keep `GEMINI_API_KEY` private
