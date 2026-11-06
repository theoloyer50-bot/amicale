# Test des clés KV Store

Pour déboguer le problème de réinitialisation, ouvrez la console Supabase et vérifiez :

## 1. Vérifier les clés existantes dans le KV store

Allez dans l'onglet Edge Functions > Logs et cherchez les logs avec le préfixe `[Reset Sainte-Barbe]` ou `[Reset Noël]`.

## 2. Points à vérifier

Les logs affichent maintenant :
- `[Reset Sainte-Barbe] Found registrations: X [...]` - montre combien d'inscriptions sont trouvées
- `[Reset Sainte-Barbe] Attempting to delete: registration_sainte_barbe:USER_ID` - tentative de suppression
- `[Reset Sainte-Barbe] Successfully deleted registration for user USER_ID` - confirmation de suppression

## 3. Si rien ne s'affiche

Si vous ne voyez pas de logs, cela signifie que :
1. La fonction n'est pas redéployée
2. L'endpoint n'est pas appelé
3. Il y a une erreur avant l'appel

## 4. Pour tester manuellement

Vous pouvez tester l'endpoint directement avec curl ou Postman :

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3b9ea24b/events/sainte-barbe/reset \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Remplacez :
- `YOUR_PROJECT_ID` par votre ID de projet Supabase
- `YOUR_ACCESS_TOKEN` par votre token d'accès admin
