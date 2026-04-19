# RevibeFit - Domain-Driven Design Document

---

## 1. Title and Project Description

### Title: **RevibeFit - A Comprehensive Fitness and Health Ecosystem Platform**

### Description

RevibeFit is a full-stack web platform that connects fitness enthusiasts, certified trainers, diagnostic lab partners, and platform administrators within a unified health and wellness ecosystem. The platform empowers fitness enthusiasts to track workouts, receive AI-powered personalized meal plans (via Google Gemini), book live training classes, access diagnostic lab services, and engage with a fitness-focused community. Trainers can conduct live classes, publish educational blogs, manage their client base, and track earnings with commission-based payouts. Lab partners manage diagnostic test catalogs, process bookings, upload digital reports, and handle commission-based invoicing. Administrators oversee user approvals, platform analytics, commission rate management, invoice generation, and regional manager assignments. Managers provide regional oversight of trainers and lab partners, assisting with approvals and monitoring activity. The platform features role-based access control, real-time communication via Socket.io, a multi-stage financial workflow (commission tracking, invoice generation, grace-period enforcement, and automated suspension for non-payment), and a community module with posts, challenges, reactions, and threaded discussions. Built on the MERN stack (MongoDB, Express.js, React 18, Node.js), RevibeFit delivers a production-grade, multi-stakeholder health platform with enterprise-level financial controls and AI-driven personalization. (196 words)

---

## 2. Domain-Driven Design

### 2a. Bounded Contexts

The system is decomposed into **seven** bounded contexts, each encapsulating a cohesive domain area with its own ubiquitous language, models, and rules.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RevibeFit Domain                                │
│                                                                         │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐  │
│  │  1. Identity &   │   │  2. Fitness       │   │  3. Nutrition      │  │
│  │     Access        │   │     Tracking      │   │     Management     │  │
│  │                   │   │                   │   │                    │  │
│  │  - User Signup    │   │  - Workout Logs   │   │  - Nutrition       │  │
│  │  - Authentication │   │  - Exercise Data  │   │    Profiles        │  │
│  │  - Role Mgmt      │   │  - Progress       │   │  - AI Meal Plans   │  │
│  │  - Approval Flow  │   │    History        │   │  - Meal Logging    │  │
│  │  - Password Mgmt  │   │                   │   │  - Food Database   │  │
│  └──────────────────┘   └──────────────────┘   └────────────────────┘  │
│                                                                         │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐  │
│  │  4. Live         │   │  5. Lab           │   │  6. Community &    │  │
│  │     Training      │   │     Services      │   │     Engagement     │  │
│  │                   │   │                   │   │                    │  │
│  │  - Class Mgmt     │   │  - Test Catalog   │   │  - Posts           │  │
│  │  - Bookings       │   │  - Lab Bookings   │   │  - Comments        │  │
│  │  - Attendance     │   │  - Report Mgmt    │   │  - Reactions       │  │
│  │  - Trainer Blogs  │   │  - Invoicing      │   │  - Challenges      │  │
│  │  - Earnings       │   │  - Commissions    │   │  - Social Follows  │  │
│  └──────────────────┘   └──────────────────┘   └────────────────────┘  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  7. Platform Administration                                        │ │
│  │                                                                    │ │
│  │  - User Approvals    - Commission Rate Mgmt   - Manager Oversight  │ │
│  │  - Platform Analytics - Invoice Enforcement   - Activity Logging   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

| # | Bounded Context | Responsibility |
|---|---|---|
| 1 | **Identity & Access** | User registration, authentication (JWT), role-based authorization, approval workflows, password management |
| 2 | **Fitness Tracking** | Logging completed workouts, tracking exercise history, fitness progress |
| 3 | **Nutrition Management** | Nutrition profiles, AI-generated meal plans (Gemini), meal logging, food search (FatSecret API), nutrition analytics |
| 4 | **Live Training** | Live class creation/scheduling by trainers, class bookings, attendance, refunds, trainer earnings, blog publishing |
| 5 | **Lab Services** | Diagnostic test catalog, lab bookings, report upload/download, commission billing, platform invoicing |
| 6 | **Community & Engagement** | Community posts, threaded comments, reactions, fitness challenges, participant tracking, social follows |
| 7 | **Platform Administration** | Admin approval/rejection, analytics dashboards, commission rate management, invoice enforcement, manager creation, activity audit logs |

---

### 2b. Context Mappings

Context mappings define the relationships and integration patterns between bounded contexts.

```
                    ┌──────────────────┐
                    │   Identity &     │
                    │   Access (U)     │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────────────────┐
            │ [Shared Kernel]│ [Shared Kernel]             │
            │                │                             │
    ┌───────▼──────┐  ┌──────▼───────┐  ┌────────────┐   │
    │  Fitness     │  │  Nutrition   │  │  Community  │   │
    │  Tracking    │  │  Management  │  │  & Engage.  │   │
    │  (D)         │  │  (D)         │  │  (D)        │   │
    └──────────────┘  └──────────────┘  └──────┬─────┘   │
                                               │          │
                    ┌──────────────────┐        │          │
                    │  Live Training   │◄───────┘          │
                    │  (D)             │  [Customer/        │
                    └────────┬─────────┘   Supplier]       │
                             │                             │
                    [Customer/Supplier]                     │
                             │                             │
                    ┌────────▼─────────┐                   │
                    │  Lab Services    │                   │
                    │  (D)             │                   │
                    └────────┬─────────┘                   │
                             │                             │
                    [Conformist]                            │
                             │                             │
                    ┌────────▼─────────────────────────────▼──┐
                    │  Platform Administration (U)             │
                    │  (Upstream for governance & financial)   │
                    └─────────────────────────────────────────┘
```

| Upstream (U) | Downstream (D) | Mapping Pattern | Description |
|---|---|---|---|
| Identity & Access | Fitness Tracking | **Shared Kernel** | Both share the `User` entity; fitness tracking depends on authenticated user identity |
| Identity & Access | Nutrition Management | **Shared Kernel** | Nutrition profiles are linked to authenticated users via `userId` |
| Identity & Access | Live Training | **Shared Kernel** | Trainers and fitness enthusiasts are User subtypes; class bookings reference user identity |
| Identity & Access | Lab Services | **Shared Kernel** | Lab partners and fitness enthusiasts are User subtypes; bookings reference both |
| Identity & Access | Community & Engagement | **Shared Kernel** | Posts, comments, follows, and challenges reference user identity |
| Identity & Access | Platform Administration | **Shared Kernel** | Admin and Manager are User subtypes; approval workflows modify user state |
| Live Training | Community & Engagement | **Customer/Supplier** | Trainers (from Live Training) create challenges and blog content consumed by the community |
| Lab Services | Platform Administration | **Conformist** | Lab Services conforms to invoice structures and commission rules defined by administration |
| Live Training | Platform Administration | **Conformist** | Trainer earnings and commission rates are governed by admin-defined policies |
| Platform Administration | Lab Services | **Customer/Supplier** | Admin generates invoices, sets commission rates; Lab Services consumes these policies |
| Platform Administration | Live Training | **Customer/Supplier** | Admin manages trainer commission rates and earnings oversight |
| Nutrition Management | Fitness Tracking | **Separate Ways** | Both operate independently; no direct dependency (both relate only to User) |

---

### 2c. Entities, Value Objects, and Services

#### Bounded Context 1: Identity & Access

| Type | Name | Description |
|---|---|---|
| **Entity** | User | Central identity entity; polymorphic by `userType` (fitness-enthusiast, trainer, lab-partner, admin, manager) |
| **Value Object** | Credentials | Email + hashed password combination |
| **Value Object** | SocialLinks | Trainer's social media URLs (Instagram, YouTube, Twitter, LinkedIn, Website) |
| **Value Object** | OperatingHours | Lab partner's daily operating schedule (open/close times per day) |
| **Value Object** | ApprovalStatus | Status enum (pending, approved, rejected) with approval metadata |
| **Value Object** | RefreshToken | JWT refresh token for session management |
| **Value Object** | PasswordResetToken | Token + expiry for password recovery |
| **Service** | AuthService | Signup, login, logout, JWT generation/validation, cookie management |
| **Service** | PasswordService | Password hashing (bcrypt), change password, forgot/reset password via email |
| **Service** | EmailService | Nodemailer-based transactional email (reset links, approval notifications) |

#### Bounded Context 2: Fitness Tracking

| Type | Name | Description |
|---|---|---|
| **Entity** | CompletedWorkout | Record of a completed workout session with duration, difficulty, and category |
| **Value Object** | Difficulty | Enum: Beginner, Intermediate, Advanced |
| **Value Object** | WorkoutCategory | Category classification string |
| **Service** | WorkoutService | Log completed workouts, retrieve history, delete entries |

#### Bounded Context 3: Nutrition Management

| Type | Name | Description |
|---|---|---|
| **Entity** | NutritionProfile | User's dietary profile with auto-calculated metrics (BMI, BMR, TDEE, daily targets) |
| **Entity** | MealPlan | AI-generated weekly meal plan with detailed nutritional breakdown per meal |
| **Entity** | MealLog | Daily meal log entries with food items and nutrition data |
| **Value Object** | FoodItem | Individual food entry with calories, protein, carbs, fats, fiber, sugar, sodium |
| **Value Object** | DailyMeal | Single day's meal structure (breakfast, lunch, dinner, snacks) within a MealPlan |
| **Value Object** | MacroTargets | Calculated daily targets: calories, protein, carbs, fats |
| **Value Object** | BodyMetrics | Height, weight, BMI, BMR, TDEE - auto-calculated from profile data |
| **Value Object** | DietaryPreference | Enum: vegetarian, vegan, keto, paleo, mediterranean, etc. |
| **Value Object** | ActivityLevel | Enum: sedentary, lightly-active, moderately-active, very-active, extremely-active |
| **Value Object** | FitnessGoal | Enum: weight-loss, muscle-gain, maintenance, endurance, general-health |
| **Service** | NutritionProfileService | CRUD for nutrition profiles; auto-calculates BMI/BMR/TDEE/macro targets |
| **Service** | MealPlanService | AI meal plan generation (Google Gemini), CRUD for meal plans |
| **Service** | MealLogService | Log meals, retrieve by date range, daily summaries, nutrition statistics |
| **Service** | FoodSearchService | FatSecret API integration for food database search and nutritional analysis |

#### Bounded Context 4: Live Training

| Type | Name | Description |
|---|---|---|
| **Entity** | LiveClass | Scheduled training session with class type, capacity, cost, and status |
| **Entity** | ClassBooking | User's booking for a live class with payment, attendance, and refund tracking |
| **Entity** | Blog | Educational content published by trainers with categories and thumbnails |
| **Entity** | BlogReading | Tracks which user has read which blog (unique per user-blog pair) |
| **Value Object** | ClassType | Enum: cycling, strength, running, yoga, meditation, rowing, outdoor, stretching, other |
| **Value Object** | BookingStatus | Enum: active, cancelled, completed, no-show |
| **Value Object** | PaymentStatus | Enum: pending, completed, failed, refunded |
| **Value Object** | AttendanceStatus | Enum: registered, attended, missed |
| **Value Object** | RefundPolicy | Time-based refund: >24hrs = 100%, 2-24hrs = 50%, <2hrs = 0% |
| **Value Object** | CommissionDetails | Rate, amount, trainer payout - calculated per booking |
| **Value Object** | BlogCategory | Enum: Fitness Tips, Nutrition, Yoga, Mental Wellness, General |
| **Service** | LiveClassService | Class creation/update by trainers, status auto-transitions, capacity management |
| **Service** | ClassBookingService | Join/cancel classes, refund calculation, booking history, attendance tracking |
| **Service** | BlogService | Blog CRUD, publish/unpublish, reading tracking |
| **Service** | TrainerDashboardService | Dashboard analytics, client listing, schedule view, earnings calculation |

#### Bounded Context 5: Lab Services

| Type | Name | Description |
|---|---|---|
| **Entity** | LabTest | Diagnostic test offered by a lab partner with price, duration, and category |
| **Entity** | LabBooking | Booking of one or more lab tests by a fitness enthusiast |
| **Entity** | PlatformInvoice | Invoice issued to lab partners for accumulated commissions over a billing period |
| **Value Object** | TestCategory | Enum: Blood Test, Urine Test, Imaging, Fitness Assessment, Cardiac Test, Other |
| **Value Object** | SelectedTest | Embedded test reference with snapshot of testName and price at booking time |
| **Value Object** | BookingStatus | Enum: pending, confirmed, completed, cancelled |
| **Value Object** | CommissionStatus | Enum: pending, billed, paid |
| **Value Object** | BillingPeriod | Month/year or custom date range for invoice generation |
| **Value Object** | CommissionBreakdown | Per-booking details within an invoice (booking ID, test names, amounts, rates) |
| **Value Object** | InvoiceStatus | Enum: payment_due, paid, overdue, cancelled |
| **Value Object** | UserPaymentInfo | Payment method (cash, card, online, UPI), date, verified-by |
| **Service** | LabTestService | Test catalog CRUD, offered tests management |
| **Service** | LabBookingService | Create/cancel bookings, status transitions, report upload/download |
| **Service** | LabPaymentService | Mark user payment received, commission calculation, payment verification |
| **Service** | InvoiceService | Generate monthly/custom invoices, mark paid, financial summary |

#### Bounded Context 6: Community & Engagement

| Type | Name | Description |
|---|---|---|
| **Entity** | CommunityPost | User-authored post with content, images, tags, and engagement metrics |
| **Entity** | Comment | Threaded comment on a post (supports nested replies via self-reference) |
| **Entity** | Reaction | User reaction on a post or comment (polymorphic target) |
| **Entity** | Challenge | Fitness challenge created by trainers/admins with goals, rules, and duration |
| **Entity** | ChallengeParticipant | User's participation record with progress logs, completion status, and rank |
| **Entity** | Follow | Social follow relationship between users (many-to-many) |
| **Value Object** | PostCategory | Enum: tip, question, transformation, motivation, discussion, success-story |
| **Value Object** | ReactionType | Enum: like, love, fire, clap |
| **Value Object** | GoalType | Enum: count, duration, streak |
| **Value Object** | ProgressLogEntry | Timestamped progress entry with value and optional note |
| **Value Object** | ChallengeDifficulty | Enum: beginner, intermediate, advanced |
| **Service** | CommunityPostService | Post CRUD, pinning, visibility control, image uploads |
| **Service** | CommentService | Threaded comment CRUD, visibility management |
| **Service** | ReactionService | Add/remove reactions on posts and comments |
| **Service** | ChallengeService | Challenge CRUD, participant management, progress tracking, leaderboards |
| **Service** | FollowService | Follow/unfollow users, follower/following lists |

#### Bounded Context 7: Platform Administration

| Type | Name | Description |
|---|---|---|
| **Entity** | ManagerActivityLog | Audit trail of manager actions with target, details, and IP address |
| **Entity** | CommissionChangeRequest | Request to modify commission rates (by managers), with admin approval flow |
| **Value Object** | ManagerType | Enum: trainer_manager, lab_manager |
| **Value Object** | ManagerAction | Enum of 18 tracked actions (APPROVE_USER, GENERATE_INVOICE, etc.) |
| **Value Object** | AssignedRegions | Array of Indian geographic regions assigned to a manager |
| **Value Object** | RequestStatus | Enum: pending, approved, denied |
| **Service** | ApprovalService | Pending approvals, approve/reject users, request additional info, claim/release locking |
| **Service** | PlatformAnalyticsService | User stats, monthly growth, user distribution, dashboard analytics |
| **Service** | CommissionManagementService | View/update commission rates for trainers and lab partners (5-30% range) |
| **Service** | InvoiceEnforcementService | Generate invoices, enforce overdue payments, suspend/unsuspend labs, grace period management |
| **Service** | ManagerService | Manager CRUD, region assignment, activity log retrieval, soft/hard delete |

---

### 2d. Cardinality Ratios

```
┌──────────────────────────────────────────────────────────────────────┐
│                     CARDINALITY RATIO DIAGRAM                        │
│                                                                      │
│  User (1) ───────────────── (0..N) CompletedWorkout                  │
│  User (1) ───────────────── (0..1) NutritionProfile                  │
│  User (1) ───────────────── (0..N) MealPlan                          │
│  User (1) ───────────────── (0..N) MealLog                           │
│  User (1) ───────────────── (0..N) LiveClass         [as Trainer]    │
│  User (1) ───────────────── (0..N) ClassBooking      [as Enthusiast] │
│  User (1) ───────────────── (0..N) Blog              [as Trainer]    │
│  User (1) ───────────────── (0..N) BlogReading       [as Enthusiast] │
│  User (1) ───────────────── (0..N) LabTest           [as Lab Partner]│
│  User (1) ───────────────── (0..N) LabBooking        [as Enthusiast] │
│  User (1) ───────────────── (0..N) LabBooking        [as Lab Partner]│
│  User (1) ───────────────── (0..N) PlatformInvoice   [as Lab Partner]│
│  User (1) ───────────────── (0..N) CommunityPost                     │
│  User (1) ───────────────── (0..N) Comment                           │
│  User (1) ───────────────── (0..N) Reaction                          │
│  User (1) ───────────────── (0..N) Challenge         [as Creator]    │
│  User (1) ───────────────── (0..N) ChallengeParticipant              │
│  User (1) ───────────────── (0..N) ManagerActivityLog [as Manager]   │
│  User (1) ───────────────── (0..N) CommissionChangeRequest           │
│  User (1) ───────────────── (0..N) Follow            [as Follower]   │
│  User (1) ───────────────── (0..N) Follow            [as Following]  │
│  User (1) ───────────────── (0..N) User              [reportsTo]     │
│                                                                      │
│  LiveClass (1) ──────────── (0..N) ClassBooking                      │
│  Blog (1) ───────────────── (0..N) BlogReading                       │
│  CommunityPost (1) ──────── (0..N) Comment                           │
│  Comment (1) ────────────── (0..N) Comment           [Threaded]      │
│  Challenge (1) ──────────── (0..N) ChallengeParticipant              │
│  LabBooking (N) ─────────── (1) PlatformInvoice                      │
│  LabBooking (N) ─────────── (M) LabTest              [Embedded]      │
│  User (M) ───────────────── (N) User                 [via Follow]    │
│  User (1) ───────────────── (1) ClassBooking         [per LiveClass] │
│  User (1) ───────────────── (1) ChallengeParticipant [per Challenge] │
│  User (1) ───────────────── (1) BlogReading          [per Blog]      │
│  Reaction (N) ──────────── (1) CommunityPost OR Comment [Polymorphic]│
└──────────────────────────────────────────────────────────────────────┘
```

| Entity A | Cardinality | Entity B | Constraint |
|---|:---:|---|---|
| User | 1 : N | CompletedWorkout | One user logs many workouts |
| User | 1 : 1 | NutritionProfile | Exactly one profile per user (unique index) |
| User | 1 : N | MealPlan | One user has many meal plans |
| User | 1 : N | MealLog | One user logs many meals |
| User (Trainer) | 1 : N | LiveClass | One trainer creates many classes |
| User (Enthusiast) | 1 : N | ClassBooking | One user books many classes |
| LiveClass | 1 : N | ClassBooking | One class has many bookings |
| User + LiveClass | 1 : 1 | ClassBooking | Unique: one booking per user per class |
| User (Trainer) | 1 : N | Blog | One trainer writes many blogs |
| User | 1 : N | BlogReading | One user reads many blogs |
| User + Blog | 1 : 1 | BlogReading | Unique: one reading per user per blog |
| Blog | 1 : N | BlogReading | One blog read by many users |
| User (Lab Partner) | 1 : N | LabTest | One lab offers many tests |
| User (Enthusiast) | 1 : N | LabBooking | One user makes many lab bookings |
| User (Lab Partner) | 1 : N | LabBooking | One lab receives many bookings |
| LabBooking | N : M | LabTest | Many tests selected per booking (embedded) |
| User (Lab Partner) | 1 : N | PlatformInvoice | One lab receives many invoices |
| PlatformInvoice | 1 : N | LabBooking | One invoice covers many bookings |
| User | 1 : N | CommunityPost | One user creates many posts |
| CommunityPost | 1 : N | Comment | One post has many comments |
| Comment | 1 : N | Comment | Parent-child threaded replies |
| User | 1 : N | Comment | One user writes many comments |
| User | 1 : N | Reaction | One user makes many reactions |
| CommunityPost / Comment | 1 : N | Reaction | One target receives many reactions (polymorphic) |
| User + Target | 1 : 1 | Reaction | Unique: one reaction per user per target |
| User (Trainer/Admin) | 1 : N | Challenge | One creator makes many challenges |
| Challenge | 1 : N | ChallengeParticipant | One challenge has many participants |
| User | 1 : N | ChallengeParticipant | One user joins many challenges |
| User + Challenge | 1 : 1 | ChallengeParticipant | Unique: one participation per user per challenge |
| User | M : N | User | Many-to-many via Follow (follower ↔ following) |
| User (Manager) | 1 : N | ManagerActivityLog | One manager has many activity log entries |
| User | 1 : N | CommissionChangeRequest | One user has many commission requests |
| User (Manager) | N : 1 | User (Manager) | Manager hierarchy via `reportsTo` |

---

### 2e. Aggregates

Aggregates define consistency boundaries - the **Aggregate Root** controls access to all entities within the aggregate.

```
┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 1: User Identity Aggregate                         │
│ Root: User                                                   │
│ ┌──────────┐                                                 │
│ │  User     │──── Credentials (VO)                           │
│ │  (Root)   │──── ApprovalStatus (VO)                        │
│ │           │──── SocialLinks (VO)                            │
│ │           │──── OperatingHours (VO)                         │
│ │           │──── RefreshToken (VO)                           │
│ │           │──── PasswordResetToken (VO)                     │
│ └──────────┘                                                 │
│ Invariant: Email must be unique; password always hashed       │
│ Invariant: Trainer/Lab approval required before activation    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 2: Workout Aggregate                               │
│ Root: CompletedWorkout                                       │
│ ┌──────────────────┐                                         │
│ │ CompletedWorkout  │──── Difficulty (VO)                     │
│ │ (Root)            │──── WorkoutCategory (VO)                │
│ └──────────────────┘                                         │
│ Invariant: Each workout belongs to exactly one user           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 3: Nutrition Profile Aggregate                     │
│ Root: NutritionProfile                                       │
│ ┌────────────────────┐                                       │
│ │ NutritionProfile    │──── BodyMetrics (VO: BMI, BMR, TDEE) │
│ │ (Root)              │──── MacroTargets (VO)                 │
│ │                     │──── FitnessGoal (VO)                  │
│ │                     │──── DietaryPreference (VO)            │
│ │                     │──── ActivityLevel (VO)                │
│ └────────────────────┘                                       │
│ Invariant: One profile per user (unique constraint)           │
│ Invariant: BMI/BMR/TDEE auto-recalculated on profile update  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 4: Meal Plan Aggregate                             │
│ Root: MealPlan                                               │
│ ┌──────────┐                                                 │
│ │ MealPlan  │──── DailyMeal[] (VO: breakfast, lunch,         │
│ │ (Root)    │          dinner, snacks with nutrition data)    │
│ │           │──── MacroTargets (VO: target snapshot)          │
│ └──────────┘                                                 │
│ Invariant: Daily totals auto-calculated from meal items       │
│ Invariant: Only one active meal plan per user at a time       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 5: Meal Log Aggregate                              │
│ Root: MealLog                                                │
│ ┌──────────┐                                                 │
│ │ MealLog   │──── FoodItem[] (VO: name, qty, unit,           │
│ │ (Root)    │          calories, protein, carbs, fats, etc.)  │
│ └──────────┘                                                 │
│ Invariant: At least one food item per meal log                │
│ Invariant: Totals computed virtually from food items          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 6: Live Class Aggregate                            │
│ Root: LiveClass                                              │
│ ┌──────────┐        ┌───────────────┐                        │
│ │ LiveClass │◄───────│ ClassBooking  │                        │
│ │ (Root)    │        │               │──── CommissionDetails  │
│ │           │        │               │       (VO)             │
│ │           │        │               │──── RefundPolicy (VO)  │
│ └──────────┘        └───────────────┘                        │
│ Invariant: currentParticipants ≤ maxParticipants              │
│ Invariant: One booking per user per class                     │
│ Invariant: Status transitions: scheduled→ongoing→completed    │
│ Invariant: Refund calculated based on time before class start │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 7: Blog Aggregate                                  │
│ Root: Blog                                                   │
│ ┌──────────┐        ┌───────────────┐                        │
│ │  Blog     │◄───────│ BlogReading   │                        │
│ │  (Root)   │        │               │                        │
│ └──────────┘        └───────────────┘                        │
│ Invariant: One BlogReading per user per blog                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 8: Lab Test Catalog Aggregate                      │
│ Root: LabTest                                                │
│ ┌──────────┐                                                 │
│ │ LabTest   │──── TestCategory (VO)                           │
│ │ (Root)    │                                                 │
│ └──────────┘                                                 │
│ Invariant: Test belongs to exactly one lab partner             │
│ Invariant: Price ≥ 0                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 9: Lab Booking Aggregate                           │
│ Root: LabBooking                                             │
│ ┌─────────────┐                                              │
│ │ LabBooking   │──── SelectedTest[] (VO: test snapshot)       │
│ │ (Root)       │──── UserPaymentInfo (VO)                     │
│ │              │──── CommissionStatus (VO)                     │
│ └─────────────┘                                              │
│ Invariant: totalAmount = sum of selected test prices          │
│ Invariant: Commission calculated only after user payment      │
│ Invariant: Status flow: pending→confirmed→completed           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 10: Platform Invoice Aggregate                     │
│ Root: PlatformInvoice                                        │
│ ┌──────────────────┐                                         │
│ │ PlatformInvoice   │──── CommissionBreakdown[] (VO)          │
│ │ (Root)            │──── BillingPeriod (VO)                  │
│ │                   │──── InvoiceStatus (VO)                  │
│ └──────────────────┘                                         │
│ Invariant: Invoice number is unique and auto-generated        │
│ Invariant: Status flow: payment_due→paid (or →overdue)        │
│ Invariant: Overdue triggers lab suspension after grace period  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 11: Community Post Aggregate                       │
│ Root: CommunityPost                                          │
│ ┌────────────────┐    ┌──────────┐    ┌──────────┐           │
│ │ CommunityPost  │◄───│ Comment  │◄───│ Comment  │ (nested)  │
│ │ (Root)         │    └──────────┘    └──────────┘           │
│ │                │◄───┌──────────┐                            │
│ │                │    │ Reaction │  (polymorphic)             │
│ └────────────────┘    └──────────┘                           │
│ Invariant: likesCount/commentsCount stay consistent           │
│ Invariant: One reaction per user per target                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 12: Challenge Aggregate                            │
│ Root: Challenge                                              │
│ ┌──────────┐       ┌────────────────────────┐                │
│ │ Challenge │◄──────│ ChallengeParticipant   │               │
│ │ (Root)    │       │                        │──── Progress   │
│ │           │       │                        │     LogEntry[] │
│ └──────────┘       └────────────────────────┘      (VO)      │
│ Invariant: participantsCount ≤ maxParticipants                │
│ Invariant: One participation per user per challenge           │
│ Invariant: Progress only logged between startDate and endDate │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 13: Follow Aggregate                               │
│ Root: Follow                                                 │
│ ┌──────────┐                                                 │
│ │  Follow   │                                                │
│ │  (Root)   │                                                │
│ └──────────┘                                                 │
│ Invariant: Unique pair (follower, following)                   │
│ Invariant: User cannot follow themselves                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 14: Manager Activity Aggregate                     │
│ Root: ManagerActivityLog                                     │
│ ┌─────────────────────┐                                      │
│ │ ManagerActivityLog   │──── ManagerAction (VO)               │
│ │ (Root)               │──── ManagerType (VO)                 │
│ └─────────────────────┘                                      │
│ Invariant: Every manager action is logged (append-only)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGGREGATE 15: Commission Change Request Aggregate            │
│ Root: CommissionChangeRequest                                │
│ ┌─────────────────────────┐                                  │
│ │ CommissionChangeRequest  │──── RequestStatus (VO)           │
│ │ (Root)                   │                                  │
│ └─────────────────────────┘                                  │
│ Invariant: Proposed rate must be between 0-100%               │
│ Invariant: Only admin can approve/deny                        │
└─────────────────────────────────────────────────────────────┘
```

#### Aggregate Summary Table

| # | Aggregate Root | Contained Entities | Key Value Objects | Bounded Context |
|---|---|---|---|---|
| 1 | User | — | Credentials, ApprovalStatus, SocialLinks, OperatingHours, RefreshToken | Identity & Access |
| 2 | CompletedWorkout | — | Difficulty, WorkoutCategory | Fitness Tracking |
| 3 | NutritionProfile | — | BodyMetrics, MacroTargets, FitnessGoal, DietaryPreference, ActivityLevel | Nutrition Management |
| 4 | MealPlan | — | DailyMeal[], MacroTargets | Nutrition Management |
| 5 | MealLog | — | FoodItem[] | Nutrition Management |
| 6 | LiveClass | ClassBooking | CommissionDetails, RefundPolicy, ClassType, BookingStatus | Live Training |
| 7 | Blog | BlogReading | BlogCategory | Live Training |
| 8 | LabTest | — | TestCategory | Lab Services |
| 9 | LabBooking | — | SelectedTest[], UserPaymentInfo, CommissionStatus | Lab Services |
| 10 | PlatformInvoice | — | CommissionBreakdown[], BillingPeriod, InvoiceStatus | Lab Services |
| 11 | CommunityPost | Comment, Reaction | PostCategory, ReactionType | Community & Engagement |
| 12 | Challenge | ChallengeParticipant | GoalType, ProgressLogEntry[], ChallengeDifficulty | Community & Engagement |
| 13 | Follow | — | — | Community & Engagement |
| 14 | ManagerActivityLog | — | ManagerAction, ManagerType | Platform Administration |
| 15 | CommissionChangeRequest | — | RequestStatus | Platform Administration |

---

*Document generated for RevibeFit - Domain-Driven Design Analysis*
