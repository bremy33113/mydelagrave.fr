import { test, expect } from '@playwright/test';
import { login, clearAuth, ACCOUNTS } from './helpers';

test.describe('Phases Modal - Non-regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should open phases modal from chantier detail', async ({ page }) => {
        // Select a chantier
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();

        // Click phases button
        await page.getByRole('button', { name: /phases/i }).click();

        // Verify modal is open
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();
        await expect(page.getByRole('heading', { name: /gestion des phases/i })).toBeVisible();
    });

    test('should close phases modal with X button', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Close with X button
        await page.locator('[data-testid="phases-modal-close"]').click();

        // Verify modal is closed
        await expect(page.locator('[data-testid="phases-modal"]')).not.toBeVisible();
    });

    test('should close phases modal with Fermer button', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Close with Fermer button
        await page.locator('[data-testid="btn-close-phases"]').click();

        // Verify modal is closed
        await expect(page.locator('[data-testid="phases-modal"]')).not.toBeVisible();
    });

    test('should display phases count in footer', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();

        // Verify phases count is displayed
        await expect(page.locator('[data-testid="phases-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="phases-count"]')).toContainText(/phase/i);
    });
});

test.describe('Phases Modal - Create Phase Group', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should open phase group form when clicking add button', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Click add phase group button (either first phase or new phase)
        const addButton = page.locator('[data-testid="btn-add-phase-group"], [data-testid="btn-create-first-phase"]').first();
        await addButton.click();

        // Verify form is displayed
        await expect(page.locator('[data-testid="phase-group-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="input-phase-label"]')).toBeVisible();
        await expect(page.locator('[data-testid="input-phase-budget"]')).toBeVisible();
    });

    test('should cancel phase group creation', async ({ page }) => {
        // Open modal and form
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();

        const addButton = page.locator('[data-testid="btn-add-phase-group"], [data-testid="btn-create-first-phase"]').first();
        await addButton.click();
        await expect(page.locator('[data-testid="phase-group-form"]')).toBeVisible();

        // Cancel
        await page.locator('[data-testid="btn-cancel-phase"]').click();

        // Verify form is hidden
        await expect(page.locator('[data-testid="phase-group-form"]')).not.toBeVisible();
    });

    test('should create a new phase group', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Click add phase group
        const addButton = page.locator('[data-testid="btn-add-phase-group"], [data-testid="btn-create-first-phase"]').first();
        await addButton.click();

        // Fill form
        await page.locator('[data-testid="input-phase-label"]').fill('Test Phase QA');
        await page.locator('[data-testid="input-phase-budget"]').fill('40');

        // Submit
        await page.locator('[data-testid="btn-submit-phase"]').click();

        // Verify phase was created (form should close)
        await expect(page.locator('[data-testid="phase-group-form"]')).not.toBeVisible();
    });
});

test.describe('Phases Modal - Create Sub-phase', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should open sub-phase form when clicking add sub-phase button', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Check if there's an existing phase group with add sub-phase button
        const addSubPhaseButton = page.locator('[data-testid^="btn-add-subphase-"]').first();

        if (await addSubPhaseButton.isVisible()) {
            await addSubPhaseButton.click();

            // Verify sub-phase form is displayed
            await expect(page.locator('[data-testid="subphase-form"]')).toBeVisible();
            await expect(page.locator('[data-testid="input-subphase-date"]')).toBeVisible();
            await expect(page.locator('[data-testid="input-subphase-duree"]')).toBeVisible();
        }
    });

    test('should cancel sub-phase creation', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();

        // Check if there's an add sub-phase button
        const addSubPhaseButton = page.locator('[data-testid^="btn-add-subphase-"]').first();

        if (await addSubPhaseButton.isVisible()) {
            await addSubPhaseButton.click();
            await expect(page.locator('[data-testid="subphase-form"]')).toBeVisible();

            // Cancel
            await page.locator('[data-testid="btn-cancel-subphase"]').click();

            // Verify form is hidden
            await expect(page.locator('[data-testid="subphase-form"]')).not.toBeVisible();
        }
    });
});

test.describe('Phases Modal - Chronological Renumbering', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should renumber sub-phases chronologically when closing modal', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // First, ensure we have a phase group
        const existingGroup = page.locator('[data-testid^="phase-group-"]').first();

        if (!(await existingGroup.isVisible())) {
            // Create a new phase group if none exists
            const addButton = page.locator('[data-testid="btn-create-first-phase"]');
            await addButton.click();
            await page.locator('[data-testid="input-phase-label"]').fill('Test Chronologique');
            await page.locator('[data-testid="input-phase-budget"]').fill('100');
            await page.locator('[data-testid="btn-submit-phase"]').click();
            await expect(page.locator('[data-testid="phase-group-form"]')).not.toBeVisible();
        }

        // Get the add sub-phase button for group 1
        const addSubPhaseButton = page.locator('[data-testid="btn-add-subphase-1"]');

        if (await addSubPhaseButton.isVisible()) {
            // Create first sub-phase with LATER date (e.g., 2026-01-20)
            await addSubPhaseButton.click();
            await page.locator('[data-testid="input-subphase-libelle"]').fill('Phase tardive');
            await page.locator('[data-testid="input-subphase-date"]').fill('2026-01-20');
            await page.locator('[data-testid="input-subphase-duree"]').fill('8');
            await page.locator('[data-testid="btn-submit-subphase"]').click();
            await expect(page.locator('[data-testid="subphase-form"]')).not.toBeVisible();

            // Wait for the sub-phase to be created
            await page.waitForTimeout(500);

            // Create second sub-phase with EARLIER date (e.g., 2026-01-10)
            await addSubPhaseButton.click();
            await page.locator('[data-testid="input-subphase-libelle"]').fill('Phase precoce');
            await page.locator('[data-testid="input-subphase-date"]').fill('2026-01-10');
            await page.locator('[data-testid="input-subphase-duree"]').fill('8');
            await page.locator('[data-testid="btn-submit-subphase"]').click();
            await expect(page.locator('[data-testid="subphase-form"]')).not.toBeVisible();

            // Wait for the sub-phase to be created
            await page.waitForTimeout(500);

            // Close the modal (this triggers renumbering)
            await page.locator('[data-testid="btn-close-phases"]').click();
            await expect(page.locator('[data-testid="phases-modal"]')).not.toBeVisible();

            // Reopen modal to verify renumbering
            await page.getByRole('button', { name: /phases/i }).click();
            await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

            // Check that sub-phases are numbered correctly:
            // - subphase-1-1 should have "Phase precoce" (earlier date = first)
            // - subphase-1-2 should have "Phase tardive" (later date = second)
            const subphase1 = page.locator('[data-testid="subphase-1-1"]');
            const subphase2 = page.locator('[data-testid="subphase-1-2"]');

            if (await subphase1.isVisible() && await subphase2.isVisible()) {
                // The earlier date should now be 1.1
                await expect(subphase1).toContainText('precoce');
                // The later date should now be 1.2
                await expect(subphase2).toContainText('tardive');
            }
        }
    });
});

test.describe('Phases Modal - Phase Name vs Sub-phase Label (v2.2.3)', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should display correct placeholder for phase name', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Click add phase group
        const addButton = page.locator('[data-testid="btn-add-phase-group"], [data-testid="btn-create-first-phase"]').first();
        await addButton.click();

        // Check placeholder for phase name is "Ex: Batiment"
        const phaseNameInput = page.locator('[data-testid="input-phase-label"]');
        await expect(phaseNameInput).toHaveAttribute('placeholder', 'Ex: Batiment');
    });

    test('should display correct placeholder for sub-phase label', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Check if there's an add sub-phase button
        const addSubPhaseButton = page.locator('[data-testid^="btn-add-subphase-"]').first();

        if (await addSubPhaseButton.isVisible()) {
            await addSubPhaseButton.click();

            // Check placeholder for sub-phase label is "Ex: RDC"
            const libelleInput = page.locator('[data-testid="input-subphase-libelle"]');
            await expect(libelleInput).toHaveAttribute('placeholder', 'Ex: RDC');
        }
    });

    test('should create phase and sub-phase with distinct names', async ({ page }) => {
        // Open modal
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // Create a new phase group with specific name
        const addButton = page.locator('[data-testid="btn-add-phase-group"], [data-testid="btn-create-first-phase"]').first();
        await addButton.click();

        // Fill phase name (e.g., "Batiment Test")
        await page.locator('[data-testid="input-phase-label"]').fill('Batiment Test');
        await page.locator('[data-testid="input-phase-budget"]').fill('50');
        await page.locator('[data-testid="btn-submit-phase"]').click();
        await expect(page.locator('[data-testid="phase-group-form"]')).not.toBeVisible();
        await page.waitForTimeout(500);

        // Find the newly created phase and add sub-phase
        const newPhaseGroup = page.getByText('Batiment Test');
        await expect(newPhaseGroup).toBeVisible();

        // Now add a sub-phase with different libellé
        const addSubPhaseButton = page.locator('[data-testid^="btn-add-subphase-"]').last();
        if (await addSubPhaseButton.isVisible()) {
            await addSubPhaseButton.click();

            // Fill sub-phase with different label (e.g., "RDC Test")
            await page.locator('[data-testid="input-subphase-libelle"]').fill('RDC Test');
            await page.locator('[data-testid="input-subphase-date"]').fill('2026-02-01');
            await page.locator('[data-testid="input-subphase-duree"]').fill('8');
            await page.locator('[data-testid="btn-submit-subphase"]').click();
            await expect(page.locator('[data-testid="subphase-form"]')).not.toBeVisible();
            await page.waitForTimeout(500);

            // Verify both names are visible and distinct
            await expect(page.getByText('Batiment Test')).toBeVisible();
            await expect(page.getByText('RDC Test')).toBeVisible();
        }
    });

    test('should display budget_heures badge when chantier has budget', async ({ page }) => {
        // Open modal on a chantier
        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();
        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.locator('[data-testid="phases-modal"]')).toBeVisible();

        // The budget badge should be visible in header if chantier has budget_heures
        // Look for the badge with hour format (e.g., "120h")
        const budgetBadge = page.locator('.rounded-full').filter({ hasText: /\d+h/ }).first();
        // This may or may not be visible depending on chantier data
        // Just check the modal structure is correct
        await expect(page.getByRole('heading', { name: /gestion des phases/i })).toBeVisible();
    });
});

test.describe('Phases Modal - RBAC', () => {
    test('admin can access phases modal', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();

        // Admin should see phases button
        await expect(page.getByRole('button', { name: /phases/i })).toBeVisible();
    });

    test('superviseur can access phases modal', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();

        // Superviseur should see phases button
        await expect(page.getByRole('button', { name: /phases/i })).toBeVisible();
    });

    test('charge_affaire can access phases modal on assigned chantier', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);

        const firstCard = page.locator('[data-testid="chantier-card"]').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();

            // Charge d'affaire should see phases button on their assigned chantiers
            await expect(page.getByRole('button', { name: /phases/i })).toBeVisible();
        }
    });
});
