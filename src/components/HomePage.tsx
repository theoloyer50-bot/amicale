import { Calendar, Gift, FileText, Baby, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HomePageProps {
  onSainteBarbeClick: () => void;
  onNoelClick: () => void;
  onMesEnfantsClick: () => void;
  onAnnuaireClick: () => void;
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
  documentsTitle: string;
  documentsDescription: string;
}

export function HomePage({ onSainteBarbeClick, onNoelClick, onMesEnfantsClick, onAnnuaireClick }: HomePageProps) {
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
    documentsTitle: 'Documents',
    documentsDescription: 'Consultez et téléchargez les documents officiels de l\'amicale',
  });

  useEffect(() => {
    // Load content from localStorage if exists
    const saved = localStorage.getItem('homePageContent');
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading homepage content:', error);
      }
    }
  }, []);

  return (
    <section id="evenements" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl text-gray-900 mb-4">
            {content.title}
          </h1>
          <h2 className="text-2xl md:text-3xl text-red-700 mb-2">
            {content.subtitle}
          </h2>
          <p className="text-gray-600 text-lg">
            {content.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Sainte-Barbe Button */}
          <button
            onClick={onSainteBarbeClick}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-red-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 p-6 rounded-full group-hover:bg-red-700 transition-colors duration-300">
                <Calendar className="w-12 h-12 text-red-700 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <h3 className="text-2xl text-gray-900 group-hover:text-red-700 transition-colors duration-300">
                {content.sainteBarbeTitle}
              </h3>
              
              <p className="text-gray-600 text-sm">
                {content.sainteBarbeDescription}
              </p>
              
              <div className="pt-2">
                <span className="inline-block px-6 py-2 bg-red-700 text-white rounded-lg group-hover:bg-red-800 transition-colors duration-300">
                  S'inscrire →
                </span>
              </div>
            </div>
          </button>

          {/* Noël Button */}
          <button
            onClick={onNoelClick}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-red-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 p-6 rounded-full group-hover:bg-red-700 transition-colors duration-300">
                <Gift className="w-12 h-12 text-red-700 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <h3 className="text-2xl text-gray-900 group-hover:text-red-700 transition-colors duration-300">
                {content.noelTitle}
              </h3>
              
              <p className="text-gray-600 text-sm">
                {content.noelDescription}
              </p>
              
              <div className="pt-2">
                <span className="inline-block px-6 py-2 bg-red-700 text-white rounded-lg group-hover:bg-red-800 transition-colors duration-300">
                  S'inscrire →
                </span>
              </div>
            </div>
          </button>

          {/* Mes Enfants Button */}
          <button
            onClick={onMesEnfantsClick}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-red-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 p-6 rounded-full group-hover:bg-red-700 transition-colors duration-300">
                <Baby className="w-12 h-12 text-red-700 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <h3 className="text-2xl text-gray-900 group-hover:text-red-700 transition-colors duration-300">
                {content.mesEnfantsTitle}
              </h3>
              
              <p className="text-gray-600 text-sm">
                {content.mesEnfantsDescription}
              </p>
              
              <div className="pt-2">
                <span className="inline-block px-6 py-2 bg-red-700 text-white rounded-lg group-hover:bg-red-800 transition-colors duration-300">
                  Déclarer →
                </span>
              </div>
            </div>
          </button>

          {/* Annuaire Button (remplace Documents) */}
          <button
            onClick={onAnnuaireClick}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-red-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 p-6 rounded-full group-hover:bg-red-700 transition-colors duration-300">
                <Users className="w-12 h-12 text-red-700 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <h3 className="text-2xl text-gray-900 group-hover:text-red-700 transition-colors duration-300">
                Annuaire
              </h3>
              
              <p className="text-gray-600 text-sm">
                Accédez aux coordonnées des membres de l'amicale
              </p>
              
              <div className="pt-2">
                <span className="inline-block px-6 py-2 bg-red-700 text-white rounded-lg group-hover:bg-red-800 transition-colors duration-300">
                  Consulter →
                </span>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Vous devez être connecté pour vous inscrire aux événements
          </p>
        </div>
      </div>
    </section>
  );
}