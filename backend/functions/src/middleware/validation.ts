import { z, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { logger } from "firebase-functions";

export function validateSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      logger.info("Schema validated successfully!");
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          logger.warn(`Schema validation issue: ${issue.message}`);
          return {
            field: issue.path.join("."),
            message: `${issue.message}`,
          };
        });
        res.status(400).json({ error: "Invalid Data", details: errorMessages });
      } else {
        logger.error(`Schema validation error: ${error}`);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}
