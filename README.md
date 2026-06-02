

# 🩸 Sew Le Sew - Unified Donation Platform

**"From Heart to Hand" – An AI-powered healthcare donation coordination platform for Ethiopia.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=for-the-badge&logo=vercel)](https://sew-le-sew-platform.vercel.app)
[![API Status](https://img.shields.io/badge/API-Live-blue?style=for-the-badge&logo=render)](https://sew-lesew-backend-gzpf.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)

---

## 📌 Overview

Sew Le Sew is a **unified, AI-driven web platform** designed to streamline healthcare donation coordination in Ethiopia. It connects donors, recipients, and the Ethiopian Red Cross Society (ERCS) through a centralized digital ecosystem.

**Key Features:**

- ✅ **User Authentication** – Email/Password + Google OAuth 2.0
- ✅ **Donor Management** – Eligibility checks, intent registration, donation history
- ✅ **Recipient Management** – Medical information submission, donation requests
- ✅ **AI-Powered Chatbot** – Groq API integration for user assistance
- ✅ **Donor-Recipient Matching** – AI-assisted matching engine
- ✅ **Event Management** – Create, schedule, and map donation events
- ✅ **File Uploads** – Secure medical document storage via Cloudinary
- ✅ **Email Notifications** – Password reset, verification, match alerts
- ✅ **Admin Dashboard** – User management, analytics, audit logs
- ✅ **Responsive Design** – Mobile-first with Tailwind CSS

---

## 🚀 Live Demo

| Component | URL |
|-----------|-----|
| **Frontend Application** | https://sew-le-sew-platform.vercel.app |
| **Backend API** | https://sew-lesew-backend-gzpf.onrender.com |
| **API Health Check** | https://sew-lesew-backend-gzpf.onrender.com/ |

---

## 🏗️ Architecture

The system follows a **three-tier client-server architecture**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│   Database  │
│  (React)    │◀────│  (Node.js)  │◀────│ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   ▼                    │
       │            ┌─────────────┐             │
       └───────────▶│  External   │◀────────────┘
                    │    APIs     │
                    └─────────────┘
```

**External Integrations:**

- Google OAuth 2.0 – Social login
- Cloudinary – Medical document storage
- Groq API – AI chatbot
- Google Maps API – Event location display
- Gmail SMTP – Email notifications

---

## 📂 Project Structure

```
Sew-Le-Sew-A-unified-Donation-Platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context (auth, theme)
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API service layer
│   ├── public/             # Static assets
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── validations/    # Zod validation schemas
│   ├── prisma/             # Database schema
│   └── package.json
│
├── docker-compose.yml      # Local development setup
├── render.yaml             # Render deployment configuration
└── README.md               # This file
```

---

## 🛠️ Tech Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend | React 18 + Vite + Tailwind CSS | Vercel |
| Backend | Node.js + Express + Prisma | Render |
| Database | PostgreSQL | Neon (Cloud) |
| Authentication | JWT + Google OAuth 2.0 | Custom + Google |
| File Storage | Cloudinary | Cloudinary CDN |
| AI Services | Groq API | External API |
| Email | Gmail SMTP | Google |
| Maps | Google Maps API | External API |
| CI/CD | GitHub Actions | Auto-deploy |

---

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL (or Docker for local development)
- npm or yarn package manager

---

## 🔧 Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/precious161/Sew-Le-Sew-A-unified-Donation-Platform.git
cd Sew-Le-Sew-A-unified-Donation-Platform
```

### 2. Set up environment variables

**Backend (.env):**

```env
# Core
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/sewlesew_db"

# Auth
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Sew Le Sew" <noreply@sewlesew.com>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Set up database

```bash
cd ../server
npx prisma generate
npx prisma db push
```

### 5. Run development servers

```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd client
npm run dev
```

### 6. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🐳 Docker Setup (Optional)

```bash
# Start PostgreSQL container
docker-compose up -d

# Run migrations
cd server
npx prisma migrate dev

# Start the app
npm run dev
```

---

## 🚀 Production Deployment

The application is configured for **automatic deployment** on every push to the `main` branch.

| Service | Platform | Auto-deploy |
|---------|----------|-------------|
| Frontend | Vercel | ✅ Yes |
| Backend | Render | ✅ Yes |
| Database | Neon | ✅ Managed |

**Deployment URLs:**

- Frontend: https://sew-le-sew-platform.vercel.app
- Backend: https://sew-lesew-backend-gzpf.onrender.com

---

## 📊 Some API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/users/me` | Get user profile |
| PATCH | `/api/users/update-me` | Update user profile |
| POST | `/api/users/change-role` | Change user role |
| GET | `/api/events` | Get public events |
| POST | `/api/events/:id/rsvp` | RSVP to event |
| GET | `/api/events/admin` | Admin event list |
| POST | `/api/events` | Create event (Admin) |
| GET | `/api/ai/chat` | AI chatbot endpoint |

---

## 👥 Contributors

| Name | ID | Role |
|------|-----|------|
| **Feyruza Dawud** | UGR/7614/15 | Backend Developer |
| **Hanan Mohammed** | UGR/0002/15 | Frontend Developer |
| **Hawi Yasin** | UGR/4877/15 | UI/UX Designer |

**Supervisor:** Mr. Nesredien Suleiman

---

## 📄 License

This project is submitted as a **graduation project** to the Department of Computer Science, Addis Ababa University. All rights reserved.

---

## 🙏 Acknowledgments

- Ethiopian Red Cross Society (ERCS) for operational guidelines
- Ministry of Health for healthcare donation standards
- Addis Ababa University Department of Computer Science
- All open-source contributors whose libraries made this project possible

---

## 📞 Contact

For any inquiries regarding this project:

- **Email:** feyruza.dawud-ug@aau.edu.et
- **GitHub:** [precious161](https://github.com/precious161)

---

**Built with ❤️ for Ethiopia**
