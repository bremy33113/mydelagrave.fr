# Plan de Split - ChantierDetail.tsx

## Situation actuelle

**Fichier** : `src/components/chantiers/ChantierDetail.tsx`
**Taille** : 1154 lignes
**Problème** : Composant "God" qui gère trop de responsabilités

### Responsabilités actuelles (mélangées)

| Section | Lignes | États | Effets | Handlers |
|---------|--------|-------|--------|----------|
| Notes | ~200 | 8 | 1 | 7 |
| Documents | ~150 | 5 | 2 | 3 |
| Contacts | ~100 | 2 | 1 | 0 |
| Réserves | ~100 | 1 | 0 | 0 |
| Coordonnées | ~80 | 1 | 0 | 0 |
| Header | ~70 | 0 | 0 | 0 |
| Modals | ~60 | 2 | 0 | 0 |

---

## Plan de découpage

### Architecture cible

```
src/components/chantiers/
├── ChantierDetail.tsx          # Orchestrateur (~200 lignes)
├── ChantierDetailHeader.tsx    # Header + actions (~80 lignes)
├── ChantierCoordonnees.tsx     # Client + adresse livraison (~100 lignes)
├── ChantierContactsList.tsx    # Liste contacts chantier (~120 lignes)
├── ChantierNotesSection.tsx    # Notes CRUD + photos (~280 lignes)
├── ChantierDocumentsSection.tsx # Documents CRUD (~200 lignes)
├── ChantierReservesSection.tsx # Réserves lecture seule (~120 lignes)
├── ChantierCompletionStatus.tsx # État complétion (~50 lignes)
└── PhotoModal.tsx              # Modal photo réutilisable (~40 lignes)
```

### Réduction attendue

| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes ChantierDetail | 1154 | ~200 |
| États dans composant principal | 28 | 5 |
| Complexité cyclomatique | Élevée | Faible |
| Réutilisabilité | Nulle | Élevée |

---

## Détail des composants

### 1. ChantierDetailHeader.tsx

**Responsabilité** : Affichage du header avec nom, référence, catégorie et boutons d'action.

```tsx
interface ChantierDetailHeaderProps {
  chantier: Chantier;
  onEdit?: () => void;
  onDelete?: () => void;
  onManagePhases?: () => void;
  onManageContacts?: () => void;
}
```

**Lignes sources** : 386-453

---

### 2. ChantierCoordonnees.tsx

**Responsabilité** : Affichage des coordonnées client principal et adresse de livraison.

```tsx
interface ChantierCoordonneesProps {
  client: Tables<'clients'> | null;
  adresseLivraison: string | null;
  latitude?: number | null;
  longitude?: number | null;
  defaultExpanded?: boolean;
}
```

**Lignes sources** : 458-537

---

### 3. ChantierContactsList.tsx

**Responsabilité** : Fetch et affichage des contacts associés au chantier.

```tsx
interface ChantierContactsListProps {
  chantierId: string;
  defaultExpanded?: boolean;
}
```

**Lignes sources** : 107-143 (fetch) + 539-626 (UI)

**État interne** :
- `contacts: ChantierContact[]`
- `expanded: boolean`

---

### 4. ChantierNotesSection.tsx

**Responsabilité** : CRUD complet des notes avec gestion photos (upload, drag & drop, paste).

```tsx
interface ChantierNotesSectionProps {
  chantierId: string;
  defaultExpanded?: boolean;
  onPhotoClick?: (url: string) => void;
}
```

**Lignes sources** : 74-84 (états) + 94-105 (fetch) + 174-317 (handlers) + 632-837 (UI)

**État interne** :
- `notes: Note[]`
- `showForm: boolean`
- `editingNote: Note | null`
- `noteContent: string`
- `notePhoto1: string | null`
- `notePhoto2: string | null`

**Handlers internes** :
- `handleSaveNote`
- `handleEditNote`
- `handleDeleteNote`
- `processImageFile`
- `handleImageUpload`
- `handleDrop`
- `handlePaste`

---

### 5. ChantierDocumentsSection.tsx

**Responsabilité** : CRUD documents avec preview et téléchargement.

```tsx
interface ChantierDocumentsSectionProps {
  chantierId: string;
  defaultExpanded?: boolean;
}
```

**Lignes sources** : 87-91 (états) + 145-172 (fetch) + 319-382 (handlers) + 839-948 (UI)

**État interne** :
- `documents: Document[]`
- `showUploadModal: boolean`
- `previewDocument: Document | null`
- `previewUrl: string | null`

**Handlers internes** :
- `handleDeleteDocument`
- `handleDownloadDocument`
- `formatFileSize`
- `getDocumentTypeIcon`
- `getDocumentTypeLabel`

---

### 6. ChantierReservesSection.tsx

**Responsabilité** : Affichage lecture seule des réserves (filtrées depuis notes).

```tsx
interface ChantierReservesSectionProps {
  notes: Note[];
  defaultExpanded?: boolean;
  onPhotoClick?: (url: string) => void;
}
```

**Lignes sources** : 950-1049

**Note** : Ce composant reçoit les notes en props (filtrées par le parent) plutôt que de refetch.

---

### 7. ChantierCompletionStatus.tsx

**Responsabilité** : Affichage de l'état de complétion (réserves levées, DOE fourni).

```tsx
interface ChantierCompletionStatusProps {
  reservesLevees: boolean;
  doeFourni: boolean;
}
```

**Lignes sources** : 1051-1084

---

### 8. PhotoModal.tsx

**Responsabilité** : Modal réutilisable pour afficher une photo en plein écran.

```tsx
interface PhotoModalProps {
  url: string | null;
  onClose: () => void;
}
```

**Lignes sources** : 1087-1108

---

## ChantierDetail.tsx refactorisé

### Structure finale

```tsx
export function ChantierDetail({ chantier, onEdit, onDelete, onManagePhases, onManageContacts }: ChantierDetailProps) {
  // Un seul état pour le modal photo
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <ChantierDetailHeader
        chantier={chantier}
        onEdit={onEdit}
        onDelete={onDelete}
        onManagePhases={onManagePhases}
        onManageContacts={onManageContacts}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {(chantier.client || chantier.adresse_livraison) && (
          <ChantierCoordonnees
            client={chantier.client}
            adresseLivraison={chantier.adresse_livraison}
            latitude={chantier.adresse_livraison_latitude}
            longitude={chantier.adresse_livraison_longitude}
          >
            <ChantierContactsList chantierId={chantier.id} />
          </ChantierCoordonnees>
        )}

        <ChantierNotesSection
          chantierId={chantier.id}
          onPhotoClick={setPhotoModalUrl}
        />

        <ChantierDocumentsSection chantierId={chantier.id} />

        <ChantierReservesSection
          chantierId={chantier.id}
          onPhotoClick={setPhotoModalUrl}
        />

        <ChantierCompletionStatus
          reservesLevees={chantier.reserves_levees}
          doeFourni={chantier.doe_fourni}
        />
      </div>

      <PhotoModal url={photoModalUrl} onClose={() => setPhotoModalUrl(null)} />
    </div>
  );
}
```

---

## Ordre d'implémentation

1. **PhotoModal.tsx** - Composant simple, pas de dépendances
2. **ChantierCompletionStatus.tsx** - Composant simple, props only
3. **ChantierDetailHeader.tsx** - Composant simple, props only
4. **ChantierCoordonnees.tsx** - Composant simple, props only
5. **ChantierContactsList.tsx** - Fetch interne, état isolé
6. **ChantierReservesSection.tsx** - Dépend de notes (props)
7. **ChantierDocumentsSection.tsx** - CRUD complet, modal interne
8. **ChantierNotesSection.tsx** - Le plus complexe (photos, drag & drop)
9. **Refactoriser ChantierDetail.tsx** - Assembler les composants

---

## Types partagés

Créer `src/components/chantiers/types.ts` pour les types communs :

```tsx
import type { Tables } from '../../lib/database.types';

export type Note = Tables<'notes_chantiers'> & {
  creator?: { first_name: string; last_name: string } | null;
};

export type Document = Tables<'documents_chantiers'> & {
  uploader?: { first_name: string; last_name: string } | null;
  ref_types_document?: Tables<'ref_types_document'> | null;
};

export type Chantier = Tables<'chantiers'> & {
  client?: Tables<'clients'> | null;
  charge_affaire?: Tables<'users'> | null;
  ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
  ref_statuts_chantier?: Tables<'ref_statuts_chantier'> | null;
};

export type ChantierContact = Tables<'chantiers_contacts'> & {
  clients: (Tables<'clients'> & {
    ref_job?: Tables<'ref_job'> | null;
  }) | null;
};
```

---

## Tests E2E

Les tests E2E existants (`e2e/notes.spec.ts`, `e2e/documents.spec.ts`) utilisent des `data-testid` qui doivent être préservés :

### Notes
- `section-informations`
- `btn-toggle-informations`
- `notes-count`
- `btn-add-note`
- `note-form`
- `note-content-input`
- `btn-submit-note`
- `notes-section`

### Documents
- `section-documents`
- `btn-toggle-documents`
- `documents-count`
- `btn-add-document`
- `documents-list`
- `document-item-{id}`
- `btn-preview-document-{id}`
- `btn-download-document-{id}`
- `btn-delete-document-{id}`
- `document-preview-modal`
- `btn-close-preview`
- `preview-filename`
- `preview-image`

---

## Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Breaking tests E2E | Élevé | Conserver tous les data-testid |
| Régression visuelle | Moyen | Ne pas modifier le JSX/CSS |
| Performance (re-renders) | Faible | Ajouter React.memo si nécessaire |
| Props drilling | Faible | Limité à 1 niveau (photoModal callback) |

---

## Checklist de validation

- [ ] Tous les data-testid préservés
- [ ] Tests E2E passent (`npm run test:e2e`)
- [ ] Pas de régression visuelle
- [ ] Build sans erreurs TypeScript
- [ ] ESLint sans nouvelles erreurs
- [ ] Chaque composant < 300 lignes
- [ ] ChantierDetail.tsx < 200 lignes
