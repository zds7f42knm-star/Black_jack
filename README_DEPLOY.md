Déploiement instantané sur GitHub Pages

But: publier le dossier `web/` (site statique) sur GitHub Pages sans config réseau locale.

1) Initialiser un repo Git (si pas déjà fait)

```powershell
Set-Location C:\workspace
git init
git add .
git commit -m "Ajout site web Blackjack"
```

2) Créer un repo distant sur GitHub (via web) nommé par exemple `blackjack-web`.

3) Ajouter le remote et pousser sur `main`

```powershell
git remote add origin https://github.com/<votre-username>/blackjack-web.git
git branch -M main
git push -u origin main
```

4) Le workflow GitHub Actions `gh-pages.yml` s'exécutera automatiquement et publiera le contenu du dossier `web/` sur GitHub Pages.

5) Après quelques instants, allez dans la page du repo → Settings → Pages pour voir l'URL fournie (ou dans l'onglet Actions vous verrez le job déployé). L'URL sera du type `https://<votre-username>.github.io/blackjack-web/`.

Remarques:
- Assurez-vous que la branche par défaut est `main`.
- Si vous utilisez une organisation, adaptez le remote.
- Je peux automatiser la création du repo GitHub via l'API si vous me donnez un token, mais pour des raisons de sécurité je préfère que vous le fassiez ou que vous m'autorisiez explicitement.
