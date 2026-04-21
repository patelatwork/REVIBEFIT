import mongoose from "mongoose";
import config from "../src/config/index.js";
import connectDB from "../src/db/index.js";
import { PlatformInvoice } from "../src/models/platformInvoice.model.js";

const TARGET_INDEX_KEYS = {
  labPartnerId: 1,
  "billingPeriod.year": 1,
  "billingPeriod.month": 1,
};

const requireMongoUri = () => {
  if (!config.mongodbUri) {
    throw new Error("MONGODB_URI is not set. Add it to RevibeFit-Backend/.env first.");
  }
};

const sameKeyPattern = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => key in b && a[key] === b[key]);
};

const dropLegacyUniqueIndex = async () => {
  const indexes = await PlatformInvoice.collection.indexes();
  const legacyUniqueIndexes = indexes.filter(
    (index) => index.unique === true && sameKeyPattern(index.key, TARGET_INDEX_KEYS)
  );

  if (legacyUniqueIndexes.length === 0) {
    console.log("No legacy unique billing-period index found.");
    return;
  }

  for (const index of legacyUniqueIndexes) {
    console.log(`Dropping index: ${index.name}`);
    await PlatformInvoice.collection.dropIndex(index.name);
  }

  console.log("Legacy unique index removed.");
};

const ensureNonUniqueIndex = async () => {
  await PlatformInvoice.collection.createIndex(TARGET_INDEX_KEYS, { unique: false });
  console.log("Ensured non-unique billing-period index exists.");
};

const run = async () => {
  requireMongoUri();
  await connectDB();

  await dropLegacyUniqueIndex();
  await ensureNonUniqueIndex();

  const indexes = await PlatformInvoice.collection.indexes();
  const target = indexes.find((idx) => sameKeyPattern(idx.key, TARGET_INDEX_KEYS));

  if (target) {
    console.log(`Current target index: ${target.name} (unique=${Boolean(target.unique)})`);
  }
};

run()
  .catch((err) => {
    console.error("Failed to fix invoice index:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
