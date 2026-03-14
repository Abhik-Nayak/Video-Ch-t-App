import { NextFunction, Request, Response } from "express";
import { verifyJwtToken } from "../config/jwt";

export const verifyUserToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const payload = verifyJwtToken(token);
    res.locals.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
