import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';

interface HomePageEditorProps {
  accessToken: string;
}

interface HomePageContent {
  title: string;
  subtitle: string;
  description: string;
  sainteBarbeTitle: string;
  sainteBarbeDescription: string;
  noelTitle: string;
  noelDescription: string;
  mesEnfantsTitle: string;
  mesEnfantsDescription: string;
}

export function HomePageEditor({ accessToken }: HomePageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<HomePageContent>({
    title: 'Amicale des Sapeurs Pompiers',
    subtitle: 'Tourlaville',
    description: 'Inscrivez-vous à nos événements',
    sainteBarbeTitle: 'Sainte-Barbe',
    sainteBarbeDescription: 'Inscrivez-vous à la célébration de la Sainte-Barbe, patronne des sapeurs-pompiers',
    noelTitle: 'Noël',
    noelDescription: 'Inscrivez-vous à la fête de Noël de l\'amicale avec vos enfants',
    mesEnfantsTitle: 'Mes Enfants',
    mesEnfantsDescription: 'Déclarez vos enfants pour faciliter l\'organisation des événements',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Save to localStorage for now (you could also save to Supabase)
      localStorage.setItem('homePageContent', JSON.stringify(content));
      
      setMessage({ type: 'success', text: 'Contenu enregistré avec succès !' });
      setIsEditing(false);
      
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving content:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
    // Reload content from localStorage if exists
    const saved = localStorage.getItem('homePageContent');
    if (saved) {
      setContent(JSON.parse(saved));
    }
  };

  if (!isEditing) {
    return (
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Edit className="w-6 h-6 text-red-700" />
                <h3 className="text-2xl text-gray-900">Éditer la page d'accueil</h3>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>
            <p className="text-gray-600">
              Cliquez sur "Modifier" pour personnaliser les textes de la page d'accueil
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 border-2 border-red-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Edit className="w-6 h-6 text-red-700" />
              <h3 className="text-2xl text-gray-900">Éditer la page d'accueil</h3>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Header Section */}
            <div className="border-b pb-6">
              <h4 className="text-lg text-gray-900 mb-4">En-tête de la page</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Titre principal</label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Sous-titre</label>
                  <input
                    type="text"
                    value={content.subtitle}
                    onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={content.description}
                    onChange={(e) => setContent({ ...content, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sainte-Barbe Button */}
            <div className="border-b pb-6">
              <h4 className="text-lg text-gray-900 mb-4">Bouton Sainte-Barbe</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={content.sainteBarbeTitle}
                    onChange={(e) => setContent({ ...content, sainteBarbeTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={content.sainteBarbeDescription}
                    onChange={(e) => setContent({ ...content, sainteBarbeDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Noël Button */}
            <div className="border-b pb-6">
              <h4 className="text-lg text-gray-900 mb-4">Bouton Noël</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={content.noelTitle}
                    onChange={(e) => setContent({ ...content, noelTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={content.noelDescription}
                    onChange={(e) => setContent({ ...content, noelDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Mes Enfants Button */}
            <div className="pb-6">
              <h4 className="text-lg text-gray-900 mb-4">Bouton Mes Enfants</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={content.mesEnfantsTitle}
                    onChange={(e) => setContent({ ...content, mesEnfantsTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={content.mesEnfantsDescription}
                    onChange={(e) => setContent({ ...content, mesEnfantsDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
