import type { DecisionConfirmation } from "@app-portal/shared/types";
import axios from "axios";
import type { CollectionReference } from "firebase/firestore";
import { collection, getDocs, query, where } from "firebase/firestore";

import { API_URL, db } from "@/config/firebase";

import { getAppCheckToken } from "./appCheckService";

const CONFIRMATION_COLLECTION = "decision-status";

export async function createDecisionConfirmation(
  decisionConfirmation: DecisionConfirmation,
  token: string,
) {
  const res = await axios.post(
    API_URL + "/status/decision",
    decisionConfirmation,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APPCHECK": await getAppCheckToken(),
      },
    },
  );
  return res.data;
}

export async function getDecisionConfirmationForResponseRole(
  userId: string,
  responseId: string,
) {
  const confirmationCollection = collection(
    db,
    CONFIRMATION_COLLECTION,
  ) as CollectionReference<DecisionConfirmation>;
  const q = query(
    confirmationCollection,
    where("userId", "==", userId),
    where("responseId", "==", responseId),
  );

  const resp = (await getDocs(q)).docs.map((d) => d.data());

  if (resp.length > 0) return resp[0];
  else return null;
}

export async function getAllDecisionConfirmationsByFormId(
  formId: string,
): Promise<DecisionConfirmation[]> {
  const responses = collection(db, CONFIRMATION_COLLECTION);
  const q = query(responses, where("formId", "==", formId));

  const results = await getDocs(q);

  return results.docs.map((d) => d.data() as DecisionConfirmation);
}
