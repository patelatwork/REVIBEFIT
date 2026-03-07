import Razorpay from "razorpay";
import crypto from "crypto";
import config from "../config/index.js";

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      throw new Error(
        "Razorpay configuration missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      );
    }
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay Order with Route transfer (split payment).
 * The lab partner's share is held until test completion.
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in paise (INR smallest unit)
 * @param {string} params.receipt - Unique receipt ID (e.g. bookingId)
 * @param {string} params.labLinkedAccountId - Lab partner's Razorpay linked account ID
 * @param {number} params.labSettlementAmount - Amount to transfer to lab (in paise)
 * @param {Object} [params.notes] - Additional metadata
 * @returns {Promise<Object>} Razorpay order object
 */
export const createOrder = async ({
  amount,
  receipt,
  labLinkedAccountId,
  labSettlementAmount,
  notes = {},
}) => {
  const razorpay = getRazorpayInstance();

  const orderOptions = {
    amount,
    currency: "INR",
    receipt,
    payment_capture: 1, // Auto-capture
    notes,
  };

  // Add Route transfer if lab has a linked account
  if (labLinkedAccountId && labSettlementAmount > 0) {
    orderOptions.transfers = [
      {
        account: labLinkedAccountId,
        amount: labSettlementAmount,
        currency: "INR",
        on_hold: 1, // Hold until test completion
        notes: {
          receipt,
          purpose: "lab_settlement",
        },
      },
    ];
  }

  return razorpay.orders.create(orderOptions);
};

/**
 * Release a held transfer (after test completion).
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} transferId - Razorpay transfer ID
 * @returns {Promise<Object>}
 */
export const releaseTransfer = async (paymentId, transferId) => {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.transfers.edit(paymentId, transferId, {
    on_hold: 0,
  });
};

/**
 * Initiate a refund via Razorpay.
 * @param {string} paymentId - Razorpay payment ID
 * @param {Object} params
 * @param {number} [params.amount] - Partial refund amount in paise (omit for full)
 * @param {string} [params.notes] - Refund reason
 * @param {boolean} [params.reverseAll] - Reverse all Route transfers
 * @returns {Promise<Object>}
 */
export const initiateRefund = async (paymentId, { amount, notes, reverseAll = true } = {}) => {
  const razorpay = getRazorpayInstance();
  const refundOptions = {
    speed: "normal",
    notes: notes ? { reason: notes } : undefined,
  };
  if (amount) refundOptions.amount = amount;
  if (reverseAll) refundOptions.reverse_all = 1;

  return razorpay.payments.refund(paymentId, refundOptions);
};

/**
 * Verify Razorpay webhook signature.
 * @param {string|Buffer} body - Raw request body
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean}
 */
export const verifyWebhookSignature = (body, signature) => {
  if (!config.razorpay.webhookSecret) {
    throw new Error("Razorpay webhook secret not configured.");
  }
  const expectedSignature = crypto
    .createHmac("sha256", config.razorpay.webhookSecret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
};

/**
 * Verify Razorpay payment signature (from Checkout callback).
 * @param {string} orderId - razorpay_order_id
 * @param {string} paymentId - razorpay_payment_id
 * @param {string} signature - razorpay_signature
 * @returns {boolean}
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};

/**
 * Create a Razorpay linked account for a lab partner (Route onboarding).
 * @param {Object} params - Lab partner details for KYC
 * @returns {Promise<Object>}
 */
export const createLinkedAccount = async ({
  email,
  phone,
  legalBusinessName,
  businessType = "partnership",
  contactName,
}) => {
  const razorpay = getRazorpayInstance();
  return razorpay.accounts.create({
    email,
    phone,
    type: "route",
    legal_business_name: legalBusinessName,
    business_type: businessType,
    contact_name: contactName,
    legal_info: {
      pan: "", // To be filled during KYC
    },
  });
};

/** Fetch a payment by ID. */
export const fetchPayment = async (paymentId) => {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.fetch(paymentId);
};

/** Fetch an order by ID. */
export const fetchOrder = async (orderId) => {
  const razorpay = getRazorpayInstance();
  return razorpay.orders.fetch(orderId);
};

/** Fetch transfers for a payment. */
export const fetchTransfers = async (paymentId) => {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.fetchTransfer(paymentId);
};

export default {
  createOrder,
  releaseTransfer,
  initiateRefund,
  verifyWebhookSignature,
  verifyPaymentSignature,
  createLinkedAccount,
  fetchPayment,
  fetchOrder,
  fetchTransfers,
};
