import { get, ref, set } from 'firebase/database';
import { firebaseDatabase } from './client';
import { MEMBER_FUNCTION_COUNTS_PATH } from './memberFunctions';

export type SiteContentKey = 'homepage' | 'hero' | 'jsp' | 'public' | 'documents';

export async function getSiteContent<T>(key: SiteContentKey, accessToken?: string): Promise<T | null> {
  void accessToken;
  const snapshot = await get(ref(firebaseDatabase, `kv/site_content:${key}`));
  return snapshot.exists() ? snapshot.val() as T : null;
}

export async function getOrMigrateSiteContent<T>(
  key: SiteContentKey,
  legacyStorageKey: string,
  accessToken: string,
): Promise<T | null> {
  const saved = await getSiteContent<T>(key, accessToken);
  if (saved !== null) return saved;

  const legacyValue = localStorage.getItem(legacyStorageKey);
  if (!legacyValue) return null;

  try {
    const legacyContent = JSON.parse(legacyValue) as T;
    await saveSiteContent(key, legacyContent, accessToken);
    return legacyContent;
  } catch (error) {
    console.error(`Unable to migrate legacy ${legacyStorageKey} content:`, error);
    return null;
  }
}

export async function saveSiteContent<T>(
  key: SiteContentKey,
  content: T,
  accessToken: string,
): Promise<void> {
  void accessToken;
  if (key === 'public' && content !== null && typeof content === 'object' && !Array.isArray(content)) {
    const publicContent: Record<string, unknown> = Object.assign({}, content);
    delete publicContent.memberFunctionCounts;

    const countsSnapshot = await get(ref(firebaseDatabase, MEMBER_FUNCTION_COUNTS_PATH));
    if (countsSnapshot.exists()) {
      publicContent.memberFunctionCounts = countsSnapshot.val();
    }

    await set(ref(firebaseDatabase, `kv/site_content:${key}`), publicContent);
    return;
  }

  await set(ref(firebaseDatabase, `kv/site_content:${key}`), content);
}
