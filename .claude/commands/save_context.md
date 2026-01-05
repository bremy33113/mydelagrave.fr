---
description: Sauvegarde le contexte de travail pour reprise apres compactage (project)
---

Ce workflow sauvegarde l'etat actuel du travail dans markdown/CONTEXT_BACKUP.md pour permettre de reprendre le travail apres un compactage ou une nouvelle session.

1. **Collecter l'etat Git**
   - Executer `git status` pour voir les modifications en cours
   - Executer `git log --oneline -10` pour les derniers commits
   - Executer `git branch --show-current` pour la branche actuelle

2. **Lire la version actuelle**
   - Lire `package.json` pour extraire la version

3. **Identifier les taches en cours**
   - Regarder le TodoWrite actuel s'il existe
   - Analyser les derniers fichiers modifies

4. **Demander a l'utilisateur**
   - Quelle est la tache en cours ?
   - Quelles sont les prochaines etapes ?

5. **Ecrire le fichier de contexte**
   - Creer/mettre a jour `markdown/CONTEXT_BACKUP.md` avec toutes les informations collectees
   - Format: Date, Branche, Version, Derniers commits, Tache en cours, Prochaines etapes

6. **Confirmer la sauvegarde**
   - Afficher un resume du contexte sauvegarde
