# Context Backup - MyDelagrave

**Date** : 2026-01-05
**Branche** : dev
**Version** : 1.4.0

## Derniers commits

```
4613b2a test: Ajout tests E2E pour utilisateurs en ligne
52366c8 feat: Utilisateurs en ligne temps réel (v1.3.0)
8e396d1 fix: Verrouillage poseur fourniture + Référentiel rôles (v1.2.2)
d89fd41 feat: Ligne Sans pose sur le Planning (v1.2.1)
8b58633 feat: Vue Tournée Poseur avec carte et itinéraires (v1.2.0)
```

## Tâche en cours

**Pages Mobiles pour utilisateurs terrain (Chargé d'affaires et Poseurs)**

### Fichiers créés (non commités)

| Fichier | Description |
|---------|-------------|
| `src/hooks/useMobileMode.ts` | Hook détection mobile + toggle dev |
| `src/components/mobile/MobileLayout.tsx` | Layout mobile sans sidebar |
| `src/pages/mobile/MobileChantiersList.tsx` | **pmca** - Liste chantiers chargé d'affaires |
| `src/pages/mobile/MobilePlanning.tsx` | **pmpo** - Planning semaine poseur |

### Fichiers modifiés (non commités)

| Fichier | Modification |
|---------|--------------|
| `src/App.tsx` | Routes mobiles `/m/*` + détection MobileSimulator |
| `src/components/layout/Sidebar.tsx` | Toggle ouvre fenêtre Galaxy (360x800) |

### Abréviations utilisées

- **pmca** = Page Mobile Chargé d'Affaires (`MobileChantiersList.tsx`)
- **pmpo** = Page Mobile Poseur (`MobilePlanning.tsx`)

## Fonctionnalités implémentées

### Mode Dev - Simulateur Mobile
- Bouton 📱 dans sidebar ouvre nouvelle fenêtre (360x800 - Galaxy S21)
- Fenêtre principale reste en mode desktop
- Icône bleue quand simulateur ouvert

### pmca (Page Mobile Chargé d'Affaires)
- Liste des chantiers assignés au CA connecté
- Affiche : Icône type + Référence + Statut + Nom + Catégorie + Semaine
- 🔧 (bleu) = Fourniture et pose
- 🚚 (orange) = Fourniture seule
- Recherche par nom/adresse/client
- Pull-to-refresh

### pmpo (Page Mobile Poseur)
- Planning semaine avec navigation (◀ ▶)
- Semaines passées : illimitées
- Semaines futures : max S+2
- Groupement par jour
- Actions : 📞 Appeler client, 🗺️ Ouvrir GPS

## Prochaines étapes suggérées

1. Tester les pages mobiles avec le simulateur
2. Ajouter détail chantier au clic sur pmca
3. Commit et release v1.4.0
4. Tests E2E pour pages mobiles

## Comment tester

```bash
npm run dev
```

1. Se connecter en admin/superviseur
2. Cliquer sur 📱 en bas de la sidebar
3. Une fenêtre Galaxy s'ouvre avec l'interface mobile
4. Se connecter en chargé d'affaires ou poseur dans cette fenêtre
