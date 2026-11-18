import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { firebaseAuth, firebaseDatabase } from './firebase/client';
import { isMemberFunction, MemberFunction } from './firebase/memberFunctions';

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  role?: 'membre' | 'superviseur' | 'admin';
  fonction?: MemberFunction;
  mustChangePassword?: boolean;
  userStatus?: {
    status: 'approved' | 'pending' | 'rejected';
    createdAt?: string;
    role?: 'membre' | 'superviseur' | 'admin';
    fonction?: MemberFunction;
  };
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

interface SignupResponse {
  message: string;
}

const readProfile = async (firebaseUser: FirebaseUser) => {
  const uid = firebaseUser.uid;
    const statusSnapshot = await get(ref(firebaseDatabase, `kv/memberAccounts/${uid}`));
  const userStatus = statusSnapshot.val() || null;
    const role = userStatus?.role || 'membre';
    const isApproved = userStatus?.status === 'approved';

  return {
    userStatus,
    role,
    isApproved,
    isRejected: userStatus?.status === 'rejected',
      mustChangePassword: userStatus?.mustChangePassword === true,
  };
};

const toAppUser = (firebaseUser: FirebaseUser, profile: Awaited<ReturnType<typeof readProfile>>): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  name: profile.userStatus?.name || firebaseUser.displayName || firebaseUser.email || '',
  isAdmin: profile.role === 'admin',
  role: profile.role,
  fonction: isMemberFunction(profile.userStatus?.fonction) ? profile.userStatus.fonction : undefined,
  mustChangePassword: profile.mustChangePassword,
  userStatus: profile.userStatus || { status: profile.isApproved ? 'approved' : 'pending', role: profile.role },
});

function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'La connexion par e-mail/mot de passe est désactivée dans Firebase Authentication.';
  }
  if (code === 'auth/too-many-requests') return 'Trop de tentatives. Réessaie plus tard.';
  if (code === 'auth/network-request-failed') return 'Connexion impossible. Vérifie ta connexion Internet.';
  return error instanceof Error ? error.message : 'Erreur d’authentification.';
}

// Authentification et stockage utilisent directement Firebase : aucune Cloud Function requise.
export async function checkServerHealth(): Promise<boolean> {
  return true;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const profile = await readProfile(credential.user);
    if (profile.isRejected) {
      await signOut(firebaseAuth);
      throw new Error('Ce compte a été désactivé. Contacte un administrateur.');
    }
    if (!profile.isApproved) {
      await signOut(firebaseAuth);
      throw new Error('Ton compte est en attente d’approbation par un administrateur.');
    }
    return {
      user: toAppUser(credential.user, profile),
      access_token: await credential.user.getIdToken(),
      refresh_token: credential.user.refreshToken,
    };
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function signup(email: string, password: string, name: string, fonction: MemberFunction): Promise<SignupResponse> {
  if (!isMemberFunction(fonction)) throw new Error('Veuillez choisir une fonction valide.');
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  try {
    await updateProfile(credential.user, { displayName: name.trim() });
    await set(ref(firebaseDatabase, `kv/memberAccounts/${credential.user.uid}`), {
      userId: credential.user.uid,
      status: 'pending',
      email: email.trim(),
      name: name.trim(),
      role: 'membre',
      fonction,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    });
    await signOut(firebaseAuth);
    return { message: 'Compte créé. Il sera accessible après validation par un administrateur.' };
  } catch (error) {
    await signOut(firebaseAuth).catch(() => undefined);
    throw new Error(authErrorMessage(error));
  }
}

export async function getSession(_accessToken?: string): Promise<User> {
  await firebaseAuth.authStateReady();
  const firebaseUser = firebaseAuth.currentUser;
  if (!firebaseUser) throw new Error('Session expirée. Veuillez vous reconnecter.');
  const profile = await readProfile(firebaseUser);
  if (profile.isRejected || !profile.isApproved) throw new Error('Ce compte n’est pas approuvé.');
  return toAppUser(firebaseUser, profile);
}

export function saveAuth(user: User, accessToken: string, refreshToken = ''): void {
  localStorage.setItem('auth', JSON.stringify({ user, accessToken, refreshToken }));
}

export function getStoredAuth(): { user: User; accessToken: string; refreshToken: string } | null {
  try {
    const stored = localStorage.getItem('auth');
    if (!stored) return null;
    const authData = JSON.parse(stored);
    return authData?.user ? authData : null;
  } catch {
    localStorage.removeItem('auth');
    return null;
  }
}

export async function restoreSession(_stored?: { user: User; accessToken: string; refreshToken: string }) {
  await firebaseAuth.authStateReady();
  const firebaseUser = firebaseAuth.currentUser;
  if (!firebaseUser) throw new Error('Session expirée. Veuillez vous reconnecter.');
  const user = await getSession();
  return {
    user,
    accessToken: await firebaseUser.getIdToken(),
    refreshToken: firebaseUser.refreshToken,
  };
}

export function clearAuth(): void {
  localStorage.removeItem('auth');
  void signOut(firebaseAuth);
}

export async function resetPassword(email: string): Promise<{ message: string }> {
  try {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
    return { message: 'Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé.' };
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function changePassword(_accessToken: string, _currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const user = firebaseAuth.currentUser;
  if (!user?.email) throw new Error('Session expirée. Veuillez vous reconnecter.');
  try {
    const credential = EmailAuthProvider.credential(user.email, _currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    const now = new Date().toISOString();
    await update(ref(firebaseDatabase, `kv/memberAccounts/${user.uid}`), {
      mustChangePassword: false,
      passwordChangedAt: now,
    });
    return { message: 'Mot de passe modifié avec succès.' };
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}
