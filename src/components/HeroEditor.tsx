import { useState } from 'react';
import { Edit, Save, X, Image } from 'lucide-react';

interface HeroEditorProps {
  accessToken: string;
}

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  imageUrl: string;
}

export function HeroEditor({ accessToken }: HeroEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<HeroContent>({
    title: 'Amicale des Sapeurs Pompiers',
    subtitle: 'de Tourlaville',
    description: 'Solidarité, Entraide et Convivialité au service de nos Sapeurs Pompiers',
    buttonText: 'Découvrir notre mission',
    imageUrl: 'https://images.unsplash.com/photo-1708451145511-7d84e4033df1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXJlZmlnaHRlcnMlMjB0cnVja3xlbnwxfHx8fDE3NjU0MzgzNDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Save to localStorage
      localStorage.setItem('heroContent', JSON.stringify(content));
      
      setMessage({ type: 'success', text: 'Contenu de la page d\'accueil enregistré avec succès !' });
      setIsEditing(false);
      
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving hero content:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
    // Reload content from localStorage if exists
    const saved = localStorage.getItem('heroContent');
    if (saved) {
      setContent(JSON.parse(saved));
    }
  };

  if (!isEditing) {
    return (
      <section className="py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Edit className="w-6 h-6 text-red-700" />
                <h3 className="text-2xl text-gray-900">Éditer la page d'accueil (non connectée)</h3>
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
              Personnalisez le contenu visible par les visiteurs non connectés (Hero/Bandeau principal)
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 border-2 border-red-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Edit className="w-6 h-6 text-red-700" />
              <h3 className="text-2xl text-gray-900">Éditer la page d'accueil (non connectée)</h3>
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
            {/* Title */}
            <div>
              <label className="block text-gray-700 mb-2">Titre principal</label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                placeholder="Amicale des Sapeurs Pompiers"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-gray-700 mb-2">Sous-titre</label>
              <input
                type="text"
                value={content.subtitle}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                placeholder="de Tourlaville"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={content.description}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                placeholder="Solidarité, Entraide et Convivialité au service de nos Sapeurs Pompiers"
              />
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-gray-700 mb-2">Texte du bouton</label>
              <input
                type="text"
                value={content.buttonText}
                onChange={(e) => setContent({ ...content, buttonText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                placeholder="Découvrir notre mission"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-gray-700 mb-2 flex items-center space-x-2">
                <Image className="w-4 h-4" />
                <span>URL de l'image de fond</span>
              </label>
              <input
                type="url"
                value={content.imageUrl}
                onChange={(e) => setContent({ ...content, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                placeholder="https://..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Utilisez une URL d'image (Unsplash, etc.). Dimensions recommandées : 1920x600px
              </p>
              {content.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={content.imageUrl} 
                    alt="Aperçu" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23ddd" width="400" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}
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
