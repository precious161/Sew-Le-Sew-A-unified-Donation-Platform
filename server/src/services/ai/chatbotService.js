import Groq from 'groq-sdk';
import { config } from '../../config/env.js';
import prisma from '../../config/db.js';

const groq = new Groq({
  apiKey: config.groqApiKey,
});

// ─────────────────────────────────────────
// COMPLETE SYSTEM KNOWLEDGE BASE
// ─────────────────────────────────────────
const SYSTEM_KNOWLEDGE = `
You are Sew Le Sew Assistant, an AI chatbot for the Ethiopian Red Cross donation platform.

ABOUT SEW LE SEW:
- Unified donation platform connecting donors, patients, hospitals, and Ethiopian Red Cross
- Supports: Blood donation, Organ donor registration, Financial contributions, In-kind medical supplies
- Geographic scope: Addis Ababa (pilot phase)
- Website: Sew Le Sew - "From Heart to Hand"

BLOOD DONATION REQUIREMENTS:
- Minimum age: 18 years
- Minimum weight: 50 kg
- Blood donation gap: 90 days between donations
- Hemoglobin minimum: 12.5 g/dL
- Blood types: A+, A-, B+, B-, AB+, AB-, O+, O-
- Universal donor: O- (can give to anyone)
- Universal recipient: AB+ (can receive from anyone)

ORGAN DONATION REQUIREMENTS:
- Must be 18+ years old
- Requires medical clearance document from doctor
- Requires verified National ID
- Consent must be given freely (no coercion)
- Organs: Kidney, Liver, Heart, Lung, Cornea

FINANCIAL CONTRIBUTIONS:
- Any amount accepted (minimum 5 ETB recommended)
- Requires proof of transfer receipt
- Verified by Red Cross admin
- Used for medical supplies and emergency response

IN-KIND DONATIONS:
- Medical supplies: First aid kits, bandages, gauze
- Equipment: Wheelchairs, crutches, hospital beds
- Medications: Unopened, unexpired (6+ months remaining)
- Must be quality certified

REGISTRATION PROCESS:
1. Sign up as Donor or Recipient
2. Upload National ID/Passport for verification
3. Admin verifies identity (24-48 hours)
4. Complete health information (for matching)
5. Start donating or requesting

DONATION WORKFLOW (Donor):
1. Complete eligibility quiz
2. Register donation intent (Blood/Organ/In-Kind)
3. Get matched with recipient (AI + admin approval)
4. Receive notification with Red Cross center details
5. Visit center to complete donation
6. Earn 90-day cooldown period

REQUEST WORKFLOW (Recipient):
1. Complete health information (blood type, weight, conditions)
2. Submit donation request with medical document
3. Admin verifies request
4. AI + admin find matching donor
5. Receive notification when donor found

EVENTS:
- Blood drives held in Addis Ababa locations
- Locations: Bole Medhanialem, Piassa, Megenagna, CMC
- Users can RSVP to events
- Donors receive event notifications

ADMIN RESPONSIBILITIES:
- Verify user identities (National ID/Passport)
- Verify donation requests (medical documents)
- Approve donor intents (especially organ donations)
- Manage donation events
- Monitor system analytics

CONTACT INFORMATION:
- Ethiopian Red Cross: +251-11-551-00-11
- Email: info@redcrosseth.org
- Address: Addis Ababa, near Meskel Square

IMPORTANT RULES:
- Organ donors must have medical clearance document
- Organ donor intent goes to PendingVerification first
- Blood donors have 90-day cooldown between donations
- All medical documents must be uploaded for verification
- Only verified users can donate or request
`;

// ─────────────────────────────────────────
// FETCH REAL-TIME SYSTEM DATA
// ─────────────────────────────────────────
const fetchSystemStats = async () => {
  try {
    const [
      totalDonors,
      totalRecipients,
      activeRequests,
      upcomingEvents,
      criticalRequests,
    ] = await Promise.all([
      prisma.user.count({ where: { Role: 'Donor', status: 'Active' } }),
      prisma.user.count({ where: { Role: 'Recipient', status: 'Active' } }),
      prisma.donationRequest.count({
        where: { status: { in: ['PendingVerification', 'Pending', 'Matching'] } },
      }),
      prisma.donationEvent.count({
        where: { eventDate: { gte: new Date() }, status: 'Active' },
      }),
      prisma.donationRequest.count({
        where: { urgencyLevel: 'Critical', status: { in: ['PendingVerification', 'Pending'] } },
      }),
    ]);

    // Get most needed blood type
    const bloodTypeDemand = await prisma.donationRequest.groupBy({
      by: ['requiredBloodType'],
      where: { donationType: 'Blood', requiredBloodType: { not: null } },
      _count: { requiredBloodType: true },
      orderBy: { _count: { requiredBloodType: 'desc' } },
      take: 1,
    });

    return {
      totalDonors,
      totalRecipients,
      activeRequests,
      upcomingEvents,
      criticalRequests,
      mostNeededBlood: bloodTypeDemand[0]?.requiredBloodType || 'O+',
    };
  } catch (error) {
    console.error('Failed to fetch stats for chatbot:', error);
    return null;
  }
};

// ─────────────────────────────────────────
// CHECK USER STATUS (if logged in)
// ─────────────────────────────────────────
const getUserContext = async (userId) => {
  if (!userId || userId === 'guest') {
    return {
      isLoggedIn: false,
      role: null,
      isVerified: false,
      hasHealthInfo: false,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { healthInfo: true },
    });

    if (!user) {
      return { isLoggedIn: false, role: null, isVerified: false, hasHealthInfo: false };
    }

    // Check if user has active intents/requests
    const activeIntents = await prisma.donationIntent.count({
      where: { userId, status: 'Active' },
    });

    const activeRequests = await prisma.donationRequest.count({
      where: { recipientId: userId, status: { in: ['Pending', 'Matching'] } },
    });

    return {
      isLoggedIn: true,
      role: user.Role,
      isVerified: user.identityStatus === 'Verified',
      hasHealthInfo: !!user.healthInfo,
      hasActiveIntents: activeIntents > 0,
      hasActiveRequests: activeRequests > 0,
      firstName: user.FirstName,
    };
  } catch (error) {
    console.error('Failed to fetch user context:', error);
    return { isLoggedIn: false, role: null, isVerified: false, hasHealthInfo: false };
  }
};

// ─────────────────────────────────────────
// GENERATE ACTIONABLE SUGGESTIONS
// ─────────────────────────────────────────
const generateActionSuggestions = (userContext, stats) => {
  const suggestions = [];

  if (!userContext.isLoggedIn) {
    suggestions.push({
      text: "Create an account",
      action: "/signup",
      description: "Start your donation journey",
    });
    suggestions.push({
      text: "View donation events",
      action: "/events",
      description: "Find drives near you",
    });
  } else if (userContext.role === 'Donor') {
    if (!userContext.isVerified) {
      suggestions.push({
        text: "Upload ID for verification",
        action: "/profile",
        description: "Complete your identity verification",
      });
    } else if (!userContext.hasHealthInfo) {
      suggestions.push({
        text: "Complete health profile",
        action: "/donations/recipient/health-info",
        description: "Required for matching",
      });
    } else if (!userContext.hasActiveIntents) {
      suggestions.push({
        text: "Register donation intent",
        action: "/donations/donor/register-intent",
        description: "Let us know you're ready to donate",
      });
    }
  } else if (userContext.role === 'Recipient') {
    if (!userContext.isVerified) {
      suggestions.push({
        text: "Upload ID for verification",
        action: "/profile",
        description: "Complete your identity verification",
      });
    } else if (!userContext.hasHealthInfo) {
      suggestions.push({
        text: "Complete health profile",
        action: "/donations/recipient/health-info",
        description: "Required for matching",
      });
    } else if (!userContext.hasActiveRequests) {
      suggestions.push({
        text: "Submit donation request",
        action: "/donations/recipient/request",
        description: "Tell us what you need",
      });
    }
  }

  return suggestions;
};

// ─────────────────────────────────────────
// MAIN CHAT FUNCTION
// ─────────────────────────────────────────
export const sendChatMessage = async (message, userId = null) => {
  try {
    console.log(`💬 sendChatMessage called with userId: ${userId}`);

    // Fetch real-time data
    const stats = await fetchSystemStats();
    const userContext = await getUserContext(userId);
    const suggestions = generateActionSuggestions(userContext, stats);

    // Build context-aware prompt
    let systemPrompt = SYSTEM_KNOWLEDGE;

    // Add real-time stats
    if (stats) {
      systemPrompt += `\n\nREAL-TIME SYSTEM DATA (as of now):
- Active Donors: ${stats.totalDonors}
- Active Recipients: ${stats.totalRecipients}
- Active Donation Requests: ${stats.activeRequests}
- Upcoming Events: ${stats.upcomingEvents}
- Critical/Emergency Requests: ${stats.criticalRequests}
- Most Needed Blood Type: ${stats.mostNeededBlood}

Use this data when users ask about current demand, shortages, or system status.`;
    }

    // Add user context if logged in
    if (userContext.isLoggedIn) {
      systemPrompt += `\n\nCURRENT USER CONTEXT:
- User Name: ${userContext.firstName}
- Role: ${userContext.role}
- Identity Verified: ${userContext.isVerified ? 'Yes' : 'No'}
- Health Info Completed: ${userContext.hasHealthInfo ? 'Yes' : 'No'}
${userContext.role === 'Donor' ? `- Has Active Intent: ${userContext.hasActiveIntents ? 'Yes' : 'No'}` : ''}
${userContext.role === 'Recipient' ? `- Has Active Request: ${userContext.hasActiveRequests ? 'Yes' : 'No'}` : ''}

Use this to personalize your responses. If the user asks "what should I do next?", suggest the next step based on their context.
If they ask for status, check their verification and health info status.`;
    }

    systemPrompt += `\n\nIMPORTANT INSTRUCTIONS:
1. Be helpful, concise, and friendly
2. Keep responses under 200 words
3. Use simple language (users may not be medical experts)
4. If user asks about something not covered, suggest contacting Red Cross
5. For actionable requests, guide users to the specific page
6. Personalize responses using user's name if available
7. If user asks "what's new" or "what's happening", mention upcoming events count and critical requests
8. If user asks about blood shortage, mention the most needed blood type from real-time data

Remember: You are representing the Ethiopian Red Cross. Be professional but warm.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';

    // ─────────────────────────────────────────
    // SAVE CHAT INTERACTION - FIXED
    // Only save if userId is a valid UUID (not 'guest')
    // ─────────────────────────────────────────
    const isValidUserId = userId && userId !== 'guest' && userId.length > 10;

    if (isValidUserId) {
      try {
        const savedChat = await prisma.chatInteraction.create({
          data: {
            userId: userId,
            query: message.substring(0, 500),
            response: reply.substring(0, 1000),
            interactionDate: new Date(),
            status: 'Answered',
          },
        });
        console.log(`✅ Chat saved successfully! ID: ${savedChat.id} for user: ${userId}`);
      } catch (dbError) {
        console.error('❌ Database error saving chat:', dbError.message);
        console.error('Error details:', dbError);
      }
    } else {
      console.log(`⚠️ Chat not saved - invalid userId: ${userId} (must be logged in to save history)`);
    }

    return {
      success: true,
      reply,
      suggestions: suggestions.slice(0, 3),
    };
  } catch (error) {
    console.error('Groq Chatbot Error:', error);
    return {
      success: false,
      reply: 'I am having trouble connecting right now. Please try again later or contact the Red Cross directly at +251-11-551-00-11.',
      suggestions: [],
    };
  }
};

// ─────────────────────────────────────────
// GET CHAT HISTORY FOR USER - FIXED with better logging
// ─────────────────────────────────────────
export const getUserChatHistory = async (userId) => {
  try {
    console.log(`📜 Fetching chat history for userId: ${userId}`);

    const history = await prisma.chatInteraction.findMany({
      where: { userId },
      orderBy: { interactionDate: 'desc' },
      take: 50,
      select: {
        id: true,
        query: true,
        response: true,
        interactionDate: true,
      },
    });

    console.log(`📜 Found ${history.length} chat history items for user ${userId}`);
    return history;
  } catch (error) {
    console.error('Failed to fetch chat history:', error.message);
    return [];
  }
};

// ─────────────────────────────────────────
// DELETE SINGLE CONVERSATION
// ─────────────────────────────────────────
export const deleteChatInteraction = async (userId, chatId) => {
  try {
    const result = await prisma.chatInteraction.deleteMany({
      where: {
        id: chatId,
        userId: userId,
      },
    });
    return result.count > 0;
  } catch (error) {
    console.error('Failed to delete chat:', error.message);
    return false;
  }
};

// ─────────────────────────────────────────
// DELETE ALL USER CONVERSATIONS
// ─────────────────────────────────────────
export const deleteAllUserChats = async (userId) => {
  try {
    const result = await prisma.chatInteraction.deleteMany({
      where: { userId },
    });
    return result.count;
  } catch (error) {
    console.error('Failed to delete all chats:', error.message);
    return 0;
  }
};