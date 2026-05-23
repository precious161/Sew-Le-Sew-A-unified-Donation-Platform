import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

const app=express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH","PUT","DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());

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