import swaggerJsdoc from "swagger-jsdoc";
import config from "./index.js";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "RevibeFit API",
    version: "1.0.0",
    description:
      "RevibeFit – a fitness, nutrition & lab-testing platform. This documentation covers all API endpoints for authentication, admin, blogs, workouts, live classes, nutrition, trainers, and lab partners.",
    contact: {
      name: "RevibeFit Team",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
        description: "JWT stored in httpOnly cookie",
      },
    },
    schemas: {
      // ─── Standard Responses ─────────────────────────────
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          statusCode: { type: "integer" },
          data: { type: "object" },
          message: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "object" } },
        },
      },

      // ─── Auth ───────────────────────────────────────────
      SignupRequest: {
        type: "object",
        required: ["name", "email", "password", "userType"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 6, example: "SecurePass123" },
          userType: {
            type: "string",
            enum: ["fitness-enthusiast", "trainer", "lab-partner"],
          },
          specialization: { type: "string", description: "Trainer only" },
          experience: { type: "number", description: "Trainer only (years)" },
          laboratoryName: { type: "string", description: "Lab partner only" },
          laboratoryAddress: { type: "string", description: "Lab partner only" },
          laboratoryPhone: { type: "string", description: "Lab partner only" },
          certifications: {
            type: "string",
            format: "binary",
            description: "Certification file (trainer only)",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", example: "SecurePass123" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          statusCode: { type: "integer", example: 200 },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
              accessToken: { type: "string" },
            },
          },
          message: { type: "string", example: "Login successful" },
        },
      },

      // ─── User ──────────────────────────────────────────
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          userType: {
            type: "string",
            enum: ["fitness-enthusiast", "trainer", "lab-partner"],
          },
          isApproved: { type: "boolean" },
          isActive: { type: "boolean" },
          isSuspended: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      // ─── Blog ──────────────────────────────────────────
      Blog: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
          thumbnail: { type: "string" },
          author: { $ref: "#/components/schemas/User" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      // ─── Live Class ────────────────────────────────────
      LiveClass: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          trainer: { $ref: "#/components/schemas/User" },
          date: { type: "string", format: "date-time" },
          duration: { type: "number" },
          maxParticipants: { type: "number" },
          price: { type: "number" },
          meetingLink: { type: "string" },
        },
      },

      // ─── Nutrition ─────────────────────────────────────
      NutritionProfile: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          age: { type: "number" },
          gender: { type: "string" },
          height: { type: "number" },
          weight: { type: "number" },
          fitnessGoal: { type: "string" },
          activityLevel: { type: "string" },
          dietaryPreference: { type: "string" },
          allergies: { type: "array", items: { type: "string" } },
          dailyCalorieTarget: { type: "number" },
        },
      },
      MealPlan: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          planType: { type: "string", enum: ["daily", "weekly"] },
          startDate: { type: "string", format: "date" },
          meals: { type: "array", items: { type: "object" } },
        },
      },

      // ─── Lab Partner ───────────────────────────────────
      LabTest: {
        type: "object",
        properties: {
          _id: { type: "string" },
          testName: { type: "string" },
          testDescription: { type: "string" },
          price: { type: "number" },
          labPartner: { type: "string" },
        },
      },
      LabBooking: {
        type: "object",
        properties: {
          _id: { type: "string" },
          fitnessEnthusiastId: { type: "string" },
          labPartnerId: { type: "string" },
          selectedTests: { type: "array", items: { type: "string" } },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "completed", "cancelled"],
          },
          totalAmount: { type: "number" },
        },
      },

      // ─── Invoice ───────────────────────────────────────
      Invoice: {
        type: "object",
        properties: {
          _id: { type: "string" },
          labPartnerId: { type: "string" },
          amount: { type: "number" },
          status: { type: "string", enum: ["pending", "paid", "overdue"] },
          billingPeriod: { type: "object" },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      // ─── Workout ───────────────────────────────────────
      CompletedWorkout: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          workoutName: { type: "string" },
          duration: { type: "number" },
          caloriesBurned: { type: "number" },
          exercises: { type: "array", items: { type: "object" } },
          completedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "User authentication (signup, login, logout)" },
    { name: "Admin", description: "Admin dashboard & management (requires admin token)" },
    { name: "Blogs", description: "Blog CRUD & reading tracking" },
    { name: "Trainers", description: "Trainer profiles & dashboard" },
    { name: "Live Classes", description: "Live class management & bookings" },
    { name: "Nutrition", description: "Nutrition profiles, meal plans & food search" },
    { name: "Lab Partners", description: "Lab partner listings, tests & bookings" },
    { name: "Workouts", description: "Workout completion tracking" },
  ],
};

const options = {
  swaggerDefinition,
  // Path to the route files containing JSDoc annotations
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
