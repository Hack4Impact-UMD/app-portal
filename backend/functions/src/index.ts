/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

import app from "./app";
// import { uploadMockData } from "./utils/mockData";

admin.initializeApp();
export const db = admin.firestore();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// uploadMockData()

export const api = onRequest(
  { region: process.env.GCP_REGION || "us-east4" },
  app,
);
