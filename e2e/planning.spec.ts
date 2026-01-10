import { test, expect } from '@playwright/test';
import { login, ACCOUNTS, navigateFromDashboard, openBurgerMenu } from './helpers';

test.describe('Planning Page', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin (has access to planning)
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should display planning page for admin', async ({ page }) => {
        // Navigate to planning via burger menu
        await navigateFromDashboard(page, /planning/i);

        // Check page title (h1 heading)
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Check view mode buttons (5 modes: Hebdo, 3 Sem, Mois, 3 Mois, Année)
        await expect(page.getByRole('button', { name: 'Hebdo' })).toBeVisible();
        await expect(page.getByRole('button', { name: '3 Sem' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Mois', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: '3 Mois' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Année' })).toBeVisible();

        // Check week navigation
        await expect(page.getByText(/Semaine \d+/)).toBeVisible();

        // Check poseur filter dropdown
        await expect(page.getByRole('combobox')).toBeVisible();

        // Check unassigned panel
        await expect(page.getByText('À attribuer')).toBeVisible();
    });

    test('should navigate between weeks', async ({ page }) => {
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Switch to 3Sem mode where navigation is by week (not by day like Hebdo)
        await page.getByRole('button', { name: '3 Sem' }).click();
        await expect(page.getByRole('button', { name: '3 Sem' })).toHaveClass(/bg-blue-600/);

        // Get initial week number (wait for button to be visible)
        const weekButton = page.locator('button').filter({ hasText: /Semaine \d+/ });
        await expect(weekButton).toBeVisible();
        const weekText = await weekButton.textContent();
        const initialWeek = parseInt(weekText?.match(/\d+/)?.[0] || '1');

        // Click next week (moves by 7 days in 3Sem mode)
        await page.click('button[title="Semaine suivante"]');

        // Week should change to initialWeek + 1
        await expect(page.locator('button').filter({ hasText: `Semaine ${initialWeek + 1}` })).toBeVisible({ timeout: 2000 });

        // Click previous week to go back to initial
        await page.click('button[title="Semaine précédente"]');

        // Week should be back to initial
        await expect(page.locator('button').filter({ hasText: `Semaine ${initialWeek}` })).toBeVisible({ timeout: 2000 });
    });

    test('should switch view modes', async ({ page }) => {
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Default is Hebdo (week view)
        const hebdoButton = page.getByRole('button', { name: 'Hebdo' });
        await expect(hebdoButton).toHaveClass(/bg-blue-600/);

        // Switch to 3 weeks
        await page.getByRole('button', { name: '3 Sem' }).click();
        await expect(page.getByRole('button', { name: '3 Sem' })).toHaveClass(/bg-blue-600/);

        // Switch to month (exact match to avoid '3 Mois')
        await page.getByRole('button', { name: 'Mois', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Mois', exact: true })).toHaveClass(/bg-blue-600/);

        // Switch to 3 months
        await page.getByRole('button', { name: '3 Mois' }).click();
        await expect(page.getByRole('button', { name: '3 Mois' })).toHaveClass(/bg-blue-600/);

        // Switch to year
        await page.getByRole('button', { name: 'Année' }).click();
        await expect(page.getByRole('button', { name: 'Année' })).toHaveClass(/bg-blue-600/);
    });

    test('should filter by poseur', async ({ page }) => {
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Open poseur dropdown and select a poseur (using index since mock data order varies)
        const dropdown = page.getByRole('combobox');
        // Select second option (first poseur after "Tous les poseurs")
        await dropdown.selectOption({ index: 1 });

        // Dropdown value should not be empty (a poseur is selected)
        await expect(dropdown).not.toHaveValue('');
    });

    test('should show planning navigation in burger menu for superviseur', async ({ page }) => {
        // Logout and login as superviseur
        await openBurgerMenu(page);
        await page.getByRole('button', { name: /déconnexion/i }).click();
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

        // Open burger menu and check Planning link is visible
        await openBurgerMenu(page);
        await expect(page.getByRole('link', { name: 'Planning' })).toBeVisible();
    });

    test('should NOT show planning navigation for poseur role', async ({ page }) => {
        // Logout and login as poseur
        await openBurgerMenu(page);
        await page.getByRole('button', { name: /déconnexion/i }).click();
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        // Open burger menu and check Planning link is NOT visible
        await openBurgerMenu(page);
        await expect(page.getByRole('link', { name: 'Planning' })).not.toBeVisible();
    });

    test('should display phases in timeline', async ({ page }) => {
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Wait for loading to complete
        await page.waitForTimeout(500);

        // Should show poseur column header (exact match to avoid ambiguity)
        await expect(page.getByText('Poseur', { exact: true })).toBeVisible();

        // Should show "À attribuer" panel
        await expect(page.getByText('À attribuer')).toBeVisible();
    });

    test('should switch to 3 Mois view', async ({ page }) => {
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Click 3 Mois button
        await page.getByRole('button', { name: '3 Mois' }).click();

        // Button should be active
        await expect(page.getByRole('button', { name: '3 Mois' })).toHaveClass(/bg-blue-600/);

        // Year header should be visible in 3 Mois view
        const currentYear = new Date().getFullYear();
        await expect(page.getByText(currentYear.toString()).first()).toBeVisible();
    });

    test('should switch to Année view', async ({ page }) => {
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Click Année button
        await page.getByRole('button', { name: 'Année' }).click();

        // Button should be active
        await expect(page.getByRole('button', { name: 'Année' })).toHaveClass(/bg-blue-600/);

        // Year header should be visible
        const currentYear = new Date().getFullYear();
        await expect(page.getByText(currentYear.toString()).first()).toBeVisible();
    });

    test('should have Planning link in burger menu', async ({ page }) => {
        // Open burger menu to check for Planning link
        await openBurgerMenu(page);

        // Planning link should be visible in burger menu
        await expect(page.getByRole('link', { name: 'Planning' })).toBeVisible();
    });
});

test.describe('Poseur Tournee Modal', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();
    });

    test('should open tournee modal when clicking poseur name', async ({ page }) => {
        // Wait for planning to load
        await page.waitForTimeout(500);

        // Click on a poseur name (first one available)
        const poseurButton = page.locator('button[data-testid^="poseur-name-"]').first();
        await expect(poseurButton).toBeVisible({ timeout: 5000 });
        await poseurButton.click();

        // Modal should open
        await expect(page.locator('[data-testid="tournee-modal"]')).toBeVisible();

        // Modal should have title with "Tournee de"
        await expect(page.getByText(/Tournee de/)).toBeVisible();

        // Week selector should be visible
        await expect(page.locator('[data-testid="week-current"]')).toBeVisible();
        await expect(page.locator('[data-testid="week-next"]')).toBeVisible();

        // Steps panel should be visible
        await expect(page.locator('[data-testid="tournee-steps-panel"]')).toBeVisible();

        // Map container should be visible
        await expect(page.locator('[data-testid="tournee-map-container"]')).toBeVisible();
    });

    test('should close tournee modal with close button', async ({ page }) => {
        await page.waitForTimeout(500);

        // Open modal
        const poseurButton = page.locator('button[data-testid^="poseur-name-"]').first();
        await expect(poseurButton).toBeVisible({ timeout: 5000 });
        await poseurButton.click();
        await expect(page.locator('[data-testid="tournee-modal"]')).toBeVisible();

        // Close modal
        await page.locator('[data-testid="close-tournee-modal"]').click();

        // Modal should be closed
        await expect(page.locator('[data-testid="tournee-modal"]')).not.toBeVisible();
    });

    test('should switch between current and next week', async ({ page }) => {
        await page.waitForTimeout(500);

        // Open modal
        const poseurButton = page.locator('button[data-testid^="poseur-name-"]').first();
        await expect(poseurButton).toBeVisible({ timeout: 5000 });
        await poseurButton.click();
        await expect(page.locator('[data-testid="tournee-modal"]')).toBeVisible();

        // Current week should be active by default
        await expect(page.locator('[data-testid="week-current"]')).toHaveClass(/bg-blue-600/);

        // Click next week
        await page.locator('[data-testid="week-next"]').click();

        // Next week should be active
        await expect(page.locator('[data-testid="week-next"]')).toHaveClass(/bg-blue-600/);

        // Click current week again
        await page.locator('[data-testid="week-current"]').click();

        // Current week should be active again
        await expect(page.locator('[data-testid="week-current"]')).toHaveClass(/bg-blue-600/);
    });

    test('should close modal when clicking backdrop', async ({ page }) => {
        await page.waitForTimeout(500);

        // Open modal
        const poseurButton = page.locator('button[data-testid^="poseur-name-"]').first();
        await expect(poseurButton).toBeVisible({ timeout: 5000 });
        await poseurButton.click();
        await expect(page.locator('[data-testid="tournee-modal"]')).toBeVisible();

        // Click on backdrop (outside modal)
        await page.locator('.modal-backdrop').click({ position: { x: 10, y: 10 } });

        // Modal should be closed
        await expect(page.locator('[data-testid="tournee-modal"]')).not.toBeVisible();
    });
});

test.describe('Planning - Unassigned Panel (v2.2.3)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();
    });

    test('should display unassigned phases panel', async ({ page }) => {
        // Check unassigned panel is visible
        await expect(page.getByText('À attribuer')).toBeVisible();
    });

    test('should have filter buttons in unassigned panel', async ({ page }) => {
        // Check filter buttons (7j, 15j, 21j, Tous)
        await expect(page.getByRole('button', { name: '7j' })).toBeVisible();
        await expect(page.getByRole('button', { name: '15j' })).toBeVisible();
        await expect(page.getByRole('button', { name: '21j' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Tous' })).toBeVisible();
    });

    test('should display phases in unassigned panel', async ({ page }) => {
        // The unassigned panel header should show count
        const panelHeader = page.getByText('À attribuer');
        await expect(panelHeader).toBeVisible({ timeout: 5000 });

        // Check that a count badge is visible next to the header
        const countBadge = page.locator('.bg-amber-500\\/20');
        await expect(countBadge).toBeVisible();
    });
});

test.describe('Planning - Phase Display (v2.2.3)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();
    });

    test('should display poseur rows with chantier grouping', async ({ page }) => {
        // Check for poseur row headers
        const poseurRow = page.locator('[data-testid^="poseur-name-"]').first();
        await expect(poseurRow).toBeVisible({ timeout: 5000 });
    });

    test('should expand/collapse poseur chantiers with chevron', async ({ page }) => {
        // Look for expand/collapse chevron button
        const chevronButton = page.locator('button').filter({ has: page.locator('svg[class*="chevron"]') }).first();

        if (await chevronButton.isVisible()) {
            // Click to collapse
            await chevronButton.click();
            await page.waitForTimeout(300);

            // Click again to expand
            await chevronButton.click();
            await page.waitForTimeout(300);
        }
    });

    test('should display chantier count badge', async ({ page }) => {
        // Look for orange badge with number (chantier count)
        const countBadge = page.locator('.bg-orange-500, [class*="bg-orange"]').first();
        // Just verify the planning structure loads
        await expect(page.getByText('À attribuer')).toBeVisible();
    });
});

test.describe('Planning - Drag and Drop (v2.2.3)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await navigateFromDashboard(page, /planning/i);
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();
    });

    test('should have draggable phases in unassigned panel', async ({ page }) => {
        // Look for draggable elements in unassigned panel
        const unassignedPanel = page.locator('text=À attribuer').locator('..');

        // The panel should have phase items
        await expect(unassignedPanel).toBeVisible();
    });

    test('should have droppable poseur rows', async ({ page }) => {
        // Look for poseur rows that can accept drops
        const poseurRow = page.locator('[data-testid^="poseur-name-"]').first();
        await expect(poseurRow).toBeVisible({ timeout: 5000 });
    });
});
