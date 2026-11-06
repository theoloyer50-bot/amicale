import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';

interface DevenirJSPEditorProps {
  accessToken: string;
}

interface DevenirJSPContent {
  title: string;
  subtitle: string;
}

export function DevenirJSPEditor({ accessToken }: DevenirJSPEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<DevenirJSPContent>({
    title: 'Devenir Jeune Sapeur-Pompier',
    subtitle: 'Rejoins les Jeunes Sapeurs-Pompiers et découvre les valeurs du courage, de l\'entraide et de la solidarité',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      localStorage.setItem('devenirJSPContent', JSON.stringify(content));
      
      setMessage({ type: 'success', text: 'Contenu de la section JSP enregistré avec succès !' });
      setIsEditing(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving JSP content:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
    const saved = localStorage.getItem('devenirJSPContent');
    if (saved) {
      const parsedContent = JSON.parse(saved);
      setContent({
        title: parsedContent.title || content.title,
        subtitle: parsedContent.subtitle || content.subtitle,
      });
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
                <h3 className="text-2xl text-gray-900">Éditer la section "Devenir JSP"</h3>
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
              Personnalisez les informations sur le recrutement des Jeunes Sapeurs-Pompiers
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
              <h3 className="text-2xl text-gray-900">Éditer la section "Devenir JSP"</h3>
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
            <div>
              <label className="block text-gray-700 mb-2">Titre</label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Sous-titre</label>
              <textarea
                value={content.subtitle}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
              />
            </div>

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
