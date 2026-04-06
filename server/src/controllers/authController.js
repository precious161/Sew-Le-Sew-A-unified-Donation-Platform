import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export const signUp= async (req,res)=>{

  try{
      const { FirstName, LastName, EmailAddress, password, phoneNumber }= req.body;

      const existingUser= await prisma.user.findUnique({
        where: { EmailAddress },
      });

      if(existingUser){
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "User already exists with this Email Address."
        });
      }

      const salt= await bcrypt.genSalt(10);
      const hashedPassword= await bcrypt.hash(password,salt);

      const newUser= await prisma.user.create({
        data:{
          FirstName,
          LastName,
          EmailAddress,
          password: hashedPassword,
          phoneNumber
        },
      });


      const token= jwt.sign(
        { userId: newUser.id},
        config.jwtSecret,
        { expiresIn: "1d"}
      );

      return res.status(StatusCodes.CREATED).json({
        message: "'User registered successfully!",
        token,
        user:{
          id: newUser.id,
          FirstName: newUser.FirstName,
          EmailAddress: newUser.EmailAddress
        }
      });
  }
  catch(error){

    console.error("Registration Error:",error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Server error during registration"
    });
  }
};


export const login= async (req,res)=>{

  try{
    const { EmailAddress, password } = req.body;

    const user= await prisma.user.findUnique({
      where: { EmailAddress },
    });

    if(!user){
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid Email Address or Password"
      });
    }

    const isPasswordCorrect= await bcrypt.compare(password, user.password);

    if(!isPasswordCorrect){
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid Email Address or Password",
      });
    }

    const token= jwt.sign(
      { userId: user.id},
      config.jwtSecret,
      {
        expiresIn: "1d"
      }
    );


    return res.status(StatusCodes.OK).json({
      messgae: "Login Successfull!",
      token,
      user:{
        id: user.id,
        FirstName: user.FirstName,
        EmailAddress: user.EmailAddress,
      },
    });
  }
  catch(error){

    console.error("Login Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Server error during login",
    });
  }
};
