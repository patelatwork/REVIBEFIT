import mongoose from "mongoose";

const managerActivityLogSchema = new mongoose.Schema({
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            "APPROVE_USER",
            "REJECT_USER",
            "SUSPEND_USER",
            "UNSUSPEND_USER",
            "CLAIM_APPROVAL",
            "RELEASE_APPROVAL",
            "GENERATE_INVOICE",
            "GENERATE_ALL_INVOICES",
            "GENERATE_FLEXIBLE_INVOICE",
            "MARK_INVOICE_PAID",
            "ENFORCE_OVERDUE",
            "SUSPEND_LAB_NONPAYMENT",
            "UNSUSPEND_LAB",
            "REQUEST_COMMISSION_CHANGE",
            "UPDATE_PROFILE",
        ],
    },
    targetModel: {
        type: String,
        required: true,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    ipAddress: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// TTL index: auto-delete after 6 months (180 days)
managerActivityLogSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 15552000 }
);

// Query indexes
managerActivityLogSchema.index({ managerId: 1, createdAt: -1 });
managerActivityLogSchema.index({ action: 1, createdAt: -1 });

export const ManagerActivityLog = mongoose.model(
    "ManagerActivityLog",
    managerActivityLogSchema
);
