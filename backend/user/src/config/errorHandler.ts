import { NextFunction, Request, Response } from "express";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  return res.status(500).json({
    message: "Internal server error",
    error: error.message
  });
};
