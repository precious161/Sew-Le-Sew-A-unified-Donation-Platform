import { StatusCodes } from "http-status-codes";
import * as EventService from "../../services/events/eventService.js";
import * as AuditService from "../../services/security/auditService.js";

export const handleCreateEvent = async (req, res) => {
  try {
    const adminId = req.user.id;
    const newEvent = await EventService.createEvent(adminId, req.body);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, "Created Donation Event", "DonationEvent", `Event: ${newEvent.eventName}`);

    return res.status(StatusCodes.CREATED).json({ success: true, message: "Event created and donors notified!", data: newEvent });
  } catch (error) {
    console.error("handleCreateEvent Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to create event." });
  }
};

export const handleGetPublicEvents = async (req, res) => {
  try {
    // This is public, no req.user needed!
    const events = await EventService.getActiveEvents();
    return res.status(StatusCodes.OK).json({ success: true, count: events.length, data: events });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch events." });
  }
};

export const handleGetAdminEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await EventService.getAllEventsAdmin(page, limit);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch events." });
  }
};

export const handleUpdateEventStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const updatedEvent = await EventService.updateEventStatus(id, status);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, `Changed Event Status to ${status}`, "DonationEvent", `Event ID: ${id}`);

    return res.status(StatusCodes.OK).json({ success: true, message: `Event marked as ${status}`, data: updatedEvent });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const handleRSVP = async (req, res) => {
  try {
    const donorId = req.user.id;
    const eventId = req.params.id;

    await EventService.rsvpToEvent(eventId, donorId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Your RSVP status has been updated successfully!"
    });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const handleUpdateEventDetails = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const updatedEvent = await EventService.updateEventDetails(id, req.body);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, "Updated Event Details", "DonationEvent", `Event ID: ${id}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Event updated and attendees notified!",
      data: updatedEvent
    });
  } catch (error) {
    console.error("handleUpdateEventDetails Error:", error);
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};