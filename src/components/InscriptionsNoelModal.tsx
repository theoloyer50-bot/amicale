import React, { useState, useEffect } from 'react';
import { Gift, X, Users, Lock, AlertCircle, Baby } from 'lucide-react';
import { ChildRecord, getEventRegistrationStatus, getMyChildren, getNoelRegistration, NoelRegistration, saveNoelRegistration } from '../utils/firebase/siteData';

interface InscriptionsNoelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; email: string; name?: string };
  accessToken: string;
}

interface RegistrationStatus {
  isOpen: boolean;
  closedMessage: string;
}

export function InscriptionsNoelModal({ isOpen, onClose, user, accessToken }: InscriptionsNoelModalProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [areChildrenLoading, setAreChildrenLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({ isOpen: false, closedMessage: 'Chargement...' });
  const [myRegistration, setMyRegistration] = useState<NoelRegistration | null>(null);
  const numberOfChildren = selectedChildIds.length;

  useEffect(() => {
    if (isOpen) {
      fetchRegistrationStatus();
      fetchMyRegistration();
    }
  }, [isOpen]);

  const fetchRegistrationStatus = async () => {
    try {
      setRegistrationStatus(await getEventRegistrationStatus('noel'));
    } catch (error) {
      console.error('Error fetching registration status:', error);
    }
  };

  const fetchMyRegistration = async () => {
    setAreChildrenLoading(true);
    try {
      const [registration, myChildren] = await Promise.all([
        getNoelRegistration(user.id),
        getMyChildren(),
      ]);
      setChildren(myChildren);
      if (registration) {
        setMyRegistration(registration);
        setIsRegistered(true);
        setNumberOfAdults(registration.numberOfAdults);
        setSelectedChildIds((registration.childIds || []).filter((id) => myChildren.some((child) => child.id === id)));
        setComments(registration.comments || '');
      } else {
        setMyRegistration(null);
        setIsRegistered(false);
        setNumberOfAdults(1);
        setSelectedChildIds([]);
        setComments('');
      }
    } catch (error) {
      console.error('Error fetching my registration:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement de votre inscription');
    } finally {
      setAreChildrenLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);

    try {
      await saveNoelRegistration({ numberOfAdults, childIds: selectedChildIds, comments });
      setIsRegistered(true);
      await fetchMyRegistration();
    } catch (error) {
      console.error('Error submitting registration:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-red-700" />
            <h2 className="text-3xl text-gray-900">Noël</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!registrationStatus.isOpen ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
              <Lock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg text-yellow-900 mb-2">Inscriptions fermées</h3>
                <p className="text-yellow-800">
                  {registrationStatus.closedMessage || 'Les inscriptions ne sont pas encore ouvertes.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {isRegistered && myRegistration && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-green-900 mb-2">✅ Vous êtes déjà inscrit !</h3>
                      <div className="text-sm text-green-800 space-y-1">
                        <p>
                          <span className="font-medium">Inscription actuelle :</span> {myRegistration.numberOfAdults} adulte(s) + {myRegistration.numberOfChildren} enfant(s)
                        </p>
                        {myRegistration.comments && (
                          <p className="text-xs italic mt-1">
                            Commentaire : "{myRegistration.comments}"
                          </p>
                        )}
                        <p className="text-xs text-green-700 mt-2 italic">
                          Vous pouvez modifier votre inscription ci-dessous.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 mb-2">
                    Nombre d'adultes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numberOfAdults}
                    onChange={(e) => setNumberOfAdults(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Enfants qui participeront
                  </label>
                  {areChildrenLoading ? (
                    <p className="text-sm text-gray-600">Chargement des enfants...</p>
                  ) : children.length > 0 ? (
                    <div className="space-y-2">
                      {children.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChildIds.includes(child.id)}
                            onChange={(event) => {
                              setSelectedChildIds((current) => event.target.checked
                                ? [...current, child.id]
                                : current.filter((id) => id !== child.id));
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-700"
                          />
                          <Baby className="w-5 h-5 text-red-700 flex-shrink-0" />
                          <span className="text-gray-800">{child.prenom} {child.nom}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Aucun enfant n'est associé à votre compte. Vous pouvez les déclarer dans la rubrique « Mes enfants ».
                    </p>
                  )}
                  {myRegistration && !myRegistration.childIds?.length && myRegistration.numberOfChildren > 0 && (
                    <p className="mt-2 text-sm text-amber-700">
                      Votre inscription précédente indique {myRegistration.numberOfChildren} enfant(s) sans détail. Sélectionnez les enfants concernés pour la mettre à jour.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Commentaires (optionnel)
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    rows={3}
                    placeholder="Informations complémentaires, allergies, etc."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Total :</strong> {numberOfAdults} adulte(s) + {numberOfChildren} enfant(s) = {numberOfAdults + numberOfChildren} personne(s)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      En cours...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      {isRegistered ? 'Modifier mon inscription' : 'S\'inscrire à Noël'}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}