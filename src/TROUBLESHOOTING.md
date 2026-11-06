# Guide de dépannage

## Problèmes courants

### 1. Erreur "Identifiants incorrects" lors de la connexion

Cette erreur peut avoir plusieurs causes :

**Causes possibles :**
- Email ou mot de passe incorrect
- Le compte n'existe pas encore dans Supabase
- Le compte n'a pas encore été créé par un administrateur

**Solutions :**
1. Vérifiez que vous utilisez le bon email et mot de passe
2. Si vous êtes admin, créez un compte via le bouton "Créer un compte" dans le panneau admin
3. Si vous êtes membre, demandez à un admin de créer votre compte ou utilisez le formulaire d'inscription

### 2. Erreur "Invalid role" lors de la modification d'un rôle

Cette erreur se produit quand vous essayez de changer le rôle d'un utilisateur.

**Vérifications à faire :**
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les logs qui affichent :
   - `Updating role for user: [userId] to role: [role] type: [type]`
   - Si le type n'est pas "string", il y a un problème
   
3. **Vérification côté serveur :**
   - Le serveur accepte uniquement : `'membre'`, `'superviseur'`, `'admin'`
   - Le rôle doit être une chaîne de caractères (string)
   - Le rôle doit être en minuscules

**Solution temporaire :**
Si le problème persiste, essayez de :
1. Rafraîchir la page (F5)
2. Se déconnecter puis se reconnecter
3. Vider le cache du navigateur

### 3. Accès superviseur

**Ce qu'un superviseur peut voir :**
- ✅ Panneau Superviseur simplifié
- ✅ Liste complète des inscriptions à l'arbre de Noël
- ✅ Statistiques (familles, adultes, enfants, total)
- ❌ PAS d'accès aux autres onglets admin

**Ce qu'un administrateur peut voir :**
- ✅ Tous les onglets (En attente, Utilisateurs, Inscrits Noël, Inscriptions, Administration)
- ✅ Possibilité de modifier les rôles
- ✅ Possibilité de créer des comptes
- ✅ Accès aux éditeurs de contenu

## Débogage avancé

### Vérifier les logs dans la console

1. Ouvrez la console du navigateur (F12)
2. Regardez les messages qui commencent par :
   - `Updating role for user:` - logs de changement de rôle
   - `Role update failed:` - erreur de changement de rôle
   - `Login exception:` - erreur de connexion
   - `Login error:` - erreur de connexion

### Vérifier le rôle côté serveur

Les rôles valides sont :
- `membre` - Membre standard
- `superviseur` - Peut voir les inscrits Noël uniquement
- `admin` - Accès complet

### Contact

Si le problème persiste, contactez l'administrateur système avec :
- La capture d'écran de l'erreur
- Les logs de la console (F12)
- L'action que vous essayiez de faire
