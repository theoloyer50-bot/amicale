import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onUserCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, accessToken, onUserCreated }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'membre' | 'superviseur' | 'admin'>('membre');
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    console.log('[CreateUserModal] Submitting with requirePasswordChange:', requirePasswordChange);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b/admin/create-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            name,
            role,
            requirePasswordChange
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du compte');
      }

      setSuccess(true);
      setEmail('');
      setPassword('');
      setName('');
      setRole('membre');
      setRequirePasswordChange(false);
      
      onUserCreated();
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Erreur de création');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-red-700" />
            <h2 className="text-xl text-gray-900">Créer un compte</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3">
              Compte créé avec succès !
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">
              Nom complet *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Prénom Nom"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="email@exemple.fr"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Mot de passe *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Rôle *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'membre' | 'superviseur' | 'admin')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="membre">Membre</option>
              <option value="superviseur">Superviseur (voit les enfants)</option>
              <option value="admin">Administrateur (tous les droits)</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
            <p className="mb-1"><strong>Rôles :</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Membre</strong> : Peut s'inscrire aux événements et déclarer ses enfants</li>
              <li><strong>Superviseur</strong> : Peut voir tous les enfants déclarés</li>
              <li><strong>Admin</strong> : Accès complet à toutes les fonctionnalités</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requirePasswordChange}
                onChange={(e) => setRequirePasswordChange(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                Forcer le changement de mot de passe à la première connexion
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Création...
                </>
              ) : success ? (
                '✓ Créé'
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Créer le compte
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
