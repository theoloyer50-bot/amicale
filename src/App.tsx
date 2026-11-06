import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { PublicHomePage } from './components/PublicHomePage';
import { LoginModal } from './components/LoginModal';
import { MemberArea } from './components/MemberArea';
import { AdminPanel } from './components/AdminPanel';
import { AdminSetup } from './pages/AdminSetup';
import { SuperAdminSetup } from './pages/SuperAdminSetup';
import { CreateAdminPage } from './pages/CreateAdminPage';
import { InscriptionsSainteBarbeModal } from './components/InscriptionsSainteBarbeModal';
import { InscriptionsNoelModal } from './components/InscriptionsNoelModal';
import { MesEnfantsModal } from './components/MesEnfantsModal';
import { Documents } from './components/Documents';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import * as auth from './utils/auth';

export default function App() {
  const [user, setUser] = useState<{ id: string; email: string; name?: string; isAdmin?: boolean; role?: 'membre' | 'superviseur' | 'admin'; mustChangePassword?: boolean; userStatus?: { status: 'approved' | 'pending' | 'rejected'; createdAt?: string } } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'admin-setup' | 'super-admin-setup' | 'create-admin'>('home');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [isSainteBarbeModalOpen, setIsSainteBarbeModalOpen] = useState(false);
  const [isNoelModalOpen, setIsNoelModalOpen] = useState(false);
  const [isMesEnfantsModalOpen, setIsMesEnfantsModalOpen] = useState(false);

  // Check for stored auth on mount
  useEffect(() => {
    const checkStoredAuth = async () => {
      // Check server health first
      const isHealthy = await auth.checkServerHealth();
      if (!isHealthy) {
        console.warn('⚠️ Le serveur Edge Supabase ne répond pas. Veuillez attendre quelques instants et rafraîchir la page.');
        setError('Le serveur est en cours de démarrage. Veuillez rafraîchir la page dans quelques instants.');
      } else {
        console.log('✅ Le serveur Edge Supabase est opérationnel');
      }

      const stored = auth.getStoredAuth();
      if (stored) {
        try {
          // Verify the token is still valid
          const validUser = await auth.getSession(stored.accessToken);
          console.log('[App] Session restored:', {
            userId: validUser.id,
            email: validUser.email,
            mustChangePassword: validUser.mustChangePassword,
            type: typeof validUser.mustChangePassword
          });
          setUser(validUser);
          setAccessToken(stored.accessToken);
          
          // Check if user must change password
          if (validUser.mustChangePassword) {
            console.log('[App] Opening password change modal (from session)');
            alert('MODAL DEVRAIT S\'OUVRIR - mustChangePassword = ' + validUser.mustChangePassword);
            setShowPasswordChangeModal(true);
          } else {
            console.log('[App] No password change required (from session)');
          }
        } catch (error) {
          console.error('Stored session invalid:', error);
          auth.clearAuth();
        }
      }
      setIsLoading(false);
    };

    checkStoredAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await auth.login(email, password);
      console.log('[App] Login response:', {
        userId: response.user.id,
        email: response.user.email,
        mustChangePassword: response.user.mustChangePassword,
        type: typeof response.user.mustChangePassword
      });
      setUser(response.user);
      setAccessToken(response.access_token);
      auth.saveAuth(response.user, response.access_token);
      setIsLoginModalOpen(false);
      
      // Check if user must change password
      if (response.user.mustChangePassword) {
        console.log('[App] Opening password change modal (from login)');
        alert('MODAL DEVRAIT S\'OUVRIR - mustChangePassword = ' + response.user.mustChangePassword);
        setShowPasswordChangeModal(true);
      } else {
        console.log('[App] No password change required (from login)');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
      // Relancer l'erreur pour que LoginModal sache que la connexion a échoué
      throw error;
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const response = await auth.signup(email, password, name);
      setSuccessMessage(response.message);
      setIsLoginModalOpen(false);
      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);
    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'Erreur d\'inscription');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setError(null);
      const response = await auth.resetPassword(email);
      setSuccessMessage(response.message);
      // Don't close modal to show success message
      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    setShowPasswordChangeModal(false);
    auth.clearAuth();
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      const response = await auth.changePassword(accessToken!, currentPassword, newPassword);
      setSuccessMessage(response.message);
      setShowPasswordChangeModal(false);
      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);
    } catch (error) {
      console.error('Password change error:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    }
  };

  const handleEventClick = (eventType: 'sainte-barbe' | 'noel') => {
    if (!user) {
      // Si l'utilisateur n'est pas connecté, ouvrir le modal de connexion
      setIsLoginModalOpen(true);
    } else {
      // Si connecté, ouvrir le modal d'inscription approprié
      if (eventType === 'sainte-barbe') {
        setIsSainteBarbeModalOpen(true);
      } else {
        setIsNoelModalOpen(true);
      }
    }
  };

  const handleMesEnfantsClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      setIsMesEnfantsModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show admin setup page if requested
  if (currentPage === 'admin-setup') {
    return <AdminSetup onNavigateHome={() => setCurrentPage('home')} />;
  }

  // Show super admin setup page if requested
  if (currentPage === 'super-admin-setup') {
    return <SuperAdminSetup onNavigateHome={() => setCurrentPage('home')} />;
  }

  // Show create admin page if requested
  if (currentPage === 'create-admin') {
    return <CreateAdminPage onNavigateHome={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mx-4 mt-4 rounded">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}
      
      {/* Public Home Page - only for non-connected users */}
      {!user && <PublicHomePage />}
      
      {/* Connected users interface - same for all roles */}
      {user && accessToken && (
        <>
          {/* Admin Panel - only for admins and superviseurs */}
          {(user?.isAdmin || user?.role === 'admin' || user?.role === 'superviseur') && (
            <AdminPanel accessToken={accessToken} userRole={user?.role} />
          )}
          
          {/* HomePage with event buttons - shown for all connected users */}
          <HomePage 
            onSainteBarbeClick={() => handleEventClick('sainte-barbe')}
            onNoelClick={() => handleEventClick('noel')}
            onMesEnfantsClick={handleMesEnfantsClick}
            onAnnuaireClick={() => {
              // scroll to member area
              const el = document.querySelector('#mon-espace');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          
          {/* Member Area - shown for all connected users */}
          <MemberArea 
            user={user} 
            userStatus={user.userStatus}
            onChangePassword={() => setShowPasswordChangeModal(true)}
          />
          
          {/* Change Password Modal */}
          {console.log('[App] Rendering ChangePasswordModal:', {
            isOpen: user.mustChangePassword || showPasswordChangeModal,
            userMustChangePassword: user.mustChangePassword,
            showPasswordChangeModal: showPasswordChangeModal,
            isMandatory: user.mustChangePassword || false
          })}
          <ChangePasswordModal
            isOpen={user.mustChangePassword || showPasswordChangeModal}
            isMandatory={user.mustChangePassword || false}
            accessToken={accessToken}
            onSuccess={() => {
              setShowPasswordChangeModal(false);
              setSuccessMessage('Mot de passe changé avec succès !');
              setTimeout(() => setSuccessMessage(null), 10000);
              // Update user to clear mustChangePassword flag
              if (user.mustChangePassword) {
                setUser({ ...user, mustChangePassword: false });
                auth.saveAuth({ ...user, mustChangePassword: false }, accessToken);
              }
            }}
            onCancel={user.mustChangePassword ? undefined : () => setShowPasswordChangeModal(false)}
          />
        </>
      )}
      
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setError(null);
        }}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onResetPassword={handleResetPassword}
        error={error}
      />
      
      {/* Event Registration Modals */}
      {user && accessToken && (
        <>
          <InscriptionsSainteBarbeModal
            isOpen={isSainteBarbeModalOpen}
            onClose={() => setIsSainteBarbeModalOpen(false)}
            user={user}
            accessToken={accessToken}
          />
          <InscriptionsNoelModal
            isOpen={isNoelModalOpen}
            onClose={() => setIsNoelModalOpen(false)}
            user={user}
            accessToken={accessToken}
          />
          <MesEnfantsModal
            isOpen={isMesEnfantsModalOpen}
            onClose={() => setIsMesEnfantsModalOpen(false)}
            user={user}
            accessToken={accessToken}
          />
        </>
      )}
    </div>
  );
}