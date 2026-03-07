import { PlatformInvoice } from "../models/platformInvoice.model.js";
import { Settlement } from "../models/settlement.model.js";
import { InvoiceCounter } from "../models/invoiceCounter.model.js";
import { User } from "../models/user.model.js";
import { INVOICE_STATUSES, SETTLEMENT_STATUSES } from "../constants.js";
import { calculateGST } from "../utils/gstCalculator.js";
import { generateInvoicePdf } from "../utils/pdfInvoiceGenerator.js";
import config from "../config/index.js";
import mongoose from "mongoose";

/**
 * Generate a monthly invoice for a specific lab partner.
 * Aggregates all settlements for the billing period and creates a GST-compliant B2B tax invoice.
 *
 * @param {string} labPartnerId - Lab partner's user ID
 * @param {number} month - Billing month (1-12)
 * @param {number} year - Billing year
 * @returns {Promise<Object>} Created invoice document
 */
export const generateMonthlyInvoice = async (labPartnerId, month, year) => {
  const labPartnerObjId = new mongoose.Types.ObjectId(labPartnerId);

  // Check if invoice already exists for this period
  const existing = await PlatformInvoice.findOne({
    labPartnerId: labPartnerObjId,
    "billingPeriod.month": month,
    "billingPeriod.year": year,
    status: { $ne: INVOICE_STATUSES.CANCELLED },
  });

  if (existing) {
    return { skipped: true, invoice: existing, reason: "Invoice already exists for this period" };
  }

  // Get all settlements for this lab partner in the billing period
  const settlements = await Settlement.find({
    labPartnerId: labPartnerObjId,
    "billingPeriod.month": month,
    "billingPeriod.year": year,
  }).populate({
    path: "bookingId",
    select: "selectedTests bookingDate totalAmount fitnessEnthusiastId",
    populate: {
      path: "fitnessEnthusiastId",
      select: "name email",
    },
  });

  if (settlements.length === 0) {
    return { skipped: true, reason: "No settlements found for this period" };
  }

  // Fetch lab partner details
  const labPartner = await User.findById(labPartnerId).select(
    "name laboratoryName laboratoryAddress gstin placeOfSupply state commissionRate"
  );

  if (!labPartner) {
    throw new Error(`Lab partner ${labPartnerId} not found`);
  }

  // Aggregate financial data
  let totalBookingValue = 0;
  let totalCommission = 0;
  let totalGst = 0;
  let totalSettlement = 0;
  const commissionBreakdown = [];
  const settlementIds = [];

  for (const settlement of settlements) {
    totalBookingValue += settlement.grossAmount;
    totalCommission += settlement.commissionAmount;
    totalGst += settlement.gstOnCommission;
    totalSettlement += settlement.netSettlementAmount;
    settlementIds.push(settlement._id);

    const booking = settlement.bookingId;
    commissionBreakdown.push({
      bookingId: booking?._id,
      settlementId: settlement._id,
      fitnessEnthusiastId: booking?.fitnessEnthusiastId?._id,
      fitnessEnthusiastName: booking?.fitnessEnthusiastId?.name || "Unknown",
      testNames: booking?.selectedTests?.map((t) => t.testName) || [],
      bookingDate: booking?.bookingDate,
      totalAmount: settlement.grossAmount,
      commissionAmount: settlement.commissionAmount,
      commissionRate: settlement.commissionRate,
      gstAmount: settlement.gstOnCommission,
      netSettlement: settlement.netSettlementAmount,
    });
  }

  // Calculate GST breakdown for the invoice total
  const labState = labPartner.placeOfSupply || labPartner.state;
  const gstBreakdown = calculateGST(totalCommission, labState);

  // Generate sequential invoice number
  const yearShort = String(year).slice(-2);
  const monthPadded = String(month).padStart(2, "0");
  const prefix = `RVF/INV/${yearShort}${monthPadded}`;
  const invoiceNumber = await InvoiceCounter.getNextInvoiceNumber(prefix);

  // Calculate due date: 15th of the next month
  const dueMonth = month === 12 ? 1 : month + 1;
  const dueYear = month === 12 ? year + 1 : year;
  const dueDate = new Date(dueYear, dueMonth - 1, 15);

  // Grace period: 5 days after due date
  const gracePeriodEnd = new Date(dueDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5);

  // Average commission rate across settlements
  const avgCommissionRate =
    settlements.reduce((sum, s) => sum + s.commissionRate, 0) / settlements.length;

  const invoice = await PlatformInvoice.create({
    labPartnerId,
    invoiceNumber,
    billingPeriod: {
      month,
      year,
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0), // Last day of month
      type: "monthly",
    },
    totalCommission,
    numberOfBookings: settlements.length,
    totalBookingValue,
    commissionRate: Math.round(avgCommissionRate * 100) / 100,
    totalSettlementAmount: totalSettlement,
    gstDetails: {
      platformGstin: config.platform.gstin,
      labPartnerGstin: labPartner.gstin || "",
      placeOfSupply: labState || "",
      sacCode: config.platform.sacCode,
      taxType: gstBreakdown.type,
      taxableValue: totalCommission,
      cgstRate: gstBreakdown.cgstRate,
      cgstAmount: gstBreakdown.cgst,
      sgstRate: gstBreakdown.sgstRate,
      sgstAmount: gstBreakdown.sgst,
      igstRate: gstBreakdown.igstRate,
      igstAmount: gstBreakdown.igst,
      totalTaxAmount: gstBreakdown.totalTax,
      totalInvoiceAmount: totalCommission + gstBreakdown.totalTax,
    },
    status: INVOICE_STATUSES.ISSUED,
    dueDate,
    gracePeriodEnd,
    settlementIds,
    bookingIds: settlements.map((s) => s.bookingId?._id).filter(Boolean),
    commissionBreakdown,
    autoGenerated: true,
    generatedBy: "system",
  });

  // Link invoice back to settlements
  await Settlement.updateMany(
    { _id: { $in: settlementIds } },
    { $set: { invoiceId: invoice._id } }
  );

  // Generate PDF
  try {
    const pdfPath = await generateInvoicePdf(invoice, labPartner);
    invoice.pdfPath = pdfPath;
    invoice.pdfGeneratedAt = new Date();
    await invoice.save();
  } catch (error) {
    console.error(`PDF generation failed for invoice ${invoiceNumber}:`, error.message);
    // Non-fatal: PDF can be regenerated later
  }

  return { skipped: false, invoice };
};

/**
 * Generate invoices for all active lab partners for a given billing period.
 *
 * @param {number} month
 * @param {number} year
 * @returns {Promise<Object>} Summary of generation results
 */
export const generateAllMonthlyInvoices = async (month, year) => {
  // Find all lab partners that have settlements in this period
  const labPartnerIds = await Settlement.distinct("labPartnerId", {
    "billingPeriod.month": month,
    "billingPeriod.year": year,
  });

  const results = {
    total: labPartnerIds.length,
    generated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const promises = labPartnerIds.map(async (labPartnerId) => {
    try {
      const result = await generateMonthlyInvoice(labPartnerId, month, year);
      if (result.skipped) {
        results.skipped++;
      } else {
        results.generated++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        labPartnerId: labPartnerId.toString(),
        error: error.message,
      });
    }
  });

  await Promise.allSettled(promises);
  return results;
};

export default { generateMonthlyInvoice, generateAllMonthlyInvoices };
