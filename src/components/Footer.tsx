interface FooterProps {
}

export function Footer({}: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl mb-4">Amicale des Sapeurs Pompiers</h3>
            <p className="text-gray-400">
              Tourlaville - Manche<br />
              Solidarité, Entraide et Convivialité
            </p>
          </div>
          
          <div>
            <h3 className="text-xl mb-4">Liens Utiles</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="https://www.pompiers.fr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Fédération Nationale des Sapeurs-Pompiers
                </a>
              </li>
              <li>
                <a href="https://www.sdis50.fr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  SDIS 50
                </a>
              </li>
              <li>
                <a href="https://www.interieur.gouv.fr/Le-ministere/Securite-civile" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Sécurité Civile
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl mb-4">Numéros d'Urgence</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <span className="text-red-400">18</span> - Pompiers
              </li>
              <li>
                <span className="text-red-400">15</span> - SAMU
              </li>
              <li>
                <span className="text-red-400">17</span> - Police
              </li>
              <li>
                <span className="text-red-400">112</span> - Numéro d'urgence européen
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Amicale des Sapeurs Pompiers de Tourlaville. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}