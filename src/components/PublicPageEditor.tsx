import { useState, useEffect } from 'react';
import { Save, Eye, Info } from 'lucide-react';

interface PublicPageContent {
  apropos: {
    mission: string;
    activites: string[];
  };
}

export function PublicPageEditor() {
  const [content, setContent] = useState<PublicPageContent>({
    apropos: {
      mission: "L'Amicale des Sapeurs Pompiers de Tourlaville est une association dont la mission principale est de soutenir et d'accompagner nos sapeurs-pompiers volontaires et professionnels dans leur engagement au service de la population. Nous œuvrons pour renforcer les liens de solidarité et de convivialité au sein de notre communauté.",
      activites: [
        "Organisation d'événements festifs et conviviaux (Sainte-Barbe, Noël, etc.)",
        "Soutien aux familles des sapeurs-pompiers",
        "Participation aux cérémonies officielles",
        "Actions de sensibilisation auprès du public",
        "Collecte de fonds pour l'amélioration des équipements",
      ],
    },
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load content from localStorage
    const saved = localStorage.getItem('publicPageContent');
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading public page content:', error);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('publicPageContent', JSON.stringify(content));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddActivity = () => {
    setContent({
      ...content,
      apropos: {
        ...content.apropos,
        activites: [...content.apropos.activites, "Nouvelle activité"],
      },
    });
  };

  const handleUpdateActivity = (index: number, value: string) => {
    const newActivites = [...content.apropos.activites];
    newActivites[index] = value;
    setContent({
      ...content,
      apropos: {
        ...content.apropos,
        activites: newActivites,
      },
    });
  };

  const handleRemoveActivity = (index: number) => {
    const newActivites = content.apropos.activites.filter((_, i) => i !== index);
    setContent({
      ...content,
      apropos: {
        ...content.apropos,
        activites: newActivites,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-900 mb-1">Édition du contenu public</h4>
            <p className="text-sm text-blue-700">
              Modifiez le contenu affiché aux visiteurs non connectés dans le modal "À Propos".
              Les sections "Devenir JSP" et "Contact" ont leurs propres éditeurs.
            </p>
          </div>
        </div>
      </div>

      {/* Section À Propos */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl text-gray-900 mb-6 flex items-center gap-2">
          <Eye className="w-5 h-5 text-red-700" />
          Section "À Propos"
        </h3>

        {/* Mission */}
        <div className="mb-6">
          <label className="block text-gray-900 mb-2">
            Notre Mission
          </label>
          <textarea
            value={content.apropos.mission}
            onChange={(e) => setContent({
              ...content,
              apropos: {
                ...content.apropos,
                mission: e.target.value,
              },
            })}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
            placeholder="Décrivez la mission de l'amicale..."
          />
        </div>

        {/* Activités */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-gray-900">
              Nos Activités
            </label>
            <button
              onClick={handleAddActivity}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              + Ajouter une activité
            </button>
          </div>
          <div className="space-y-3">
            {content.apropos.activites.map((activite, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={activite}
                  onChange={(e) => handleUpdateActivity(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  placeholder="Description de l'activité..."
                />
                <button
                  onClick={() => handleRemoveActivity(index)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition ${
            isSaved
              ? 'bg-green-600 text-white'
              : 'bg-red-700 text-white hover:bg-red-800'
          }`}
        >
          <Save className="w-5 h-5" />
          {isSaved ? 'Sauvegardé !' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  );
}
