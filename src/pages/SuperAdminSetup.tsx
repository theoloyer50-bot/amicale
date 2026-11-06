import React from 'react';
import { Crown, ArrowLeft } from 'lucide-react';

interface SuperAdminSetupProps {
  onNavigateHome: () => void;
}

export function SuperAdminSetup({ onNavigateHome }: SuperAdminSetupProps) {
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
            <Crown className="w-8 h-8 text-red-700" />
            <h2 className="text-3xl text-gray-900">Configuration Super Administrateur</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>
              Cette page est réservée à la configuration avancée du système.
            </p>
            <p>
              Pour configurer le premier administrateur, veuillez suivre les instructions dans la page de configuration administrateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
