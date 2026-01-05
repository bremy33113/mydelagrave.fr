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
npm run preview      # Preview production build locally

# E2E Tests (auto-starts dev server on port 5173 if not running)
npm run test:e2e     # Run all Playwright tests
npx playwright test auth.spec.ts              # Run specific test file
npx playwright test --grep "should login"     # Run tests matching pattern
npx playwright test --headed                  # Run with visible browser
npx playwright test --debug                   # Debug with Playwright Inspector
npx playwright show-report                    # View test report after failure
```

### E2E Test Suites
```
e2e/
├── helpers.ts              # Login helpers, test accounts (ACCOUNTS object)
├── auth.spec.ts            # Authentication flows (login, logout, session)
├── admin.spec.ts           # Admin page, user management
├── contacts.spec.ts        # Contacts CRUD, permissions by role
├── dashboard.spec.ts       # KPI cards, chantier list, filters
├── documents.spec.ts       # Document upload, preview, trash
├── notes.spec.ts           # Notes with photos, RBAC
├── rbac.spec.ts            # Role-based access control checks
├── trash.spec.ts           # Soft delete, restore, permanent delete
├── address-selector.spec.ts # Map/address modal (Leaflet)
├── planning.spec.ts        # Planning drag & drop, views, tournée
└── online-users.spec.ts    # Real-time presence feature
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
│   ├── useUserRole.ts   # RBAC hook (returns role flags and permissions)
│   ├── useMobileMode.ts # Mobile detection (viewport, simulator, localStorage)
│   └── usePresence.ts   # Real-time online users tracking
├── pages/               # Route-level components
│   └── mobile/          # Mobile-specific pages (MobileChantiersList, MobilePlanning)
├── components/
│   ├── chantiers/       # Chantier CRUD modals and detail views
│   ├── planning/        # Planning calendar, drag & drop phases
│   ├── dashboard/       # KPI cards and bars
│   ├── layout/          # Sidebar, Layout wrapper
│   ├── mobile/          # Mobile layout components
│   └── ui/              # Reusable UI components
e2e/
├── helpers.ts           # Login helpers and test accounts
└── *.spec.ts            # Test suites by feature
```

### Data Model
Core entities: `chantiers` (construction sites), `clients`, `users`, `phases_chantiers`, `notes_chantiers`, `chantiers_contacts`, `documents_chantiers`, `pointages`

Reference tables (prefixed `ref_`):
- `ref_roles_user` - User roles (admin, superviseur, charge_affaire, poseur)
- `ref_statuts_chantier` - Chantier status (nouveau, planifie, en_cours, termine...)
- `ref_categories_chantier` - Categories (laboratoire, enseignement, tertiaire...)
- `ref_types_chantier` - Types (fourniture_pose, fourniture_seule)
- `ref_clients` - Client categories (client, sous_traitant, architecte...)
- `ref_job` - Contact job functions (directeur, architecte, conducteur_travaux...)
- `ref_types_document` - Document types (plan, devis, rapport, reserve, feuille_pointage)

#### Phases and Sub-phases (v1.4.0)
Phases use `groupe_phase` for grouping into sub-phases (e.g., 1.1, 1.2, 2.1). Each phase can have `heures_budget` for time tracking with visual gauges.

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

## Claude Code Skills

Skills (invocable via `/skill-name`) are in `.claude/commands/`:
- `/qa`: Analyse de régression complète (lint + E2E)
- `/patch`, `/minor`, `/major`: Bumping de version et release
- `/analyze-risks`: Analyse des risques de régression sur 30 jours
- `/save_context`: Sauvegarde le contexte de travail pour reprise après compactage

## French UI

All user-facing text is in French. Keep UI labels, error messages, and placeholders in French.

## Environment Variables

```bash
# Mock mode (default for development)
VITE_USE_MOCK=true

# Production mode (requires real Supabase credentials)
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## Mobile Routes

Mobile views are available at `/m/*` routes:
- `/m/chantiers` - Chargé d'affaire's chantier list
- `/m/planning` - Poseur's weekly planning

Mobile mode is auto-detected via viewport width (<768px), `window.name === 'MobileSimulator'`, or `localStorage.force_mobile_mode`.

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

## Planning Module

The planning page (`PlanningPage.tsx`) uses drag & drop (`@dnd-kit`) to assign phases to poseurs:
- `PlanningCalendar.tsx` - Main calendar grid with week/3-week/month views
- `UnassignedPhasesPanel.tsx` - Tree view of unassigned phases (grouped by chantier)
- `DraggablePhase.tsx` - Draggable phase blocks with tooltip
- `DroppablePoseurRow.tsx` - Drop zones for each poseur

French holidays are defined in `PlanningCalendar.tsx` (HOLIDAYS array) for 2025-2027.

## Additional Documentation

Detailed documentation is available in `Markdown/`:
- `ZONES.md` - UI zones and component architecture (ASCII diagrams)
- `CHANGELOG.md` - Version history
- `CONTEXT_BACKUP.md` - Work context for session continuity (use `/save_context` to update)
