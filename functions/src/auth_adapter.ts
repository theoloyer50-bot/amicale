import { getAuth, UserRecord } from "firebase-admin/auth";

interface AuthError {
  message: string;
}

const auth = () => getAuth();
const apiKey = () => process.env.FIREBASE_WEB_API_KEY;

const toCompatUser = (user: UserRecord) => {
  const nameParts = (user.displayName || "").trim().split(/\s+/);
  return {
    id: user.uid,
    uid: user.uid,
    email: user.email || "",
    user_metadata: {
      name: user.displayName || user.email || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" "),
    },
    app_metadata: {},
  };
};

const asAuthError = (error: unknown): AuthError => ({
  message: error instanceof Error ? error.message : "Erreur d'authentification",
});

async function signInWithPassword({ email, password }: { email: string; password: string }) {
  const key = apiKey();
  if (!key) {
    return { data: { user: null, session: null }, error: { message: "FIREBASE_WEB_API_KEY non configurée" } };
  }

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const result = await response.json();
    if (!response.ok) {
      const message = result?.error?.message || "Identifiants incorrects";
      return { data: { user: null, session: null }, error: { message } };
    }

    const user = await auth().getUser(result.localId);
    return {
      data: {
        user: toCompatUser(user),
        session: { access_token: result.idToken, refresh_token: result.refreshToken },
      },
      error: null,
    };
  } catch (error) {
    return { data: { user: null, session: null }, error: asAuthError(error) };
  }
}

async function resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
  const key = apiKey();
  if (!key) return { error: { message: "FIREBASE_WEB_API_KEY non configurée" } };

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
        continueUrl: options?.redirectTo,
      }),
    });
    const result = await response.json();
    return response.ok ? { error: null } : { error: { message: result?.error?.message || "Échec de l'envoi de l'e-mail" } };
  } catch (error) {
    return { error: asAuthError(error) };
  }
}

async function refreshSession(refreshToken: string) {
  const key = apiKey();
  if (!key) return { error: { message: "FIREBASE_WEB_API_KEY non configurée" } };

  try {
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { error: { message: result?.error?.message || "Session Firebase expirée" } };
    }
    return {
      data: { access_token: result.id_token, refresh_token: result.refresh_token },
      error: null,
    };
  } catch (error) {
    return { error: asAuthError(error) };
  }
}

export const firebaseAuth = {
  getUser: async (idToken: string) => {
    try {
      const decoded = await auth().verifyIdToken(idToken);
      const user = await auth().getUser(decoded.uid);
      return { data: { user: toCompatUser(user) }, error: null };
    } catch (error) {
      return { data: { user: null }, error: asAuthError(error) };
    }
  },
  signInWithPassword,
  resetPasswordForEmail,
  refreshSession,
  admin: {
    createUser: async (input: any) => {
      try {
        const user = await auth().createUser({
          email: input.email,
          password: input.password,
          emailVerified: Boolean(input.email_confirm),
          displayName: input.user_metadata?.name,
        });
        return { data: { user: toCompatUser(user) }, error: null };
      } catch (error) {
        return { data: { user: null }, error: asAuthError(error) };
      }
    },
    getUserById: async (uid: string) => {
      try {
        const user = await auth().getUser(uid);
        return { data: { user: { user: toCompatUser(user) } }, error: null };
      } catch (error) {
        return { data: { user: null }, error: asAuthError(error) };
      }
    },
    listUsers: async () => {
      try {
        const result = await auth().listUsers(1000);
        return { data: { users: result.users.map(toCompatUser) }, error: null };
      } catch (error) {
        return { data: { users: [] }, error: asAuthError(error) };
      }
    },
    updateUserById: async (uid: string, properties: any) => {
      try {
        const user = await auth().updateUser(uid, {
          ...(properties.password ? { password: properties.password } : {}),
          ...(properties.user_metadata?.name ? { displayName: properties.user_metadata.name } : {}),
        });
        return { data: { user: toCompatUser(user) }, error: null };
      } catch (error) {
        return { data: { user: null }, error: asAuthError(error) };
      }
    },
    deleteUser: async (uid: string) => {
      try {
        await auth().deleteUser(uid);
        return { error: null };
      } catch (error) {
        return { error: asAuthError(error) };
      }
    },
    signOut: async (uid: string) => {
      try {
        await auth().revokeRefreshTokens(uid);
        return { error: null };
      } catch (error) {
        return { error: asAuthError(error) };
      }
    },
  },
};
