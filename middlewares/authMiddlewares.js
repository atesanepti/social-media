import createHttpError from "http-errors";
import { verifyToken } from "../helper/jwt.js";
import prisma from "../prisma/index.js";

export const authorized = async (req, res, next) => {
  
  try {
    const authToken = req.headers["authorization"];
    const token = authToken && authToken.split(" ")[1];
    const { id } = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: 1, email: 1, username: 1 },
    });
    if (!user) {
      throw createHttpError(401, "Authentication failed! User not found");
    }
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
