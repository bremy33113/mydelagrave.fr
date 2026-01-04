import { test, expect } from '@playwright/test';
import { login, ACCOUNTS } from './helpers';

test.describe('Planning Page', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin (has access to planning)
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should display planning page for admin', async ({ page }) => {
        // Navigate to planning
        await page.getByRole('link', { name: 'Planning' }).click();

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
        await page.getByRole('link', { name: 'Planning' }).click();
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
        await page.getByRole('link', { name: 'Planning' }).click();
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
        await page.getByRole('link', { name: 'Planning' }).click();
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Open poseur dropdown and select a poseur (using index since mock data order varies)
        const dropdown = page.getByRole('combobox');
        // Select second option (first poseur after "Tous les poseurs")
        await dropdown.selectOption({ index: 1 });

        // Dropdown value should not be empty (a poseur is selected)
        await expect(dropdown).not.toHaveValue('');
    });

    test('should show planning navigation in sidebar for superviseur', async ({ page }) => {
        // Logout and login as superviseur
        await page.click('button:has-text("Déconnexion")');
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

        // Planning link should be visible
        await expect(page.getByRole('link', { name: 'Planning' })).toBeVisible();
    });

    test('should NOT show planning navigation for poseur role', async ({ page }) => {
        // Logout and login as poseur
        await page.click('button:has-text("Déconnexion")');
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        // Planning link should NOT be visible
        await expect(page.getByRole('link', { name: 'Planning' })).not.toBeVisible();
    });

    test('should display phases in timeline', async ({ page }) => {
        await page.getByRole('link', { name: 'Planning' }).click();
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Wait for loading to complete
        await page.waitForTimeout(500);

        // Should show poseur column header (exact match to avoid ambiguity)
        await expect(page.getByText('Poseur', { exact: true })).toBeVisible();

        // Should show "À attribuer" panel
        await expect(page.getByText('À attribuer')).toBeVisible();
    });

    test('should switch to 3 Mois view', async ({ page }) => {
        await page.getByRole('link', { name: 'Planning' }).click();
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
        await page.getByRole('link', { name: 'Planning' }).click();
        await expect(page.locator('h1').filter({ hasText: 'Planning' })).toBeVisible();

        // Click Année button
        await page.getByRole('button', { name: 'Année' }).click();

        // Button should be active
        await expect(page.getByRole('button', { name: 'Année' })).toHaveClass(/bg-blue-600/);

        // Year header should be visible
        const currentYear = new Date().getFullYear();
        await expect(page.getByText(currentYear.toString()).first()).toBeVisible();
    });

    test('should have external window button next to Planning menu', async ({ page }) => {
        // External window button should be visible next to Planning link
        // The MonitorUp icon button is rendered next to Planning
        const planningSection = page.locator('nav').filter({ has: page.getByRole('link', { name: 'Planning' }) });
        await expect(planningSection).toBeVisible();

        // Button with MonitorUp icon should exist (it has a title attribute)
        const externalButton = page.locator('button[title*="fenêtre"], button[title*="écran"]');
        await expect(externalButton).toBeVisible();
    });
});
