import { deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { createIsolatedFirebaseApp, firebaseAuth, firebaseDatabase } from './client';
import {
  countMemberFunctions,
  isMemberFunction,
  MemberFunction,
} from './memberFunctions';

export type AccountRole = 'membre' | 'superviseur' | 'admin';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface MemberAccount {
  userId: string;
  email: string;
  name: string;
  status: AccountStatus;
  role: AccountRole;
  fonction?: MemberFunction;
  isAdmin: boolean;
  createdAt: string;
}

const accountPath = (uid: string) => `kv/memberAccounts/${uid}`;

export async function listMemberAccounts(): Promise<MemberAccount[]> {
  const snapshot = await get(ref(firebaseDatabase, 'kv/memberAccounts'));
  const values = snapshot.val() || {};
  return Object.entries(values)
    .filter(([, value]) => value && typeof value === 'object')
    .map(([userId, rawValue]) => {
      const value = rawValue as Record<string, unknown>;
      const role = (value.role || 'membre') as AccountRole;
      return {
        userId,
        email: String(value.email || ''),
        name: String(value.name || value.email || 'Utilisateur'),
        status: (value.status || 'pending') as AccountStatus,
        role,
        fonction: isMemberFunction(value.fonction) ? value.fonction : undefined,
        isAdmin: role === 'admin',
        createdAt: String(value.createdAt || ''),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function createMemberAccount(input: {
  email: string;
  password: string;
  name: string;
  role: AccountRole;
  fonction: MemberFunction;
  requirePasswordChange: boolean;
}): Promise<void> {
  const secondaryApp = createIsolatedFirebaseApp(`account-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, input.email.trim(), input.password);
    await updateProfile(credential.user, { displayName: input.name.trim() });

    const uid = credential.user.uid;
    const now = new Date().toISOString();
    const account = {
        userId: uid,
        status: 'approved',
        email: input.email.trim(),
        name: input.name.trim(),
        role: input.role,
        fonction: input.fonction,
        isAdmin: input.role === 'admin',
        createdAt: now,
        approvedAt: now,
        mustChangePassword: input.requirePasswordChange,
      };
    const updates: Record<string, unknown> = {
      [accountPath(uid)]: account,
      [`kv/memberDirectory/${uid}`]: {
        userId: uid,
        email: input.email.trim(),
        name: input.name.trim(),
        role: input.role,
        fonction: input.fonction,
        status: 'approved',
      },
    };
    await update(ref(firebaseDatabase), updates);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/email-already-in-use') throw new Error('Un compte existe déjà avec cette adresse e-mail.');
    if (code === 'auth/weak-password') throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    throw error;
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

export async function updateMemberStatus(uid: string, status: AccountStatus): Promise<void> {
  const snapshot = await get(ref(firebaseDatabase, accountPath(uid)));
  if (!snapshot.exists()) throw new Error('Utilisateur introuvable.');
  const current = snapshot.val() as MemberAccount;
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    [accountPath(uid)]: {
    ...current,
    status,
    ...(status === 'approved' ? { approvedAt: now } : {}),
    ...(status === 'rejected' ? { deactivatedAt: now } : {}),
    },
  };
  if (status === 'approved') {
    updates[`kv/memberDirectory/${uid}`] = {
      userId: uid,
      email: current.email,
      name: current.name,
      role: current.role,
      status,
      ...(current.fonction ? { fonction: current.fonction } : {}),
    };
  } else {
    updates[`kv/memberDirectory/${uid}`] = null;
  }
  await update(ref(firebaseDatabase), updates);
}

export async function updateMemberRole(uid: string, role: AccountRole): Promise<void> {
  const snapshot = await get(ref(firebaseDatabase, accountPath(uid)));
  if (!snapshot.exists()) throw new Error('Utilisateur introuvable.');
  const current = snapshot.val() as MemberAccount;
  const updates: Record<string, unknown> = {
    [accountPath(uid)]: {
    ...current,
    role,
    isAdmin: role === 'admin',
    },
  };
  if (current.status === 'approved') {
    updates[`kv/memberDirectory/${uid}`] = {
      userId: uid,
      email: current.email,
      name: current.name,
      role,
      status: current.status,
      ...(current.fonction ? { fonction: current.fonction } : {}),
    };
  }
  await update(ref(firebaseDatabase), updates);
}

export async function updateMemberFunction(uid: string, fonction: MemberFunction | null): Promise<void> {
  const snapshot = await get(ref(firebaseDatabase, accountPath(uid)));
  if (!snapshot.exists()) throw new Error('Utilisateur introuvable.');

  const current = snapshot.val() as MemberAccount;
  const updatedAccount = { ...current };
  if (fonction) {
    updatedAccount.fonction = fonction;
  } else {
    delete updatedAccount.fonction;
  }

  const updates: Record<string, unknown> = {
    [accountPath(uid)]: updatedAccount,
  };
  if (current.status === 'approved') {
    updates[`kv/memberDirectory/${uid}`] = {
      userId: uid,
      email: current.email,
      name: current.name,
      role: current.role,
      status: current.status,
      ...(fonction ? { fonction } : {}),
    };
  }
  await update(ref(firebaseDatabase), updates);
}

export async function publishMemberFunctionCounts(accounts: MemberAccount[]): Promise<void> {
  await set(
    ref(firebaseDatabase, 'kv/memberFunctionCounts'),
    countMemberFunctions(accounts)
  );
}

export async function sendMemberPasswordReset(email: string): Promise<void> {
  if (!email) throw new Error('Adresse e-mail introuvable pour ce compte.');
  await sendPasswordResetEmail(firebaseAuth, email);
}

export async function blockMemberAccount(uid: string): Promise<void> {
  await updateMemberStatus(uid, 'rejected');
}
