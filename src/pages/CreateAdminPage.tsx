import React from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { CreateUserModal } from '../components/CreateUserModal';

interface CreateAdminPageProps {
  onNavigateHome: () => void;
}

export function CreateAdminPage({ onNavigateHome }: CreateAdminPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-red-700 hover:text-red-800 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </button>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-8 h-8 text-red-700" />
            <h2 className="text-3xl text-gray-900">Créer un nouveau compte</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>
              Cette page permet aux administrateurs de créer directement des comptes utilisateurs.
            </p>
            <p>
              Utilisez le panneau d'administration pour accéder à cette fonctionnalité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
