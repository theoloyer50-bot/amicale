import { get, push, ref, set, update } from 'firebase/database';
import { firebaseAuth, firebaseDatabase } from './client';
import { AccountRole, AccountStatus, MemberAccount } from './accounts';

export type EventKey = 'sainte-barbe' | 'noel';
export interface RegistrationStatus { isOpen: boolean; closedMessage: string }
export interface ChildRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  age: number;
  parentUserId?: string;
  parentName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}
export interface NoelRegistration {
  userId: string;
  email: string;
  name: string;
  numberOfAdults: number;
  numberOfChildren: number;
  comments: string;
  registeredAt: string;
}
export interface SainteBarbeReservation {
  userId: string;
  name: string;
  numberOfGuests: number;
  tableNumber?: number;
  slotNumber?: number;
  addedManually?: boolean;
  addedBy?: string;
  addedAt?: string;
}
export interface SainteBarbeTable {
  tableNumber: number;
  participants: SainteBarbeReservation[];
  totalSeats: number;
}

const currentUid = () => {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('Session expirée. Veuillez vous reconnecter.');
  return uid;
};
const rolePath = (uid: string) => `kv/memberAccounts/${uid}/role`;
const statusPath = (uid: string) => `kv/memberAccounts/${uid}/status`;
const accountIsModerator = async () => {
  const uid = currentUid();
  const snapshot = await get(ref(firebaseDatabase, rolePath(uid)));
  return ['admin', 'superviseur'].includes(snapshot.val());
};
const accountIsAdmin = async () => {
  const snapshot = await get(ref(firebaseDatabase, rolePath(currentUid())));
  if (snapshot.val() !== 'admin') throw new Error('Accès administrateur requis.');
};
const calculateAge = (birthDate: string): number => {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > new Date()) throw new Error('Date de naissance invalide.');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
};
const keyForEvent = (event: EventKey) => event === 'noel' ? 'noel' : 'sainte-barbe';

export async function getEventRegistrationStatus(event: EventKey): Promise<RegistrationStatus> {
  const snapshot = await get(ref(firebaseDatabase, `kv/eventSettings/${keyForEvent(event)}`));
  return snapshot.val() || { isOpen: true, closedMessage: '' };
}

export async function saveEventRegistrationStatus(event: EventKey, status: RegistrationStatus): Promise<void> {
  await accountIsAdmin();
  await set(ref(firebaseDatabase, `kv/eventSettings/${keyForEvent(event)}`), {
    isOpen: Boolean(status.isOpen),
    closedMessage: status.closedMessage || '',
  });
}

export async function getApprovedMembers(): Promise<MemberAccount[]> {
  const snapshot = await get(ref(firebaseDatabase, 'kv/memberDirectory'));
  const values = snapshot.val() || {};
  return Object.entries(values)
    .map(([userId, value]) => ({ userId, ...(value as Omit<MemberAccount, 'userId'>) }))
    .filter((account) => account.status === 'approved')
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function getMyChildren(): Promise<ChildRecord[]> {
  const uid = currentUid();
  const snapshot = await get(ref(firebaseDatabase, `kv/children/${uid}`));
  const values = snapshot.val() || {};
  return Object.values(values) as ChildRecord[];
}

export async function saveMyChild(input: Pick<ChildRecord, 'nom' | 'prenom' | 'dateNaissance' | 'parentUserId'>, childId?: string): Promise<void> {
  const uid = currentUid();
  const accountSnapshot = await get(ref(firebaseDatabase, `kv/memberAccounts/${uid}`));
  const account = accountSnapshot.val() as MemberAccount | null;
  if (account?.status !== 'approved') throw new Error('Compte non approuvé.');
  const now = new Date().toISOString();
  const existingSnapshot = childId ? await get(ref(firebaseDatabase, `kv/children/${uid}/${childId}`)) : null;
  const existing = existingSnapshot?.val() as ChildRecord | null;
  const id = childId || push(ref(firebaseDatabase, `kv/children/${uid}`)).key!;
  const child: ChildRecord = {
    id,
    userId: uid,
    userName: account.name,
    userEmail: account.email,
    nom: input.nom.trim(),
    prenom: input.prenom.trim(),
    dateNaissance: input.dateNaissance,
    age: calculateAge(input.dateNaissance),
    ...(input.parentUserId ? { parentUserId: input.parentUserId } : {}),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  if (!child.nom || !child.prenom) throw new Error('Nom et prénom obligatoires.');
  if (input.parentUserId) {
    const parentSnapshot = await get(ref(firebaseDatabase, `kv/memberAccounts/${input.parentUserId}`));
    const parent = parentSnapshot.val() as MemberAccount | null;
    if (parent?.status !== 'approved') throw new Error('Le parent choisi n’est pas un membre approuvé.');
    child.parentName = parent.name;
  }
  await set(ref(firebaseDatabase, `kv/children/${uid}/${id}`), child);
}

export async function deleteMyChild(childId: string): Promise<void> {
  await set(ref(firebaseDatabase, `kv/children/${currentUid()}/${childId}`), null);
}

export async function listChildrenForModerators(): Promise<ChildRecord[]> {
  if (!(await accountIsModerator())) throw new Error('Accès superviseur ou administrateur requis.');
  const snapshot = await get(ref(firebaseDatabase, 'kv/children'));
  const groups = snapshot.val() || {};
  return Object.values(groups).flatMap((children: any) => Object.values(children || {})) as ChildRecord[];
}

export async function createChildForMember(userId: string, input: Pick<ChildRecord, 'nom' | 'prenom' | 'dateNaissance'>): Promise<void> {
  await accountIsAdmin();
  const targetSnapshot = await get(ref(firebaseDatabase, `kv/memberAccounts/${userId}`));
  const target = targetSnapshot.val() as MemberAccount | null;
  if (!target || target.status !== 'approved') throw new Error('Membre introuvable ou non approuvé.');
  const id = push(ref(firebaseDatabase, `kv/children/${userId}`)).key!;
  const now = new Date().toISOString();
  const child: ChildRecord = {
    id, userId, userName: target.name, userEmail: target.email,
    nom: input.nom.trim(), prenom: input.prenom.trim(), dateNaissance: input.dateNaissance,
    age: calculateAge(input.dateNaissance), createdAt: now, updatedAt: now, createdBy: 'admin',
  };
  if (!child.nom || !child.prenom) throw new Error('Nom et prénom obligatoires.');
  await set(ref(firebaseDatabase, `kv/children/${userId}/${id}`), child);
}

export async function deleteChildForMember(userId: string, childId: string): Promise<void> {
  await accountIsAdmin();
  await set(ref(firebaseDatabase, `kv/children/${userId}/${childId}`), null);
}

export async function getNoelRegistration(uid = currentUid()): Promise<NoelRegistration | null> {
  const snapshot = await get(ref(firebaseDatabase, `kv/noelRegistrations/${uid}`));
  return snapshot.val();
}

export async function saveNoelRegistration(input: Pick<NoelRegistration, 'numberOfAdults' | 'numberOfChildren' | 'comments'>): Promise<void> {
  const uid = currentUid();
  const profileSnapshot = await get(ref(firebaseDatabase, `kv/memberAccounts/${uid}`));
  const profile = profileSnapshot.val() as MemberAccount | null;
  if (profile?.status !== 'approved') throw new Error('Compte non approuvé.');
  if (!Number.isInteger(input.numberOfAdults) || input.numberOfAdults < 1 || input.numberOfAdults > 20 || !Number.isInteger(input.numberOfChildren) || input.numberOfChildren < 0 || input.numberOfChildren > 20) {
    throw new Error('Nombre d’adultes ou d’enfants invalide.');
  }
  const status = await getEventRegistrationStatus('noel');
  if (!status.isOpen) throw new Error(status.closedMessage || 'Les inscriptions sont fermées.');
  await set(ref(firebaseDatabase, `kv/noelRegistrations/${uid}`), {
    userId: uid, email: profile.email, name: profile.name,
    numberOfAdults: input.numberOfAdults,
    numberOfChildren: input.numberOfChildren,
    comments: (input.comments || '').slice(0, 1000),
    registeredAt: new Date().toISOString(),
  } satisfies NoelRegistration);
}

export async function listNoelRegistrations(): Promise<{ registrations: NoelRegistration[]; stats: { totalRegistrations: number; totalAdults: number; totalChildren: number; totalParticipants: number } }> {
  if (!(await accountIsModerator())) throw new Error('Accès superviseur ou administrateur requis.');
  const snapshot = await get(ref(firebaseDatabase, 'kv/noelRegistrations'));
  const registrations = Object.values(snapshot.val() || {}) as NoelRegistration[];
  const totalAdults = registrations.reduce((sum, item) => sum + (item.numberOfAdults || 0), 0);
  const totalChildren = registrations.reduce((sum, item) => sum + (item.numberOfChildren || 0), 0);
  return { registrations, stats: { totalRegistrations: registrations.length, totalAdults, totalChildren, totalParticipants: totalAdults + totalChildren } };
}

const tablePath = (tableNumber: number) => `kv/sainteBarbeTables/${tableNumber}`;
export async function listSainteBarbeTables(): Promise<SainteBarbeTable[]> {
  const countSnapshot = await get(ref(firebaseDatabase, 'kv/sainteBarbeTableCount'));
  const count = Math.min(15, Math.max(1, Number(countSnapshot.val() || 10)));
  const snapshots = await Promise.all(Array.from({ length: count }, (_, index) => get(ref(firebaseDatabase, tablePath(index + 1)))));
  return snapshots.map((snapshot, index) => {
    const raw = snapshot.val() || {};
    const participants = Object.values(raw.slots || {}) as SainteBarbeReservation[];
    return { tableNumber: index + 1, participants, totalSeats: participants.reduce((sum, person) => sum + Number(person.numberOfGuests || 0), 0) };
  });
}

export async function getMySainteBarbeRegistration(uid = currentUid()): Promise<SainteBarbeReservation | null> {
  const indexSnapshot = await get(ref(firebaseDatabase, `kv/sainteBarbeUserIndex/${uid}`));
  const index = indexSnapshot.val() as { tableKey: string; slotKey: string } | null;
  if (!index) return null;
  const reservationSnapshot = await get(ref(firebaseDatabase, `${tablePath(Number(index.tableKey))}/slots/${index.slotKey}`));
  return reservationSnapshot.exists()
    ? { ...reservationSnapshot.val(), tableNumber: Number(index.tableKey), slotNumber: Number(index.slotKey) }
    : null;
}

export async function saveSainteBarbeRegistration(tableNumber: number, numberOfGuests: number): Promise<void> {
  const uid = currentUid();
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || ![1, 2].includes(numberOfGuests)) throw new Error('Inscription invalide.');
  const status = await getEventRegistrationStatus('sainte-barbe');
  if (!status.isOpen) throw new Error(status.closedMessage || 'Les inscriptions sont fermées.');
  const profileSnapshot = await get(ref(firebaseDatabase, `kv/memberAccounts/${uid}`));
  const profile = profileSnapshot.val() as MemberAccount | null;
  if (profile?.status !== 'approved') throw new Error('Compte non approuvé.');

  const indexRef = ref(firebaseDatabase, `kv/sainteBarbeUserIndex/${uid}`);
  const indexSnapshot = await get(indexRef);
  const oldIndex = indexSnapshot.val() as { tableKey: string; slotKey: string } | null;
  const now = new Date().toISOString();

  if (oldIndex && Number(oldIndex.tableKey) === tableNumber) {
    const reservationRef = ref(firebaseDatabase, `${tablePath(tableNumber)}/slots/${oldIndex.slotKey}`);
    const oldSnapshot = await get(reservationRef);
    if (oldSnapshot.exists()) {
      await set(reservationRef, {
        ...oldSnapshot.val(), userId: uid, name: profile.name, email: profile.email,
        numberOfGuests, tableNumber, slotNumber: Number(oldIndex.slotKey), registeredAt: now,
      });
      return;
    }
  }

  const tableSnapshot = await get(ref(firebaseDatabase, tablePath(tableNumber)));
  const slots = tableSnapshot.val()?.slots || {};
  const availableSlots = [1, 2, 3, 4, 5].filter((slot) => !slots[String(slot)]);
  if (!availableSlots.length) throw new Error('Cette table est complète. Choisissez une autre table.');

  if (oldIndex) {
    const oldReservationPath = `${tablePath(Number(oldIndex.tableKey))}/slots/${oldIndex.slotKey}`;
    const oldReservationSnapshot = await get(ref(firebaseDatabase, oldReservationPath));
    if (oldReservationSnapshot.val()?.userId === uid) await set(ref(firebaseDatabase, oldReservationPath), null);
  }

  for (const slotNumber of availableSlots) {
    const slotKey = String(slotNumber);
    await set(indexRef, { tableKey: String(tableNumber), slotKey });
    try {
      await set(ref(firebaseDatabase, `${tablePath(tableNumber)}/slots/${slotKey}`), {
        userId: uid,
        name: profile.name,
        email: profile.email,
        numberOfGuests,
        tableNumber,
        slotNumber,
        registeredAt: now,
      });
      return;
    } catch (error) {
      const currentIndex = await get(indexRef);
      if (currentIndex.val()?.tableKey !== String(tableNumber) || currentIndex.val()?.slotKey !== slotKey) throw error;
    }
  }
  throw new Error('Cette table vient d’être réservée. Choisissez une autre table.');
}

export async function addManualSainteBarbeReservation(tableNumber: number, name: string, numberOfGuests: number): Promise<void> {
  await accountIsAdmin();
  if (!name.trim() || !Number.isInteger(tableNumber) || ![1, 2].includes(numberOfGuests)) throw new Error('Participant invalide.');
  const snapshot = await get(ref(firebaseDatabase, tablePath(tableNumber)));
  const slots = snapshot.val()?.slots || {};
  const slotNumber = [1, 2, 3, 4, 5].find((slot) => !slots[String(slot)]);
  if (!slotNumber) throw new Error('Cette table est complète.');
  await set(ref(firebaseDatabase, `${tablePath(tableNumber)}/slots/${slotNumber}`), {
    userId: `manual_${slotNumber}_${Date.now()}`,
    name: name.trim(),
    numberOfGuests,
    tableNumber,
    slotNumber,
    addedManually: true,
    addedBy: currentUid(),
    addedAt: new Date().toISOString(),
  } satisfies SainteBarbeReservation);
}

export async function removeSainteBarbeReservation(tableNumber: number, participantUserId: string): Promise<void> {
  await accountIsAdmin();
  const table = (await listSainteBarbeTables()).find((item) => item.tableNumber === tableNumber);
  const reservation = table?.participants.find((item) => item.userId === participantUserId);
  if (!reservation?.slotNumber) throw new Error('Réservation introuvable.');
  const updates: Record<string, unknown> = {
    [`${tablePath(tableNumber)}/slots/${reservation.slotNumber}`]: null,
  };
  if (!participantUserId.startsWith('manual_')) updates[`kv/sainteBarbeUserIndex/${participantUserId}`] = null;
  await update(ref(firebaseDatabase), updates);
}

export async function resetEventRegistrations(event: EventKey): Promise<number> {
  await accountIsAdmin();
  const path = event === 'noel' ? 'kv/noelRegistrations' : 'kv/sainteBarbeTables';
  if (event === 'sainte-barbe') {
    const tables = await listSainteBarbeTables();
    const count = tables.reduce((sum, table) => sum + table.participants.length, 0);
    await set(ref(firebaseDatabase, path), null);
    return count;
  }
  const snapshot = await get(ref(firebaseDatabase, path));
  const count = Object.keys(snapshot.val() || {}).length;
  await set(ref(firebaseDatabase, path), null);
  return count;
}

export async function setSainteBarbeTableCount(count: number): Promise<void> {
  await accountIsAdmin();
  if (!Number.isInteger(count) || count < 1 || count > 15) throw new Error('Le nombre de tables doit être entre 1 et 15.');
  await set(ref(firebaseDatabase, 'kv/sainteBarbeTableCount'), count);
}

export type MemberAccountSummary = Pick<MemberAccount, 'userId' | 'email' | 'name' | 'role' | 'status'>;
