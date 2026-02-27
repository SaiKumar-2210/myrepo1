# MedBs — Medication Adherence & Alert Assistant

AI-powered full-stack application to help users track medications, get reminders, and ensure adherence with caregiver alerts.

## ✨ Features

- **User Authentication** — JWT-based signup/login
- **OCR Prescription Scan** — Upload prescription images, auto-extract medicines via Tesseract.js
- **QR Code Scanner** — Import prescription data from QR codes
- **Medicine Management** — Add, edit, delete medicines with scheduling
- **Smart Reminders** — node-cron scheduler with timing-based alerts
- **Adherence Dashboard** — Daily tracking with visual charts
- **Voice Confirmation** — Say "I took my medicine" via Web Speech API
- **Caregiver Alerts** — Auto-email if a dose is missed
- **Responsive Design** — Works on desktop and mobile

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI/OCR | Tesseract.js |
| Voice | Web Speech API |
| Scheduler | node-cron |
| Email | Nodemailer |

## 📁 Project Structure

```
Medbs/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT authentication
│   ├── models/                # User, Medicine, AdherenceLog
│   ├── routes/                # auth, medicines, adherence, ocr, qr
│   ├── utils/                 # scheduler, email
│   ├── server.js              # Entry point
│   ├── .env                   # ← Add your secrets here
│   └── .env.example
├── frontend/
│   ├── src/app/               # Pages (dashboard, login, signup, medicines, scan)
│   ├── src/components/        # Navbar, MedicineCard, AdherenceChart, etc.
│   ├── src/lib/               # API client, auth context
│   ├── .env.local             # ← Frontend env
│   └── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally or a MongoDB Atlas URI

### 1. Clone and Setup Backend

```bash
cd backend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
# ← Add your MongoDB URI here
MONGODB_URI=mongodb://localhost:27017/medbs

# ← Add a strong JWT secret
JWT_SECRET=your_strong_secret_here

# ← (Optional) Gmail credentials for caregiver email alerts
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Server starts at `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
App opens at `http://localhost:3000`

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `PORT` | Server port (default: 5000) | ❌ |
| `EMAIL_USER` | Gmail address for sending alerts | ❌ |
| `EMAIL_PASS` | Gmail App Password | ❌ |
| `FRONTEND_URL` | Frontend URL for CORS | ❌ |

### Frontend (`frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | ✅ |

## 📡 API Endpoints

### Auth
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile

### Medicines
- `GET /api/medicines` — List medicines
- `POST /api/medicines` — Add medicine
- `POST /api/medicines/bulk` — Bulk add (from OCR/QR)
- `PUT /api/medicines/:id` — Update medicine
- `DELETE /api/medicines/:id` — Delete medicine

### Adherence
- `GET /api/adherence` — Get logs
- `GET /api/adherence/stats` — Get statistics
- `POST /api/adherence` — Log a dose
- `PUT /api/adherence/:id` — Update log
- `POST /api/adherence/voice` — Voice confirmation

### OCR & QR
- `POST /api/ocr/extract` — Extract text from prescription image
- `POST /api/qr/parse` — Parse QR code data

## 📝 License

MIT
