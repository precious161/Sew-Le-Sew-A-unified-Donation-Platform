import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import { validateRequest } from "../../middleware/donations/validateRequest.js"; // Adjust path if needed
import { eventSchema, eventStatusSchema } from "../../validations/events/eventSchema.js";
import * as EventController from "../../controllers/events/eventController.js";

const router = Router();

// ── PUBLIC ROUTE ──
router.get("/", EventController.handleGetPublicEvents);

// ── DONOR ROUTES ──
router.post(
  "/:id/rsvp",
  protect,
  authorize("Donor"),
  EventController.handleRSVP
);

// ── ADMIN ROUTES ──
router.get(
  "/admin",
  protect,
  authorize("Red_Cross_Admin"),
  EventController.handleGetAdminEvents
);


router.post(
  "/",
  protect,
  authorize("Red_Cross_Admin"),
  validateRequest(eventSchema),
  EventController.handleCreateEvent
);


router.put(
  "/:id",
  protect,
  authorize("Red_Cross_Admin"),
  validateRequest(eventSchema),
  EventController.handleUpdateEventDetails
);


router.patch(
  "/:id/status",
  protect,
  authorize("Red_Cross_Admin"),
  validateRequest(eventStatusSchema),
  EventController.handleUpdateEventStatus
);

export default router;