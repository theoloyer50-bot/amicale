# Configuration du premier administrateur

## Étape 1 : Créer le premier compte

1. Allez sur le site et cliquez sur "Connexion"
2. Cliquez sur "Pas encore de compte ? S'inscrire"
3. Créez votre compte administrateur avec votre email et mot de passe

## Étape 2 : Approuver et promouvoir en administrateur

Pour approuver le premier compte et le promouvoir en administrateur, utilisez Firebase Authentication pour vérifier que le compte existe, puis Firebase Realtime Database pour modifier son rôle et son statut.

1. Allez sur https://console.firebase.google.com/ et ouvrez le projet `amicale-tourlaville`
2. Ouvrez Realtime Database puis l'onglet Data
3. Ouvrez le nœud `kv`
4. Trouvez la clé `user_status:<UID_FIREBASE>` correspondant à l'UID affiché dans Firebase Authentication
5. Modifiez la valeur JSON pour changer :
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

6. Sauvegardez les modifications

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
