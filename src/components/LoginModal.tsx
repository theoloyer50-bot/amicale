import { X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  error?: string | null;
}

export function LoginModal({ isOpen, onClose, onLogin, onSignup, onResetPassword, error }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (mode === 'login') {
        await onLogin(email, password);
        // Only clear fields on successful login
        setEmail('');
        setPassword('');
      } else if (mode === 'signup') {
        await onSignup(email, password, name);
        // Clear all fields after signup
        setEmail('');
        setPassword('');
        setName('');
      } else if (mode === 'reset') {
        await onResetPassword(email);
        setResetSuccess(true);
        // Don't clear email after reset request
      }
    } catch (error) {
      // Error is handled by parent component
      // On login error, only clear password, keep email
      if (mode === 'login') {
        setPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl text-gray-900">
            {mode === 'login' ? 'Connexion Adhérent' : mode === 'signup' ? 'Créer un compte' : 'Réinitialiser le mot de passe'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {resetSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Un email de réinitialisation a été envoyé.</p>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                required={mode === 'signup'}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                required
                minLength={6}
                disabled={isSubmitting}
              />
              {!mode.includes('login') && (
                <p className="text-sm text-gray-500 mt-1">Minimum 6 caractères</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {mode === 'login' ? 'Connexion...' : mode === 'signup' ? 'Inscription...' : 'Réinitialisation...'}
              </>
            ) : (
              <>{mode === 'login' ? 'Se connecter' : mode === 'signup' ? "S'inscrire" : 'Réinitialiser'}</>
            )}
          </button>
        </form>

        <div className="px-6 pb-6 space-y-2">
          {mode !== 'reset' && (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setEmail('');
                setPassword('');
                setName('');
                setResetSuccess(false);
              }}
              className="text-red-700 hover:text-red-800 text-sm block"
              disabled={isSubmitting}
            >
              {mode === 'login'
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'}
            </button>
          )}
          
          {mode === 'login' && (
            <button
              onClick={() => {
                setMode('reset');
                setEmail('');
                setPassword('');
                setName('');
                setResetSuccess(false);
              }}
              className="text-red-700 hover:text-red-800 text-sm block"
              disabled={isSubmitting}
            >
              Mot de passe oublié ?
            </button>
          )}
          
          {mode === 'reset' && (
            <button
              onClick={() => {
                setMode('login');
                setEmail('');
                setPassword('');
                setName('');
                setResetSuccess(false);
              }}
              className="text-red-700 hover:text-red-800 text-sm block"
              disabled={isSubmitting}
            >
              Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}