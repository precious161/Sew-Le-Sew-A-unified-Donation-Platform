import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';

dotenv.config();

 const app=express();

app.use(cors());
app.use(express.json());

app.get('/',async (req,res)=>{

  try{
    res.status(StatusCodes.OK).json({
      message: "Sew Le Sew API is running smoothly"
    });
  }
catch(error){
     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Something went wrong.",
      details: error.message
     })
}
});

app.use((req,res)=>{
   res.status(StatusCodes.NOT_FOUND).json({
    status:'Fail',
    message:`Route ${req.originalUrl} not found`
   });
});

export default app;