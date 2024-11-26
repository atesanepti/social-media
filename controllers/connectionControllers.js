import prisma from "../prisma/index.js";
import createHttpError from "http-errors";

export const connectEstablish = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const selfId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { connections: 1 },
    });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    if (user.connections.followers.includes(selfId)) {
      return next(createHttpError(400, "You already followed him"));
    }

    const response = await prisma.$transaction([
      prisma.connection.update({
        where: { userId: userId },
        data: { followers: { push: selfId } },
      }),

      prisma.connection.update({
        where: { userId: selfId },
        data: { following: { push: userId } },
      }),
    ]);

    return res.status(201).json({ message: "You followed " });
  } catch (error) {
    next(error);
  }
};

export const disconnectEstablish = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const selfId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { connections: 1 },
    });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    if (!user.connections.followers.includes(selfId)) {
      return next(createHttpError(400, "No need you naver followed him"));
    }

    const reqArray = Array.from({ length: 2 });

    const response = await prisma.$transaction([
      prisma.connection.update({
        where: { userId: userId },
        data: {
          followers: {
            set: (
              await prisma.connection.findUnique({
                where: { userId: userId },
                select: { followers: true },
              })
            ).followers.filter((id) => id != selfId),
          },
        },
      }),

      prisma.connection.update({
        where: { userId: selfId },
        data: {
          following: {
            set: (
              await prisma.connection.findUnique({
                where: { userId: selfId },
                select: { following: true },
              })
            ).following.filter((id) => id != userId),
          },
        },
      }),
    ]);

    return res.status(201).json({ message: "You unfollowed" });
  } catch (error) {
    next(error);
  }
};
