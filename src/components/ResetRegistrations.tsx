import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b`;

interface ResetRegistrationsProps {
  accessToken: string;
}

export function ResetRegistrations({ accessToken }: ResetRegistrationsProps) {
  const [showSainteBarbeConfirm, setShowSainteBarbeConfirm] = useState(false);
  const [showNoelConfirm, setShowNoelConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetSainteBarbe = async () => {
    try {
      setIsResetting(true);
      setError(null);
      setSuccessMessage(null);

      console.log('[ResetRegistrations] Calling Sainte-Barbe reset endpoint...');
      console.log('[ResetRegistrations] API URL:', `${API_BASE}/events/sainte-barbe/reset`);
      console.log('[ResetRegistrations] Access token:', accessToken ? 'Present' : 'Missing');

      const response = await fetch(`${API_BASE}/events/sainte-barbe/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[ResetRegistrations] Response status:', response.status);
      
      const data = await response.json();
      console.log('[ResetRegistrations] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      setSuccessMessage(`✅ ${data.message || 'Inscriptions Sainte-Barbe réinitialisées avec succès'}`);
      setShowSainteBarbeConfirm(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('[ResetRegistrations] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetNoel = async () => {
    try {
      setIsResetting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`${API_BASE}/events/noel/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      const data = await response.json();
      setSuccessMessage(`✅ ${data.message || 'Inscriptions Noël réinitialisées avec succès'}`);
      setShowNoelConfirm(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error resetting Noel registrations:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-900 mb-1">⚠️ Réinitialisation des inscriptions</h4>
            <p className="text-sm text-yellow-700">
              Utilisez ces boutons pour supprimer toutes les inscriptions d'un événement.
              Cette action est <strong>irréversible</strong> et doit être effectuée uniquement en début d'année
              pour préparer les nouveaux événements.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-700" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Reset Buttons */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sainte-Barbe Reset */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
          <h3 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
            🎄 Réinitialiser Sainte-Barbe
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Supprime toutes les inscriptions à l'événement Sainte-Barbe ainsi que les réservations de tables.
          </p>
          
          {!showSainteBarbeConfirm ? (
            <button
              onClick={() => setShowSainteBarbeConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              disabled={isResetting}
            >
              <Trash2 className="w-5 h-5" />
              Réinitialiser les inscriptions
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ Êtes-vous sûr ? Cette action supprimera <strong>TOUTES</strong> les inscriptions !
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetSainteBarbe}
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition disabled:opacity-50"
                >
                  {isResetting ? 'Réinitialisation...' : 'Oui, supprimer tout'}
                </button>
                <button
                  onClick={() => setShowSainteBarbeConfirm(false)}
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Noël Reset */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
          <h3 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
            🎅 Réinitialiser Noël
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Supprime toutes les inscriptions à l'événement de Noël (adultes et enfants).
          </p>
          
          {!showNoelConfirm ? (
            <button
              onClick={() => setShowNoelConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              disabled={isResetting}
            >
              <Trash2 className="w-5 h-5" />
              Réinitialiser les inscriptions
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ Êtes-vous sûr ? Cette action supprimera <strong>TOUTES</strong> les inscriptions !
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetNoel}
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition disabled:opacity-50"
                >
                  {isResetting ? 'Réinitialisation...' : 'Oui, supprimer tout'}
                </button>
                <button
                  onClick={() => setShowNoelConfirm(false)}
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}