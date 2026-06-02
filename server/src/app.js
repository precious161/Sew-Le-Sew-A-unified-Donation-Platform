import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/passport.js';
import { StatusCodes } from 'http-status-codes';

// Import Auth Routes
import authRoutes from "./routes/authRoutes.js";

// Import User-Management routes
import userRoutes from "./routes/users/index.js";

// Import Donation-Management routes
import donationRoutes from "./routes/donations/index.js";

// Import Matching routes
import matchingRoutes from "./routes/matching/index.js";

// Import Audit routes
import auditRoutes from "./routes/security/auditRoutes.js";

// Import Event routes
import eventRoutes from "./routes/events/eventRoutes.js";

// Import AI routes
import aiRoutes from './routes/ai/index.js';

dotenv.config();
console.log('🔧 Frontend URL configured as:', config.frontendUrl);
const app=express();

const allowedOrigins = [
  'https://sew-le-sew-platform.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
   cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Main Route
app.get('/',async (req,res)=>{

  try{
    res.status(StatusCodes.OK).json({
      success:true,
      message: "Sew Le Sew API is running smoothly"
    });
  }
catch(error){
     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success:false,
      error: "Something went wrong.",
      details: error.message
     })
}
});

// Debug Cloudinary config (remove after testing)
app.get('/api/debug/cloudinary', (req, res) => {
  res.json({
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
});

// Auth Routes
app.use('/api/auth',authRoutes);

// User Routes
app.use("/api/users", userRoutes);

// Donation Routes
app.use("/api/donations",donationRoutes);

// Matching Routes
app.use("/api/matching", matchingRoutes);

// Audit Routes
app.use("/api/admin/audit", auditRoutes);

// Event Routes
app.use("/api/events", eventRoutes);

// AI Routes
app.use("/api/ai", aiRoutes);

app.use((req,res)=>{
   res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    status:'Fail',
    message:`Route ${req.originalUrl} not found`
   });
});

export default app;