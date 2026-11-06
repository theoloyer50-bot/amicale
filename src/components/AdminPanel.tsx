import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Shield, Calendar, Edit, Key, Clock, Unlock, Lock, AlertTriangle, Crown, Eye, UserPlus, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CreateUserModal } from './CreateUserModal';
import { HomePageEditor } from './HomePageEditor';
import { HeroEditor } from './HeroEditor';
import { DevenirJSPEditor } from './DevenirJSPEditor';
import { PublicPageEditor } from './PublicPageEditor';
import { ResetRegistrations } from './ResetRegistrations';
import { NoelRegistrationsList } from './NoelRegistrationsList';
import { ListeEnfants } from './ListeEnfants';
import { DocumentsEditor } from './DocumentsEditor';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b`;

interface PendingUser {
  userId: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  role?: 'membre' | 'superviseur' | 'admin';
  isAdmin?: boolean;
  createdAt: string;
}

interface RegistrationStatus {
  isOpen: boolean;
  closedMessage: string;
}

interface AdminPanelProps {
  accessToken: string;
  userRole?: 'membre' | 'superviseur' | 'admin';
}

type TabType = 'pending' | 'approved' | 'registrations' | 'administration' | 'noel-registrations' | 'enfants';

// Define icon aliases to avoid naming conflicts
const UsersIcon = Users;

export function AdminPanel({ accessToken, userRole }: AdminPanelProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize activeTab based on userRole
  const [activeTab, setActiveTab] = useState<TabType>(userRole === 'superviseur' ? 'noel-registrations' : 'pending');
  const [passwordModalUserId, setPasswordModalUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  
  // Registration status states
  const [sainteBarbeStatus, setSainteBarbeStatus] = useState<RegistrationStatus>({ isOpen: false, closedMessage: 'Les inscriptions ne sont pas encore ouvertes.' });
  const [noelStatus, setNoelStatus] = useState<RegistrationStatus>({ isOpen: false, closedMessage: 'Les inscriptions ne sont pas encore ouvertes.' });
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/admin/pending-users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      console.log(`[AdminPanel] Fetched users:`, data.users);
      setPendingUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
    fetchRegistrationStatuses(); // Always fetch registration statuses on mount
  }, [accessToken]);

  const fetchRegistrationStatuses = async () => {
    try {
      setIsLoadingStatus(true);
      console.log('[AdminPanel] Fetching registration statuses...');
      
      // Fetch Sainte-Barbe status
      const sainteBarbeResponse = await fetch(`${API_BASE}/registration-status/sainte-barbe`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      console.log('[AdminPanel] Sainte-Barbe response status:', sainteBarbeResponse.status);
      if (sainteBarbeResponse.ok) {
        const data = await sainteBarbeResponse.json();
        console.log('[AdminPanel] Sainte-Barbe data:', data);
        setSainteBarbeStatus(data);
      }
      
      // Fetch Noël status
      const noelResponse = await fetch(`${API_BASE}/registration-status/noel`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      console.log('[AdminPanel] Noël response status:', noelResponse.status);
      if (noelResponse.ok) {
        const data = await noelResponse.json();
        console.log('[AdminPanel] Noël data:', data);
        setNoelStatus(data);
      }
    } catch (error) {
      console.error('[AdminPanel] Error fetching registration statuses:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleToggleRegistration = async (eventType: 'sainte-barbe' | 'noel', isOpen: boolean) => {
    try {
      setError(null);
      const currentStatus = eventType === 'sainte-barbe' ? sainteBarbeStatus : noelStatus;
      
      console.log('Toggle registration:', { eventType, isOpen, currentStatus });
      
      const response = await fetch(`${API_BASE}/admin/registration-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          eventType,
          isOpen,
          closedMessage: currentStatus.closedMessage || 'Les inscriptions sont actuellement fermées.'
        })
      });

      const data = await response.json();
      console.log('[AdminPanel] Toggle response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Update local state immediately
      const updatedStatus = { 
        isOpen, 
        closedMessage: currentStatus.closedMessage || 'Les inscriptions sont actuellement fermées.' 
      };
      
      if (eventType === 'sainte-barbe') {
        setSainteBarbeStatus(updatedStatus);
      } else {
        setNoelStatus(updatedStatus);
      }
      
      console.log('[AdminPanel] Registration status updated successfully, new state:', updatedStatus);
      
      // Re-fetch from server to confirm
      setTimeout(() => {
        fetchRegistrationStatuses();
      }, 500);
    } catch (error) {
      console.error('[AdminPanel] Error toggling registration:', error);
      setError(error instanceof Error ? error.message : 'Erreur de mise à jour');
    }
  };

  const handleUpdateClosedMessage = async (eventType: 'sainte-barbe' | 'noel', message: string) => {
    try {
      const currentStatus = eventType === 'sainte-barbe' ? sainteBarbeStatus : noelStatus;
      console.log('[AdminPanel] Updating closed message:', { eventType, message, currentStatus });
      
      const response = await fetch(`${API_BASE}/admin/registration-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          eventType,
          isOpen: currentStatus.isOpen,
          closedMessage: message
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Update local state
      if (eventType === 'sainte-barbe') {
        setSainteBarbeStatus({ ...sainteBarbeStatus, closedMessage: message });
      } else {
        setNoelStatus({ ...noelStatus, closedMessage: message });
      }
    } catch (error) {
      console.error('Error updating closed message:', error);
      setError(error instanceof Error ? error.message : 'Erreur de mise à jour');
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      console.log(`[AdminPanel] Updating user ${userId} status to ${status}`);
      const response = await fetch(`${API_BASE}/admin/update-user-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId, status })
      });

      console.log(`[AdminPanel] Response status: ${response.status}`);
      
      if (!response.ok) {
        const data = await response.json();
        console.error(`[AdminPanel] Error response:`, data);
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      const data = await response.json();
      console.log(`[AdminPanel] Success response:`, data);
      
      // Refresh the list
      console.log(`[AdminPanel] Refreshing pending users...`);
      await fetchPendingUsers();
      console.log(`[AdminPanel] Refresh complete`);
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error instanceof Error ? error.message : 'Erreur de mise à jour');
    }
  };

  const handleUpdateRole = async (userId: string, role: 'membre' | 'superviseur' | 'admin') => {
    try {
      console.log('Updating role for user:', userId, 'to role:', role, 'type:', typeof role);
      const response = await fetch(`${API_BASE}/admin/update-user-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId, role })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Role update failed:', data);
        throw new Error(data.error || 'Erreur lors de la mise à jour du rôle');
      }

      // Refresh the list
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'Erreur de mise à jour');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      setError(null);

      const response = await fetch(`${API_BASE}/admin/reset-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          userId, 
          newPassword,
          requirePasswordChange 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la réinitialisation du mot de passe');
      }

      // Close modal and reset form
      setPasswordModalUserId(null);
      setNewPassword('');
      setRequirePasswordChange(false);
      
      // Refresh the list
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error resetting user password:', error);
      setError(error instanceof Error ? error.message : 'Erreur de réinitialisation du mot de passe');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleToggleUserActivation = async (userId: string, currentStatus: string) => {
    try {
      setError(null);
      const isActive = currentStatus !== 'approved';
      
      if (!confirm(isActive ? 'Voulez-vous vraiment activer cet utilisateur ?' : 'Voulez-vous vraiment désactiver cet utilisateur ?')) {
        return;
      }

      const response = await fetch(`${API_BASE}/admin/toggle-user-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId, isActive })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la modification du statut');
      }

      // Refresh the list
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error toggling user activation:', error);
      setError(error instanceof Error ? error.message : 'Erreur de modification du statut');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      setError(null);
      
      if (!confirm(`⚠️ ATTENTION ⚠️\n\nVoulez-vous vraiment supprimer définitivement l'utilisateur "${userName}" ?\n\nCette action supprimera :\n- Le compte utilisateur\n- Toutes ses inscriptions\n- Tous ses enfants déclarés\n- Toutes ses données\n\nCette action est IRRÉVERSIBLE !`)) {
        return;
      }

      console.log('[handleDeleteUser] Deleting user:', userId, 'with token:', accessToken?.substring(0, 20) + '...');

      const response = await fetch(`${API_BASE}/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId })
      });

      console.log('[handleDeleteUser] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('[handleDeleteUser] Error response:', data);
        
        // Si le token est invalide, déconnecter l'utilisateur
        if (response.status === 401) {
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          window.location.reload();
          return;
        }
        
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Refresh the list
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Erreur de suppression');
    }
  };

  const getRoleBadge = (user: PendingUser) => {
    // Handle legacy isAdmin field
    const role = user.role || (user.isAdmin ? 'admin' : 'membre');
    
    switch (role) {
      case 'admin':
        return { text: 'Administrateur', color: 'bg-purple-100 text-purple-700', icon: Crown };
      case 'superviseur':
        return { text: 'Superviseur', color: 'bg-blue-100 text-blue-700', icon: UsersIcon };
      case 'membre':
      default:
        return { text: 'Membre', color: 'bg-gray-100 text-gray-700', icon: Eye };
    }
  };

  const pendingCount = pendingUsers.filter(u => u.status === 'pending').length;
  const approvedCount = pendingUsers.filter(u => u.status === 'approved').length;
  const totalCount = pendingUsers.length;

  const filteredUsers = activeTab === 'pending' 
    ? pendingUsers.filter(u => u.status === 'pending')
    : pendingUsers; // Show ALL users in role management, not just approved

  // Vue simplifiée pour les superviseurs - uniquement inscrits Noël
  if (userRole === 'superviseur') {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <Eye className="w-6 h-6 text-red-700 mr-2" />
            <h2 className="text-2xl text-gray-900">Panneau Superviseur</h2>
          </div>
          
          {/* Onglets pour superviseur */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('noel-registrations')}
              className={`flex-1 px-4 py-2 rounded-md transition ${
                activeTab === 'noel-registrations'
                  ? 'bg-white text-red-700 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎄 Inscriptions Noël
            </button>
            <button
              onClick={() => setActiveTab('enfants')}
              className={`flex-1 px-4 py-2 rounded-md transition ${
                activeTab === 'enfants'
                  ? 'bg-white text-red-700 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👶 Enfants déclarés
            </button>
          </div>

          {/* Contenu selon l'onglet */}
          {activeTab === 'noel-registrations' && (
            <NoelRegistrationsList accessToken={accessToken} />
          )}
          
          {activeTab === 'enfants' && (
            <ListeEnfants accessToken={accessToken} userRole={userRole} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-red-700 mr-2" />
            <h2 className="text-2xl text-gray-900">Panneau Administrateur</h2>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              <Clock className="w-4 h-4 inline mr-1" />
              {pendingCount} en attente
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              <UserCheck className="w-4 h-4 inline mr-1" />
              {approvedCount} approuvés
            </span>
          </div>
        </div>

        {/* Tabs - défilable sur téléphone */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6">
          <div className="flex gap-4 border-b border-gray-200 px-4 sm:px-0 min-w-max sm:min-w-full">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 -mb-px whitespace-nowrap transition ${
                activeTab === 'pending'
                  ? 'border-b-2 border-red-700 text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⏳ En attente ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 -mb-px whitespace-nowrap transition ${
                activeTab === 'approved'
                  ? 'border-b-2 border-red-700 text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Tous les utilisateurs ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('noel-registrations')}
              className={`px-4 py-2 -mb-px whitespace-nowrap transition ${
                activeTab === 'noel-registrations'
                  ? 'border-b-2 border-red-700 text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎄 Inscrits Noël
            </button>
            <button
              onClick={() => setActiveTab('enfants')}
              className={`px-4 py-2 -mb-px whitespace-nowrap transition ${
                activeTab === 'enfants'
                  ? 'border-b-2 border-red-700 text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👶 Enfants déclarés
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-4 py-2 -mb-px whitespace-nowrap transition ${
                activeTab === 'registrations'
                  ? 'border-b-2 border-red-700 text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Inscriptions
            </button>
            <button
              onClick={() => setActiveTab('administration')}
              className={`px-4 py-2 -mb-px whitespace-nowrap transition ${
                activeTab === 'administration'
                  ? 'border-b-2 border-red-700 text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🛠️ Administration
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Registrations Tab Content */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            {isLoadingStatus ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Sainte-Barbe Registration Control */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-red-700" />
                      <h3 className="text-xl text-gray-900">Inscriptions Sainte-Barbe</h3>
                    </div>
                    <button
                      onClick={() => handleToggleRegistration('sainte-barbe', !sainteBarbeStatus.isOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        sainteBarbeStatus.isOpen
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {sainteBarbeStatus.isOpen ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          Ouvertes - Cliquer pour fermer
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Fermées - Cliquer pour ouvrir
                        </>
                      )}
                    </button>
                  </div>
                  
                  {!sainteBarbeStatus.isOpen && (
                    <div className="mt-4">
                      <label className="block text-gray-700 mb-2">
                        Message affiché quand les inscriptions sont fermées :
                      </label>
                      <textarea
                        value={sainteBarbeStatus.closedMessage}
                        onChange={(e) => setSainteBarbeStatus({ ...sainteBarbeStatus, closedMessage: e.target.value })}
                        onBlur={(e) => handleUpdateClosedMessage('sainte-barbe', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                        rows={3}
                        placeholder="Les inscriptions sont actuellement fermées."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Le message sera automatiquement enregistré quand vous quitterez le champ
                      </p>
                    </div>
                  )}
                </div>

                {/* Noël Registration Control */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-red-700" />
                      <h3 className="text-xl text-gray-900">Inscriptions Noël</h3>
                    </div>
                    <button
                      onClick={() => handleToggleRegistration('noel', !noelStatus.isOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        noelStatus.isOpen
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {noelStatus.isOpen ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          Ouvertes - Cliquer pour fermer
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Fermées - Cliquer pour ouvrir
                        </>
                      )}
                    </button>
                  </div>
                  
                  {!noelStatus.isOpen && (
                    <div className="mt-4">
                      <label className="block text-gray-700 mb-2">
                        Message affiché quand les inscriptions sont fermées :
                      </label>
                      <textarea
                        value={noelStatus.closedMessage}
                        onChange={(e) => setNoelStatus({ ...noelStatus, closedMessage: e.target.value })}
                        onBlur={(e) => handleUpdateClosedMessage('noel', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                        rows={3}
                        placeholder="Les inscriptions sont actuellement fermées."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Le message sera automatiquement enregistré quand vous quitterez le champ
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Administration Tab Content */}
        {activeTab === 'administration' && (
          <div className="space-y-8">
            <HomePageEditor accessToken={accessToken} />
            <HeroEditor accessToken={accessToken} />
            <DevenirJSPEditor accessToken={accessToken} />
            <PublicPageEditor />
            <DocumentsEditor />
            <div className="border-t-4 border-red-200 pt-8">
              <h3 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-700" />
                Réinitialisation des inscriptions annuelles
              </h3>
              <ResetRegistrations accessToken={accessToken} />
            </div>
          </div>
        )}

        {/* Noel Registrations Tab Content */}
        {activeTab === 'noel-registrations' && (
          <div>
            <NoelRegistrationsList accessToken={accessToken} />
          </div>
        )}

        {/* Enfants Tab Content */}
        {activeTab === 'enfants' && (
          <div>
            <ListeEnfants accessToken={accessToken} userRole={userRole} />
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab !== 'registrations' && activeTab !== 'administration' && activeTab !== 'noel-registrations' && activeTab !== 'enfants' && (
          <>
            {/* Create User Button */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setIsCreateUserModalOpen(true)}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <UserPlus className="w-5 h-5" />
                Créer un compte
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {activeTab === 'pending' 
                  ? 'Aucune demande d\'adhésion pour le moment'
                  : 'Aucun membre approuvé'}
              </div>
            ) : (
              <div className="space-y-3">{filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user);
                const RoleIcon = roleBadge.icon;
                const currentRole = user.role || (user.isAdmin ? 'admin' : 'membre');

                return (
                  <div
                    key={user.userId}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-gray-900">{user.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${roleBadge.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleBadge.text}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              user.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : user.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.status === 'pending' && '⏳ En attente'}
                            {user.status === 'approved' && '✓ Approuvé'}
                            {user.status === 'rejected' && '✗ Refusé'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Demande du {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {activeTab === 'pending' ? (
                          // Pending users: show approve/reject buttons
                          <>
                            <button
                              onClick={() => handleUpdateStatus(user.userId, 'approved')}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                            >
                              <UserCheck className="w-4 h-4" />
                              Approuver
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(user.userId, 'rejected')}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                            >
                              <UserX className="w-4 h-4" />
                              Refuser
                            </button>
                          </>
                        ) : (
                          // All users tab: show role selector for approved users, or approve/reject buttons for pending
                          user.status === 'approved' ? (
                            <>
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 whitespace-nowrap">Rôle :</label>
                                <select
                                  value={currentRole}
                                  onChange={(e) => {
                                    const selectedRole = e.target.value as 'membre' | 'superviseur' | 'admin';
                                    console.log('Role selected from dropdown:', selectedRole, 'type:', typeof selectedRole);
                                    handleUpdateRole(user.userId, selectedRole);
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none text-sm"
                                >
                                  <option value="membre">Membre</option>
                                  <option value="superviseur">Superviseur</option>
                                  <option value="admin">Administrateur</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setPasswordModalUserId(user.userId)}
                                  className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
                                  title="Réinitialiser le mot de passe"
                                >
                                  <Key className="w-4 h-4" />
                                  <span className="sm:hidden">Mot de passe</span>
                                  <span className="hidden sm:inline">MDP</span>
                                </button>
                                <button
                                  onClick={() => handleToggleUserActivation(user.userId, user.status)}
                                  className={`flex-1 sm:flex-none ${
                                    user.status === 'approved' 
                                      ? 'bg-blue-600 hover:bg-blue-700' 
                                      : 'bg-gray-600 hover:bg-gray-700'
                                  } text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm`}
                                  title={user.status === 'approved' ? 'Désactiver' : 'Activer'}
                                >
                                  {user.status === 'approved' ? (
                                    <>
                                      <Lock className="w-4 h-4" />
                                      <span className="sm:hidden">Désactiver</span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-4 h-4" />
                                      <span className="sm:hidden">Activer</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.userId, user.name)}
                                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="sm:hidden">Supprimer</span>
                                </button>
                              </div>
                            </>
                          ) : user.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(user.userId, 'approved')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                              >
                                <UserCheck className="w-4 h-4" />
                                Approuver
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(user.userId, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                              >
                                <UserX className="w-4 h-4" />
                                Refuser
                              </button>
                            </>
                          ) : (
                            // Rejected/Deactivated users: show reactivate and delete buttons
                            <>
                              <button
                                onClick={() => handleToggleUserActivation(user.userId, user.status)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
                                title="Réactiver ce compte"
                              >
                                <Unlock className="w-4 h-4" />
                                Réactiver
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.userId, user.name)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </>
        )}

        {/* Password Reset Modal */}
        {passwordModalUserId && (() => {
          const user = pendingUsers.find(u => u.userId === passwordModalUserId);
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-6 h-6 text-red-700" />
                  <h3 className="text-xl text-gray-900">Réinitialiser le mot de passe</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Changer le mot de passe de <strong>{user?.name}</strong> ({user?.email})
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      placeholder="Entrez le nouveau mot de passe"
                      minLength={6}
                    />
                    <p className="text-sm text-gray-500 mt-1">Minimum 6 caractères</p>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requirePasswordChange}
                        onChange={(e) => setRequirePasswordChange(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">
                        Forcer le changement de mot de passe à la prochaine connexion
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      setPasswordModalUserId(null);
                      setNewPassword('');
                      setRequirePasswordChange(false);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
                    disabled={isSubmittingPassword}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleResetPassword(passwordModalUserId)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isSubmittingPassword || newPassword.length < 6}
                  >
                    {isSubmittingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Réinitialisation...
                      </>
                    ) : (
                      'Réinitialiser'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          accessToken={accessToken}
          onUserCreated={() => fetchPendingUsers()}
        />
      </div>
    </div>
  );
}