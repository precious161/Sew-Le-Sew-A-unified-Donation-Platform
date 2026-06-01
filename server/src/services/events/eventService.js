import prisma from "../../config/db.js";
import logger from "../../utils/logger.js";

// ── ADMIN: Create Event & Auto-Notify Donors ──
export const createEvent = async (adminId, data) => {
  const { eventName, description, location, latitude, longitude, eventDate, startTime, endTime } = data;

  logger.info(`Creating new event by admin ${adminId}: ${eventName}`);

  const newEvent = await prisma.donationEvent.create({
    data: {
      eventName,
      description,
      location,
      latitude,
      longitude,
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      createdBy: adminId,
      status: "Active",
    },
  });

  const activeDonors = await prisma.user.findMany({
    where: { Role: "Donor", status: "Active" },
    select: { id: true },
  });

  if (activeDonors.length > 0) {
    const notifications = activeDonors.map(donor => ({
      userId: donor.id,
      message: `New Blood Drive! ${eventName} is scheduled at ${location} on ${new Date(eventDate).toDateString()}. Check the map for details!`,
    }));
    await prisma.notification.createMany({ data: notifications });
    logger.info(`Sent notifications to ${activeDonors.length} donors for event: ${eventName}`);
  }

  logger.info(`Event created successfully: ${newEvent.id} - ${eventName}`);
  return newEvent;
};

// ── PUBLIC & DONOR: Get Active Upcoming Events ──
export const getActiveEvents = async () => {
  logger.info("Fetching active upcoming events");

  await autoCompleteExpiredEvents();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.donationEvent.findMany({
    where: {
      status: "Active",
      eventDate: { gte: today }
    },
    include: {
      _count: { select: { attendees: true } },
      attendees: { select: { id: true } }
    },
    orderBy: { eventDate: "asc" },
  });

  logger.info(`Found ${events.length} active events`);
  return events;
};

// ── ADMIN: Get ALL Events with Filters ──
export const getAllEventsAdmin = async (page = 1, limit = 20, statusFilter = 'all') => {
  const skip = (page - 1) * limit;

  await autoCompleteExpiredEvents();

  logger.info(`Admin fetching events - page ${page}, limit ${limit}, filter: ${statusFilter}`);

  const whereClause = statusFilter !== 'all' ? { status: statusFilter } : {};

  const [events, totalCount] = await Promise.all([
    prisma.donationEvent.findMany({
      skip,
      take: limit,
      where: whereClause,
      include: {
        _count: { select: { attendees: true } }
      },
      orderBy: { eventDate: "desc" },
    }),
    prisma.donationEvent.count({ where: whereClause }),
  ]);

  logger.info(`Admin retrieved ${events.length} events (total: ${totalCount})`);
  return { events, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

// ── AUTO-COMPLETE EXPIRED EVENTS ──
export const autoCompleteExpiredEvents = async () => {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  logger.info(`Running auto-complete check at ${now.toISOString()}`);

  const expiredByDate = await prisma.donationEvent.findMany({
    where: {
      status: "Active",
      eventDate: { lt: now },
    },
  });

  const todayStr = now.toISOString().split('T')[0];
  const expiredByTime = await prisma.donationEvent.findMany({
    where: {
      status: "Active",
      eventDate: {
        gte: new Date(todayStr),
        lt: new Date(todayStr + 'T23:59:59')
      },
    },
  });

  const expiredByTimeFiltered = expiredByTime.filter(event => {
    return event.endTime < currentTime;
  });

  const allExpired = [...expiredByDate, ...expiredByTimeFiltered];
  const uniqueExpired = [...new Map(allExpired.map(item => [item.id, item])).values()];

  if (uniqueExpired.length > 0) {
    logger.info(`Found ${uniqueExpired.length} expired events to auto-complete`);

    for (const event of uniqueExpired) {
      await prisma.donationEvent.update({
        where: { id: event.id },
        data: { status: "Completed" },
      });
      logger.info(`Auto-completed event: ${event.eventName} (${event.id})`);
    }
  }

  return uniqueExpired.length;
};

// ── ADMIN: Update Event Status (Cancel/Complete) ──
export const updateEventStatus = async (eventId, status) => {
  const validStatuses = ["Active", "Cancelled", "Completed"];
  if (!validStatuses.includes(status)) {
    logger.warn(`Invalid status update attempt: ${status} for event ${eventId}`);
    throw new Error("Invalid status.");
  }

  logger.info(`Updating event ${eventId} status to: ${status}`);

  const updatedEvent = await prisma.donationEvent.update({
    where: { id: eventId },
    data: { status },
  });

  logger.info(`Event ${eventId} status updated successfully`);
  return updatedEvent;
};

// ── DONOR: RSVP to an Event ──
export const rsvpToEvent = async (eventId, donorId) => {
  logger.info(`Donor ${donorId} attempting to RSVP to event ${eventId}`);

  const event = await prisma.donationEvent.findUnique({
    where: { id: eventId },
    include: { attendees: { select: { id: true } } }
  });

  if (!event || event.status !== "Active") {
    logger.warn(`RSVP failed - Event ${eventId} not active or not found`);
    throw new Error("Event is not active or does not exist.");
  }

  const isAttending = event.attendees.some(attendee => attendee.id === donorId);

  let result;
  if (isAttending) {
    logger.info(`Donor ${donorId} cancelling RSVP for event ${eventId}`);
    result = await prisma.donationEvent.update({
      where: { id: eventId },
      data: { attendees: { disconnect: { id: donorId } } },
      include: { _count: { select: { attendees: true } } }
    });
  } else {
    logger.info(`Donor ${donorId} RSVPing to event ${eventId}`);
    result = await prisma.donationEvent.update({
      where: { id: eventId },
      data: { attendees: { connect: { id: donorId } } },
      include: { _count: { select: { attendees: true } } }
    });
  }

  logger.info(`RSVP updated for donor ${donorId}, event ${eventId}. Total attendees: ${result._count.attendees}`);
  return result;
};

// ── ADMIN: Full Event Update & Auto-Notify RSVP'd Donors ──
export const updateEventDetails = async (eventId, data) => {
  const { eventName, description, location, latitude, longitude, eventDate, startTime, endTime } = data;

  logger.info(`Admin updating event ${eventId}: ${eventName}`);

  const existingEvent = await prisma.donationEvent.findUnique({
    where: { id: eventId },
    include: { attendees: { select: { id: true } } }
  });

  if (!existingEvent) {
    logger.error(`Event ${eventId} not found for update`);
    throw new Error("Event not found.");
  }

  const updatedEvent = await prisma.donationEvent.update({
    where: { id: eventId },
    data: {
      eventName,
      description,
      location,
      latitude,
      longitude,
      eventDate: eventDate ? new Date(eventDate) : existingEvent.eventDate,
      startTime,
      endTime,
    },
  });

  if (existingEvent.attendees.length > 0) {
    const notifications = existingEvent.attendees.map(donor => ({
      userId: donor.id,
      message: `UPDATE: The blood drive "${updatedEvent.eventName}" has changed details. It is now at ${updatedEvent.location} from ${updatedEvent.startTime}. Please check your map!`,
    }));

    await prisma.notification.createMany({ data: notifications });
    logger.info(`Sent update notifications to ${existingEvent.attendees.length} attendees for event ${eventId}`);
  }

  logger.info(`Event ${eventId} updated successfully`);
  return updatedEvent;
};

// ── Get event statistics for dashboard ──
export const getEventStats = async () => {
  await autoCompleteExpiredEvents();

  const [active, completed, cancelled] = await Promise.all([
    prisma.donationEvent.count({ where: { status: "Active" } }),
    prisma.donationEvent.count({ where: { status: "Completed" } }),
    prisma.donationEvent.count({ where: { status: "Cancelled" } }),
  ]);

  const totalAttendeesResult = await prisma.donationEvent.aggregate({
    _count: { attendees: true }
  });

  return { active, completed, cancelled, totalAttendees: totalAttendeesResult._count.attendees };
};