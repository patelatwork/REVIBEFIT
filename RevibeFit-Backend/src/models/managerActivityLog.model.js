import mongoose from "mongoose";

const managerActivityLogSchema = new mongoose.Schema({
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    managerType: {
        type: String,
        enum: ["trainer_manager", "lab_manager"],
        required: true,
    },
    region: {
        type: String,
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
            "SUSPEND_TRAINER",
            "UNSUSPEND_TRAINER",
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
            "REQUEST_TRAINER_COMMISSION_CHANGE",
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
    targetUserType: {
        type: String,
        default: null,
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

// Query indexes
managerActivityLogSchema.index({ managerType: 1, region: 1, createdAt: -1 });
managerActivityLogSchema.index({ managerId: 1, createdAt: -1 });
managerActivityLogSchema.index({ action: 1, createdAt: -1 });

export const ManagerActivityLog = mongoose.model(
    "ManagerActivityLog",
    managerActivityLogSchema
);
