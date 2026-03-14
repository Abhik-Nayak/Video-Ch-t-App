import jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

export const jwtAuthToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
};

export const verifyJwtToken = (
  token: string,
): {
  userId: string;
} => {
  return jwt.verify(token, getJwtSecret()) as { userId: string };
};
