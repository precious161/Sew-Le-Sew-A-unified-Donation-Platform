import prisma from "../../config/db.js";

// ── ADMIN: Create Event & Auto-Notify Donors ──
export const createEvent = async (adminId, data) => {
  const { eventName, description, location, latitude, longitude, eventDate, startTime, endTime } = data;

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

  // AUTOMATION: Find all active donors and send them an alert
  const activeDonors = await prisma.user.findMany({
    where: { Role: "Donor", status: "Active" },
    select: { id: true },
  });

  if (activeDonors.length > 0) {
    const notifications = activeDonors.map(donor => ({
      userId: donor.id,
      message: `New Blood Drive! ${eventName} is scheduled at ${location} on ${new Date(eventDate).toDateString()}. Check the map for details!`,
    }));

    // Bulk insert notifications for performance
    await prisma.notification.createMany({ data: notifications });
  }

  return newEvent;
};

// ── PUBLIC & DONOR: Get Active Upcoming Events ──
export const getActiveEvents = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  return await prisma.donationEvent.findMany({
    where: {
      status: "Active",
      eventDate: { gte: today } // Only show events happening today or in the future
    },
    include: {
      // Gives us a raw number of total participants (ViewEventStats requirement)
      _count: { select: { attendees: true } },
      // Sends back only the IDs of attendees so the Frontend can show "Cancel RSVP" if the user is in the list
      attendees: { select: { id: true } }
    },
    orderBy: { eventDate: "asc" }, // Closest events show up first
  });
};

// ── ADMIN: Get ALL Events (For Dashboard) ──
export const getAllEventsAdmin = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [events, totalCount] = await Promise.all([
    prisma.donationEvent.findMany({
      skip,
      take: limit,
      include: {
        // Admin gets to see exactly how many people are coming
        _count: { select: { attendees: true } }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.donationEvent.count(),
  ]);

  return { events, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

// ── ADMIN: Update Event Status (Cancel/Complete) ──
export const updateEventStatus = async (eventId, status) => {
  const validStatuses = ["Active", "Cancelled", "Completed"];
  if (!validStatuses.includes(status)) throw new Error("Invalid status.");

  return await prisma.donationEvent.update({
    where: { id: eventId },
    data: { status },
  });
};

// ── DONOR: RSVP to an Event ──
export const rsvpToEvent = async (eventId, donorId) => {
  const event = await prisma.donationEvent.findUnique({
    where: { id: eventId },
    include: { attendees: { select: { id: true } } }
  });

  if (!event || event.status !== "Active") {
    throw new Error("Event is not active or does not exist.");
  }

  // Check if already attending
  const isAttending = event.attendees.some(attendee => attendee.id === donorId);

  if (isAttending) {
    // If already attending, remove them (Cancel RSVP)
    return await prisma.donationEvent.update({
      where: { id: eventId },
      data: { attendees: { disconnect: { id: donorId } } },
      include: { _count: { select: { attendees: true } } } // Return updated count
    });
  } else {
    // If not attending, add them (RSVP)
    return await prisma.donationEvent.update({
      where: { id: eventId },
      data: { attendees: { connect: { id: donorId } } },
      include: { _count: { select: { attendees: true } } } // Return updated count
    });
  }
};

// ── ADMIN: Full Event Update & Auto-Notify RSVP'd Donors ──
export const updateEventDetails = async (eventId, data) => {
  const { eventName, description, location, latitude, longitude, eventDate, startTime, endTime } = data;

  // 1. Get the existing event to find out who has RSVP'd
  const existingEvent = await prisma.donationEvent.findUnique({
    where: { id: eventId },
    include: { attendees: { select: { id: true } } }
  });

  if (!existingEvent) throw new Error("Event not found.");

  // 2. Update the event in the database
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

  // 3. AUTOMATION: Notify ONLY the donors who already RSVP'd!
  if (existingEvent.attendees.length > 0) {
    const notifications = existingEvent.attendees.map(donor => ({
      userId: donor.id,
      message: `UPDATE: The blood drive "${updatedEvent.eventName}" has changed details. It is now at ${updatedEvent.location} from ${updatedEvent.startTime}. Please check your map!`,
    }));

    await prisma.notification.createMany({ data: notifications });
  }

  return updatedEvent;
};