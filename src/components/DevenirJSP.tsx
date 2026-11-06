import { useState, useEffect } from 'react';
import { Users, GraduationCap, Heart, Trophy } from 'lucide-react';

interface DevenirJSPContent {
  title: string;
  subtitle: string;
}

interface DevenirJSPProps {
  isModal?: boolean;
}

export function DevenirJSP({ isModal = false }: DevenirJSPProps) {
  const [content, setContent] = useState<DevenirJSPContent>({
    title: 'Devenir Jeune Sapeur-Pompier',
    subtitle: 'Rejoins les Jeunes Sapeurs-Pompiers et découvre les valeurs du courage, de l\'entraide et de la solidarité',
  });

  useEffect(() => {
    const saved = localStorage.getItem('devenirJSPContent');
    if (saved) {
      try {
        const parsedContent = JSON.parse(saved);
        setContent({
          title: parsedContent.title || content.title,
          subtitle: parsedContent.subtitle || content.subtitle,
        });
      } catch (error) {
        console.error('Error loading JSP content:', error);
      }
    }
  }, []);

  const sectionClasses = isModal ? "" : "py-20 bg-white";
  const containerClasses = isModal ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <section id="devenir-jsp" className={sectionClasses}>
      <div className={containerClasses}>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
            {content.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Age */}
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">11-18 ans</h3>
            <p className="text-gray-600">
              Ouvert aux jeunes de 11 à 18 ans, motivés et engagés
            </p>
          </div>

          {/* Formation */}
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">Formation</h3>
            <p className="text-gray-600">
              Apprentissage des techniques de secours et de lutte contre l'incendie
            </p>
          </div>

          {/* Valeurs */}
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">Valeurs</h3>
            <p className="text-gray-600">
              Esprit d'équipe, discipline, courage et solidarité
            </p>
          </div>

          {/* Compétition */}
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">Compétitions</h3>
            <p className="text-gray-600">
              Participe aux compétitions sportives et techniques régionales
            </p>
          </div>
        </div>

        {/* Programme */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-8">
          <h3 className="text-2xl text-gray-900 mb-6 text-center">Notre Programme</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-700 rounded-full mt-2"></div>
                <p className="text-gray-700">Initiation aux gestes de premiers secours (PSC1)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-700 rounded-full mt-2"></div>
                <p className="text-gray-700">Formation aux techniques d'incendie</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-700 rounded-full mt-2"></div>
                <p className="text-gray-700">Activités sportives et parcours d'obstacles</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-700 rounded-full mt-2"></div>
                <p className="text-gray-700">Manœuvres et exercices pratiques</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-700 rounded-full mt-2"></div>
                <p className="text-gray-700">Participation aux cérémonies officielles</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-700 rounded-full mt-2"></div>
                <p className="text-gray-700">Camps d'été et sorties éducatives</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}