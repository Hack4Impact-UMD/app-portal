import type {
  DocumentData,
  Query,
  Transaction,
  WriteBatch,
} from "firebase-admin/firestore";

import { db } from "..";

export function runTransaction<T>(fn: (tx: Transaction) => Promise<T>) {
  return db.runTransaction(fn);
}

const BATCH_SIZE = 250;

export async function commitInChunks<T>(
  items: T[],
  apply: (batch: WriteBatch, item: T) => void,
) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const item of items.slice(i, i + BATCH_SIZE)) apply(batch, item);
    await batch.commit();
  }
}

export async function listDocs<T extends DocumentData>(query: Query<T>) {
  return (await query.get()).docs.map((d) => d.data());
}
