# Context Backup - MyDelagrave

**Date de sauvegarde** : 2026-01-12
**Branche** : main
**Version** : 2.6.12

---

## Derniers commits

```
4da143a fix: Améliorations mobile planning et documents (v2.6.11)
9223cd2 feat: Trajets domicile dans carte tournée + adresse utilisateur
1545536 feat: Dépassement budget groupe + historique phases (v2.3.0)
3766b8f chore: Supprime fichier vidéo accidentel
8f23786 fix: Améliore tooltip phases + debug création sous-phases
```

---

## Travail effectué dans la session (v2.6.11)

### Viewer Documents Plein Écran

**Fichiers modifiés :**
- `src/components/chantiers/ChantierDocumentsSection.tsx`
  - Ajout bouton viewer (Eye) pour images ET PDFs
  - Modal plein écran avec header (nom fichier + bouton fermer)
  - Support iframe pour PDFs, img pour images

- `src/pages/mobile/MobileChantierDetail.tsx`
  - Même viewer plein écran sur mobile
  - State `previewData` avec `{ url, type, name? }`

### Sections Expandables Mobile

**Modifications dans `MobileChantierDetail.tsx` :**
- Ajout states : `documentsExpanded`, `informationsExpanded`, `reservesExpanded`
- Documents et Informations fermées par défaut, Réserves ouverte
- Chevrons à gauche des titres de section
- Boutons "+ Ajouter" toujours visibles (Informations, Réserves)

### Notes Poseur (CRUD)

**Nouveau fichier créé :**
- `src/pages/mobile/MobileNoteForm.tsx`
  - Formulaire création/édition notes
  - Support mode édition via query param `?edit=noteId`
  - Compression images avant stockage base64

**Modifications :**
- `src/App.tsx` : Ajout route `/m/chantier/:id/note`
- `src/pages/mobile/MobileChantierDetail.tsx` :
  - Boutons edit/delete sur notes du poseur (seulement ses propres notes)
  - Fonction `handleDeleteNote` (soft delete)
  - State `currentUserId` pour vérification permissions

### Section Informations Mobile

- Vignettes photos à droite de la section (au lieu d'en dessous)
- Taille réduite de 50% : `w-8 h-8` au lieu de `w-16 h-16`
- Layout flex avec contenu à gauche, photos à droite

### Planning Mobile - Jours Fériés

**Fichier modifié : `src/pages/mobile/MobilePlanningV2.tsx`**
- Import `FRENCH_HOLIDAYS` depuis constants
- Fonction `isHoliday(date)` pour détecter jours fériés
- Weekends supprimés : `weekDates` = 5 jours (Lun-Ven)
- Jours fériés affichés en rouge hachuré :
  - Badge date : `bg-red-500/30 text-red-400`
  - Badge "Férié" à côté du jour
  - Zone hachurée : `repeating-linear-gradient(135deg, ...)`

---

## Architecture Composants Mobile Chantier

```
MobileChantierDetail.tsx
├── Header (nom, client, statut, catégorie)
├── Boutons Actions (GPS, Rapport)
├── Section Localisation & Contact
├── Section Phases à venir (si présentes)
├── Section Documents [expandable, fermée par défaut]
│   └── Liste docs type='plan' avec viewer
├── Section Informations [expandable, fermée par défaut]
│   ├── Notes (hors réserves)
│   ├── Vignettes photos (à droite)
│   └── Boutons edit/delete (propres notes)
├── Section Réserves [expandable, ouverte par défaut]
│   └── Accordéon par réserve
└── Modal Preview Plein Écran (images/PDFs)
```

---

## Fichiers Clés Modifiés

| Fichier | Modifications |
|---------|---------------|
| `ChantierDocumentsSection.tsx` | Viewer plein écran desktop |
| `ChantierNotesSection.tsx` | Permissions poseur (edit/delete) |
| `MobileChantierDetail.tsx` | Sections expandables, viewer, CRUD notes |
| `MobileNoteForm.tsx` | **Nouveau** - Formulaire notes mobile |
| `MobilePlanningV2.tsx` | Weekends masqués, jours fériés |
| `App.tsx` | Route `/m/chantier/:id/note` |

---

## États Importants

### MobileChantierDetail States
```typescript
const [documentsExpanded, setDocumentsExpanded] = useState(false);
const [informationsExpanded, setInformationsExpanded] = useState(false);
const [reservesExpanded, setReservesExpanded] = useState(true);
const [previewData, setPreviewData] = useState<{ url: string; type: 'image' | 'pdf'; name?: string } | null>(null);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);
```

### Jours Fériés (constants.ts)
```typescript
export const FRENCH_HOLIDAYS = [
    '2025-01-01', '2025-04-21', '2025-05-01', ...
    '2026-01-01', '2026-04-06', '2026-05-01', ...
];
```

---

## Prochaines Étapes Suggérées

1. **Tester les fonctionnalités mobile** avec un compte poseur
2. **Ajouter jours fériés 2027** dans `FRENCH_HOLIDAYS`
3. **Considérer** : Synchronisation offline pour notes/réserves mobile

---

## Déploiement

- Site production : https://mydelagrave.fr
- Build : `npm run build -- --mode production`
- Tests E2E : `npm run test:e2e`

---

## Comptes Test

| Email | Rôle | Mot de passe |
|-------|------|--------------|
| admin@delagrave.fr | Admin | admin123 |
| jean.dupont@delagrave.fr | Chargé d'affaire | password123 |
| marie.martin@delagrave.fr | Superviseur | password123 |
| pierre.durand@delagrave.fr | Poseur | password123 |
