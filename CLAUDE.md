# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyDelagrave is a construction site (chantier) management application for Delagrave, a French company. The app manages construction projects, clients, contacts, and work phases with role-based access control.

**Current State**: Uses a mock Supabase client (`src/lib/supabase.ts`) with localStorage persistence. Designed for future migration to real Supabase backend.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (port 5173)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint check

# E2E Tests
npm run test:e2e     # Run all Playwright tests
npx playwright test auth.spec.ts              # Run specific test file
npx playwright test --grep "should login"     # Run tests matching pattern
npx playwright show-report                    # View test report after failure
```

## Architecture

### Tech Stack
- React 19 + TypeScript + Vite
- TailwindCSS for styling
- React Router (HashRouter for static hosting compatibility)
- Playwright for E2E testing
- Leaflet/react-leaflet for maps

### Key Directories
```
src/
├── lib/
│   ├── supabase.ts      # Mock Supabase client (emulates API with localStorage)
│   ├── mockData.ts      # Initial demo data and reference tables
│   └── database.types.ts # TypeScript types for all tables
├── hooks/
│   └── useUserRole.ts   # RBAC hook (returns role flags and permissions)
├── pages/               # Route-level components
├── components/
│   ├── chantiers/       # Chantier CRUD modals and detail views
│   ├── dashboard/       # KPI cards and bars
│   ├── layout/          # Sidebar, Layout wrapper
│   └── ui/              # Reusable UI components
e2e/
├── helpers.ts           # Login helpers and test accounts
└── *.spec.ts            # Test suites by feature
```

### Data Model
Core entities: `chantiers` (construction sites), `clients`, `users`, `phases_chantiers`, `notes_chantiers`, `chantiers_contacts`

Reference tables (prefixed `ref_`): `ref_roles_user`, `ref_statuts_chantier`, `ref_categories_chantier`, `ref_types_chantier`, `ref_clients`, `ref_job`

### Role-Based Access Control (RBAC)
Four roles with hierarchical permissions:
- **admin**: Full access, user management
- **superviseur**: View all chantiers, user management
- **charge_affaire**: Manage assigned chantiers only
- **poseur**: Read-only access to assigned chantiers

Use `useUserRole()` hook to check permissions: `isAdmin`, `isSuperviseur`, `canManageUsers`, `canViewAllChantiers`, etc.

### Mock Authentication
Test accounts defined in `e2e/helpers.ts`:
- admin@delagrave.fr / admin123
- jean.dupont@delagrave.fr / password123 (charge_affaire)
- marie.martin@delagrave.fr / password123 (superviseur)
- pierre.durand@delagrave.fr / password123 (poseur)

### Soft Delete Pattern
Entities use `deleted_at` field for soft deletion. Deleted items appear in TrashPage and can be restored.

## Workflows & Skills

Agent workflows are defined in `.agent/workflows/`:
- `run_qa.md`: Lint + E2E tests
- `patch_release.md`, `minor_release.md`, `major_release.md`: Version bumping and release

Claude Code skills (invocable via `/skill-name`) are in `.claude/commands/`:
- `/qa`: Analyse de régression complète (lint + E2E)
- `/patch`, `/minor`, `/major`: Bumping de version et release
- `/analyze-risks`: Analyse des risques de régression sur 30 jours
- `/save_context`: Sauvegarde le contexte de travail pour reprise après compactage

## French UI

All user-facing text is in French. Keep UI labels, error messages, and placeholders in French.

## Migration Notes (Mock → Supabase)

### Storage Bucket pour les photos
Actuellement, les photos des notes (`notes_chantiers.photo_1_url`, `photo_2_url`) sont stockées en base64 compressé directement dans la table.

**Lors de la migration vers Supabase réel :**
- Créer un bucket `notes-photos` dans Supabase Storage
- Modifier `handleImageUpload` dans `ChantierDetail.tsx` pour uploader vers le bucket
- Stocker uniquement le path/URL dans la table au lieu du base64
- Configurer les policies RLS sur le bucket

### Soft Delete
S'assurer que `deleted_at` est explicitement `null` (pas `undefined`) lors des insertions pour que le filtre `.is('deleted_at', null)` fonctionne.
