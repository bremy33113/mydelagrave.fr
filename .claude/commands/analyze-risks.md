---
description: Analyse des risques de régression sur les 30 derniers jours
allowed-tools: Read, Glob, Grep, Bash(npm:*), Bash(git:*), Bash(npx:*)
---

# Analyse des Risques de Régression

Tu es un analyste QA. Analyse l'historique Git des 30 derniers jours pour identifier les zones à haut risque nécessitant des tests E2E supplémentaires.

## Étape 1: Analyser les changements récents

```bash
# Commits des 30 derniers jours
git log --since="30 days ago" --oneline --name-status | head -100
```

## Étape 2: Identifier les fichiers fréquemment modifiés

```bash
# Fichiers les plus modifiés (hot spots)
git log --name-only --pretty=format: --since="30 days ago" | sort | uniq -c | sort -rn | head -20
```

Afficher un rapport :
```
🔥 **Fichiers à haut risque (modifiés fréquemment)**

| Fichier | Modifications | Risque |
|---------|---------------|--------|
| [fichier] | N fois | Haut/Moyen |
```

## Étape 3: Vérifier la couverture E2E actuelle

```bash
# Lister tous les tests E2E
npx playwright test --list
```

### Mapper pages → tests

Lister les pages et vérifier si chacune a un test E2E correspondant :

```
📊 **Couverture des tests E2E**

| Page | Test E2E | Statut |
|------|----------|--------|
| DashboardPage | dashboard.spec.ts | ✅ Couvert |
| ChantiersPage | chantiers.spec.ts | ❌ Manquant |
```

## Étape 4: Critères de risque

### Fichiers à haut risque (nécessitent des tests E2E)
- **Modifié >5 fois en 30 jours** → Flux critiques changeant fréquemment
- **Pages sans tests E2E** → Pas de validation automatisée
- **Composants utilisés dans >3 pages** → Impact élevé si cassés
- **Fichiers avec warnings lint** → Problèmes de qualité

## Étape 5: Vérifier les warnings ESLint

```bash
npm run lint 2>&1 | head -50
```

## Étape 6: Rapport final

```
═══════════════════════════════════════════════════════
📋 **RAPPORT D'ANALYSE DES RISQUES**
═══════════════════════════════════════════════════════

## Résumé

- Période analysée : 30 derniers jours
- Commits analysés : N
- Fichiers modifiés : N
- Fichiers à haut risque : N

## Fichiers à haut risque

| Fichier | Modifications | Couvert par E2E | Action |
|---------|---------------|-----------------|--------|
| [fichier] | N | ✅/❌ | [action suggérée] |

## Lacunes de couverture E2E

| Page/Composant | Raison | Priorité |
|----------------|--------|----------|
| [page] | Pas de test existant | Haute |

## Recommandations

1. **Priorité haute** : Créer tests pour [pages]
2. **Priorité moyenne** : Enrichir tests pour [composants]
3. **Priorité basse** : Corriger warnings lint dans [fichiers]

═══════════════════════════════════════════════════════
```

## Actions suggérées

Selon les résultats, proposer :

1. Créer les fichiers de test manquants
2. Ajouter des `data-testid` aux composants non testables
3. Enrichir les tests existants pour couvrir les flux modifiés
4. Corriger les warnings ESLint identifiés
