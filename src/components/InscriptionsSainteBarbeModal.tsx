import React, { useState, useEffect } from 'react';
import { Calendar, X, Users, Lock, AlertCircle, UserPlus, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b`;

interface InscriptionsSainteBarbeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; email: string; name?: string; role?: 'membre' | 'superviseur' | 'admin'; isAdmin?: boolean };
  accessToken: string;
}

interface Table {
  tableNumber: number;
  participants: Array<{
    userId: string;
    name: string;
    numberOfGuests: number;
    addedManually?: boolean;
  }>;
  totalSeats: number;
}

interface RegistrationStatus {
  isOpen: boolean;
  closedMessage: string;
}

export function InscriptionsSainteBarbeModal({ isOpen, onClose, user, accessToken }: InscriptionsSainteBarbeModalProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const MAX_GUESTS = 2;
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({ isOpen: false, closedMessage: 'Chargement...' });
  const [myRegistration, setMyRegistration] = useState<any>(null);
  const [myTable, setMyTable] = useState<any>(null);
  
  // Admin states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTable, setAddModalTable] = useState<number | null>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantGuests, setNewParticipantGuests] = useState(1); // max 2 per participant

  const isAdmin = user.role === 'admin' || user.isAdmin;

  useEffect(() => {
    if (isOpen) {
      fetchRegistrationStatus();
      fetchMyRegistration();
      fetchTables();
    }
  }, [isOpen]);

  const fetchRegistrationStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/registration-status/sainte-barbe`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrationStatus(data);
      }
    } catch (error) {
      console.error('Error fetching registration status:', error);
    }
  };

  const fetchMyRegistration = async () => {
    try {
      const response = await fetch(`${API_BASE}/events/sainte-barbe/my-registration`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.registration && data.table) {
          setMyRegistration(data.registration);
          setMyTable(data.table);
          setNumberOfGuests(data.registration.numberOfGuests);
          setSelectedTable(data.registration.tableNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching my registration:', error);
    }
  };

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/events/sainte-barbe/tables`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
        
        const userRegistered = data.tables.some((table: Table) =>
          table.participants.some(p => p.userId === user.id)
        );
        setIsRegistered(userRegistered);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Erreur lors du chargement des tables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTable) {
      setError('Veuillez sélectionner une table');
      return;
    }

    if (numberOfGuests < 1 || numberOfGuests > MAX_GUESTS) {
      setError(`Le nombre de personnes doit être entre 1 et ${MAX_GUESTS}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/events/sainte-barbe/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numberOfGuests,
          tableNumber: selectedTable
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsRegistered(true);
        setSuccessMessage('Inscription réussie !');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchMyRegistration();
        fetchTables();
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      setError('Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!isAdmin) {
      setError('Accès refusé : seuls les administrateurs peuvent ajouter des participants.');
      return;
    }

    if (!newParticipantName || !addModalTable) {
      return;
    }

    if (newParticipantGuests < 1 || newParticipantGuests > MAX_GUESTS) {
      setError(`Le nombre de personnes pour un participant doit être entre 1 et ${MAX_GUESTS}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/events/sainte-barbe/add-participant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableNumber: addModalTable,
          participantName: newParticipantName,
          numberOfGuests: newParticipantGuests
        })
      });

      if (response.ok) {
        setSuccessMessage('Participant ajouté avec succès');
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowAddModal(false);
        setNewParticipantName('');
        setNewParticipantGuests(1);
        setAddModalTable(null);
        fetchTables();
      } else {
        const text = await response.text();
        let message = text;
        try {
          const data = JSON.parse(text);
          message = data.error || data.message || JSON.stringify(data);
        } catch (err) {
          // not JSON, keep text
        }
        console.error('Add participant failed', response.status, message);
        setError(`Erreur ${response.status} : ${message}`);
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveParticipant = async (tableNumber: number, participantUserId: string, participantName: string) => {
    if (!confirm(`Voulez-vous vraiment retirer ${participantName} de la table ${tableNumber} ?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/events/sainte-barbe/remove-participant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableNumber,
          participantUserId
        })
      });

      if (response.ok) {
        setSuccessMessage('Participant retiré avec succès');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchTables();
      } else {
        const text = await response.text();
        let message = text;
        try {
          const data = JSON.parse(text);
          message = data.error || data.message || JSON.stringify(data);
        } catch (err) {
          // not JSON
        }
        console.error('Remove participant failed', response.status, message);
        setError(`Erreur ${response.status} : ${message}`);
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-red-700" />
            <h2 className="text-3xl text-gray-900">Sainte-Barbe 2024</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-3">
              {successMessage}
            </div>
          )}

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
              {isRegistered && myRegistration && myTable && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-green-900 mb-2">✅ Vous êtes déjà inscrit !</h3>
                      <div className="text-sm text-green-800 space-y-1">
                        <p>
                          <span className="font-medium">Table actuelle :</span> Table {myRegistration.tableNumber} 
                          <span className="text-green-600"> ({myTable.totalSeats}/10 places)</span>
                        </p>
                        <p>
                          <span className="font-medium">Vos places :</span> {myRegistration.numberOfGuests} personne(s)
                        </p>
                        <p className="text-xs text-green-700 mt-2 italic">
                          Vous pouvez changer de table en sélectionnant une autre table ci-dessous.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mb-6">
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">
                    Nombre de personnes *
                  </label>
                  <select
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    required
                  >
                    <option value={1}>1 personne</option>
                    <option value={2}>2 personnes</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">
                    Sélectionnez votre table * (10 places max par table)
                  </label>
                  
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {tables.map((table) => {
                        const isCurrentTable = isRegistered && myRegistration && table.tableNumber === myRegistration.tableNumber;
                        const availableSeats = isCurrentTable ? table.totalSeats - myRegistration.numberOfGuests : table.totalSeats;
                        const isAvailable = availableSeats + numberOfGuests <= 10;
                        const isFull = table.totalSeats >= 10;
                        
                        return (
                          <div
                            key={table.tableNumber}
                            className={`border-2 rounded-lg p-3 transition ${
                              isCurrentTable
                                ? 'border-green-600 bg-green-50 ring-2 ring-green-600'
                                : selectedTable === table.tableNumber
                                ? 'border-red-700 bg-red-50'
                                : isFull
                                ? 'border-gray-200 bg-gray-100 opacity-50'
                                : isAvailable
                                ? 'border-gray-300 hover:border-red-700 hover:bg-red-50'
                                : 'border-gray-200 bg-gray-100 opacity-50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => isAvailable && setSelectedTable(table.tableNumber)}
                              disabled={!isAvailable}
                              className="w-full text-center mb-2 relative"
                            >
                              {isCurrentTable && (
                                <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                                  Actuelle
                                </div>
                              )}
                              <div className="text-lg mb-1">Table {table.tableNumber}</div>
                              <div className={`text-sm ${isFull ? 'text-red-600' : isCurrentTable ? 'text-green-600' : 'text-gray-600'}`}>
                                {table.totalSeats}/10
                              </div>
                            </button>
                            
                            {/* Liste des participants */}
                            <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                              {table.participants.length > 0 ? (
                                table.participants.map((participant, index) => (
                                  <div 
                                    key={index}
                                    className={`text-xs p-1.5 rounded flex items-center justify-between ${
                                      participant.userId === user.id
                                        ? 'bg-green-100 text-green-900 font-medium'
                                        : 'bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <span className="truncate">
                                      {participant.name}
                                      <span className="text-gray-600"> ({participant.numberOfGuests})</span>
                                      {participant.userId === user.id && ' ✓'}
                                    </span>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveParticipant(table.tableNumber, participant.userId, participant.name)}
                                        className="ml-1 text-red-600 hover:text-red-800 flex-shrink-0"
                                        title="Supprimer ce participant"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-400 italic text-center py-1">Vide</p>
                              )}
                              
                              {/* Admin: Add button */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddModalTable(table.tableNumber);
                                    setShowAddModal(true);
                                  }}
                                  className="w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mt-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Ajouter
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTable}
                  className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'En cours...' : isRegistered ? 'Modifier mon inscription' : 'S\'inscrire'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Admin: Add Participant Modal */}
      {showAddModal && addModalTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-gray-900">Ajouter un participant - Table {addModalTable}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Nom du participant *
                </label>
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Nombre de places *
                </label>
                <select
                  value={newParticipantGuests}
                  onChange={(e) => setNewParticipantGuests(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value={1}>1 personne</option>
                  <option value={2}>2 personnes</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddParticipant}
                  disabled={!newParticipantName || isSubmitting || !isAdmin}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
