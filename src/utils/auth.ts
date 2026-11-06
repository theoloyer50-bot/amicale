import { projectId, publicAnonKey } from './supabase/info.tsx';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b`;

// Health check to verify server is accessible
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  role?: 'membre' | 'superviseur' | 'admin';
  mustChangePassword?: boolean;
  userStatus?: {
    status: 'approved' | 'pending' | 'rejected';
    createdAt?: string;
  };
}

interface AuthResponse {
  user: User;
  access_token: string;
}

interface SignupResponse {
  message: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      let errorMessage = 'Erreur de connexion';
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // If response is not JSON
        console.error('Server error (non-JSON):', text);
        errorMessage = 'Erreur serveur. Veuillez vérifier que la fonction Edge Supabase est déployée.';
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        isAdmin: data.user.isAdmin || data.user.role === 'admin',
        role: data.user.role,
        mustChangePassword: data.user.mustChangePassword
      },
      access_token: data.access_token
    };
  } catch (error) {
    console.error('Login exception:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur. Veuillez vérifier que la fonction Edge Supabase est déployée.');
    }
    throw error;
  }
}

export async function signup(email: string, password: string, name: string): Promise<SignupResponse> {
  try {
    console.log('Signup request to:', `${API_BASE}/signup`);
    console.log('With data:', { email, name });
    
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name })
    });

    console.log('Signup response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('Signup error:', error);
      throw new Error(error.error || 'Erreur d\'inscription');
    }

    const data = await response.json();
    console.log('Signup success:', data);
    return {
      message: data.message
    };
  } catch (error) {
    console.error('Signup exception:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur. Veuillez vérifier que la fonction Edge Supabase est déployée.');
    }
    throw error;
  }
}

export async function getSession(accessToken: string): Promise<User> {
  try {
    const response = await fetch(`${API_BASE}/session`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Session invalide';
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        errorMessage = error.error || errorMessage;
      } catch (e) {
        console.error('Session error (non-JSON):', text);
        errorMessage = 'Erreur serveur lors de la vérification de session.';
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      isAdmin: data.user.isAdmin || data.user.role === 'admin',
      role: data.user.role,
      mustChangePassword: data.user.mustChangePassword,
      userStatus: data.userStatus
    };
  } catch (error) {
    console.error('getSession exception:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur.');
    }
    throw error;
  }
}

export function saveAuth(user: User, accessToken: string): void {
  localStorage.setItem('auth', JSON.stringify({ user, accessToken }));
}

export function getStoredAuth(): { user: User; accessToken: string } | null {
  const stored = localStorage.getItem('auth');
  if (!stored) return null;
  return JSON.parse(stored);
}

export function clearAuth(): void {
  localStorage.removeItem('auth');
}

export async function resetPassword(email: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      let errorMessage = 'Erreur lors de la réinitialisation du mot de passe';
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        errorMessage = error.error || errorMessage;
      } catch (e) {
        console.error('Reset password error (non-JSON):', text);
        errorMessage = 'Erreur serveur. Veuillez vérifier que la fonction Edge Supabase est déployée.';
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      message: data.message
    };
  } catch (error) {
    console.error('resetPassword exception:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur. Veuillez vérifier que la fonction Edge Supabase est déployée.');
    }
    throw error;
  }
}

export async function changePassword(accessToken: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      let errorMessage = 'Erreur lors du changement de mot de passe';
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        errorMessage = error.error || errorMessage;
      } catch (e) {
        console.error('Change password error (non-JSON):', text);
        errorMessage = 'Erreur serveur. Veuillez vérifier que la fonction Edge Supabase est déployée.';
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      message: data.message
    };
  } catch (error) {
    console.error('changePassword exception:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur. Veuillez vérifier que la fonction Edge Supabase est déployée.');
    }
    throw error;
  }
}