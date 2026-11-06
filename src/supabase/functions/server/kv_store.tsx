import { getDatabase } from "firebase-admin/database";

const validateKey = (key: string): void => {
  if (!key || /[.#$\[\]\/]/.test(key)) {
    throw new Error(`Invalid Firebase database key: ${key}`);
  }
};

export const set = async (key: string, value: any): Promise<void> => {
  validateKey(key);
  await getDatabase().ref(`kv/${key}`).set(value);
};

export const get = async (key: string): Promise<any> => {
  validateKey(key);
  const snapshot = await getDatabase().ref(`kv/${key}`).get();
  return snapshot.exists() ? snapshot.val() : undefined;
};

export const del = async (key: string): Promise<void> => {
  validateKey(key);
  await getDatabase().ref(`kv/${key}`).remove();
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  if (keys.length !== values.length) {
    throw new Error("The number of keys and values must match");
  }
  const updates: Record<string, any> = {};
  keys.forEach((key, index) => {
    validateKey(key);
    updates[key] = values[index];
  });
  if (keys.length) await getDatabase().ref("kv").update(updates);
};

export const mget = async (keys: string[]): Promise<any[]> => {
  return await Promise.all(keys.map((key) => get(key)));
};

export const mdel = async (keys: string[]): Promise<void> => {
  const updates: Record<string, null> = {};
  keys.forEach((key) => {
    validateKey(key);
    updates[key] = null;
  });
  if (keys.length) await getDatabase().ref("kv").update(updates);
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const snapshot = await getDatabase().ref("kv").get();
  const values = snapshot.val() || {};
  return Object.entries(values)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, value]) => ({ key, value }));
};