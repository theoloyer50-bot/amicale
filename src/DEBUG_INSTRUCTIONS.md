# 🐛 Instructions de débogage pour "Invalid role"

## Étape 1 : Redéployer la fonction Supabase

**IMPORTANT : Vous devez redéployer votre fonction Supabase pour activer les nouveaux logs !**

```bash
# Depuis votre terminal, dans le dossier du projet
supabase functions deploy make-server-3b9ea24b
```

## Étape 2 : Reproduire l'erreur

1. Connectez-vous en tant qu'admin
2. Allez dans l'onglet "👥 Tous les utilisateurs"
3. Essayez de changer le rôle d'un utilisateur vers "Superviseur"

## Étape 3 : Consulter les logs

### 📱 Logs côté navigateur (Frontend)

1. Appuyez sur **F12** pour ouvrir la console du navigateur
2. Regardez les messages suivants :
   ```
   Role selected from dropdown: superviseur type: string
   Updating role for user: [userId] to role: superviseur type: string
   ```
3. Si vous voyez `Role update failed:`, notez le message d'erreur complet

### ☁️ Logs côté serveur (Supabase)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** > **make-server-3b9ea24b** > **Logs**
4. Cherchez les messages suivants :
   ```
   [update-user-role] Received request: { userId: '...', role: '...', roleType: 'string' }
   [update-user-role] Role validation passed, updating...
   ```
   OU
   ```
   [update-user-role] Invalid role received: [valeur reçue]
   ```

## 🔍 Ce qu'on cherche

Les logs nous diront :
- ✅ La valeur exacte du rôle envoyé (doit être `'superviseur'`)
- ✅ Le type de donnée (doit être `'string'`)
- ✅ Si le rôle passe la validation ou non
- ✅ Le message d'erreur exact si ça échoue

## 📋 Rôles valides

Le serveur accepte uniquement ces 3 rôles (en minuscules) :
- `'membre'`
- `'superviseur'`
- `'admin'`

## ⚠️ Causes possibles

Si le rôle est rejeté, c'est probablement parce que :
1. ❌ Le rôle n'est pas exactement `'superviseur'` (espaces, majuscules, etc.)
2. ❌ La fonction Supabase n'a pas été redéployée avec le nouveau code
3. ❌ Il y a un problème de cache

## 🔧 Solutions

### Si la fonction n'est pas redéployée :
```bash
supabase functions deploy make-server-3b9ea24b
```

### Si le problème persiste après redéploiement :
1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Déconnectez-vous et reconnectez-vous
3. Essayez à nouveau

### Si le problème continue :
Partagez les logs complets de la console (F12) et des logs Supabase pour qu'on puisse voir exactement ce qui se passe !

## 📞 Besoin d'aide ?

Partagez :
1. Les logs de la console navigateur (F12)
2. Les logs Supabase Edge Functions
3. La capture d'écran de l'erreur
