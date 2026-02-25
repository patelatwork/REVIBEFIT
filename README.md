# RevibeFit - Complete Fitness & Health Platform 🏋️‍♂️💪

<div align="center">

![RevibeFit](https://img.shields.io/badge/RevibeFit-Fitness%20Platform-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![MongoDB](https://img.shields.io/badge/database-MongoDB-green)

An all-in-one fitness and health platform connecting fitness enthusiasts, certified trainers, and lab partners with AI-powered nutrition planning, live classes, workout tracking, and comprehensive health services.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles)
- [Core Modules](#-core-modules)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)

---

## 🌟 Overview

RevibeFit is a comprehensive fitness and health platform that brings together multiple stakeholders in the health and fitness ecosystem. The platform enables fitness enthusiasts to achieve their goals through live classes, AI-generated meal plans, workout tracking, and access to lab services - all in one place.

### **Why RevibeFit?**

- **Personalized Experience**: AI-powered meal planning tailored to individual goals
- **Expert Guidance**: Connect with certified trainers for live classes and blogs
- **Health Integration**: Book lab tests and receive reports seamlessly
- **Track Progress**: Monitor workouts, nutrition, and overall fitness journey
- **Revenue Opportunities**: Trainers and lab partners can monetize their services

---

## ✨ Key Features

### 🎯 For Fitness Enthusiasts

#### Workout Management
- 📊 **Workout Tracking** - Log and track completed workouts with detailed metrics
- 📈 **Progress Monitoring** - View workout history and performance trends
- 🎯 **Goal Setting** - Set and achieve personalized fitness goals

#### AI-Powered Nutrition
- 🤖 **AI Meal Plan Generator** - Powered by Google Gemini AI for personalized meal plans
- 🥗 **Nutrition Profiling** - Complete nutritional assessment (age, gender, height, weight, fitness goals)
- 🍽️ **Custom Meal Plans** - Based on dietary preferences (Vegetarian, Vegan, Non-Vegetarian, Keto)
- ⚕️ **Health Considerations** - Accounts for allergies, food dislikes, and health conditions
- 💧 **Hydration Tracking** - Water intake monitoring and targets
- 📊 **Macro Tracking** - Detailed calorie, protein, carbs, and fat breakdowns

#### Live Fitness Classes
- 🎥 **Book Live Classes** - Reserve spots in trainer-led sessions
- 👨‍🏫 **Browse Trainers** - View trainer profiles, specializations, and certifications
- 📅 **Class Schedule** - View and manage upcoming bookings
- 💰 **Payment Integration** - Secure booking and payment system
- ❌ **Cancel Bookings** - Flexible cancellation options

#### Blog & Learning
- 📖 **Educational Content** - Read fitness and health blogs from certified trainers
- 👁️ **Reading Tracker** - Mark blogs as read and track learning progress
- 🔍 **Discover Content** - Browse blogs by category and trainer

#### Lab Services
- 🧪 **Book Lab Tests** - Schedule health checkups and diagnostic tests
- 📋 **Test Catalog** - Browse available tests from approved lab partners
- 📄 **Digital Reports** - Access test reports directly in the platform
- 📍 **Lab Partner Network** - Find approved labs in your area
- 💳 **Transparent Pricing** - View test costs upfront

### 👨‍🏫 For Trainers

#### Class Management
- ➕ **Create Live Classes** - Schedule and manage live training sessions
- 📊 **Class Analytics** - Track attendance and class performance
- 💵 **Earnings Dashboard** - Monitor income from classes

#### Content Creation
- ✍️ **Blog Publishing** - Create and publish fitness/health blogs
- 🖼️ **Media Upload** - Add images and thumbnails to blogs
- 📝 **Content Management** - Edit and delete your published content

#### Business Tools
- 📈 **Dashboard Statistics** - Overview of clients, classes, and earnings
- 👥 **Client Management** - View and track client progress
- 📆 **Schedule Management** - Organize your training calendar
- 💰 **Earnings Tracking** - Monthly and total earnings reports
- 👤 **Profile Management** - Update specializations and certifications

### 🧪 For Lab Partners

#### Test Management
- ➕ **Add Lab Tests** - Create and manage your test catalog
- 💰 **Pricing Control** - Set competitive prices for tests
- 📋 **Test Categories** - Organize tests by type

#### Booking Management
- 📥 **View Bookings** - Manage incoming test bookings
- ✅ **Update Status** - Track booking workflow (Pending → Confirmed → Completed)
- 📤 **Upload Reports** - Deliver digital reports to users
- 💳 **Payment Tracking** - Mark payments as received

#### Financial Management
- 🧾 **Invoice System** - Automated monthly invoice generation
- 📊 **Financial Summary** - Revenue reports and analytics
- 💵 **Commission Tracking** - Platform commission management
- 📬 **Invoice Requests** - Request custom invoices from admin

#### Profile & Settings
- 🏢 **Laboratory Profile** - Update lab info, address, and contact details
- 📍 **Location Management** - Set service areas
- ⚙️ **Offered Tests** - Manage which tests you offer

### 🔐 For Admins

#### User Management
- ✅ **Approval System** - Review and approve trainer/lab partner registrations
- ❌ **Rejection Workflow** - Reject applications with reasons
- 👥 **User Directory** - View all platform users
- ⏸️ **Suspend/Activate Users** - Manage user account status

#### Analytics & Insights
- 📊 **User Statistics** - Total users by type, pending approvals
- 📈 **Growth Analytics** - Monthly user growth trends
- 👥 **User Distribution** - Demographics and user type breakdown
- 💰 **Lab Earnings Analytics** - Track lab partner revenue over time
- 🏆 **Top Performers** - Identify top-earning lab partners

#### Financial Management
- 🧾 **Automated Invoice Generation** - Monthly platform invoices for lab partners
- 📅 **Flexible Invoicing** - Generate invoices for custom date ranges
- 💳 **Payment Tracking** - Mark invoices as paid/unpaid
- ⏰ **Grace Period System** - 7-day payment grace period
- ⚠️ **Overdue Enforcement** - Auto-suspend labs for non-payment
- 💰 **Commission Management** - Customize commission rates per lab partner (5-30%)
- 📩 **Invoice Requests** - Handle custom invoice requests from lab partners

#### Platform Control
- 🏥 **Lab Suspension** - Suspend labs for policy violations or non-payment
- 🔓 **Reactivation** - Unsuspend labs after issues resolved
- 💰 **Dynamic Rates** - Adjust commission rates by lab partner
- 📋 **Invoice Generation** - Bulk generate invoices for all partners

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js (v5.1.0)
- **Database**: MongoDB with Mongoose ODM (v8.19.2)
- **Authentication**: JWT (jsonwebtoken v9.0.2) + bcryptjs (v3.0.2)
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash) - v0.24.1
- **File Upload**: Multer (v2.0.2)
- **Email**: Nodemailer (v6.9.8)
- **Security**: Helmet.js (v8.1.0), CORS
- **HTTP Client**: Axios (v1.13.2)
- **Logging**: Morgan (v1.10.0)

### Frontend
- **Framework**: React 18.2.0 + Vite
- **Routing**: React Router DOM (v7.8.2)
- **UI Libraries**: 
  - Chakra UI (v3.27.1)
  - Tailwind CSS (v4.1.16)
  - Framer Motion (v12.23.24) - Animations
  - Lucide React + React Icons
- **State Management**: 
  - Zustand (v5.0.8)
  - TanStack React Query (v5.90.3)
- **Forms**: React Hook Form (v7.65.0) + Zod validation (v4.1.12)
- **HTTP Client**: Axios (v1.12.2)
- **Notifications**: React Toastify (v11.0.5)
- **Charts**: Recharts (v3.5.1)
- **Date Handling**: date-fns (v4.1.0)
- **File Upload**: React Dropzone (v14.3.8)

### Development Tools
- **Dev Server**: Nodemon (v3.1.10)
- **Code Formatting**: Prettier (v3.6.2)
- **Linting**: ESLint (v9.33.0)
- **Testing**: Jest DOM, React Testing Library

---

## 👥 User Roles

The platform supports four distinct user types:

### 1. **Fitness Enthusiast** 🏃
Regular users focused on achieving fitness goals through workouts, nutrition, classes, and health checkups.

**Key Capabilities**:
- Track workouts and progress
- Get AI-generated meal plans
- Book live classes with trainers
- Read educational blogs
- Book lab tests and access reports

### 2. **Trainer** 💪
Certified fitness professionals providing training services and educational content.

**Key Capabilities**:
- Conduct live training classes
- Create and publish blogs
- View client roster
- Track earnings
- Manage schedule

**Requirements**: 
- Valid certifications (uploaded during signup)
- Admin approval required
- Specialization area defined

### 3. **Lab Partner** 🧪
Diagnostic laboratories offering health testing services.

**Key Capabilities**:
- Manage test catalog
- Process bookings
- Upload test reports
- Track revenue
- Receive monthly invoices

**Requirements**:
- Laboratory license and documentation
- Admin approval required
- Commission-based revenue sharing (5-30%)

### 4. **Admin** 🛡️
Platform administrators managing operations and user approvals.

**Key Capabilities**:
- Approve/reject user registrations
- Monitor platform analytics
- Manage invoices and finances
- Suspend/activate accounts
- Configure commission rates

---

## 🔧 Core Modules

### 1. Authentication Module
```javascript
Routes: /api/auth
- POST /signup - Register new users (with file upload for trainers)
- POST /login - User authentication
- POST /logout - Session termination
```

**Features**:
- JWT-based authentication
- Bcrypt password hashing
- Role-based access control
- HTTP-only cookies
- Certification upload for trainers

---

### 2. Workout Module
```javascript
Routes: /api/workouts (Protected)
- POST /complete - Log completed workout
- GET /completed - Get workout history
- DELETE /completed/:id - Remove workout entry
```

**Features**:
- Workout completion tracking
- Historical data retrieval
- Progress analytics

---

### 3. Nutrition Module (AI-Powered)
```javascript
Routes: /api/nutrition (Protected)

Profile Management:
- POST /profile - Create/update nutrition profile
- GET /profile - Get user's nutrition data
- DELETE /profile - Remove profile

Meal Planning:
- POST /meal-plan/generate - Generate AI meal plan
- GET /meal-plans - List all meal plans
- GET /meal-plans/:id - Get specific plan
- PUT /meal-plans/:id - Update meal plan
- DELETE /meal-plans/:id - Delete meal plan
```

**Profile Fields**:
- Demographics: age, gender, height, weight
- Goals: fitness goal, target weight
- Activity level: sedentary, lightly active, moderately active, very active, extra active
- Diet: vegetarian, vegan, non-vegetarian, keto
- Health: allergies, food dislikes, conditions
- Preferences: meals per day, water intake target

**AI Features**:
- Gemini 2.5 Flash integration
- Personalized meal recommendations
- Macro calculations
- Dietary restriction handling

---

### 4. Live Classes Module
```javascript
Routes: /api/live-classes

Public:
- GET / - Browse all classes
- GET /public/:id - View class details

Protected (Trainers):
- POST / - Create new class
- PUT /:id - Update class
- DELETE /:id - Delete class
- GET /trainer/my-classes - View own classes
- GET /trainer/earnings - View class earnings

Protected (Users):
- POST /:id/join - Book a class
- GET /my-bookings - View bookings
- DELETE /bookings/:bookingId - Cancel booking
```

**Features**:
- Class scheduling with date/time
- Capacity management
- Booking system
- Earnings tracking
- Cancellation handling

---

### 5. Blog Module
```javascript
Routes: /api/blogs

Public:
- GET / - List all blogs
- GET /:id - Read single blog

Protected (Trainers):
- POST / - Create blog (with image upload)
- GET /trainer/my-blogs - Get own blogs
- PUT /:id - Update blog
- DELETE /:id - Delete blog

Protected (Users):
- POST /:id/mark-read - Mark blog as read
- GET /read-blogs - Get reading history
- GET /:id/read-status - Check if read
```

**Features**:
- Rich content creation
- Thumbnail upload
- Reading tracker
- Author attribution
- CRUD operations

---

### 6. Lab Partner Module
```javascript
Routes: /api/lab-partners

Public:
- GET / - List approved labs
- GET /:id - Lab details
- GET /:id/tests - Available tests

Protected (Lab Partners):
- POST /tests/add - Add new test
- GET /tests/my-tests - Manage tests
- PUT /tests/:testId - Update test
- DELETE /tests/:testId - Remove test
- GET /offered-tests - View offered tests
- PUT /offered-tests - Update offerings
- GET /bookings/lab-bookings - View bookings
- PUT /bookings/:id/status - Update booking
- POST /bookings/:id/upload-report - Upload report
- DELETE /bookings/:id/report - Delete report
- PATCH /bookings/:id/user-payment-received - Mark paid
- GET /invoices - View invoices
- GET /invoices/:id - Invoice details
- POST /request-invoice - Request custom invoice
- GET /financial-summary - Revenue summary
- PUT /profile - Update lab profile

Protected (Users):
- POST /bookings/create - Book test
- GET /bookings/my-bookings - View bookings
- PUT /bookings/:id/cancel - Cancel booking
- GET /bookings/:id/report - Download report
```

**Features**:
- Test catalog management
- Booking workflow
- Report delivery system
- Payment tracking
- Invoice management
- Commission calculation

---

### 7. Trainer Module
```javascript
Routes: /api/trainers

Public:
- GET / - List approved trainers
- GET /:id - Trainer profile

Protected (Trainers):
- GET /dashboard/stats - Dashboard metrics
- GET /dashboard/clients - Client list
- GET /dashboard/schedule - Calendar view
- GET /dashboard/earnings - Revenue data
- PUT /profile - Update profile
```

**Features**:
- Public trainer directory
- Dashboard analytics
- Client management
- Schedule overview
- Earnings reports

---

### 8. Admin Module
```javascript
Routes: /api/admin

Authentication:
- POST /login - Admin login

User Management:
- GET /pending-approvals - Review applications
- POST /approve/:userId - Approve user
- POST /reject/:userId - Reject user
- GET /users - All users list
- PATCH /users/:id/suspend - Toggle suspension

Analytics:
- GET /stats - Platform statistics
- GET /analytics/monthly-growth - Growth trends
- GET /analytics/user-distribution - Demographics
- GET /analytics/lab-earnings/over-time - Earnings timeline
- GET /analytics/lab-earnings/breakdown - Revenue breakdown
- GET /analytics/lab-earnings/top-partners - Top earners

Lab Partner Management:
- GET /lab-partners/commission-rates - View rates
- PATCH /lab-partners/:id/commission-rate - Update rate
- PATCH /lab-partners/:id/suspend-for-nonpayment - Suspend
- PATCH /lab-partners/:id/unsuspend - Reactivate

Invoice Management:
- POST /invoices/generate/:id - Generate invoice
- POST /invoices/generate-flexible/:id - Custom invoice
- POST /invoices/generate-all - Bulk generation
- GET /invoices - All invoices
- GET /invoices/:id - Invoice details
- GET /invoice-requests - Pending requests
- PATCH /invoices/:id/mark-paid - Update payment
- POST /invoices/enforce-overdue - Auto-suspend
- GET /invoices/grace-period-status - Grace period info
```

**Features**:
- Comprehensive approval system
- Real-time analytics
- Financial management
- Commission control (5-30%)
- Automated invoicing
- Grace period enforcement (7 days)
- Bulk operations

---

## 📁 Project Structure

```
WBD-REVIBEFIT/
│
├── RevibeFit-Backend/
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   │   ├── admin.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── blog.controller.js
│   │   │   ├── labPartner.controller.js
│   │   │   ├── liveClass.controller.js
│   │   │   ├── nutrition.controller.js
│   │   │   ├── trainer.controller.js
│   │   │   └── workout.controller.js
│   │   │
│   │   ├── models/            # MongoDB schemas
│   │   │   ├── user.model.js
│   │   │   ├── blog.model.js
│   │   │   ├── blogReading.model.js
│   │   │   ├── liveClass.model.js
│   │   │   ├── classBooking.model.js
│   │   │   ├── completedWorkout.model.js
│   │   │   ├── nutritionProfile.model.js
│   │   │   ├── mealPlan.model.js
│   │   │   ├── labTest.model.js
│   │   │   ├── labBooking.model.js
│   │   │   └── platformInvoice.model.js
│   │   │
│   │   ├── routes/            # API endpoints
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── blog.routes.js
│   │   │   ├── labPartner.routes.js
│   │   │   ├── liveClass.routes.js
│   │   │   ├── nutrition.routes.js
│   │   │   ├── trainer.routes.js
│   │   │   └── workout.routes.js
│   │   │
│   │   ├── middlewares/       # Express middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── errorLogger.middleware.js
│   │   │   └── multer.middleware.js
│   │   │
│   │   ├── utils/            # Helper functions
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   └── emailService.js
│   │   │
│   │   ├── db/               # Database connection
│   │   │   └── index.js
│   │   │
│   │   ├── app.js            # Express app setup
│   │   ├── index.js          # Entry point
│   │   └── constants.js      # App constants
│   │
│   ├── public/temp/          # Temporary file storage
│   ├── logs/                 # Application logs
│   ├── scripts/              # Utility scripts
│   └── package.json
│
├── RevibeFit-Frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/         # Login/Signup
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Signup.jsx
│   │   │   │
│   │   │   ├── fitness-enthusiast/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Dashboard.jsx
│   │   │   │   │   ├── Workouts.jsx
│   │   │   │   │   ├── CompletedWorkouts.jsx
│   │   │   │   │   ├── NutritionPlan.jsx
│   │   │   │   │   ├── LiveClasses.jsx
│   │   │   │   │   ├── MyBookings.jsx
│   │   │   │   │   ├── Blog.jsx
│   │   │   │   │   ├── BlogDetail.jsx
│   │   │   │   │   ├── ReadBlogs.jsx
│   │   │   │   │   ├── Trainers.jsx
│   │   │   │   │   ├── Care.jsx
│   │   │   │   │   └── FitnessEnthusiastCare.jsx
│   │   │   │   └── components/
│   │   │   │       ├── FitnessEnthusiastNavbar.jsx
│   │   │   │       ├── BlogCard.jsx
│   │   │   │       ├── ExerciseTimerModal.jsx
│   │   │   │       ├── LabBookingModal.jsx
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── trainer/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Dashboard.jsx
│   │   │   │   │   ├── TrainerLiveClasses.jsx
│   │   │   │   │   ├── MyClients.jsx
│   │   │   │   │   ├── TrainerSchedule.jsx
│   │   │   │   │   ├── TrainerEarnings.jsx
│   │   │   │   │   ├── UploadBlog.jsx
│   │   │   │   │   └── TrainerProfile.jsx
│   │   │   │   └── components/
│   │   │   │
│   │   │   ├── lab-partner/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Dashboard.jsx
│   │   │   │   │   ├── ManageTests.jsx
│   │   │   │   │   ├── ManageBookings.jsx
│   │   │   │   │   ├── LabReports.jsx
│   │   │   │   │   ├── MyInvoices.jsx
│   │   │   │   │   └── LabProfile.jsx
│   │   │   │   └── components/
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   │   ├── AdminLogin.jsx
│   │   │   │   │   ├── PendingApprovals.jsx
│   │   │   │   │   ├── InvoiceManagement.jsx
│   │   │   │   │   └── LabEarningsAnalytics.jsx
│   │   │   │   └── components/
│   │   │   │       ├── AdminNavbar.jsx
│   │   │   │       ├── Analytics.jsx
│   │   │   │       └── ManageUsers.jsx
│   │   │   │
│   │   │   └── landing-page/
│   │   │       ├── pages/
│   │   │       └── sections/
│   │   │
│   │   ├── components/       # Shared components
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── store/           # State management
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── blogSlice.js
│   │   │       └── workoutSlice.js
│   │   │
│   │   ├── context/         # React Context
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── UserPreferencesContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   │
│   │   ├── hooks/           # Custom hooks
│   │   │   ├── useReduxAuth.js
│   │   │   ├── useReduxWorkout.js
│   │   │   └── useLiveData.js
│   │   │
│   │   ├── assets/          # Static assets
│   │   │   └── workouts/
│   │   │
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   │
│   ├── public/              # Public assets
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (Local or Atlas)
- **npm** or **yarn**
- **Google Gemini API Key** (for AI meal planning)

---

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd RevibeFit-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the backend root:
   
   ```env
   # Server Configuration
   PORT=8000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/revibe_fit
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/revibe_fit
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   JWT_EXPIRY=7d
   
   # Cookie Settings
   COOKIE_NAME=token
   COOKIE_EXPIRY=7
   
   # Google Gemini AI (for meal plan generation)
   GEMINI_API_KEY=your-gemini-api-key-here
   
   # Email Configuration (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=RevibeFit <noreply@revibefit.com>
   
   # CORS Origin (Frontend URL)
   CORS_ORIGIN=http://localhost:5173
   
   # File Upload
   MAX_FILE_SIZE=5242880  # 5MB in bytes
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The backend server will start on `http://localhost:8000`

---

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd RevibeFit-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the frontend root:
   
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The frontend will start on `http://localhost:5173`

---

### Database Seeding (Optional)

To create test data:

```bash
cd RevibeFit-Backend
node scripts/create-test-booking.js
```

---

### Creating First Admin User

Since admin accounts require special privileges, you'll need to create one manually in MongoDB:

1. **Connect to MongoDB**
   ```bash
   mongosh
   use revibe_fit
   ```

2. **Create admin user**
   ```javascript
   db.users.insertOne({
     name: "Admin",
     email: "admin@revibefit.com",
     password: "$2a$10$YourHashedPasswordHere",  // Use bcrypt to hash
     phone: "1234567890",
     age: 30,
     userType: "admin",
     isApproved: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

   Or hash a password in Node.js:
   ```javascript
   const bcrypt = require('bcryptjs');
   const password = await bcrypt.hash('your-password', 10);
   console.log(password);
   ```

---

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication

All protected routes require a JWT token in the cookie or Authorization header:

```http
Cookie: token=your-jwt-token
```

Or:

```http
Authorization: Bearer your-jwt-token
```

### Response Format

All API responses follow this structure:

**Success**:
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

**Error**:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false,
  "errors": []
}
```

### API Endpoints Summary

| Module | Base Route | Authentication |
|--------|-----------|----------------|
| Auth | `/api/auth` | Public |
| Workouts | `/api/workouts` | Required |
| Nutrition | `/api/nutrition` | Required |
| Live Classes | `/api/live-classes` | Mixed |
| Blogs | `/api/blogs` | Mixed |
| Lab Partners | `/api/lab-partners` | Mixed |
| Trainers | `/api/trainers` | Mixed |
| Admin | `/api/admin` | Required (Admin) |

For detailed endpoint documentation, see the [Core Modules](#-core-modules) section above.

---

## 🎨 Frontend Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Landing Page | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/dashboard` | User Dashboard | Private |
| `/workouts` | Workout Library | Private (FE) |
| `/completed-workouts` | Workout History | Private (FE) |
| `/nutrition` | Nutrition Planning | Private (FE) |
| `/live-classes` | Browse Classes | Private (FE) |
| `/my-bookings` | Class Bookings | Private (FE) |
| `/blogs` | Blog Listing | Private (FE) |
| `/blogs/:id` | Blog Detail | Private (FE) |
| `/read-blogs` | Reading History | Private (FE) |
| `/trainers` | Trainer Directory | Private (FE) |
| `/care` | Lab Services | Private (FE) |
| `/trainer/dashboard` | Trainer Dashboard | Private (Trainer) |
| `/trainer/classes` | Manage Classes | Private (Trainer) |
| `/trainer/blog/upload` | Create Blog | Private (Trainer) |
| `/trainer/clients` | View Clients | Private (Trainer) |
| `/trainer/earnings` | View Earnings | Private (Trainer) |
| `/lab/dashboard` | Lab Dashboard | Private (Lab) |
| `/lab/tests` | Manage Tests | Private (Lab) |
| `/lab/bookings` | Manage Bookings | Private (Lab) |
| `/lab/invoices` | View Invoices | Private (Lab) |
| `/admin/login` | Admin Login | Public |
| `/admin/dashboard` | Admin Dashboard | Private (Admin) |
| `/admin/approvals` | Pending Approvals | Private (Admin) |
| `/admin/invoices` | Invoice Management | Private (Admin) |

*FE = Fitness Enthusiast*

---

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **HTTP-Only Cookies**: XSS protection
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Mongoose schema validation
- **File Upload Security**: File type and size restrictions
- **Role-Based Access**: Middleware-enforced permissions
- **Error Handling**: Global error handler
- **Rate Limiting**: (Recommended for production)

---

## 🌐 Environment Variables

### Backend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/revibe_fit` |
| `JWT_SECRET` | JWT signing key | `your-secret-key` |
| `JWT_EXPIRY` | Token expiration | `7d` |
| `GEMINI_API_KEY` | Google AI API key | `your-api-key` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email username | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Email password | `app-password` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:5173` |

### Frontend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |

---

## 📊 Database Schema

### Collections

1. **users** - All platform users
2. **blogs** - Trainer-created content
3. **blogreadings** - User reading tracker
4. **liveclasses** - Training sessions
5. **classbookings** - Class reservations
6. **completedworkouts** - Workout logs
7. **nutritionprofiles** - User nutrition data
8. **mealplans** - AI-generated meal plans
9. **labtests** - Lab test catalog
10. **labbookings** - Lab test bookings
11. **platforminvoices** - Monthly invoices

---

## 🛣️ Roadmap

### Upcoming Features

- [ ] **Payment Gateway Integration** (Razorpay/Stripe)
- [ ] **Video Call Integration** for live classes
- [ ] **Push Notifications** for bookings and classes
- [ ] **Mobile App** (React Native)
- [ ] **Social Features** (Friends, Activity Feed)
- [ ] **Workout Recommendation Engine**
- [ ] **Progress Photos Upload**
- [ ] **Meal Logging with Photos**
- [ ] **Wearable Device Integration** (Fitbit, Apple Watch)
- [ ] **Community Forums**
- [ ] **Trainer Ratings & Reviews**
- [ ] **Multi-language Support**
- [ ] **Dark Mode**

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards

- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Authors

**RevibeFit Team**

- Backend Development
- Frontend Development  
- AI Integration
- Database Design
- UI/UX Design

---

## 📧 Support

For support and queries:

- **Email**: support@revibefit.com
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent meal planning
- **MongoDB** for flexible database
- **React** community for amazing tools
- **Express.js** for robust backend framework
- All contributors and testers

---

<div align="center">

**Made with ❤️ by the RevibeFit Team**

[Website](#) | [Documentation](#) | [Blog](#) | [Support](#)

⭐ Star us on GitHub if you find this project helpful!

</div>