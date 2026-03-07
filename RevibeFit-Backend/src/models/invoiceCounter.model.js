import mongoose from "mongoose";

const invoiceCounterSchema = new mongoose.Schema({
  prefix: {
    type: String,
    required: true,
    unique: true,
  },
  sequence: {
    type: Number,
    default: 0,
  },
});

/**
 * Atomically get the next invoice number for a given prefix.
 * Uses findOneAndUpdate with $inc for thread-safe sequential numbering.
 *
 * @param {string} prefix - e.g. "RVF/INV/2603"
 * @returns {Promise<string>} - e.g. "RVF/INV/2603/000001"
 */
invoiceCounterSchema.statics.getNextInvoiceNumber = async function (prefix) {
  const counter = await this.findOneAndUpdate(
    { prefix },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true }
  );
  const sequenceStr = String(counter.sequence).padStart(6, "0");
  return `${prefix}/${sequenceStr}`;
};

export const InvoiceCounter = mongoose.model("InvoiceCounter", invoiceCounterSchema);
