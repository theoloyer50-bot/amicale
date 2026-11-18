import { useState, useEffect } from 'react';
import { Users, GraduationCap, Mail, Info, Flame, ArrowRight } from 'lucide-react';
import { DevenirJSP } from './DevenirJSP';
import { Contact } from './Contact';
import { getSiteContent } from '../utils/firebase/siteContent';
import './HomePage.css';

interface PublicPageContent {
  apropos: {
    mission: string;
    activites: string[];
  };
}

export function PublicHomePage() {
  const [activeModal, setActiveModal] = useState<'apropos' | 'jsp' | 'contact' | null>(null);
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

  useEffect(() => {
    getSiteContent<PublicPageContent>('public')
      .then((saved) => { if (saved) setContent((current) => ({ ...current, ...saved })); })
      .catch((error) => console.error('Error loading public page content:', error));
  }, []);

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <section className="public-home">
        <div className="homepage-shell">
          <div className="public-hero">
            <div className="public-hero-content">
              <p className="public-hero-kicker"><span /> Solidarité · Entraide · Convivialité</p>
              <h2 className="public-hero-title">L'esprit d'équipe au cœur de notre amicale</h2>
              <p className="public-hero-description">
                Une association qui rassemble et accompagne les sapeurs-pompiers et leurs familles, dans les moments forts comme au quotidien.
              </p>
              <button
                onClick={() => setActiveModal('apropos')}
                className="public-hero-cta"
              >
                Découvrir l'Amicale
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="public-hero-emblem" aria-hidden="true">
              <Flame />
            </div>
          </div>

          <div className="public-section-heading">
            <p className="public-section-eyebrow">Bienvenue</p>
            <h3>Découvrez l'Amicale</h3>
            <p>Explorez nos actions, nos engagements et les façons de nous rejoindre.</p>
          </div>

          <div className="public-feature-grid">
            <button
              onClick={() => setActiveModal('apropos')}
              className="public-feature-card"
            >
              <div className="public-feature-icon">
                <Info aria-hidden="true" />
              </div>
              <h4>À Propos</h4>
              <p>
                Découvrez notre mission, nos valeurs et notre histoire
              </p>
              <span className="public-feature-link">En savoir plus <ArrowRight aria-hidden="true" size={17} /></span>
            </button>

            <button
              onClick={() => setActiveModal('jsp')}
              className="public-feature-card"
            >
              <div className="public-feature-icon">
                <GraduationCap aria-hidden="true" />
              </div>
              <h4>Devenir JSP</h4>
              <p>
                Rejoignez les Jeunes Sapeurs-Pompiers et vivez une aventure unique
              </p>
              <span className="public-feature-link">Découvrir <ArrowRight aria-hidden="true" size={17} /></span>
            </button>

            <button
              onClick={() => setActiveModal('contact')}
              className="public-feature-card"
            >
              <div className="public-feature-icon">
                <Mail aria-hidden="true" />
              </div>
              <h4>Contact</h4>
              <p>
                Posez vos questions ou rejoignez-nous
              </p>
              <span className="public-feature-link">Nous écrire <ArrowRight aria-hidden="true" size={17} /></span>
            </button>
          </div>
        </div>
      </section>

      {/* À Propos Modal */}
      {activeModal === 'apropos' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-gradient-to-r from-red-700 to-red-900 text-white px-8 py-6 rounded-t-2xl flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <Info className="w-8 h-8" />
                <h2 className="text-3xl">À Propos de l'Amicale</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8">
              <div className="space-y-8">
                {/* Mission */}
                <div className="bg-red-50 rounded-lg p-6">
                  <h3 className="text-2xl text-gray-900 mb-4">Notre Mission</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {content.apropos.mission}
                  </p>
                </div>

                {/* Valeurs */}
                <div>
                  <h3 className="text-2xl text-gray-900 mb-6">Nos Valeurs</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white border-2 border-red-200 rounded-lg p-6 text-center">
                      <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl text-gray-900 mb-2">Solidarité</h4>
                      <p className="text-gray-600">
                        Soutien mutuel et entraide entre tous les membres
                      </p>
                    </div>
                    
                    <div className="bg-white border-2 border-red-200 rounded-lg p-6 text-center">
                      <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h4 className="text-xl text-gray-900 mb-2">Entraide</h4>
                      <p className="text-gray-600">
                        Accompagnement et soutien dans tous les moments
                      </p>
                    </div>
                    
                    <div className="bg-white border-2 border-red-200 rounded-lg p-6 text-center">
                      <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-xl text-gray-900 mb-2">Convivialité</h4>
                      <p className="text-gray-600">
                        Moments de partage et d'échange chaleureux
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activités */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6">
                  <h3 className="text-2xl text-gray-900 mb-4">Nos Activités</h3>
                  <ul className="space-y-3">
                    {content.apropos.activites.map((activite, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-700 rounded-full mt-2"></div>
                        <p className="text-gray-700">{activite}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSP Modal */}
      {activeModal === 'jsp' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-gradient-to-r from-red-700 to-red-900 text-white px-8 py-6 rounded-t-2xl flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8" />
                <h2 className="text-3xl">Devenir Jeune Sapeur-Pompier</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8">
              <DevenirJSP isModal={true} />
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-gradient-to-r from-red-700 to-red-900 text-white px-8 py-6 rounded-t-2xl flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8" />
                <h2 className="text-3xl">Nous Contacter</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8">
              <Contact isModal={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}