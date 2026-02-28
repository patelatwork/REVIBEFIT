import mongoose from "mongoose";

const commissionChangeRequestSchema = new mongoose.Schema(
    {
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetUserType: {
            type: String,
            enum: ["trainer", "lab-partner"],
            required: true,
        },
        currentRate: {
            type: Number,
            required: true,
        },
        proposedRate: {
            type: Number,
            required: true,
            min: [0, "Commission rate cannot be negative"],
            max: [100, "Commission rate cannot exceed 100%"],
        },
        reason: {
            type: String,
            required: [true, "Reason for rate change is required"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "denied"],
            default: "pending",
        },
        adminResponse: {
            type: String,
            default: null,
            trim: true,
        },
        respondedAt: {
            type: Date,
            default: null,
        },
        respondedBy: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for quick lookups
commissionChangeRequestSchema.index({ status: 1, createdAt: -1 });
commissionChangeRequestSchema.index({ requestedBy: 1, status: 1 });

export const CommissionChangeRequest = mongoose.model(
    "CommissionChangeRequest",
    commissionChangeRequestSchema
);
