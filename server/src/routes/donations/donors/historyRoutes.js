import { Router } from "express";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";
import * as HistoryController from "../../../controllers/donations/donors/historyController.js";

const router = Router();

// ── Donor Routes ──
router.get("/my-histoy", protect, authorize("Donor"), HistoryController.getMyDonationHistory);

// ── Admin Routes ──
router.get("/all-history", protect, authorize("Red_Cross_Admin"), HistoryController.getAllDonationHistory);
router.patch("/:id/remarks", protect, authorize("Red_Cross_Admin"), HistoryController.updateHistoryRemarks);

export default router;