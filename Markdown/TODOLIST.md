# TODOLIST - MyDelagrave

Liste des tâches et améliorations prévues pour le projet.

---

## Migration Supabase (Priorité Haute)

### Storage Bucket pour les photos
- [ ] Créer un bucket `notes-photos` dans Supabase Storage
- [ ] Modifier `handleImageUpload` dans `ChantierDetail.tsx` pour uploader vers le bucket
- [ ] Stocker uniquement le path/URL dans la table au lieu du base64
- [ ] Configurer les policies RLS sur le bucket

### Storage Bucket pour les documents
- [ ] Créer un bucket `documents` dans Supabase Storage
- [ ] Configurer les policies RLS (lecture par utilisateurs assignés, écriture par admin/charge_affaire)
- [ ] Migrer les documents existants vers le bucket

### Base de données
- [ ] Configurer la vraie connexion Supabase (remplacer le mock)
- [ ] Créer les tables dans Supabase avec les types de `database.types.ts`
- [ ] Configurer les policies RLS pour chaque table
- [ ] Migrer les données mock vers Supabase

### Authentification
- [ ] Remplacer l'authentification mock par Supabase Auth
- [ ] Configurer les providers (email/password, éventuellement SSO)
- [ ] Gérer les sessions et tokens JWT

---

## Fonctionnalités (Priorité Moyenne)

### Dashboard
- [ ] Graphiques de progression (chantiers par mois, par statut)
- [ ] Export des données en CSV/Excel
- [ ] Recherche globale multi-critères

### Chantiers
- [ ] Historique des modifications (audit log)
- [ ] Commentaires/discussions sur un chantier
- [ ] Notifications email sur changement de statut
- [ ] Import de chantiers depuis un fichier CSV

### Documents
- [ ] Prévisualisation des PDF inline
- [ ] Versionning des documents (historique des versions)
- [ ] Génération automatique de rapports PDF

### Phases
- [ ] Vue Gantt des phases de tous les chantiers
- [ ] Alertes sur phases en retard
- [ ] Calcul automatique de la durée

### Contacts
- [ ] Import de contacts depuis un fichier CSV
- [ ] Fusion de contacts en double
- [ ] Historique des interactions

---

## Améliorations Techniques (Priorité Basse)

### Performance
- [ ] Pagination côté serveur pour les grandes listes
- [ ] Mise en cache des données (React Query ou SWR)
- [ ] Lazy loading des composants lourds

### Tests
- [ ] Tests unitaires pour les hooks et utilitaires
- [ ] Tests d'intégration pour les flux critiques
- [ ] Tests de performance (Lighthouse CI)

### DevOps
- [ ] CI/CD avec GitHub Actions
- [ ] Déploiement automatique sur Vercel/Netlify
- [ ] Environnements staging et production

### UX/UI
- [ ] Mode sombre/clair (toggle theme)
- [ ] Responsive design pour mobile/tablette
- [ ] PWA avec mode hors-ligne
- [ ] Internationalisation (i18n) si besoin anglais

---

## Bugs Connus

_Aucun bug connu actuellement._

---

## Complété Récemment

### v0.6.0
- [x] Section Documents dans le détail chantier
- [x] Modal d'upload avec drag & drop
- [x] Prévisualisation des images
- [x] Intégration documents dans la corbeille

### v0.5.0
- [x] Filtres dropdown (Chargé d'affaire, Statut, Poseur)
- [x] Centralisation documentation dans `Markdown/`

### v0.4.0
- [x] Section Informations expandable
- [x] Gestionnaire de notes CRUD
- [x] Upload de photos dans les notes

---

## Légende

| Priorité | Description |
|----------|-------------|
| Haute | Bloquant ou critique pour la mise en production |
| Moyenne | Amélioration significative de l'expérience utilisateur |
| Basse | Nice-to-have, améliorations futures |
