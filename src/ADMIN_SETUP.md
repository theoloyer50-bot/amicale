# Configuration du premier administrateur

## Étape 1 : Créer le premier compte

1. Allez sur le site et cliquez sur "Connexion"
2. Cliquez sur "Pas encore de compte ? S'inscrire"
3. Créez votre compte administrateur avec votre email et mot de passe

## Étape 2 : Approuver et promouvoir en administrateur

Pour approuver le premier compte et le promouvoir en administrateur, vous devez accéder directement à la base de données Supabase :

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans "Table Editor" dans le menu de gauche
4. Sélectionnez la table `kv_store_3b9ea24b`
5. Trouvez la ligne avec la clé qui commence par `user_status:` (suivie de l'ID de votre utilisateur)
6. Cliquez sur la ligne pour l'éditer
7. Dans la colonne `value`, modifiez le JSON pour changer :
   - `"status": "pending"` en `"status": "approved"`
   - Ajoutez `"isAdmin": true`

Le JSON devrait ressembler à ceci :
```json
{
  "userId": "votre-user-id",
  "status": "approved",
  "email": "votre@email.com",
  "name": "Votre Nom",
  "createdAt": "2025-12-11T...",
  "isAdmin": true
}
```

8. Sauvegardez les modifications

## Étape 3 : Se connecter en tant qu'administrateur

1. Retournez sur le site
2. Connectez-vous avec vos identifiants
3. Vous devriez maintenant voir le "Panneau Administrateur" en haut de la page

## Gestion des adhérents

Une fois connecté en tant qu'administrateur, vous pouvez :
- Voir toutes les demandes d'adhésion en attente dans le panneau administrateur
- Approuver ou refuser les nouvelles demandes
- Les utilisateurs approuvés pourront se connecter et accéder à l'espace adhérent

---

**Note de sécurité** : Cette manipulation manuelle n'est nécessaire que pour le premier administrateur. Ensuite, vous pourrez gérer les approbations directement depuis l'interface web.
