import { StatusCodes } from "http-status-codes";
import * as EventService from "../../services/events/eventService.js";
import * as AuditService from "../../services/security/auditService.js";
import logger from "../../utils/logger.js";

export const handleCreateEvent = async (req, res) => {
  try {
    const adminId = req.user.id;
    logger.info(`Admin ${adminId} creating new event`);

    const newEvent = await EventService.createEvent(adminId, req.body);

    await AuditService.createLogEntry(adminId, "Created Donation Event", "DonationEvent", `Event: ${newEvent.eventName}`);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Event created and donors notified!",
      data: newEvent
    });
  } catch (error) {
    logger.error(`handleCreateEvent Error: ${error.message}`, { stack: error.stack });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create event."
    });
  }
};

export const handleGetPublicEvents = async (req, res) => {
  try {
    logger.info("Fetching public events");
    const events = await EventService.getActiveEvents();
    return res.status(StatusCodes.OK).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    logger.error(`handleGetPublicEvents Error: ${error.message}`, { stack: error.stack });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch events."
    });
  }
};

export const handleGetAdminEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const statusFilter = req.query.status || 'all';

    logger.info(`Admin fetching events - page ${page}, limit ${limit}, filter: ${statusFilter}`);

    const result = await EventService.getAllEventsAdmin(page, limit, statusFilter);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    logger.error(`handleGetAdminEvents Error: ${error.message}`, { stack: error.stack });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch events."
    });
  }
};

export const handleGetEventStats = async (req, res) => {
  try {
    logger.info("Fetching event stats");
    const stats = await EventService.getEventStats();
    return res.status(StatusCodes.OK).json({ success: true, data: stats });
  } catch (error) {
    logger.error(`handleGetEventStats Error: ${error.message}`, { stack: error.stack });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch event stats."
    });
  }
};

export const handleUpdateEventStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    logger.info(`Admin ${adminId} updating event ${id} status to ${status}`);

    const updatedEvent = await EventService.updateEventStatus(id, status);

    await AuditService.createLogEntry(adminId, `Changed Event Status to ${status}`, "DonationEvent", `Event ID: ${id}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Event marked as ${status}`,
      data: updatedEvent
    });
  } catch (error) {
    logger.error(`handleUpdateEventStatus Error: ${error.message}`, { stack: error.stack });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const handleRSVP = async (req, res) => {
  try {
    const donorId = req.user.id;
    const eventId = req.params.id;

    logger.info(`Donor ${donorId} RSVP request for event ${eventId}`);

    await EventService.rsvpToEvent(eventId, donorId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Your RSVP status has been updated successfully!"
    });
  } catch (error) {
    logger.error(`handleRSVP Error: ${error.message}`, { stack: error.stack });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const handleUpdateEventDetails = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    logger.info(`Admin ${adminId} updating event details for ${id}`);

    const updatedEvent = await EventService.updateEventDetails(id, req.body);

    await AuditService.createLogEntry(adminId, "Updated Event Details", "DonationEvent", `Event ID: ${id}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Event updated and attendees notified!",
      data: updatedEvent
    });
  } catch (error) {
    logger.error(`handleUpdateEventDetails Error: ${error.message}`, { stack: error.stack });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};