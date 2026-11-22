import type {
  CollectionReference,
  DocumentData,
  Query,
} from "firebase-admin/firestore";

import { db } from "..";

const IN_QUERY_LIMIT = 30;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function getDocsById<T extends DocumentData>(
  collection: CollectionReference<T>,
  ids: Iterable<string>,
): Promise<Map<string, T>> {
  const unique = [...new Set(ids)].filter((id) => id.length > 0);
  const result = new Map<string, T>();
  if (unique.length === 0) return result;

  const snaps = await db.getAll(...unique.map((id) => collection.doc(id)));
  for (const snap of snaps) {
    const data = snap.data() as T | undefined;
    if (data !== undefined) result.set(snap.id, data);
  }
  return result;
}

export async function queryWhereIn<T extends DocumentData>(
  query: Query<T>,
  field: string,
  values: Iterable<string>,
): Promise<T[]> {
  const unique = [...new Set(values)];
  if (unique.length === 0) return [];

  const snaps = await Promise.all(
    chunk(unique, IN_QUERY_LIMIT).map((c) => query.where(field, "in", c).get()),
  );

  return snaps
    .flatMap((snap) => snap.docs)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((doc) => doc.data());
}

export function groupBy<T>(items: T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}
