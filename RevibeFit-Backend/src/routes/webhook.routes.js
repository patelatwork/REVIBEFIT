import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// Razorpay webhook — no auth middleware (uses signature verification)
// Note: express.raw() body parser is applied in app.js specifically for this route
router.post("/razorpay", handleRazorpayWebhook);

export default router;
