import React, { useState, useEffect } from 'react';
import { Baby, Users, Calendar, Filter, TrendingUp, Trash2, UserPlus, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b`;

interface Child {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  age: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  under14: number;
  from14AndOver: number;
  ageRanges: {
    '0-3': number;
    '4-7': number;
    '8-11': number;
    '12-14': number;
    '15+': number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface ListeEnfantsProps {
  accessToken: string;
  userRole?: string;
}

export function ListeEnfants({ accessToken, userRole }: ListeEnfantsProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<'all' | 'under14' | '14plus'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newChildData, setNewChildData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchAllChildren();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [children, ageFilter, searchTerm]);

  const fetchAllChildren = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/all-children`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      const data = await response.json();
      setChildren(data.children || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching all children:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log('[fetchAllUsers] Fetching with token:', accessToken?.substring(0, 20) + '...');
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Si le token est invalide, déconnecter l'utilisateur
        if (response.status === 401) {
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          window.location.reload();
          return;
        }
        
        throw new Error(data.error || 'Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      // Map to the format expected by the component
      const mappedUsers = (data.users || []).map((user: any) => ({
        id: user.userId,
        email: user.email,
        name: user.name
      }));
      setAllUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching all users:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement des utilisateurs');
    }
  };

  const applyFilters = () => {
    let filtered = [...children];

    // Age filter
    if (ageFilter === 'under14') {
      filtered = filtered.filter(child => child.age < 14);
    } else if (ageFilter === '14plus') {
      filtered = filtered.filter(child => child.age >= 14);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(child =>
        child.nom.toLowerCase().includes(term) ||
        child.prenom.toLowerCase().includes(term) ||
        child.userName.toLowerCase().includes(term) ||
        child.userEmail.toLowerCase().includes(term)
      );
    }

    setFilteredChildren(filtered);
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    fetchAllUsers();
  };

  const handleAddChild = async () => {
    if (!selectedUserId || !newChildData.nom || !newChildData.prenom || !newChildData.dateNaissance) {
      setError('Tous les champs sont requis');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/children`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUserId,
          nom: newChildData.nom,
          prenom: newChildData.prenom,
          dateNaissance: newChildData.dateNaissance
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'ajout de l\'enfant');
      }

      await fetchAllChildren();
      setShowAddModal(false);
      setNewChildData({ nom: '', prenom: '', dateNaissance: '' });
      setSelectedUserId('');
      setSuccessMessage('Enfant ajouté avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error adding child:', error);
      setError(error instanceof Error ? error.message : 'Erreur d\'ajout');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChild = async (userId: string, childId: string, childName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${childName} ?`)) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/children/${userId}/${childId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      await fetchAllChildren();
      setSuccessMessage('Enfant supprimé avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting child:', error);
      setError(error instanceof Error ? error.message : 'Erreur de suppression');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Content */}
      <div className="px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Enfants</p>
                  <p className="text-3xl text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Moins de 14 ans</p>
                  <p className="text-3xl text-gray-900 mt-1">{stats.under14}</p>
                </div>
                <Baby className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">14 ans et plus</p>
                  <p className="text-3xl text-gray-900 mt-1">{stats.from14AndOver}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div>
                <p className="text-sm text-gray-600 mb-2">Répartition par âge</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">0-3 ans:</span>
                    <span className="text-orange-700">{stats.ageRanges['0-3']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">4-7 ans:</span>
                    <span className="text-orange-700">{stats.ageRanges['4-7']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">8-11 ans:</span>
                    <span className="text-orange-700">{stats.ageRanges['8-11']}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div>
                <p className="text-sm text-gray-600 mb-2">Adolescents</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">12-14 ans:</span>
                    <span className="text-red-700">{stats.ageRanges['12-14']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">15+ ans:</span>
                    <span className="text-red-700">{stats.ageRanges['15+']}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Add Button */}
        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition flex items-center gap-2 shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un enfant manuellement
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl text-gray-900">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Filtre par âge
              </label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
              >
                <option value="all">Tous les âges</option>
                <option value="under14">Moins de 14 ans</option>
                <option value="14plus">14 ans et plus</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, prénom, parent..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Add Child Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-6 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-8 h-8" />
                  <h2 className="text-2xl">Ajouter un enfant</h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                  aria-label="Fermer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Parent *
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                    >
                      <option value="">Sélectionnez un parent</option>
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={newChildData.nom}
                        onChange={(e) => setNewChildData({ ...newChildData, nom: e.target.value })}
                        placeholder="Nom de l'enfant"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={newChildData.prenom}
                        onChange={(e) => setNewChildData({ ...newChildData, prenom: e.target.value })}
                        placeholder="Prénom de l'enfant"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      value={newChildData.dateNaissance}
                      onChange={(e) => setNewChildData({ ...newChildData, dateNaissance: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    disabled={actionLoading}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddChild}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Ajout en cours...' : 'Ajouter l\'enfant'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Children Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Baby className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {searchTerm || ageFilter !== 'all' 
                ? 'Aucun enfant ne correspond aux critères de recherche.' 
                : 'Aucun enfant déclaré pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Prénom
                    </th>
                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                      Âge
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Email Parent
                    </th>
                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredChildren.map((child) => (
                    <tr key={child.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{child.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{child.prenom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                          child.age < 14 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {child.age} ans
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{child.userName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{child.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs ${
                          child.age <= 3 ? 'bg-pink-100 text-pink-800' :
                          child.age <= 7 ? 'bg-yellow-100 text-yellow-800' :
                          child.age <= 11 ? 'bg-orange-100 text-orange-800' :
                          child.age <= 14 ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {child.age <= 3 ? 'Petite enfance' :
                           child.age <= 7 ? 'Maternelle' :
                           child.age <= 11 ? 'Primaire' :
                           child.age <= 14 ? 'Collège' :
                           'Lycée+'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDeleteChild(child.userId, child.id, `${child.prenom} ${child.nom}`)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg hover:bg-red-50 transition"
                            title="Supprimer cet enfant"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results count */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Affichage de <strong>{filteredChildren.length}</strong> enfant{filteredChildren.length > 1 ? 's' : ''} 
                {children.length !== filteredChildren.length && ` sur ${children.length} au total`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
