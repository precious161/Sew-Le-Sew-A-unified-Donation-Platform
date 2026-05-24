import { Router } from 'express';
import bloodMatchingRoutes from "./bloodMatchingRoutes.js";
import inKindMatchingRoutes from "./inKindMatchingRoutes.js";
import financialRoutes from "./financialRoutes.js";
import organMatchingRoutes from "./organMatchingRoutes.js";
import { protect } from '../../middleware/authMiddleware.js';
import prisma from '../../config/db.js';

const router = Router();

// ─────────────────────────────────────────
// NEW: Unified Handshake Route 
// This allows the Donor to see the "Accept/Decline" card
// ─────────────────────────────────────────
router.get('/my-active-match', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activeMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { intent: { userId: userId } },
          { request: { recipientId: userId } }
        ],
        status: { in: ['Pending', 'Accepted'] },
      },
      include: {
        intent: true,
        request: {
          include: {
            user: { select: { FirstName: true, LastName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeMatch) {
      return res.status(200).json({ success: true, hasActiveMatch: false });
    }

    return res.status(200).json({
      success: true,
      hasActiveMatch: true,
      data: {
        matchId: activeMatch.id,
        donationType: activeMatch.intent.category,
        location: activeMatch.intent.location,
        urgencyLevel: activeMatch.request.urgencyLevel,
        status: activeMatch.status
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registry fetch error' });
  }
});

router.use("/blood", bloodMatchingRoutes);
router.use("/inkind", inKindMatchingRoutes);
router.use("/financial", financialRoutes);
router.use("/organ", organMatchingRoutes);

export default router;