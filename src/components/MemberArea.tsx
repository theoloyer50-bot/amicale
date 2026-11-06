import { Calendar, Users, User, Shield, Check, Clock, Lock, FileText } from 'lucide-react';
import { Documents } from './Documents';

interface MemberAreaProps {
  user: { 
    id: string; 
    email: string; 
    name?: string;
    role?: 'membre' | 'organisateur' | 'admin';
  };
  userStatus?: {
    status: 'approved' | 'pending' | 'rejected';
    createdAt?: string;
  };
  onChangePassword?: () => void;
}

export function MemberArea({ user, userStatus, onChangePassword }: MemberAreaProps) {
  const upcomingEvents = [
    { title: 'Assemblée Générale', date: '15 Janvier 2026' },
    { title: 'Journée Portes Ouvertes', date: '15 Mars 2026' },
  ];

  const displayName = user.name || user.email;

  // Format role for display
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'organisateur': return 'Organisateur';
      case 'membre': return 'Membre';
      default: return 'Membre';
    }
  };

  // Format status for display
  const getStatusInfo = () => {
    if (!userStatus) return { label: 'En attente', color: 'yellow', icon: Clock };
    
    switch (userStatus.status) {
      case 'approved':
        return { label: 'Approuvé', color: 'green', icon: Check };
      case 'pending':
        return { label: 'En attente', color: 'yellow', icon: Clock };
      case 'rejected':
        return { label: 'Refusé', color: 'red', icon: Clock };
      default:
        return { label: 'En attente', color: 'yellow', icon: Clock };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Non disponible';
    }
  };

  return (
    <section id="mon-espace" className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
            Espace Adhérent
          </h2>
          <p className="text-xl text-gray-600">
            Bienvenue {displayName}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Informations personnelles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-red-700" />
              <h3 className="text-2xl text-gray-900">Informations personnelles</h3>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Nom</p>
                <p className="text-gray-900">{user.name || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <p className="text-sm text-gray-600">Rôle</p>
                </div>
                <p className="text-gray-900">{getRoleLabel(user.role)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <p className="text-sm text-gray-600">Date de création</p>
                </div>
                <p className="text-gray-900">{formatDate(userStatus?.createdAt)}</p>
              </div>
              <div className={`p-4 rounded-lg border ${
                statusInfo.color === 'green' ? 'bg-green-50 border-green-200' :
                statusInfo.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  <StatusIcon className={`w-4 h-4 ${
                    statusInfo.color === 'green' ? 'text-green-600' :
                    statusInfo.color === 'yellow' ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <p className={`text-sm ${
                    statusInfo.color === 'green' ? 'text-green-600' :
                    statusInfo.color === 'yellow' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>Statut du compte</p>
                </div>
                <p className={
                  statusInfo.color === 'green' ? 'text-green-800' :
                  statusInfo.color === 'yellow' ? 'text-yellow-800' :
                  'text-red-800'
                }>{statusInfo.label}</p>
              </div>
              {onChangePassword && (
                <button 
                  onClick={onChangePassword}
                  className="w-full flex items-center justify-center space-x-2 p-4 bg-red-700 text-white rounded-lg hover:bg-red-800 transition"
                >
                  <Lock className="w-4 h-4" />
                  <span>Changer mon mot de passe</span>
                </button>
              )}
            </div>
          </div>

          {/* Documents: afficher directement la liste ici */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-6 h-6 text-red-700" />
              <h3 className="text-2xl text-gray-900">Documents</h3>
            </div>
            <Documents isModal={true} />
          </div>

          {/* Annuaire card removed per request */}
        </div>

        {/* bottom documents section removed — documents are available in the card beside personal info */}
      </div>
    </section>
  );
}