import React, { useState, useEffect } from 'react';
import { Baby, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

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
  parentUserId?: string;
  parentName?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  userId: string;
  email: string;
  name: string;
  status: string;
  role: string;
}

interface MesEnfantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  userName: string;
}

export function MesEnfantsModal({ isOpen, onClose, accessToken, userName }: MesEnfantsModalProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [parentUserId, setParentUserId] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchChildren();
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/children`, {
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
    } catch (error) {
      console.error('Error fetching children:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!nom.trim() || !prenom.trim() || !dateNaissance) {
      setError('Veuillez remplir tous les champs correctement');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          dateNaissance: dateNaissance,
          parentUserId: parentUserId || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }

      // Reset form and refresh list
      setNom('');
      setPrenom('');
      setDateNaissance('');
      setParentUserId('');
      setShowAddForm(false);
      await fetchChildren();
    } catch (error) {
      console.error('Error adding child:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'ajout');
    }
  };

  const handleUpdate = async (childId: string) => {
    if (!nom.trim() || !prenom.trim() || !dateNaissance) {
      setError('Veuillez remplir tous les champs correctement');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/children/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          dateNaissance: dateNaissance,
          parentUserId: parentUserId || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la modification');
      }

      // Reset form and refresh list
      setNom('');
      setPrenom('');
      setDateNaissance('');
      setParentUserId('');
      setEditingId(null);
      await fetchChildren();
    } catch (error) {
      console.error('Error updating child:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/children/${childId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      await fetchChildren();
    } catch (error) {
      console.error('Error deleting child:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const startEdit = (child: Child) => {
    setEditingId(child.id);
    setNom(child.nom);
    setPrenom(child.prenom);
    setDateNaissance(child.dateNaissance);
    setParentUserId(child.parentUserId || '');
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNom('');
    setPrenom('');
    setDateNaissance('');
    setParentUserId('');
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setNom('');
    setPrenom('');
    setDateNaissance('');
    setParentUserId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Baby className="w-8 h-8 text-red-700" />
            <div>
              <h2 className="text-3xl text-gray-900">Mes Enfants</h2>
              <p className="text-sm text-gray-600 mt-1">Bienvenue {userName} !</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Add Button */}
          {!showAddForm && !editingId && (
            <div className="mb-6">
              <button
                onClick={startAdd}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                Ajouter un enfant
              </button>
            </div>
          )}

          {/* Add/Edit Form */}
          {(showAddForm || editingId) && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-red-700">
              <h3 className="text-xl text-gray-900 mb-4">
                {editingId ? 'Modifier un enfant' : 'Ajouter un enfant'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                    placeholder="Nom de famille"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                    placeholder="Prénom"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Parent (optionnel)
                  </label>
                  <select
                    value={parentUserId}
                    onChange={(e) => setParentUserId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  >
                    <option value="">Aucun parent assigné</option>
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Enregistrer' : 'Ajouter'}
                </button>
                
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    cancelEdit();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Children List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <Baby className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Aucun enfant déclaré pour le moment.
              </p>
              <p className="text-gray-500 mt-2">
                Cliquez sur "Ajouter un enfant" pour commencer.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {children.map((child) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEdit(child)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h3 className="text-lg text-blue-900 mb-2">
              Pourquoi déclarer mes enfants ?
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>✅ Facilite l'organisation des événements (Arbre de Noël, etc.)</li>
              <li>✅ Permet de prévoir les cadeaux adaptés à l'âge</li>
              <li>✅ Aide à estimer le nombre de participants</li>
              <li>✅ Les superviseurs peuvent mieux planifier les activités</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
