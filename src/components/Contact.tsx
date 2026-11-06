import { Mail, Phone, MapPin, Facebook } from 'lucide-react';

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
                  Centre de Secours de Tourlaville<br />
                  Tourlaville, 50110<br />
                  Manche, Normandie
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1">Email</h4>
                <a href="mailto:contact@amicale-pompiers-tourlaville.fr" className="text-red-700 hover:text-red-800">
                  contact@amicale-pompiers-tourlaville.fr
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Phone className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1">Téléphone</h4>
                <a href="tel:+33233000000" className="text-red-700 hover:text-red-800">
                  02 33 00 00 00
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Facebook className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1">Réseaux sociaux</h4>
                <a href="#" className="text-red-700 hover:text-red-800">
                  Suivez-nous sur Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}