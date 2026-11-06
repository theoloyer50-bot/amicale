import React from 'react';
import { AdminSetupInstructions } from '../components/AdminSetupInstructions';
import { ArrowLeft } from 'lucide-react';

interface AdminSetupProps {
  onNavigateHome: () => void;
}

export function AdminSetup({ onNavigateHome }: AdminSetupProps) {
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
        <AdminSetupInstructions />
      </div>
    </div>
  );
}
