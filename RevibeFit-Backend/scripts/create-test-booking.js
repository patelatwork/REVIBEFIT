import mongoose from "mongoose";
import config from "../src/config/index.js";
import connectDB from "../src/db/index.js";
import { USER_TYPES } from "../src/constants.js";
import { User } from "../src/models/user.model.js";
import { LabTest } from "../src/models/labTest.model.js";
import { LabBooking } from "../src/models/labBooking.model.js";

const nowStamp = Date.now();

const requireMongoUri = () => {
  if (!config.mongodbUri) {
    throw new Error("MONGODB_URI is not set. Add it to RevibeFit-Backend/.env first.");
  }
};

const ensureLabPartner = async () => {
  let labPartner = await User.findOne({ userType: USER_TYPES.LAB_PARTNER });
  if (labPartner) return labPartner;

  const email = `lab.test.${nowStamp}@revibefit.local`;
  labPartner = await User.create({
    name: "Test Lab Partner",
    email,
    password: "Password123",
    phone: "9999999999",
    age: 30,
    userType: USER_TYPES.LAB_PARTNER,
    laboratoryName: "Revibe Test Lab",
    laboratoryAddress: "123 Test Street",
    licenseNumber: `LIC-${nowStamp}`,
    totalEarnings: 0,
    monthlyEarnings: 0,
    lastEarningsUpdate: new Date(),
    unbilledCommissions: 0,
    currentMonthLiability: 0,
    isApproved: true,
    approvalStatus: "approved",
  });

  return labPartner;
};

const ensureFitnessEnthusiast = async () => {
  let user = await User.findOne({ userType: USER_TYPES.FITNESS_ENTHUSIAST });
  if (user) return user;

  const email = `fitness.test.${nowStamp}@revibefit.local`;
  user = await User.create({
    name: "Test Fitness User",
    email,
    password: "Password123",
    phone: "8888888888",
    age: 24,
    userType: USER_TYPES.FITNESS_ENTHUSIAST,
    fitnessGoal: "general fitness",
  });

  return user;
};

const ensureLabTest = async (labPartnerId) => {
  let test = await LabTest.findOne({ labPartnerId, isActive: true });
  if (test) return test;

  test = await LabTest.create({
    testName: "CBC Test",
    description: "Complete Blood Count",
    price: 599,
    duration: "24 hours",
    labPartnerId,
    category: "Blood Test",
  });

  return test;
};

const createBooking = async () => {
  const labPartner = await ensureLabPartner();
  const fitnessUser = await ensureFitnessEnthusiast();
  const labTest = await ensureLabTest(labPartner._id);

  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 1);

  const booking = await LabBooking.create({
    fitnessEnthusiastId: fitnessUser._id,
    labPartnerId: labPartner._id,
    selectedTests: [
      {
        testId: labTest._id,
        testName: labTest.testName,
        price: labTest.price,
      },
    ],
    bookingDate,
    timeSlot: "09:00 AM - 10:00 AM",
    totalAmount: labTest.price,
    status: "confirmed",
    paymentStatus: "pending",
    contactPhone: fitnessUser.phone,
    contactEmail: fitnessUser.email,
    notes: "Created by scripts/create-test-booking.js",
  });

  return { booking, labPartner, fitnessUser, labTest };
};

const run = async () => {
  requireMongoUri();
  await connectDB();

  const { booking, labPartner, fitnessUser, labTest } = await createBooking();

  console.log("Test booking created successfully.");
  console.log(`bookingId: ${booking._id}`);
  console.log(`labPartnerId: ${labPartner._id}`);
  console.log(`fitnessUserId: ${fitnessUser._id}`);
  console.log(`labTestId: ${labTest._id}`);
};

run()
  .catch((err) => {
    console.error("Failed to create test booking:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
