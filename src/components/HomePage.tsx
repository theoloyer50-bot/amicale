import { Calendar, Gift, Baby, ArrowRight, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSiteContent } from '../utils/firebase/siteContent';
import './HomePage.css';

interface HomePageProps {
  onSainteBarbeClick: () => void;
  onNoelClick: () => void;
  onMesEnfantsClick: () => void;
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

export function HomePage({ onSainteBarbeClick, onNoelClick, onMesEnfantsClick }: HomePageProps) {
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
    getSiteContent<HomePageContent>('homepage')
      .then((saved) => { if (saved) setContent((current) => ({ ...current, ...saved })); })
      .catch((error) => console.error('Error loading homepage content:', error));
  }, []);

  return (
    <section id="evenements" className="member-home">
      <div className="homepage-shell">
        <div className="member-home-heading">
          <p className="member-home-kicker"><Users aria-hidden="true" size={16} /> Espace membres</p>
          <h1>
            {content.title}
          </h1>
          <p className="text-red-700">
            {content.subtitle}
          </p>
          <p>
            {content.description}
          </p>
        </div>

        <div className="member-event-grid">
          <button
            onClick={onSainteBarbeClick}
            className="member-event-card"
          >
              <div className="member-event-icon">
                <Calendar aria-hidden="true" />
              </div>
              <h2>
                {content.sainteBarbeTitle}
              </h2>
              <p>
                {content.sainteBarbeDescription}
              </p>
              <span className="member-event-action">S'inscrire <ArrowRight aria-hidden="true" size={17} /></span>
          </button>

          <button
            onClick={onNoelClick}
            className="member-event-card"
          >
              <div className="member-event-icon">
                <Gift aria-hidden="true" />
              </div>
              <h2>
                {content.noelTitle}
              </h2>
              <p>
                {content.noelDescription}
              </p>
              <span className="member-event-action">S'inscrire <ArrowRight aria-hidden="true" size={17} /></span>
          </button>

          <button
            onClick={onMesEnfantsClick}
            className="member-event-card"
          >
              <div className="member-event-icon">
                <Baby aria-hidden="true" />
              </div>
              <h2>
                {content.mesEnfantsTitle}
              </h2>
              <p>
                {content.mesEnfantsDescription}
              </p>
              <span className="member-event-action">Déclarer <ArrowRight aria-hidden="true" size={17} /></span>
          </button>
        </div>

        <div className="member-home-note">
          <p>
            Retrouvez ici vos inscriptions aux événements et vos démarches pour la famille.
          </p>
        </div>
      </div>
    </section>
  );
}