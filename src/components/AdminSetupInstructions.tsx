import { Shield, Database, Key } from 'lucide-react';

export function AdminSetupInstructions() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg my-8">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-8 h-8 text-red-700" />
        <h2 className="text-3xl text-gray-900">Configuration du premier administrateur</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-blue-800">
            <strong>Note :</strong> Cette procédure n'est nécessaire qu'une seule fois pour créer le premier administrateur. 
            Ensuite, vous pourrez gérer toutes les approbations directement depuis l'interface web.
          </p>
        </div>

        <div>
          <h3 className="text-xl text-gray-900 mb-3 flex items-center">
            <span className="bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
            Créer votre compte
          </h3>
          <ul className="ml-11 space-y-2 text-gray-700">
            <li>• Cliquez sur le bouton "Connexion" en haut à droite</li>
            <li>• Cliquez sur "Pas encore de compte ? S'inscrire"</li>
            <li>• Remplissez le formulaire avec vos informations</li>
            <li>• Vous verrez un message confirmant que votre demande a été enregistrée</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl text-gray-900 mb-3 flex items-center">
            <span className="bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
            Accéder à Supabase
          </h3>
          <ul className="ml-11 space-y-2 text-gray-700">
            <li className="flex items-start">
              <Database className="w-5 h-5 text-red-700 mr-2 mt-0.5 flex-shrink-0" />
              <span>Allez sur <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-red-700 underline">https://supabase.com/dashboard</a></span>
            </li>
            <li>• Connectez-vous si nécessaire</li>
            <li>• Sélectionnez votre projet</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl text-gray-900 mb-3 flex items-center">
            <span className="bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
            Modifier le statut dans la base de données
          </h3>
          <ul className="ml-11 space-y-2 text-gray-700">
            <li>• Dans le menu de gauche, cliquez sur <strong>"Table Editor"</strong></li>
            <li>• Sélectionnez la table <code className="bg-gray-100 px-2 py-1 rounded">kv_store_3b9ea24b</code></li>
            <li>• Trouvez la ligne avec la clé qui commence par <code className="bg-gray-100 px-2 py-1 rounded">user_status:</code></li>
            <li>• Cliquez sur la ligne pour l'éditer</li>
            <li>• Dans la colonne <code className="bg-gray-100 px-2 py-1 rounded">value</code>, modifiez le JSON :</li>
          </ul>
          
          <div className="ml-11 mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">{`{
  "userId": "votre-user-id",
  "status": "approved",     ← Changez "pending" en "approved"
  "email": "votre@email.com",
  "name": "Votre Nom",
  "createdAt": "2025-12-11T...",
  "isAdmin": true          ← Ajoutez cette ligne
}`}</pre>
          </div>
          
          <ul className="ml-11 mt-4 space-y-2 text-gray-700">
            <li>• Cliquez sur "Save" pour sauvegarder les modifications</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl text-gray-900 mb-3 flex items-center">
            <span className="bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
            Se connecter en tant qu'administrateur
          </h3>
          <ul className="ml-11 space-y-2 text-gray-700">
            <li>• Retournez sur ce site</li>
            <li>• Cliquez sur "Connexion"</li>
            <li>• Entrez vos identifiants</li>
            <li>• Vous devriez voir le "Panneau Administrateur" apparaître</li>
          </ul>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
          <h4 className="text-green-800 mb-2 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            <strong>Après la configuration</strong>
          </h4>
          <p className="text-green-700">
            Une fois connecté en tant qu'administrateur, vous pourrez approuver ou refuser 
            toutes les nouvelles demandes d'adhésion directement depuis le panneau administrateur, 
            sans avoir besoin d'accéder à la base de données.
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <h4 className="text-yellow-800 mb-2">
            <strong>Où trouver vos utilisateurs ?</strong>
          </h4>
          <ul className="text-yellow-700 space-y-2">
            <li>
              <strong>Liste des comptes créés :</strong> Supabase Dashboard → Authentication → Users
            </li>
            <li>
              <strong>Statuts d'approbation :</strong> Supabase Dashboard → Table Editor → kv_store_3b9ea24b
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
