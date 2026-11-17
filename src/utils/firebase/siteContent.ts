import { serverApiBase } from './info';

export type SiteContentKey = 'homepage' | 'hero' | 'jsp' | 'public' | 'documents';

export async function getSiteContent<T>(key: SiteContentKey, accessToken?: string): Promise<T | null> {
  const response = await fetch(`${serverApiBase}/site-content/${key}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Impossible de charger le contenu (${response.status})`);
  }

  const result = await response.json();
  return result.content as T | null;
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
  const response = await fetch(`${serverApiBase}/site-content/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Impossible d'enregistrer le contenu (${response.status})`);
  }
}
