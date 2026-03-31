# RevibeFit — Database Schema Documentation

**Database:** MongoDB (NoSQL)  
**ODM:** Mongoose  
**Total Collections:** 20

---

## Table of Contents
1. [User](#1-user)
2. [Blog](#2-blog)
3. [BlogReading](#3-blogreading)
4. [Challenge](#4-challenge)
5. [ChallengeParticipant](#5-challengeparticipant)
6. [LiveClass](#6-liveclass)
7. [ClassBooking](#7-classbooking)
8. [LabTest](#8-labtest)
9. [LabBooking](#9-labbooking)
10. [CommunityPost](#10-communitypost)
11. [Comment](#11-comment)
12. [Reaction](#12-reaction)
13. [Follow](#13-follow)
14. [NutritionProfile](#14-nutritionprofile)
15. [MealPlan](#15-mealplan)
16. [MealLog](#16-meallog)
17. [CompletedWorkout](#17-completedworkout)
18. [PlatformInvoice](#18-platforminvoice)
19. [CommissionChangeRequest](#19-commissionchangerequest)
20. [ManagerActivityLog](#20-manageractivitylog)

---

## 1. User

**Collection:** `users`  
**Purpose:** Single polymorphic collection for all user roles — Fitness Enthusiast, Trainer, Lab Partner, Admin, Manager.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `name` | String | Yes | Full name (min 2 chars) |
| `email` | String | Yes | Unique, lowercase |
| `password` | String | Yes | Bcrypt hashed, hidden by default |
| `phone` | String | Yes | 10-digit Indian number |
| `age` | Number | Yes (non-manager) | 13–100 |
| `userType` | String (enum) | Yes | `fitness-enthusiast` \| `trainer` \| `lab-partner` \| `admin` \| `manager` |
| `city` | String | No | Location |
| `state` | String (enum) | No | Indian state |
| `profileImage` | String | No | File path |
| `isApproved` | Boolean | Yes | Default `false` for trainer/lab-partner |
| `isActive` | Boolean | Yes | Account active status |
| `refreshToken` | String | No | JWT refresh token |
| **Fitness Enthusiast fields** | | | |
| `fitnessGoal` | String | Yes (FE only) | User's goal |
| **Trainer fields** | | | |
| `specialization` | String | Yes (Trainer) | e.g., Yoga, Strength |
| `certifications` | String | Yes (Trainer) | File path |
| `governmentId` | String | No | File path |
| `bio` | String | No | Trainer bio |
| `socialLinks` | Object | No | `{ instagram, youtube, twitter, website }` |
| `totalEarnings` | Number | Yes (Trainer/Lab) | Cumulative |
| `monthlyEarnings` | Number | Yes (Trainer/Lab) | Current month |
| `commissionRate` | Number | Yes (Trainer/Lab) | Default 15% trainer, 10% lab |
| **Lab Partner fields** | | | |
| `laboratoryName` | String | Yes (Lab) | Lab name |
| `laboratoryAddress` | String | Yes (Lab) | Physical address |
| `licenseNumber` | String | Yes (Lab) | Registration number |
| `accreditationDocs` | String | No | File path |
| `labImages` | [String] | No | Array of file paths |
| `operatingHours` | Mixed | No | `{ monday: { open, close, isOpen }, ... }` |
| `offeredTests` | [ObjectId] → LabTest | No | Tests offered by lab |
| `unbilledCommissions` | Number | Yes (Lab) | Commission owed to platform |
| `currentMonthLiability` | Number | Yes (Lab) | Current month commission |
| **Manager fields** | | | |
| `managerType` | String (enum) | Yes (Manager) | Regional manager type |
| `region` | String | Yes (Manager) | Indian region |
| `assignedStates` | [String] | No | States under jurisdiction |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `email` (unique), `userType`, `state`, `isApproved`

---

## 2. Blog

**Collection:** `blogs`  
**Purpose:** Fitness/nutrition articles written by Trainers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `title` | String | Yes | 5–200 characters |
| `content` | String | Yes | Min 50 characters |
| `category` | String (enum) | Yes | `Fitness Tips` \| `Nutrition` \| `Yoga` \| `Mental Wellness` \| `General` |
| `thumbnail` | String | Yes | File path |
| `author` | ObjectId → User | Yes | Trainer reference |
| `authorName` | String | Yes | Denormalized name |
| `isPublished` | Boolean | Yes | Default `true` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ author, createdAt }`, `category`, `isPublished`

---

## 3. BlogReading

**Collection:** `blogreadings`  
**Purpose:** Tracks which users have read which blogs (for read history & analytics).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId → User | Yes | Reader |
| `blogId` | ObjectId → Blog | Yes | Blog read |
| `readAt` | Date | Yes | When read |

**Indexes:** `{ userId, blogId }` (unique), `{ blogId }`

---

## 4. Challenge

**Collection:** `challenges`  
**Purpose:** Fitness challenges created by Trainers or Admins.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `title` | String | Yes | 5–200 characters |
| `description` | String | Yes | 20–5000 characters |
| `category` | String (enum) | Yes | `strength` \| `cardio` \| `flexibility` \| `nutrition` \| `mindfulness` \| `general` |
| `coverImage` | String | No | File path |
| `createdBy` | ObjectId → User | Yes | Trainer or Admin |
| `creatorName` | String | Yes | Denormalized |
| `creatorType` | String (enum) | Yes | `trainer` \| `admin` |
| `startDate` | Date | Yes | Challenge start |
| `endDate` | Date | Yes | Challenge end |
| `goalType` | String (enum) | Yes | `count` \| `duration` \| `streak` |
| `goalTarget` | Number | Yes | Target value |
| `goalUnit` | String | Yes | e.g., pushups, minutes, days |
| `rules` | [String] | No | Challenge rules |
| `participantsCount` | Number | Yes | Default `0` |
| `maxParticipants` | Number | No | `null` = unlimited |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## 5. ChallengeParticipant

**Collection:** `challengeparticipants`  
**Purpose:** Tracks user enrollment and progress in challenges.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `challenge` | ObjectId → Challenge | Yes | Challenge reference |
| `user` | ObjectId → User | Yes | Participant |
| `userName` | String | Yes | Denormalized |
| `progress` | Number | Yes | Current progress (default `0`) |
| `progressLog` | Array | No | `[{ value, note, loggedAt }]` |
| `isCompleted` | Boolean | Yes | Default `false` |
| `completedAt` | Date | No | Completion timestamp |
| `rank` | Number | No | Leaderboard rank |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ challenge, user }` (unique), `{ challenge, progress }` for leaderboard

---

## 6. LiveClass

**Collection:** `liveclasses`  
**Purpose:** Live fitness sessions hosted by Trainers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `trainerId` | ObjectId → User | Yes | Hosting trainer |
| `title` | String | Yes | 3–100 characters |
| `description` | String | No | Max 500 characters |
| `classType` | String (enum) | Yes | `cycling` \| `strength` \| `running` \| `yoga` \| `meditation` \| `rowing` \| `outdoor` \| `stretching` \| `other` |
| `otherClassType` | String | Yes (if other) | Custom type name |
| `scheduledDate` | Date | Yes | Class date |
| `scheduledTime` | String | Yes | HH:MM format |
| `duration` | Number | Yes | Minutes (15–180), default 60 |
| `cost` | Number | Yes | ₹0–₹10,000 |
| `maxParticipants` | Number | Yes | 1–200, default 50 |
| `currentParticipants` | Number | Yes | Default `0` |
| `status` | String (enum) | Yes | `scheduled` \| `live` \| `completed` \| `cancelled` |
| `meetingLink` | String | No | Video call URL |
| `thumbnail` | String | No | File path |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## 7. ClassBooking

**Collection:** `classbookings`  
**Purpose:** Records user bookings for live classes, including payment and attendance.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId → User | Yes | Booking user |
| `classId` | ObjectId → LiveClass | Yes | Booked class |
| `trainerId` | ObjectId → User | Yes | Trainer (denormalized) |
| `bookingDate` | Date | Yes | When booked |
| `amountPaid` | Number | Yes | Payment amount |
| `paymentStatus` | String (enum) | Yes | `pending` \| `completed` \| `failed` \| `refunded` |
| `bookingStatus` | String (enum) | Yes | `active` \| `cancelled` \| `completed` \| `no-show` |
| `attendanceStatus` | String (enum) | Yes | `registered` \| `attended` \| `missed` |
| `joinedAt` | Date | No | Class join time |
| `leftAt` | Date | No | Class leave time |
| `rating` | Number | No | 1–5 post-class rating |
| `feedback` | String | No | Max 500 characters |
| `refundAmount` | Number | No | Default `0` |
| `refundReason` | String | No | Reason for refund |
| `cancellationReason` | String | No | Reason for cancellation |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## 8. LabTest

**Collection:** `labtests`  
**Purpose:** Health tests offered by Lab Partners.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `testName` | String | Yes | Name of the test |
| `description` | String | Yes | Test description |
| `price` | Number | Yes | Price in ₹ |
| `duration` | String | Yes | e.g., "30 minutes", "2-3 days for results" |
| `labPartnerId` | ObjectId → User | Yes | Owning lab partner |
| `category` | String (enum) | Yes | `Blood Test` \| `Urine Test` \| `Imaging` \| `Fitness Assessment` \| `Cardiac Test` \| `Other` |
| `preparationInstructions` | String | No | Default: "No special preparation required" |
| `isActive` | Boolean | Yes | Default `true` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ labPartnerId, isActive }`, text index on `testName, description`

---

## 9. LabBooking

**Collection:** `labbookings`  
**Purpose:** Appointments made by Fitness Enthusiasts at a lab.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `fitnessEnthusiastId` | ObjectId → User | Yes | Patient |
| `labPartnerId` | ObjectId → User | Yes | Lab |
| `selectedTests` | Array | Yes | `[{ testId, testName, price }]` |
| `bookingDate` | Date | Yes | Appointment date |
| `timeSlot` | String | Yes | e.g., "9:00 AM - 10:00 AM" |
| `totalAmount` | Number | Yes | Sum of test prices |
| `status` | String (enum) | Yes | `pending` \| `confirmed` \| `completed` \| `cancelled` |
| `paymentStatus` | String (enum) | Yes | `pending` \| `paid` \| `refunded` |
| `userPaidToLab` | Boolean | Yes | Patient paid lab directly |
| `userPaymentDate` | Date | No | When patient paid |
| `userPaymentMethod` | String (enum) | No | `cash` \| `card` \| `online` \| `upi` |
| `paymentReceivedByLab` | Boolean | Yes | Lab confirms receipt |
| `paymentReceivedDate` | Date | No | When lab received payment |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## 10. CommunityPost

**Collection:** `communityposts`  
**Purpose:** Social feed posts by any user type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `author` | ObjectId → User | Yes | Post author |
| `authorName` | String | Yes | Denormalized |
| `authorType` | String (enum) | Yes | `fitness-enthusiast` \| `trainer` \| `lab-partner` \| `admin` \| `manager` |
| `content` | String | Yes | 1–5000 characters |
| `category` | String (enum) | Yes | `tip` \| `question` \| `transformation` \| `motivation` \| `discussion` \| `success-story` |
| `images` | [String] | No | File paths |
| `tags` | [String] | No | Lowercase tags |
| `likesCount` | Number | Yes | Default `0` |
| `commentsCount` | Number | Yes | Default `0` |
| `reactionsCount` | Object | Yes | `{ like, love, fire, clap }` |
| `isPinned` | Boolean | Yes | Default `false` |
| `isVisible` | Boolean | Yes | Default `true` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ author, createdAt }`, `{ category, createdAt }`, `{ isPinned, createdAt }`, `tags`

---

## 11. Comment

**Collection:** `comments`  
**Purpose:** Comments and nested replies on community posts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `post` | ObjectId → CommunityPost | Yes | Parent post |
| `author` | ObjectId → User | Yes | Commenter |
| `authorName` | String | Yes | Denormalized |
| `authorType` | String (enum) | Yes | User role |
| `content` | String | Yes | 1–2000 characters |
| `parentComment` | ObjectId → Comment | No | `null` = top-level, else reply |
| `likesCount` | Number | Yes | Default `0` |
| `isVisible` | Boolean | Yes | Default `true` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ post, createdAt }`, `author`, `parentComment`

---

## 12. Reaction

**Collection:** `reactions`  
**Purpose:** Emoji reactions on posts and comments (polymorphic).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `user` | ObjectId → User | Yes | Reactor |
| `targetType` | String (enum) | Yes | `post` \| `comment` |
| `targetId` | ObjectId | Yes | ID of post or comment |
| `targetModel` | String (enum) | Yes | `CommunityPost` \| `Comment` |
| `type` | String (enum) | Yes | `like` \| `love` \| `fire` \| `clap` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ user, targetId, targetType }` (unique — one reaction per user per target)

---

## 13. Follow

**Collection:** `follows`  
**Purpose:** Follower/following relationships between users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `follower` | ObjectId → User | Yes | The user who follows |
| `following` | ObjectId → User | Yes | The user being followed |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ follower, following }` (unique), `follower`, `following`

---

## 14. NutritionProfile

**Collection:** `nutritionprofiles`  
**Purpose:** Detailed health and dietary profile for Fitness Enthusiasts (one per user).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `user` | ObjectId → User | Yes (unique) | One profile per user |
| `age` | Number | Yes | 13–100 |
| `gender` | String (enum) | Yes | `male` \| `female` \| `other` |
| `height` | Number | Yes | cm (100–250) |
| `weight` | Number | Yes | kg (30–300) |
| `fitnessGoal` | String (enum) | Yes | `weight-loss` \| `muscle-gain` \| `maintenance` \| `endurance` \| `general-health` |
| `targetWeight` | Number | No | kg |
| `activityLevel` | String (enum) | Yes | `sedentary` \| `lightly-active` \| `moderately-active` \| `very-active` \| `extremely-active` |
| `dietaryPreference` | String (enum) | Yes | `none` \| `vegetarian` \| `vegan` \| `keto` \| `paleo` \| `mediterranean` \| `low-carb` \| `low-fat` \| `gluten-free` \| `dairy-free` |
| `allergies` | [String] | No | Food allergies |
| `foodDislikes` | [String] | No | Disliked foods |
| `dailyCalories` | Number | No | Calculated TDEE |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## 15. MealPlan

**Collection:** `mealplans`  
**Purpose:** AI-generated or manual weekly/daily meal plans for users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `user` | ObjectId → User | Yes | Plan owner |
| `planName` | String | Yes | Plan title |
| `planType` | String (enum) | Yes | `daily` \| `weekly` |
| `startDate` | Date | Yes | Plan start |
| `endDate` | Date | Yes | Plan end |
| `isActive` | Boolean | Yes | Default `true` |
| `meals` | Array | Yes | Per-day meal breakdown `{ dayOfWeek, date, breakfast, lunch, dinner, snacks }` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Meal Sub-document:** Each meal (breakfast/lunch/dinner) contains `{ name, description, items[{ name, quantity, unit }], calories, protein, carbs, fats, prepTime, instructions }`.

---

## 16. MealLog

**Collection:** `meallogs`  
**Purpose:** Daily food intake logs for nutrition tracking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `user` | ObjectId → User | Yes | Log owner |
| `date` | Date | Yes | Log date |
| `mealType` | String (enum) | Yes | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| `foodItems` | Array | Yes | Min 1 item `[{ name, quantity, unit, calories, protein, carbs, fats, fiber, sugar, sodium, fatSecretFoodId }]` |
| `notes` | String | No | Additional notes |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ user, date }`

---

## 17. CompletedWorkout

**Collection:** `completedworkouts`  
**Purpose:** Records of workouts completed by Fitness Enthusiasts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId → User | Yes | User who completed it |
| `workoutId` | String | Yes | Frontend workout identifier |
| `workoutTitle` | String | Yes | Workout name |
| `duration` | Number | Yes | Duration in minutes |
| `difficulty` | String (enum) | Yes | `Beginner` \| `Intermediate` \| `Advanced` |
| `category` | String | No | Workout category |
| `exercisesCompleted` | Number | Yes | Count of exercises done |
| `completedAt` | Date | Yes | Default `Date.now` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes:** `{ userId, completedAt }`

---

## 18. PlatformInvoice

**Collection:** `platforminvoices`  
**Purpose:** Commission invoices issued to Lab Partners by the platform.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `labPartnerId` | ObjectId → User | Yes | Billed lab partner |
| `invoiceNumber` | String | Yes | Unique invoice ID |
| `billingPeriod` | Object | Yes | `{ month, year, startDate, endDate, type: monthly/weekly/custom }` |
| `totalCommission` | Number | Yes | Amount owed |
| `numberOfBookings` | Number | Yes | Bookings in period |
| `totalBookingValue` | Number | Yes | Total transaction value |
| `commissionRate` | Number | Yes | % applied |
| `status` | String (enum) | Yes | `pending` \| `paid` \| `overdue` \| `cancelled` |
| `dueDate` | Date | Yes | Payment deadline |
| `paidDate` | Date | No | When paid |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## 19. CommissionChangeRequest

**Collection:** `commissionchangerequests`  
**Purpose:** Requests by Trainers/Lab Partners to change their commission rate.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `requestedBy` | ObjectId → User | Yes | Requester (Trainer or Lab Partner) |
| `currentRate` | Number | Yes | Current commission % |
| `requestedRate` | Number | Yes | Proposed commission % |
| `reason` | String | Yes | Justification |
| `status` | String (enum) | Yes | `pending` \| `approved` \| `rejected` |
| `reviewedBy` | ObjectId → User | No | Manager who reviewed |
| `reviewNote` | String | No | Manager's comment |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## 20. ManagerActivityLog

**Collection:** `manageractivitylogs`  
**Purpose:** Audit trail of actions taken by Managers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key |
| `managerId` | ObjectId → User | Yes | Acting manager |
| `action` | String | Yes | Action performed (e.g., `approved_trainer`) |
| `targetType` | String | Yes | e.g., `User`, `LabBooking` |
| `targetId` | ObjectId | Yes | Target document ID |
| `details` | Object | No | Additional context |
| `createdAt` | Date | Auto | Timestamp |

---

## Entity Relationships Summary

```
User (1) ──────────────────> (N) Blog             (Trainer writes blogs)
User (1) ──────────────────> (N) BlogReading       (User reads blogs)
User (1) ──────────────────> (N) Challenge         (Trainer/Admin creates)
User (1) ──────────────────> (N) ChallengeParticipant
Challenge (1) ─────────────> (N) ChallengeParticipant
User (1) ──────────────────> (N) LiveClass         (Trainer hosts)
User (1) ──────────────────> (N) ClassBooking      (User books class)
LiveClass (1) ─────────────> (N) ClassBooking
User (1) ──────────────────> (N) LabTest           (Lab Partner lists)
User (1) ──────────────────> (N) LabBooking        (User books lab)
LabTest (N) ───────────────> (N) LabBooking        (via selectedTests array)
User (1) ──────────────────> (N) CommunityPost     (Any user posts)
CommunityPost (1) ─────────> (N) Comment
Comment (1) ───────────────> (N) Comment           (Nested replies)
User (1) ──────────────────> (N) Reaction          (Post/Comment reactions)
User (1) ──────────────────> (N) Follow            (follower → following)
User (1) ──────────────────> (1) NutritionProfile
User (1) ──────────────────> (N) MealPlan
User (1) ──────────────────> (N) MealLog
User (1) ──────────────────> (N) CompletedWorkout
User (1) ──────────────────> (N) PlatformInvoice   (Lab Partner invoiced)
User (1) ──────────────────> (N) CommissionChangeRequest
User (1) ──────────────────> (N) ManagerActivityLog (Manager actions)
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Single User collection (polymorphic)** | All user roles share auth fields; role-specific fields kept optional. Simplifies JWT auth and middleware. |
| **Denormalized name fields** | `authorName`, `creatorName` etc. stored alongside ObjectId refs to avoid population overhead on feed queries. |
| **Polymorphic Reactions** | `targetType` + `targetModel` pattern allows reactions on both posts and comments without separate collections. |
| **Nested replies via `parentComment`** | Self-referential Comment schema supports unlimited nesting depth without separate collections. |
| **Workout data as static JSON** | Workout exercises are served from frontend static assets — only completion records stored in MongoDB. |
| **Commission tracking split** | `totalEarnings` tracks lifetime; `monthlyEarnings` tracks current month; `PlatformInvoice` handles billing cycles. |
