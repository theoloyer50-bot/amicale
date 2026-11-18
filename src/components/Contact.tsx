import { MapPin, Instagram } from 'lucide-react';

interface ContactProps {
  isModal?: boolean;
}

export function Contact({ isModal = false }: ContactProps) {
  const sectionClasses = isModal ? "" : "py-20 bg-gray-50";
  const containerClasses = isModal ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <section id="contact" className={sectionClasses}>
      <div className={containerClasses}>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
            Nous Contacter
          </h2>
          <p className="text-xl text-gray-600">
            Une question ? Envie de nous rejoindre ? N'hésitez pas à nous contacter
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            <h3 className="text-2xl text-gray-900 mb-6">Informations de contact</h3>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <MapPin className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1">Adresse</h4>
                <p className="text-gray-600">
                  401 Rue du Capitaine Rolland Picquot<br />
                  50110 Cherbourg-en-Cotentin
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 mb-3">Réseaux sociaux</h4>
              <div className="space-y-3">
                <a
                  href="https://www.instagram.com/cis.tourlaville/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-red-700 hover:text-red-800"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Suivez-nous sur Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}