# Projet IA - MyDelagrave

## Introduction

Ce document présente la vision et les propositions d'intégration de l'Intelligence Artificielle dans l'application MyDelagrave, en utilisant **Google Gemini API**.

### Objectifs

1. **Optimiser la planification** : Suggestions intelligentes d'affectation des poseurs et optimisation des tournées
2. **Améliorer la gestion des réserves** : Workflow intelligent d'affectation et priorisation des réserves
3. **Gagner en productivité** : Réduire le temps de décision et d'organisation

### Technologie choisie

**Google Gemini** - Modèles d'IA générative pour l'analyse et les recommandations

| Modèle | Usage | Caractéristiques |
|--------|-------|------------------|
| `gemini-1.5-flash` | Temps réel | Rapide, économique, ~0.5s de latence |
| `gemini-1.5-pro` | Analyses complexes | Plus précis, meilleur raisonnement |

---

## 1. Obtention de la clé API Google Gemini

### Étape 1 : Créer un projet Google Cloud

1. Accéder à [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquer sur "Sélectionner un projet" → "Nouveau projet"
3. Nommer le projet (ex: `mydelagrave-ia`)
4. Cliquer sur "Créer"

### Étape 2 : Activer l'API Generative AI

1. Dans le menu latéral, aller dans "API et services" → "Bibliothèque"
2. Rechercher "Generative Language API" ou "Gemini API"
3. Cliquer sur "Activer"

### Étape 3 : Créer une clé API

1. Aller dans "API et services" → "Identifiants"
2. Cliquer sur "+ Créer des identifiants" → "Clé API"
3. Copier la clé générée
4. (Recommandé) Restreindre la clé à l'API Generative Language

### Étape 4 : Configurer l'application

Ajouter dans le fichier `.env.local` :

```env
VITE_GEMINI_API_KEY=votre-cle-api-ici
```

> **Note** : Ne jamais committer la clé API dans le dépôt Git. Ajouter `.env.local` au `.gitignore`.

### Tarification (janvier 2025)

| Modèle | Input (1M tokens) | Output (1M tokens) |
|--------|-------------------|---------------------|
| gemini-1.5-flash | $0.075 | $0.30 |
| gemini-1.5-pro | $1.25 | $5.00 |

Estimation pour MyDelagrave : ~$5-20/mois selon usage.

---

## 2. Architecture Technique

### Structure des fichiers à créer

```
src/
├── lib/
│   └── gemini.ts                    # Client Gemini API + helpers
├── hooks/
│   ├── useGeminiPlanning.ts         # Hook suggestions planning
│   └── useGeminiReserves.ts         # Hook analyse réserves
├── components/
│   └── ai/
│       ├── AISuggestionBadge.tsx    # Badge "Suggestion IA"
│       ├── PlanningAISuggestions.tsx # Panel suggestions planning
│       └── ReserveAnalysisPanel.tsx  # Résultat analyse photo
└── types/
    └── ai.types.ts                  # Types pour réponses IA
```

### Client Gemini (`src/lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Modèle rapide pour suggestions temps réel
export const flashModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
});

// Modèle avancé pour analyses complexes
export const proModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro'
});

// Helper pour génération texte
export async function generateText(
  prompt: string,
  useProModel = false
) {
  const model = useProModel ? proModel : flashModel;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Dépendance à installer

```bash
npm install @google/generative-ai
```

---

## 3. Planning IA (Priorité 1)

### 3.1 Bouton "Aide à l'assignation"

**Objectif** : Assister le superviseur dans l'assignation des phases non attribuées aux poseurs.

**Type de calcul** : **Algorithme local** (pas d'appel API Gemini)

#### Interface utilisateur

**Emplacement** : Bouton dans l'en-tête de `PlanningPage.tsx`, à côté du sélecteur de vue.

**Maquette de la modal** :

```
┌─────────────────────────────────────────────────────┐
│  Aide à l'assignation                          [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  7 phases non assignées cette semaine              │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ CHU Nantes - Phase 1.2 (8h)                   │ │
│  │ ✨ Suggéré: Pierre Durand                     │ │
│  │    • Charge: 12h/40h (léger)                  │ │
│  │    • Déjà sur ce chantier                     │ │
│  │    • Distance: 0km (même site)                │ │
│  │                              [Appliquer]      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Lycée Angers - Phase 2.1 (4h)                 │ │
│  │ ✨ Suggéré: Lucas Bernard                     │ │
│  │    • Charge: 8h/40h (disponible)              │ │
│  │    • Nouveau chantier                         │ │
│  │    • Distance: 45km depuis dernier chantier   │ │
│  │                              [Appliquer]      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Appliquer toutes les suggestions]                │
└─────────────────────────────────────────────────────┘
```

#### Algorithme de scoring

**Formule pondérée** :

```
Score = (0.5 × Score_Charge) + (0.3 × Score_Localisation) + (0.2 × Score_Historique)
```

| Critère | Poids | Calcul |
|---------|-------|--------|
| **Charge** | 50% | `1 - (HeuresAssignées / 40)` |
| **Localisation** | 30% | `1 / (1 + DistanceKm / 100)` |
| **Historique** | 20% | `1.0` si déjà sur ce chantier, `0.5` sinon |

#### Implémentation

**Fichiers à créer** :

```
src/
├── hooks/
│   └── usePlanningAssistant.ts       # Hook calcul suggestions
├── lib/
│   └── planningScoring.ts            # Formules de scoring
├── components/
│   └── planning/
│       └── AssignmentAssistantModal.tsx  # Modal suggestions
```

**Code du scoring** (`planningScoring.ts`) :

```typescript
export interface SuggestionScore {
  poseur: User;
  score: number;
  hoursThisWeek: number;
  distanceKm: number;
  hasHistory: boolean;
  reasons: {
    chargeScore: number;
    localisationScore: number;
    historiqueScore: number;
  };
}

export function calculatePoseurScore(
  poseur: User,
  phase: Phase,
  allPhases: Phase[],
  dateRange: DateRange
): SuggestionScore {
  // 1. Score charge (50%)
  const hoursThisWeek = allPhases
    .filter(p => p.poseur_id === poseur.id && isInDateRange(p, dateRange))
    .reduce((sum, p) => sum + p.duree_heures, 0);
  const chargeScore = Math.max(0, 1 - (hoursThisWeek / 40));

  // 2. Score localisation (30%)
  const distanceKm = calculateHaversineDistance(
    poseur.lastChantierCoords,
    phase.chantier
  );
  const localisationScore = 1 / (1 + distanceKm / 100);

  // 3. Score historique (20%)
  const hasHistory = allPhases.some(
    p => p.chantier_id === phase.chantier_id &&
         p.poseur_id === poseur.id &&
         new Date(p.date_fin) < new Date()
  );
  const historiqueScore = hasHistory ? 1.0 : 0.5;

  // Score final
  const score = 0.5 * chargeScore + 0.3 * localisationScore + 0.2 * historiqueScore;

  return {
    poseur,
    score,
    hoursThisWeek,
    distanceKm,
    hasHistory,
    reasons: { chargeScore, localisationScore, historiqueScore }
  };
}

export function getBestPoseurForPhase(
  phase: Phase,
  poseurs: User[],
  allPhases: Phase[],
  dateRange: DateRange
): SuggestionScore[] {
  return poseurs
    .map(p => calculatePoseurScore(p, phase, allPhases, dateRange))
    .sort((a, b) => b.score - a.score);
}
```

---

### 3.2 Fonctionnalités futures (Phase 2)

#### Optimisation de tournée

- Réorganiser l'ordre des phases d'un poseur pour minimiser les trajets
- Utiliser OSRM (déjà intégré via `useOSRMRoute`)
- Algorithme TSP (Traveling Salesman Problem) simplifié

#### Détection de conflits

- Surcharge poseur (>40h/semaine)
- Chevauchement de phases
- Trajet impossible (2 chantiers éloignés le même jour)

---

## 4. Réserves - Workflow avec Lanceur (Priorité 2)

### 4.0 Nouveau rôle : Lanceur

Le **Lanceur** est un nouveau rôle à intégrer dans l'application.

**Définition** : Personne responsable de la fabrication/refabrication du matériel pour un chantier. C'est le lanceur qui a mis en fabrication le matériel initial et qui "relance" la fabrication si nécessaire.

**Point clé** : Le lanceur est **lié au chantier** (dossier), pas à la réserve individuellement.

**Ajout dans `ref_roles_user`** :

```typescript
{ code: 'lanceur', label: 'Lanceur', level: 35, description: 'Gère la fabrication/refabrication des matériels' }
```

**Ajout dans `chantiers`** :

```typescript
lanceur_id: string | null;  // ID de l'utilisateur (rôle 'lanceur') responsable de ce chantier
```

**Permissions** :
- Voir uniquement les réserves de **ses chantiers**
- Recevoir les réserves **uniquement via le superviseur**
- Informer le superviseur : "Pris en compte" et "Matériel prêt"

---

### 4.1 Workflow complet des réserves

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW DE GESTION DES RÉSERVES                      │
└─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐
  │ Poseur ou   │ ──── Signale un défaut sur le chantier
  │ Chargé Aff. │      (création réserve, statut: 'ouverte')
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Superviseur │ ──── Valide et transfère au LANCEUR DU DOSSIER
  │             │      (statut: 'transferee')
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Lanceur    │ ──── Reçoit la réserve (uniquement de son chantier)
  │ (du dossier)│      Informe : "Pris en compte"
  │             │      (statut: 'prise_en_compte')
  │             │      Relance la fabrication
  │             │      Informe : "Matériel prêt"
  └──────┬──────┘      (statut: 'prete')
         │
         ▼
  ┌─────────────┐
  │ Superviseur │ ──── Reçoit notification "matériel prêt"
  │             │      Assigne un poseur pour lever (suggestion IA)
  └──────┬──────┘      (statut: 'a_lever')
         │
         ▼
  ┌─────────────┐
  │   Poseur    │ ──── Intervient et lève la réserve
  │             │      (statut: 'levee')
  └─────────────┘
```

### Flux de communication

```
Superviseur ─────► Lanceur (du dossier)
     │                │
     │  "Réserve à    │  "Pris en compte"
     │   traiter"     │  "Matériel prêt"
     │                │
     ◄────────────────┘
```

**Points clés** :
- Le lanceur ne voit QUE les réserves de ses chantiers
- Le lanceur reçoit les réserves UNIQUEMENT via le superviseur
- Le lanceur informe le superviseur de l'avancement (prise en compte → prêt)
- Pas de "suggestion de lanceur" par l'IA : le lanceur est celui du dossier

---

### 4.2 Nouveaux statuts de réserve

Extension des statuts actuels :

| Statut | Libellé | Acteur responsable | Description |
|--------|---------|-------------------|-------------|
| `ouverte` | Ouverte | - | Signalée par poseur/CA, en attente |
| `transferee` | Transférée | Lanceur | Transférée au lanceur du dossier |
| `prise_en_compte` | Prise en compte | Lanceur | Lanceur a accusé réception |
| `prete` | Prête | Superviseur | Matériel prêt, lanceur a terminé |
| `a_lever` | À lever | Poseur | Assignée à un poseur pour correction |
| `levee` | Levée | - | Corrigée et validée |
| `rejetee` | Rejetée | - | Non valide ou hors périmètre |

**Modification `database.types.ts`** :

```typescript
statut_reserve:
  | 'ouverte'
  | 'transferee'
  | 'prise_en_compte'
  | 'prete'
  | 'a_lever'
  | 'levee'
  | 'rejetee'
  | null;
```

**Nouveaux champs à ajouter dans `notes_chantiers`** :

```typescript
poseur_levee_id: string | null;       // ID du poseur assigné pour lever
date_transfert: string | null;        // Date de transfert au lanceur
date_prise_en_compte: string | null;  // Date où le lanceur a accusé réception
date_pret: string | null;             // Date matériel disponible
```

> **Note** : Le champ `lanceur_id` n'est PAS dans `notes_chantiers` car le lanceur est lié au chantier (`chantiers.lanceur_id`).

---

### 4.3 Suggestion d'affectation IA

**Objectif** : L'IA recommande le meilleur poseur pour lever la réserve (pas de suggestion de lanceur car il est lié au dossier).

#### Suggestion de Poseur pour levée

Quand le matériel est prêt, l'IA suggère le meilleur poseur pour lever la réserve.

**Critères d'analyse** :
- Poseurs déjà planifiés sur ce chantier (continuité)
- Proximité géographique
- Charge de travail actuelle
- Compétence sur ce type de correction

**Prompt exemple** :

```
Tu es un assistant de planification pour une entreprise de pose de mobilier.

Contexte :
- Réserve à lever : "${reserve.contenu}" sur ${chantier.nom}
- Adresse : ${chantier.adresse}
- Catégorie : ${chantier.categorie}

Poseurs disponibles cette semaine :
${poseurs.map(p => `- ${p.nom}: ${p.phases_semaine} phases, ${p.deja_sur_chantier ? 'déjà sur ce chantier' : 'nouveau chantier'}, distance: ${p.distance_km}km`).join('\n')}

Recommande le meilleur poseur pour lever cette réserve.
Priorité : poseur déjà présent sur le chantier > proximité > charge de travail.
Réponds au format JSON : { "poseur_id": "...", "raison": "...", "confiance": 0-1 }
```

---

### 4.4 Priorisation intelligente

**Objectif** : Calculer un score de priorité pour ordonner les réserves à traiter.

**Critères et pondération** :

| Critère | Points | Description |
|---------|--------|-------------|
| Ancienneté > 14 jours | +40 | Réserve vieillissante |
| Ancienneté > 7 jours | +20 | Réserve en retard |
| Chantier en phase finale | +35 | Proche de la livraison |
| Chantier "a_terminer" | +25 | Livraison imminente |
| Réserve récurrente | +15 | Même problème déjà signalé |
| Client prioritaire | +20 | Certains clients sont VIP |
| Blocage phase suivante | +30 | Empêche la progression |

**Prompt IA pour priorisation** :

```
Tu es un assistant de gestion de réserves pour une entreprise de pose de mobilier.

Voici les réserves ouvertes à prioriser :
${reserves.map((r, i) => `${i+1}. "${r.contenu}" - Chantier: ${r.chantier.nom} (${r.chantier.statut}) - Créée le: ${r.created_at}`).join('\n')}

Contexte métier :
- Les chantiers "a_terminer" sont prioritaires (livraison proche)
- Les réserves > 7 jours sont en retard
- La continuité d'un poseur sur un chantier est préférable

Classe ces réserves par ordre de priorité (1 = plus urgent).
Réponds au format JSON : { "ordre": [3, 1, 5, 2, 4], "explications": {...} }
```

**Affichage UI** :

```tsx
// Badge priorité calculée
<span className={`px-2 py-1 rounded text-xs font-medium ${
  priorite >= 80 ? 'bg-red-100 text-red-800' :
  priorite >= 50 ? 'bg-orange-100 text-orange-800' :
  priorite >= 30 ? 'bg-yellow-100 text-yellow-800' :
  'bg-gray-100 text-gray-800'
}`}>
  {priorite >= 80 ? 'Urgent' : priorite >= 50 ? 'Prioritaire' : priorite >= 30 ? 'Normal' : 'Bas'}
</span>
```

---

### 4.5 Intégration UI - ReservesPage améliorée

**Nouvelles fonctionnalités** :

1. **Filtrage par statut étendu** : Tous les nouveaux statuts
2. **Vue Kanban** : Colonnes par statut pour visualiser le workflow
3. **Boutons d'action contextuels** selon le rôle :
   - Superviseur : "Valider", "Assigner au lanceur", "Assigner au poseur"
   - Lanceur : "Marquer prêt"
   - Poseur : "Lever la réserve"
4. **Suggestions IA** : Badge avec recommandation d'affectation

```tsx
// Exemple d'action avec suggestion IA
<div className="flex items-center gap-2">
  <button onClick={() => assignerLanceur(reserve.id, suggestion.lanceur_id)}>
    Assigner à {suggestion.lanceur_nom}
  </button>
  <span className="text-xs text-purple-600 flex items-center gap-1">
    <Sparkles className="w-3 h-3" />
    Suggestion IA
  </span>
</div>
```

---

### 4.6 Notifications et alertes

**Notifications automatiques** (à implémenter) :

| Événement | Destinataire | Message |
|-----------|--------------|---------|
| Nouvelle réserve | Superviseur | "Nouvelle réserve sur {chantier}" |
| Réserve assignée | Lanceur | "Relance à effectuer sur {chantier}" |
| Matériel prêt | Superviseur | "Matériel disponible pour {réserve}" |
| Réserve à lever | Poseur | "Réserve à lever sur {chantier}" |
| Réserve > 7 jours | Superviseur | "Réserve en retard sur {chantier}" |

---

## 5. Exemples de Prompts Gemini

### Prompt système (à inclure dans chaque requête)

```
Tu es un assistant IA intégré à MyDelagrave, une application de gestion de chantiers pour une entreprise de pose de mobilier en France.

Contexte métier :
- Les "chantiers" sont des projets de pose de mobilier (laboratoires, écoles, bureaux)
- Les "poseurs" sont les techniciens qui réalisent les installations
- Les "phases" sont les étapes de travail sur un chantier
- Les "réserves" sont des défauts signalés à corriger

Règles :
- Réponds toujours en français
- Sois concis et actionnable
- Utilise le format JSON quand demandé
- En cas de doute, indique ton niveau de confiance
```

### Templates de prompts par fonctionnalité

> **Note** : Le planning utilise un **algorithme local** (pas de Gemini). Les prompts ci-dessous sont pour des fonctionnalités futures ou pour les réserves.

```typescript
export const PROMPTS = {
  // Réserves - Suggestion Poseur pour levée
  SUGGEST_POSEUR_LEVEE: (context: string) => `
    ${SYSTEM_PROMPT}

    Recommande le meilleur poseur pour lever cette réserve.
    Priorité : poseur déjà sur le chantier > proximité > charge de travail.
    ${context}

    Format: { "poseur_id": "...", "raison": "...", "confiance": 0-1 }
  `,

  // Réserves - Priorisation
  PRIORITIZE_RESERVES: (context: string) => `
    ${SYSTEM_PROMPT}

    Classe ces réserves par ordre de priorité (1 = plus urgent).
    Les chantiers "a_terminer" sont prioritaires, les réserves > 7 jours sont en retard.
    ${context}

    Format: { "ordre": [...], "explications": {...} }
  `,
};
```

> **Rappel** : Le lanceur n'est PAS suggéré par l'IA. Le lanceur est celui du dossier (`chantiers.lanceur_id`).

---

## 6. Roadmap d'Implémentation

### Phase 1 : Planning - Bouton "Aide à l'assignation"

- [ ] Créer `src/lib/planningScoring.ts` (algorithme de scoring local)
- [ ] Créer `src/hooks/usePlanningAssistant.ts`
- [ ] Créer `src/components/planning/AssignmentAssistantModal.tsx`
- [ ] Ajouter bouton "Aide à l'assignation" dans `PlanningPage.tsx`
- [ ] Implémenter fonction "Appliquer" et "Appliquer tout"
- [ ] Tests E2E

### Phase 2 : Réserves - Nouveau workflow avec Lanceur

- [ ] Ajouter le rôle "lanceur" dans `ref_roles_user`
- [ ] Ajouter `lanceur_id` dans la table `chantiers`
- [ ] Étendre les statuts de réserve (`database.types.ts`)
- [ ] Ajouter les champs dans `notes_chantiers` :
  - `poseur_levee_id`
  - `date_transfert`
  - `date_prise_en_compte`
  - `date_pret`
- [ ] Mettre à jour `ReservesPage.tsx` avec les nouveaux statuts
- [ ] Créer les actions contextuelles selon le rôle
- [ ] Tests E2E du nouveau workflow

### Phase 3 : Réserves - Suggestions IA

- [ ] Implémenter suggestion de Poseur pour levée (algorithme local ou Gemini)
- [ ] Implémenter priorisation intelligente
- [ ] Ajouter les badges de suggestion dans l'UI
- [ ] Tests E2E

### Phase 4 : Améliorations futures

- [ ] Optimisation de tournée (OSRM + algorithme TSP)
- [ ] Détection de conflits planning
- [ ] Vue Kanban des réserves
- [ ] Notifications et alertes
- [ ] Dashboard analytics

---

## 7. Considérations

### Gestion des erreurs

```typescript
try {
  const result = await analyzeImage(photo, PROMPTS.ANALYZE_PHOTO);
  return JSON.parse(result);
} catch (error) {
  console.error('Erreur Gemini:', error);
  // Fallback : fonctionnalité manuelle sans IA
  return null;
}
```

### Mode hors-ligne / Fallback

Si l'API Gemini est indisponible :
- Désactiver les boutons IA (griser avec tooltip explicatif)
- Continuer le fonctionnement normal de l'application
- Logger les erreurs pour analyse

### Performance

- **Cache** : Mettre en cache les résultats d'analyse similaires (même photo = même résultat)
- **Debounce** : Éviter les appels multiples rapides
- **Loading states** : Afficher un spinner pendant l'analyse (~0.5-2s)

### Sécurité

- Ne jamais exposer la clé API côté client en production
- Option : Créer un endpoint backend (`/api/gemini`) qui proxifie les requêtes
- Limiter le rate d'appels par utilisateur

### RGPD / Confidentialité

- Les photos de chantier sont envoyées à Google pour analyse
- Informer les utilisateurs dans les CGU
- Option de désactivation de l'IA par utilisateur

---

## 8. Métriques de succès

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Adoption suggestions poseur (planning) | >50% acceptées | % de suggestions appliquées |
| Adoption suggestions réserves | >50% acceptées | % de lanceurs/poseurs suggérés utilisés |
| Temps de traitement réserve | -25% | Délai moyen ouverte → levée |
| Optimisation trajets | -15% km | Distance totale hebdo |
| Réserves en retard (>7j) | <10% | % des réserves ouvertes |

---

## Annexes

### A. Schéma d'intégration

```
┌─────────────────────────────────────────────────────────────────────┐
│                          MyDelagrave App                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │  PlanningPage    │    │   ReservesPage   │                       │
│  │  - Suggestion    │    │  - Suggestion    │                       │
│  │    poseur        │    │    Lanceur       │                       │
│  │  - Optimisation  │    │  - Suggestion    │                       │
│  │    tournée       │    │    Poseur levée  │                       │
│  └────────┬─────────┘    │  - Priorisation  │                       │
│           │              └────────┬─────────┘                       │
│           │                       │                                  │
│           ▼                       ▼                                  │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │ useGeminiPlanning│    │ useGeminiReserves│                       │
│  └────────┬─────────┘    └────────┬─────────┘                       │
│           │                       │                                  │
│           └───────────┬───────────┘                                  │
│                       ▼                                              │
│              ┌──────────────────┐                                   │
│              │   gemini.ts      │                                   │
│              │  (Client API)    │                                   │
│              └────────┬─────────┘                                   │
│                       │                                              │
└───────────────────────┼──────────────────────────────────────────────┘
                        │ HTTPS
                        ▼
               ┌──────────────────┐
               │  Google Gemini   │
               │      API         │
               └──────────────────┘
```

### A.bis Workflow des réserves

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RÔLES ET RESPONSABILITÉS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Poseur    │  │  Chargé     │  │ Superviseur │  │   Lanceur   │ │
│  │             │  │  d'affaire  │  │             │  │             │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤ │
│  │ • Signaler  │  │ • Signaler  │  │ • Valider   │  │ • Relancer  │ │
│  │   défaut    │  │   défaut    │  │ • Assigner  │  │   fabric.   │ │
│  │ • Lever     │  │             │  │   lanceur   │  │ • Marquer   │ │
│  │   réserve   │  │             │  │ • Assigner  │  │   prêt      │ │
│  │             │  │             │  │   poseur    │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B. Variables d'environnement complètes

```env
# Fichier .env.local (ne pas committer)

# Gemini API
VITE_GEMINI_API_KEY=AIza...
VITE_GEMINI_MODEL_FAST=gemini-1.5-flash
VITE_GEMINI_MODEL_PRO=gemini-1.5-pro

# Feature flags IA
VITE_AI_ENABLED=true
VITE_AI_PLANNING_ENABLED=true
VITE_AI_RESERVES_ENABLED=true
```

### C. Ressources

- [Documentation Google Gemini](https://ai.google.dev/docs)
- [SDK JavaScript](https://www.npmjs.com/package/@google/generative-ai)
- [Tarification](https://ai.google.dev/pricing)
- [Exemples de prompts](https://ai.google.dev/docs/prompt_best_practices)
