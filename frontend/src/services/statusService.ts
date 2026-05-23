import type { ApplicantRole } from "@app-portal/shared/constants";
import { ReviewStatus } from "@app-portal/shared/constants";
import type { InternalApplicationStatus } from "@app-portal/shared/types";
import { API_URL, db } from "@/config/firebase";
import axios from "axios";
import type { CollectionReference } from "firebase/firestore";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getAppCheckToken } from "./appCheckService";

const STATUS_COLLECTION = "app-status";

export async function getApplicationStatus(
  token: string,
  responseId: string,
  role: ApplicantRole,
) {
  const res = await axios.get(API_URL + `/status/${responseId}/${role}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-APPCHECK": await getAppCheckToken(),
    },
  });

  return res.data as {
    id: string;
    status: ReviewStatus | "decided";
    role: ApplicantRole;
    released: boolean;
  };
}

export async function getAllApplicationStatusesForForm(formId: string) {
  const statusCollection = collection(db, STATUS_COLLECTION);
  const q = query(statusCollection, where("formId", "==", formId));
  const docsSnap = await getDocs(q);
  return docsSnap.docs.map((d) => d.data() as InternalApplicationStatus);
}

export async function rejectUndecidedApplicantsForForm(formId: string) {
  const statuses = await getAllApplicationStatusesForForm(formId);
  const undecided = statuses.filter((s) => !isDecided(s.status));
  const statusCollection = collection(
    db,
    STATUS_COLLECTION,
  ) as CollectionReference<InternalApplicationStatus>;

  const chunkSize = 250;

  for (let i = 0; i < undecided.length; i += chunkSize) {
    const chunk = undecided.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((s) => {
      const update: Partial<InternalApplicationStatus> = {
        status: ReviewStatus.Denied,
      };

      batch.update(doc(statusCollection, s.id), update);
    });

    await batch.commit();
  }
}

export function isDecided(status: ReviewStatus) {
  return [
    ReviewStatus.Accepted,
    ReviewStatus.Denied,
    ReviewStatus.Waitlisted,
  ].includes(status);
}

export async function getApplicationStatusForResponseRole(
  responseId: string,
  role: ApplicantRole,
) {
  const statusCollection = collection(
    db,
    STATUS_COLLECTION,
  ) as CollectionReference<InternalApplicationStatus>;
  const q = query(
    statusCollection,
    where("role", "==", role),
    where("responseId", "==", responseId),
  );

  const resp = (await getDocs(q)).docs.map((d) => d.data());

  if (resp.length > 0) return resp[0];
  else return undefined;
}

export async function getApplicationStatusById(statusId: string) {
  const statusCollection = collection(
    db,
    STATUS_COLLECTION,
  ) as CollectionReference<InternalApplicationStatus>;
  const q = query(statusCollection, where("id", "==", statusId));

  const resp = (await getDocs(q)).docs.map((d) => d.data());

  if (resp.length > 0) return resp[0];
  else return undefined;
}

export async function updateApplicationStatus(
  statusId: string,
  update: Partial<Omit<InternalApplicationStatus, "id">>,
) {
  const statusCollection = collection(
    db,
    STATUS_COLLECTION,
  ) as CollectionReference<InternalApplicationStatus>;
  const statusDoc = doc(statusCollection, statusId);
  await updateDoc(statusDoc, update);
}

// Helper to fetch all qualified statuses for a form
export async function getQualifiedStatusesForForm(formId: string) {
  try {
    const statusCollection = collection(db, STATUS_COLLECTION);
    const q = query(
      statusCollection,
      where("formId", "==", formId),
      where("isQualified", "==", true),
    );
    const docsSnap = await getDocs(q);
    return docsSnap.docs.map((d) => d.data() as InternalApplicationStatus);
  } catch (error) {
    console.error("Failed to fetch qualified statuses:", error);
    throw error;
  }
}

export async function getQualifiedStatusesForFormRoles(
  formId: string,
  roles: ApplicantRole[],
) {
  if (roles.length === 0) return [];
  try {
    const statusCollection = collection(db, STATUS_COLLECTION);
    const q = query(
      statusCollection,
      where("formId", "==", formId),
      where("isQualified", "==", true),
      where("role", "in", roles),
    );
    const docsSnap = await getDocs(q);
    return docsSnap.docs.map((d) => d.data() as InternalApplicationStatus);
  } catch (error) {
    console.error("Failed to fetch qualified statuses:", error);
    throw error;
  }
}
