import { StatusCodes } from "http-status-codes";

export const validate= (schema) => (req,res,next)=>{

  const result = schema.safeParse(req.body);
  if(!result.success){

    const zodErrors = result.error?.errors || [];
    console.log("Incoming Body:", req.body);
    console.log("Validation Failed for:", req.body.EmailAddress);
    console.log("Zod Error:", result.error.format());

    return res.status(StatusCodes.BAD_REQUEST).json({
      status:"Fail",
      message: "Validation Failed",
      errors: zodErrors.map((err)=>({
        field: err.path[0] || "general",
        message: err.message,
      })),
    });
  }

  req.body=result.data;
  next();
};