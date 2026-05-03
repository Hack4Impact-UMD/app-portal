import { NextFunction, Request, Response } from "express";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";

export default async function appcheck(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.header("X-APPCHECK");

  if (!token) {
    logger.error("No app check token found in request.");
    return res.status(403).send();
  }

  try {
    await admin.appCheck().verifyToken(token);
    logger.info("App Check token verified.");
    return next();
  } catch (err) {
    logger.error("App check verification failed!", err);
    return res.status(403).send();
  }
}
