import { GoogleAuth } from "npm:google-auth-library@9.15.1";

const databaseUrl = (Deno.env.get("FIREBASE_DATABASE_URL") || "https://amicale-tourlaville-default-rtdb.europe-west1.firebasedatabase.app")
  .replace(/\/$/, "");
const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const firebaseScopes = [
  "https://www.googleapis.com/auth/firebase.database",
  "https://www.googleapis.com/auth/userinfo.email",
];

let googleAuth: GoogleAuth | undefined;

const getAccessToken = async (): Promise<string> => {
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
  }

  googleAuth ??= new GoogleAuth({
    credentials: JSON.parse(serviceAccountJson),
    scopes: firebaseScopes,
  });

  const client = await googleAuth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;
  if (!accessToken) {
    throw new Error("Could not obtain a Firebase access token");
  }
  return accessToken;
};

const validateKey = (key: string): void => {
  if (!key || /[.#$\[\]\/]/.test(key)) {
    throw new Error(`Invalid Firebase database key: ${key}`);
  }
};

const request = async (path: string, method: string, value?: unknown): Promise<any> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`${databaseUrl}/${path}.json`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(value === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || `Firebase Realtime Database request failed (${response.status})`);
  }
  return result;
};

export const set = async (key: string, value: any): Promise<void> => {
  validateKey(key);
  await request(`kv/${encodeURIComponent(key)}`, "PUT", value);
};

export const get = async (key: string): Promise<any> => {
  validateKey(key);
  return await request(`kv/${encodeURIComponent(key)}`, "GET");
};

export const del = async (key: string): Promise<void> => {
  validateKey(key);
  await request(`kv/${encodeURIComponent(key)}`, "DELETE");
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  if (keys.length !== values.length) {
    throw new Error("The number of keys and values must match");
  }
  const updates: Record<string, any> = {};
  keys.forEach((key, index) => {
    validateKey(key);
    updates[encodeURIComponent(key)] = values[index];
  });
  if (keys.length) await request("kv", "PATCH", updates);
};

export const mget = async (keys: string[]): Promise<any[]> => {
  return await Promise.all(keys.map((key) => get(key)));
};

export const mdel = async (keys: string[]): Promise<void> => {
  const updates: Record<string, null> = {};
  keys.forEach((key) => {
    validateKey(key);
    updates[encodeURIComponent(key)] = null;
  });
  if (keys.length) await request("kv", "PATCH", updates);
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const values = await request("kv", "GET") || {};
  return Object.entries(values)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, value]) => ({ key, value }));
};