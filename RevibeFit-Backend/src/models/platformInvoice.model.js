import mongoose from "mongoose";

const platformInvoiceSchema = new mongoose.Schema(
  {
    labPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lab partner ID is required"],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      index: true,
    },
    billingPeriod: {
      month: {
        type: Number,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        min: 2020,
      },
      // For custom date ranges
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      type: {
        type: String,
        enum: ["monthly", "weekly", "custom"],
        default: "monthly",
      },
    },
    // Financial details
    totalCommission: {
      type: Number,
      required: [true, "Total commission is required"],
      min: [0, "Total commission cannot be negative"],
    },
    numberOfBookings: {
      type: Number,
      required: [true, "Number of bookings is required"],
      min: [0, "Number of bookings cannot be negative"],
      default: 0,
    },
    totalBookingValue: {
      type: Number,
      required: [true, "Total booking value is required"],
      min: [0, "Total booking value cannot be negative"],
      default: 0,
    },
    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      default: 10,
      min: 0,
      max: 100,
    },
    // Invoice status and dates
    status: {
      type: String,
      enum: ["payment_due", "paid", "overdue", "cancelled"],
      default: "payment_due",
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true,
    },
    generatedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "online", "cash", "cheque", null],
      default: null,
    },
    paymentReference: {
      type: String,
      default: null,
    },
    paymentNotes: {
      type: String,
      default: null,
    },
    // Related bookings
    bookingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabBooking",
      },
    ],
    // Commission breakdown - detailed list of each booking's commission
    commissionBreakdown: [
      {
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LabBooking",
        },
        fitnessEnthusiastId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        fitnessEnthusiastName: String,
        testNames: [String],
        bookingDate: Date,
        totalAmount: Number,
        commissionAmount: Number,
        commissionRate: Number,
      },
    ],
    // Invoice request tracking
    requestedByLabPartner: {
      type: Boolean,
      default: false,
    },
    requestedDate: {
      type: Date,
      default: null,
    },
    requestNotes: {
      type: String,
      default: null,
    },
    // Admin notes
    notes: {
      type: String,
      trim: true,
    },
    generatedBy: {
      type: String, // Admin email who generated the invoice
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient billing period queries (made non-unique to allow multiple invoices per period)
platformInvoiceSchema.index({ labPartnerId: 1, "billingPeriod.year": 1, "billingPeriod.month": 1 });

// Index for custom date range queries
platformInvoiceSchema.index({ labPartnerId: 1, "billingPeriod.startDate": 1, "billingPeriod.endDate": 1 });

// Index for status and due date filtering
platformInvoiceSchema.index({ status: 1, dueDate: 1 });

// Virtual for formatted invoice number
platformInvoiceSchema.virtual("formattedInvoiceNumber").get(function () {
  return `INV-${this.billingPeriod.year}-${String(this.billingPeriod.month).padStart(2, "0")}-${this.invoiceNumber.slice(-6)}`;
});

// Virtual for formatted billing period
platformInvoiceSchema.virtual("formattedBillingPeriod").get(function () {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[this.billingPeriod.month - 1]} ${this.billingPeriod.year}`;
});

// Method to check if invoice is overdue
platformInvoiceSchema.methods.isOverdue = function () {
  return this.status === "payment_due" && new Date() > this.dueDate;
};

// Static method to generate invoice number
platformInvoiceSchema.statics.generateInvoiceNumber = async function (labPartnerId, year, month) {
  const prefix = `${year}${String(month).padStart(2, "0")}`;
  const count = await this.countDocuments({
    "billingPeriod.year": year,
    "billingPeriod.month": month,
  });
  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}${labPartnerId.toString().slice(-4)}${sequence}`;
};

// Pre-save hook to update overdue status
platformInvoiceSchema.pre("save", function (next) {
  if (this.status === "payment_due" && new Date() > this.dueDate) {
    this.status = "overdue";
  }
  next();
});

export const PlatformInvoice = mongoose.model("PlatformInvoice", platformInvoiceSchema);
