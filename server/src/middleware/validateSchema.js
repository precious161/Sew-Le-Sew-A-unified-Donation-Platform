import { StatusCodes } from "http-status-codes";

export const validate= (schema) => (req,res,next)=>{

  const result = schema.safeParse(req.body);
  if(!result.success){
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation Failed",
      errors: result.error.errors.map((err)=>({
        field: err.path[0],
        message: err.message,
      })),
    });
  }

  req.body=result.data;
  next();
};