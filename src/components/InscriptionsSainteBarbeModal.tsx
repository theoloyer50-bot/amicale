import React, { useState, useEffect } from 'react';
import { Calendar, X, Users, Lock, AlertCircle, UserPlus, Trash2 } from 'lucide-react';
import {
  addManualSainteBarbeReservation,
  getEventRegistrationStatus,
  getMySainteBarbeRegistration,
  listSainteBarbeTables,
  removeSainteBarbeReservation,
  saveSainteBarbeRegistration,
  SainteBarbeReservation,
} from '../utils/firebase/siteData';

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

const MAX_GUESTS = 2;

export function InscriptionsSainteBarbeModal({ isOpen, onClose, user, accessToken }: InscriptionsSainteBarbeModalProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const numberOfGuests = numberOfAdults;
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({ isOpen: false, closedMessage: 'Chargement...' });
  const [myRegistration, setMyRegistration] = useState<(SainteBarbeReservation & { tableNumber: number }) | null>(null);
  const [myTable, setMyTable] = useState<Table | null>(null);
  
  // Admin states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTable, setAddModalTable] = useState<number | null>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantGuests, setNewParticipantGuests] = useState(1); // max 2 per participant

  const isAdmin = user.role === 'admin' || user.isAdmin;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchRegistrationStatus();
      fetchMyRegistration();
      fetchTables();
    }
  }, [isOpen]);

  const fetchRegistrationStatus = async () => {
    try {
      setRegistrationStatus(await getEventRegistrationStatus('sainte-barbe'));
    } catch (error) {
      console.error('Error fetching registration status:', error);
    }
  };

  const fetchMyRegistration = async () => {
    try {
      const [registration, allTables] = await Promise.all([
        getMySainteBarbeRegistration(user.id),
        listSainteBarbeTables(),
      ]);
      if (registration) {
        const table = allTables.find((item) => item.tableNumber === registration.tableNumber);
        setMyRegistration(registration);
        setMyTable(table || null);
        setNumberOfAdults(registration.numberOfAdults ?? registration.numberOfGuests);
        setSelectedTable(registration.tableNumber);
      } else {
        setMyRegistration(null);
        setMyTable(null);
        setNumberOfAdults(1);
      }
    } catch (error) {
      console.error('Error fetching my registration:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement de votre inscription');
    }
  };

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const data = await listSainteBarbeTables();
      setTables(data);
      const userRegistered = data.some((table: Table) =>
          table.participants.some(p => p.userId === user.id)
        );
      setIsRegistered(userRegistered);
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

    if (numberOfAdults < 1 || numberOfAdults > 2) {
      setError('Une inscription doit inclure 1 ou 2 adultes.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveSainteBarbeRegistration(selectedTable, numberOfAdults);
      setIsRegistered(true);
      setSuccessMessage('Inscription réussie !');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchMyRegistration();
      await fetchTables();
    } catch (error) {
      console.error('Error submitting registration:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
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
      await addManualSainteBarbeReservation(addModalTable, newParticipantName, newParticipantGuests);
      setSuccessMessage('Participant ajouté avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowAddModal(false);
      setNewParticipantName('');
      setNewParticipantGuests(1);
      setAddModalTable(null);
      await fetchTables();
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
      await removeSainteBarbeReservation(tableNumber, participantUserId);
      setSuccessMessage('Participant retiré avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchTables();
    } catch (error) {
      console.error('Error removing participant:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="sainte-barbe-title" className="w-full max-w-7xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-red-900 via-red-800 to-rose-700 px-5 py-5 text-white sm:px-7">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/20">
              <Calendar className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-100">Événement de l’amicale</p>
              <h2 id="sainte-barbe-title" className="mt-1 text-2xl font-bold sm:text-3xl">Sainte-Barbe</h2>
              <p className="mt-1 hidden text-sm text-red-100 sm:block">Choisissez votre table et le nombre d’adultes présents.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer l’inscription Sainte-Barbe"
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-92px)] overflow-y-auto bg-slate-50 p-4 sm:p-7">
          {successMessage && (
            <div role="status" className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm">
              <Users className="h-5 w-5 flex-shrink-0 text-emerald-700" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {error && registrationStatus.isOpen && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!registrationStatus.isOpen ? (
            <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="rounded-xl bg-amber-100 p-3">
                <Lock className="h-6 w-6 flex-shrink-0 text-amber-700" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-amber-950">Inscriptions fermées</h3>
                <p className="text-amber-900">
                  {registrationStatus.closedMessage || 'Les inscriptions ne sont pas encore ouvertes.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {isRegistered && myRegistration && myTable && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Inscription confirmée</p>
                        <h3 className="mt-1 text-xl font-bold text-slate-900">Votre place est réservée</h3>
                        <p className="mt-1 text-sm text-slate-600">Vous pouvez modifier votre table ou le nombre d’adultes ci-dessous.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Table</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">N° {myRegistration.tableNumber}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Places</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{myRegistration.numberOfGuests}<span className="ml-1 text-sm font-medium text-slate-500">/ 10</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Votre groupe</h3>
                    <p className="mt-1 text-sm text-slate-600">Indiquez le nombre d’adultes, vous inclus.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2].map((count) => (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={numberOfAdults === count}
                        onClick={() => setNumberOfAdults(count)}
                        className={`flex items-center justify-between rounded-xl border-2 px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-red-300 ${
                          numberOfAdults === count
                            ? 'border-red-700 bg-red-50 text-red-900 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50/50'
                        }`}
                      >
                        <span>
                          <span className="block font-semibold">{count} {count === 1 ? 'adulte' : 'adultes'}</span>
                          <span className="mt-0.5 block text-sm opacity-75">{count === 1 ? 'Vous-même' : 'Vous et un accompagnant'}</span>
                        </span>
                        <Users className={`h-5 w-5 ${numberOfAdults === count ? 'text-red-700' : 'text-slate-400'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="table-selection-title">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 id="table-selection-title" className="text-lg font-bold text-slate-900">Choisissez votre table</h3>
                      <p className="mt-1 text-sm text-slate-600">Jusqu’à 10 places et 5 réservations par table.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">Votre table</span>
                      <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-800">Sélectionnée</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">Indisponible</span>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-red-700 border-t-transparent"></div>
                      <p className="mt-3 text-sm text-slate-500">Chargement des tables...</p>
                    </div>
                  ) : tables.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-slate-600">
                      Aucune table n’est disponible pour le moment.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                      {tables.map((table) => {
                        const isCurrentTable = isRegistered && myRegistration && table.tableNumber === myRegistration.tableNumber;
                        const availableSeats = isCurrentTable ? table.totalSeats - myRegistration.numberOfGuests : table.totalSeats;
                        const hasReservationSlot = Boolean(isCurrentTable) || table.participants.length < 5;
                        const isAvailable = hasReservationSlot && availableSeats + numberOfGuests <= 10;
                        const isFull = table.totalSeats >= 10 || table.participants.length >= 5;
                        const isSelectedTable = selectedTable === table.tableNumber;
                        
                        return (
                          <div
                            key={table.tableNumber}
                            className={`rounded-2xl border p-3 transition-all ${
                              isCurrentTable
                                ? 'border-emerald-300 bg-emerald-50/60 shadow-sm'
                                : isSelectedTable
                                ? 'border-red-300 bg-red-50/60 shadow-md ring-2 ring-red-100'
                                : isFull
                                ? 'border-slate-200 bg-slate-100/70'
                                : isAvailable
                                ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md'
                                : 'border-slate-200 bg-slate-100/70 opacity-60'
                            }`}
                          >
                            <button
                              type="button"
                              aria-pressed={isSelectedTable}
                              aria-label={`Sélectionner la table ${table.tableNumber}, ${table.totalSeats} places occupées sur 10`}
                              onClick={() => isAvailable && setSelectedTable(table.tableNumber)}
                              disabled={!isAvailable}
                              className="w-full text-left focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                            >
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <span className="text-base font-bold text-slate-900">Table {table.tableNumber}</span>
                                {isCurrentTable ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Actuelle</span>
                                ) : isSelectedTable ? (
                                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-800">Choisie</span>
                                ) : !isAvailable ? (
                                  <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Indisponible</span>
                                ) : null}
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className={`text-2xl font-bold ${isFull ? 'text-red-700' : isCurrentTable ? 'text-emerald-700' : 'text-slate-800'}`}>{table.totalSeats}</span>
                                <span className="text-xs font-medium text-slate-500">places sur 10</span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all ${isFull ? 'bg-red-600' : isCurrentTable ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(100, (table.totalSeats / 10) * 100)}%` }}
                                />
                              </div>
                            </button>
                            
                            <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                              {table.participants.length > 0 ? (
                                table.participants.map((participant, index) => (
                                  <div 
                                    key={index}
                                    className={`flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 text-xs ${
                                      participant.userId === user.id
                                        ? 'bg-emerald-100 font-semibold text-emerald-900'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    <span className="min-w-0 truncate">
                                      {participant.name}
                                      <span className="ml-1 text-slate-500">({participant.numberOfGuests})</span>
                                      {participant.userId === user.id && ' ✓'}
                                    </span>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveParticipant(table.tableNumber, participant.userId, participant.name)}
                                        className="flex-shrink-0 rounded p-1 text-red-600 transition hover:bg-red-100 hover:text-red-800"
                                        title="Supprimer ce participant"
                                        aria-label={`Retirer ${participant.name} de la table ${table.tableNumber}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="py-2 text-center text-xs italic text-slate-400">Aucune inscription</p>
                              )}
                              
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddModalTable(table.tableNumber);
                                    setShowAddModal(true);
                                  }}
                                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-red-300 py-2 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  Ajouter un participant
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
                  disabled={isSubmitting || !selectedTable || numberOfGuests > 10}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-800 to-red-700 px-5 py-4 font-bold text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'En cours...' : isRegistered ? 'Modifier mon inscription' : 'Confirmer mon inscription'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Admin: Add Participant Modal */}
      {showAddModal && addModalTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="add-participant-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-red-900 to-red-700 px-5 py-4 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-100">Table {addModalTable}</p>
                <h3 id="add-participant-title" className="mt-1 text-lg font-bold">Ajouter un participant</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} aria-label="Fermer" className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nom du participant *
                </label>
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre de places *
                </label>
                <select
                  value={newParticipantGuests}
                  onChange={(e) => setNewParticipantGuests(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value={1}>1 personne</option>
                  <option value={2}>2 personnes</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddParticipant}
                  disabled={!newParticipantName || isSubmitting || !isAdmin}
                  className="flex-1 rounded-xl bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
