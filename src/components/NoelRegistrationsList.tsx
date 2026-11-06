import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, Baby } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b`;

interface Registration {
  userId: string;
  email: string;
  name: string;
  numberOfAdults: number;
  numberOfChildren: number;
  comments: string;
  registeredAt: string;
}

interface Stats {
  totalRegistrations: number;
  totalAdults: number;
  totalChildren: number;
  totalParticipants: number;
}

interface NoelRegistrationsListProps {
  accessToken: string;
}

export function NoelRegistrationsList({ accessToken }: NoelRegistrationsListProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/events/noel/registrations`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        // Don't show error if it's just a permission issue
        if (response.status === 403) {
          console.log('NoelRegistrationsList: User does not have organizer/admin access');
          return; // Silently fail for permission issues
        }
        throw new Error(data.error || 'Erreur lors du chargement des inscriptions');
      }

      const data = await response.json();
      setRegistrations(data.registrations || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching Noel registrations:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-2xl text-gray-900 mb-4">📋 Inscriptions Arbre de Noël</h2>
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Familles</p>
                    <p className="text-2xl text-blue-900">{stats.totalRegistrations}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Adultes</p>
                    <p className="text-2xl text-green-900">{stats.totalAdults}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Enfants</p>
                    <p className="text-2xl text-purple-900">{stats.totalChildren}</p>
                  </div>
                  <Baby className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Total</p>
                    <p className="text-2xl text-red-900">{stats.totalParticipants}</p>
                  </div>
                  <Users className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement des inscriptions...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune inscription pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                    Adultes
                  </th>
                  <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                    Enfants
                  </th>
                  <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Commentaires
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration) => (
                  <tr key={registration.userId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{registration.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{registration.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                        <Users className="w-3 h-3 mr-1" />
                        {registration.numberOfAdults}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                        <Baby className="w-3 h-3 mr-1" />
                        {registration.numberOfChildren}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                        {registration.numberOfAdults + registration.numberOfChildren}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(registration.registeredAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {registration.comments ? (
                        <div className="flex items-start text-sm text-gray-600 max-w-xs">
                          <MessageSquare className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{registration.comments}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Aucun</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}