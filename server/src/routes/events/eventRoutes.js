import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as EventController from "../../controllers/events/eventController.js";

const router = Router();

// PUBLIC ROUTE
router.get("/", EventController.handleGetPublicEvents);

// ── ADMIN ROUTES ──
router.post(
  "/",
  protect,
  authorize("Red_Cross_Admin"),
  EventController.handleCreateEvent
);

router.get(
  "/admin",
  protect,
  authorize("Red_Cross_Admin"),
  EventController.handleGetAdminEvents
);

router.patch(
  "/:id/status",
  protect,
  authorize("Red_Cross_Admin"),
  EventController.handleUpdateEventStatus
);

// ── DONOR ROUTES ──
router.post(
  "/:id/rsvp",
  protect,
  authorize("Donor"),
  EventController.handleRSVP
);

export default router;